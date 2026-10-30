import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ children, onClose, labelledBy, className = '' }) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (event) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', handleKey)

    const focusTarget =
      panelRef.current?.querySelector('input:not([type="checkbox"]), select, textarea') ||
      panelRef.current?.querySelector('button')
    focusTarget?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div
        ref={panelRef}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
