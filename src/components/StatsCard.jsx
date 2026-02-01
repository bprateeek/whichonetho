export default function StatsCard({ label, value, icon, trend }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-geist text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="font-geist text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
          {trend && (
            <p className={`font-geist text-xs mt-1 ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend > 0 ? '+' : ''}{trend} this week
            </p>
          )}
        </div>
        {icon && (
          <div className="text-2xl">{icon}</div>
        )}
      </div>
    </div>
  )
}
