/**
 * Simple bar chart using CSS (no external library)
 */
export function BarChart({ data, label, color = 'primary' }) {
  if (!data || data.length === 0) {
    return (
      <div className="font-geist text-center text-gray-500 dark:text-gray-400 py-8">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="space-y-2">
      {label && (
        <p className="font-geist text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      )}
      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition-all ${
                color === 'primary' ? 'bg-primary' : 'bg-secondary'
              }`}
              style={{
                height: `${(item.count / maxValue) * 100}%`,
                minHeight: item.count > 0 ? '4px' : '0',
              }}
            />
            <span className="font-geist text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Simple donut/pie chart using CSS
 */
export function DonutChart({ value, total, label, color = 'primary' }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  const circumference = 2 * Math.PI * 40 // radius = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={color === 'primary' ? 'text-primary' : 'text-secondary'}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-geist text-xl font-bold text-gray-900 dark:text-gray-100">
            {percentage}%
          </span>
        </div>
      </div>
      {label && (
        <p className="font-geist text-sm text-gray-500 dark:text-gray-400">{label}</p>
      )}
    </div>
  )
}

/**
 * Horizontal bar for comparing two values
 */
export function ComparisonBar({ valueA, valueB, labelA = 'A', labelB = 'B' }) {
  const total = valueA + valueB
  const percentA = total > 0 ? Math.round((valueA / total) * 100) : 50
  const percentB = total > 0 ? Math.round((valueB / total) * 100) : 50

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-geist font-medium text-primary">{labelA}: {valueA}</span>
        <span className="font-geist font-medium text-secondary">{labelB}: {valueB}</span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden">
        <div
          className="bg-primary transition-all"
          style={{ width: `${percentA}%` }}
        />
        <div
          className="bg-secondary transition-all"
          style={{ width: `${percentB}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-geist">{percentA}%</span>
        <span className="font-geist">{percentB}%</span>
      </div>
    </div>
  )
}
