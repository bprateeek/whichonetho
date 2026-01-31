export default function ProgressBar({
  label,
  percent,
  votes,
  isWinner = false,
  color = 'primary'
}) {
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={`font-medium ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {label} {isWinner && '✓'}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {percent}% ({votes})
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
