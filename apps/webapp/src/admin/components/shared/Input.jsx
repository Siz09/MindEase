"use client"

import { useId } from "react"

export default function Input({ label, placeholder, type = "text", value, onChange, error, helper, id, ...props }) {
  const inputId = id || useId()
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  const describedBy = [error && errorId, helper && helperId].filter(Boolean).join(" ") || undefined

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="form-input"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <div id={errorId} className="form-helper" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
      {helper && (
        <div id={helperId} className="form-helper">
          {helper}
        </div>
      )}
    </div>
  )
}
