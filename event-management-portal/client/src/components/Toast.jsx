import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { IconAlert, IconCheck, IconClose, IconSpark } from './Icons.jsx'

const ToastContext = createContext(null)
let nextId = 0

const ICONS = {
  success: IconCheck,
  error: IconAlert,
  info: IconSpark,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, type = 'success') => {
      const id = ++nextId
      setToasts((current) => [...current.slice(-3), { id, message, type }])
      const timer = setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        timers.current.delete(id)
      }, 4200)
      timers.current.set(id, timer)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || IconSpark
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span className="toast-icon">
                <Icon size={16} />
              </span>
              <p>{toast.message}</p>
              <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                <IconClose size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}
