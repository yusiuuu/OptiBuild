"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// Configuration constants for toast management
const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

// Extended toast type with additional properties for internal management
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Action types for toast state management
// Defines all possible operations on toast notifications
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Counter for generating unique toast IDs
let count = 0

// Generate unique ID for each toast notification
// Ensures each toast has a unique identifier for state management
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// Type definitions for action types and actions
type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

// State interface for toast management
interface State {
  toasts: ToasterToast[]
}

// Map to track timeout IDs for toast removal
// Prevents multiple timeouts for the same toast
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Add toast to removal queue with timeout
// Schedules toast removal after specified delay
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// Reducer function for toast state management
// Handles all toast-related actions and updates state accordingly
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Add new toast to beginning of array, limit total toasts
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      // Update existing toast by ID
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // Side effects - schedule toast removal
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        // Dismiss all toasts if no specific ID provided
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      // Mark toasts as closed
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      // Remove specific toast or all toasts
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Array of state change listeners
const listeners: Array<(state: State) => void> = []

// In-memory state for toast management
let memoryState: State = { toasts: [] }

// Dispatch function to update state and notify listeners
// Central function for all toast state changes
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Toast function type without ID (generated internally)
type Toast = Omit<ToasterToast, "id">

// Main toast function for creating new toast notifications
// Returns toast object with update and dismiss methods
function toast({ ...props }: Toast) {
  const id = genId()

  // Update function for modifying existing toast
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  
  // Dismiss function for closing toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Dispatch add toast action
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// Custom hook for toast management
// Provides toast state and functions for creating/dismissing toasts
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  // Subscribe to toast state changes
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

// Export main functions and hook
export { useToast, toast }
