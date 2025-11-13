"use client"

export default function Select({ label, value, onChange, options, error, helper, className = "", ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`form-select select-field ${className}`.trim()}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="form-helper" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
      {helper && <div className="form-helper">{helper}</div>}
    </div>
  )
}
