import { useSyncExternalStore } from 'react'
import { subscribe, getSnapshot, removeToast } from '../lib/toast'
import Toast from './Toast'

/**
 * Toaster - Self-contained toast container
 *
 * Subscribes to the toast manager and renders toasts.
 * Only this component re-renders when toasts change.
 */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
