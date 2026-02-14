export default function FilterChip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`font-geist px-3 py-2 rounded-2xl text-sm font-medium transition-all text-center ${
        selected
          ? "bg-primary text-white border-2 border-primary"
          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
