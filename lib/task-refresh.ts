// Global task refresh utility
// Allows components to notify each other when tasks are created/updated/deleted

export const TASK_REFRESH_EVENT = 'task-refresh'

export function triggerTaskRefresh() {
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASK_REFRESH_EVENT))
    
    // Also update localStorage as a backup mechanism
    localStorage.setItem('task-refresh-timestamp', Date.now().toString())
  }
}

export function useTaskRefresh(callback: () => void) {
  if (typeof window === 'undefined') return
  
  const handleRefresh = () => {
    callback()
  }
  
  // Listen to custom event
  window.addEventListener(TASK_REFRESH_EVENT, handleRefresh)
  
  // Also listen to storage events (for cross-tab communication)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'task-refresh-timestamp') {
      callback()
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  return () => {
    window.removeEventListener(TASK_REFRESH_EVENT, handleRefresh)
    window.removeEventListener('storage', handleStorageChange)
  }
}

