import { useRef, useState } from "react";

export default function ImageUpload({
  label,
  value,
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file) => {
    // Clear previous error
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (value?.previewUrl) {
      URL.revokeObjectURL(value.previewUrl);
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 ${
          isDragging
            ? "border-primary bg-primary/5"
            : error
            ? "border-red-400 dark:border-red-500"
            : value
            ? "border-transparent"
            : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {value?.previewUrl ? (
          <>
            <img
              src={value.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Remove image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="font-geist absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <svg
              className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-geist text-sm md:text-base">
              Tap to upload
            </span>
            <span className="font-geist text-xs md:text-sm mt-1">
              or drag & drop
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="font-geist text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
