import { useState } from "react";

const reportReasons = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or misleading" },
  { value: "offensive", label: "Offensive or harmful" },
  { value: "other", label: "Other" },
];

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [selectedReason, setSelectedReason] = useState("");

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-900/50 max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <h2 className="font-geist text-xl font-bold text-gray-900 dark:text-gray-100">
            Report Poll
          </h2>
          <p className="font-geist text-sm text-gray-500 dark:text-gray-400 mt-1">
            Why are you reporting this poll?
          </p>
        </div>

        {/* Reason options */}
        <div className="space-y-2">
          {reportReasons.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              className={`font-geist w-full py-3 px-4 rounded-xl border text-left transition-all ${
                selectedReason === reason.value
                  ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="font-geist flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="font-geist flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              </span>
            ) : (
              "Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
