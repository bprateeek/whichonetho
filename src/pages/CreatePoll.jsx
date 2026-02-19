import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";
import FilterChip from "../components/FilterChip";
import { checkPollRateLimit, createPollRecord } from "../services/polls";
import { compressImage } from "../services/storage";
import { moderateAndUploadImages } from "../services/moderation";
import { toast } from "../lib/toast";

const genderOptions = [
  { value: "female", label: "Women" },
  { value: "male", label: "Men" },
  { value: "nonbinary", label: "Others" },
];

const contextOptions = [
  { value: "date", label: "Date Night" },
  { value: "work", label: "Work" },
  { value: "casual", label: "Casual" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const durationOptions = [
  { value: 15, label: "15 minutes", description: "Quick decision" },
  { value: 60, label: "1 hour", description: "Fast feedback" },
  { value: 240, label: "4 hours", description: "Get more votes" },
  { value: 480, label: "8 hours", description: "Maximum votes" },
];

const bodyTypeOptions = [
  { value: "petite", label: "Petite" },
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "curvy", label: "Curvy" },
  { value: "plus-size", label: "Plus-size" },
  { value: "prefer-not", label: "Prefer not to say" },
];

export default function CreatePoll() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    gender: "",
    bodyType: "",
    context: "",
    duration: 60, // default 1 hour in minutes
    imageA: null,
    imageB: null,
  });
  const [rateLimit, setRateLimit] = useState({
    canCreate: true,
    remaining: 5,
    resetAt: null,
  });
  const [rateLimitLoading, setRateLimitLoading] = useState(true);

  // Check rate limit on mount
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const limit = await checkPollRateLimit();
        setRateLimit(limit);
      } catch (err) {
        console.error("Failed to check rate limit:", err);
      } finally {
        setRateLimitLoading(false);
      }
    };
    checkLimit();
  }, []);

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.gender !== "";
      case 2:
        return formData.imageA !== null && formData.imageB !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const formatResetTime = (resetAt) => {
    if (!resetAt) return "";
    const date = new Date(resetAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Check rate limit
      setSubmissionStatus("Checking rate limit...");
      const rateLimitCheck = await checkPollRateLimit();
      if (!rateLimitCheck.canCreate) {
        const error = new Error("RATE_LIMIT_EXCEEDED");
        error.resetAt = rateLimitCheck.resetAt;
        throw error;
      }

      // Step 2: Compress images
      setSubmissionStatus("Compressing images...");
      const [compressedA, compressedB] = await Promise.all([
        compressImage(formData.imageA.file),
        compressImage(formData.imageB.file),
      ]);

      // Step 3: Upload & moderate
      setSubmissionStatus("Uploading images...");
      const tempId = crypto.randomUUID();
      const { imageAUrl, imageBUrl } = await moderateAndUploadImages(
        compressedA,
        compressedB,
        tempId
      );

      // Step 4: Create poll record
      setSubmissionStatus("Creating poll...");
      const poll = await createPollRecord({
        posterGender: formData.gender,
        bodyType: formData.bodyType || null,
        context: formData.context || null,
        duration: formData.duration,
        imageAUrl,
        imageBUrl,
        tempId,
      });

      toast.success("Poll created successfully!");
      navigate(`/results/${poll.id}`);
    } catch (err) {
      console.error("Failed to create poll:", err);

      if (err.message === "RATE_LIMIT_EXCEEDED") {
        const resetTime = formatResetTime(err.resetAt);
        const errorMsg = `You've reached the daily limit of 5 polls. You can create another poll ${
          resetTime ? `after ${resetTime}` : "tomorrow"
        }.`;
        setError(errorMsg);
        toast.error("Daily limit reached");
        setRateLimit({ canCreate: false, remaining: 0, resetAt: err.resetAt });
      } else if (err.message === "MODERATION_REJECTED") {
        const whichImage =
          err.rejectedImage === "both"
            ? "One or more of your images"
            : `Outfit ${err.rejectedImage}`;
        setError(
          `${whichImage} couldn't be posted because it may contain content that doesn't meet our community guidelines. Please try different photos.`
        );
        toast.error("Image rejected by moderation");
      } else {
        setError(err.message || "Failed to create poll. Please try again.");
        toast.error("Failed to create poll");
      }
      setSubmissionStatus("");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step
                ? "w-8 bg-primary"
                : s < step
                ? "w-2 bg-primary"
                : "w-2 bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Gender & Body Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              About you
            </h1>
            <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
              This helps us show your poll to the right voters
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-3">
            {/* Gender selection */}
            <div className="grid grid-cols-3 gap-3">
              {genderOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={formData.gender === option.value}
                  onClick={() => updateForm("gender", option.value)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

            {/* Body type selection */}
            <div className="grid grid-cols-3 gap-2">
              {bodyTypeOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={formData.bodyType === option.value}
                  onClick={() =>
                    updateForm(
                      "bodyType",
                      formData.bodyType === option.value ? "" : option.value
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Images */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Upload your outfits
            </h1>
            <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
              Add two outfit photos to compare
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <ImageUpload
              label="Outfit A"
              value={formData.imageA}
              onChange={(value) => updateForm("imageA", value)}
            />
            <ImageUpload
              label="Outfit B"
              value={formData.imageB}
              onChange={(value) => updateForm("imageB", value)}
            />
          </div>

          <p className="font-geist text-xs text-gray-400 dark:text-gray-500 text-center">
            Images must be JPEG or PNG, max 5MB each
          </p>
        </div>
      )}

      {/* Step 3: Context & Duration */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Almost done!
            </h1>
            <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
              Choose your poll settings
            </p>
          </div>

          {/* Context selection */}
          <div className="space-y-2">
            <label className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              Context (optional)
            </label>
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              {contextOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateForm(
                      "context",
                      formData.context === option.value ? "" : option.value
                    )
                  }
                  className={`font-geist py-2 px-4 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    formData.context === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration selection */}
          <div className="space-y-2">
            <label className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              Poll duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateForm("duration", option.value)}
                  className={`font-geist py-3 px-4 rounded-xl border transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    formData.duration === option.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div
                    className={`font-geist font-medium ${
                      formData.duration === option.value
                        ? "text-primary"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="font-geist text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="font-geist text-sm text-gray-500 dark:text-gray-400 text-center">
              Preview
            </p>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {formData.imageA && (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={formData.imageA.previewUrl}
                    alt="Outfit A"
                    className="w-full h-full object-cover"
                  />
                  <div className="font-geist absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                    A
                  </div>
                </div>
              )}
              {formData.imageB && (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={formData.imageB.previewUrl}
                    alt="Outfit B"
                    className="w-full h-full object-cover"
                  />
                  <div className="font-geist absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                    B
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="font-geist p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Rate limit indicator */}
      {!rateLimitLoading && step === 3 && (
        <div className="text-center">
          {rateLimit.canCreate ? (
            <p className="font-geist text-sm text-gray-500 dark:text-gray-400">
              {rateLimit.remaining}{" "}
              {rateLimit.remaining === 1 ? "poll" : "polls"} remaining today
            </p>
          ) : (
            <p className="font-geist text-sm text-orange-600">
              Daily limit reached. Try again{" "}
              {rateLimit.resetAt
                ? `after ${formatResetTime(rateLimit.resetAt)}`
                : "tomorrow"}
              .
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="font-geist flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={
            !canProceed() ||
            isSubmitting ||
            (step === 3 && !rateLimit.canCreate)
          }
          className="font-geist flex-1 py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {submissionStatus || "Posting..."}
            </span>
          ) : step === 3 ? (
            "Post Poll"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
