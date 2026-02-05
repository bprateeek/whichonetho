const WomanIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
    <circle cx="12" cy="4.5" r="3" />
    <path d="M12 9c-2.5 0-4.5 1.5-4.5 3.5L7.5 16h3v5.5a1.5 1.5 0 003 0V16h3l0-3.5C16.5 10.5 14.5 9 12 9z" />
    <path d="M8.5 13l-1.5 5h2l1-3.5M15.5 13l1.5 5h-2l-1-3.5" opacity="0.6" />
  </svg>
);

const ManIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
    <circle cx="12" cy="4.5" r="3" />
    <path d="M15.5 9h-7a2 2 0 00-2 2v4.5h3V22a1.5 1.5 0 003 0v-6.5h1V22a1.5 1.5 0 003 0v-6.5h3V11a2 2 0 00-2-2z" />
  </svg>
);

const NonBinaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10">
    <circle cx="12" cy="4.5" r="3" />
    <path d="M15 9H9a2 2 0 00-2 2v4h2.5l-1 7a1.5 1.5 0 003 0l.5-4 .5 4a1.5 1.5 0 003 0l-1-7H17v-4a2 2 0 00-2-2z" />
  </svg>
);

const genderOptions = [
  { value: "female", label: "Woman", icon: <WomanIcon /> },
  { value: "male", label: "Man", icon: <ManIcon /> },
  { value: "nonbinary", label: "Non-binary", icon: <NonBinaryIcon /> },
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
            <div className="flex justify-center mb-1 md:mb-2">
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
