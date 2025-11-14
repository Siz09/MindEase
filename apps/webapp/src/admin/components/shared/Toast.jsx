"use client"

import { useState, useEffect, useRef } from "react"

export default function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onCloseRef.current?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  const bgColor =
    {
      success: "var(--success)",
      error: "var(--danger)",
      warning: "var(--warning)",
      info: "var(--info)",
    }[type] || "var(--info)"

  const accessibilityProps =
    type === "error"
      ? { role: "alert", "aria-live": "assertive" }
      : { role: "status", "aria-live": "polite" }

  return (
    <div
      {...accessibilityProps}
      aria-atomic="true"
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
