const genderOptions = [
  { value: "female", label: "Woman", icon: "👩" },
  { value: "male", label: "Man", icon: "👨" },
  { value: "nonbinary", label: "Non-binary", icon: "🧑" },
];

export default function GenderSelect({
  value,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="font-geist block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-3">
        {genderOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`py-3 md:py-4 px-4 md:px-6 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
              value === option.value
                ? "font-geist border-primary bg-primary/10 text-primary"
                : "font-geist border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-geist text-2xl md:text-3xl mb-1 md:mb-2">
              {option.icon}
            </div>
            <div className="font-geist text-sm md:text-base font-medium">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
