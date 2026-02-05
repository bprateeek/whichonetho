/**
 * Toast Manager - Imperative, event-based toast system
 *
 * Usage:
 *   import { toast } from '../lib/toast'
 *   toast.success("Poll created!")
 *   toast.error("Something went wrong")
 *   toast.info("Link copied")
 */

// Subscribers (typically just the Toaster component)
const listeners = new Set()

// Toast state (managed outside React for performance)
let toasts = []
let idCounter = 0

// Notify all subscribers of state change
function emit() {
  listeners.forEach(listener => listener([...toasts]))
}

// Add a toast and notify subscribers
function addToast(message, type = 'info', duration = 3000) {
  const id = ++idCounter
  toasts = [...toasts, { id, message, type, duration }]
  emit()
  return id
}

// Remove a toast by ID
export function removeToast(id) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

// Get current snapshot (for useSyncExternalStore)
export function getSnapshot() {
  return toasts
}

// Subscribe to toast changes (for useSyncExternalStore)
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Imperative API
export const toast = {
  success: (message, duration) => addToast(message, 'success', duration),
  error: (message, duration) => addToast(message, 'error', duration),
  info: (message, duration) => addToast(message, 'info', duration),
}
