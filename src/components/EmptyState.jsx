export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-5xl">{icon}</div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      {action}
    </div>
  )
}
