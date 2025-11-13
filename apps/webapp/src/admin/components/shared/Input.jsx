"use client"

export default function Input({ label, placeholder, type = "text", value, onChange, error, helper, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="form-input"
        {...props}
      />
      {error && (
        <div className="form-helper" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
      {helper && <div className="form-helper">{helper}</div>}
    </div>
  )
}
