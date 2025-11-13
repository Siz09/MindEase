"use client"

import { useState, useEffect } from "react"

export default function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose && onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: "var(--success)",
    error: "var(--danger)",
    warning: "var(--warning)",
    info: "var(--info)",
  }[type]

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: bgColor,
        color: "white",
        padding: "var(--spacing-lg)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        animation: "slideIn 0.3s ease",
        zIndex: 2000,
      }}
    >
      {message}
    </div>
  )
}
