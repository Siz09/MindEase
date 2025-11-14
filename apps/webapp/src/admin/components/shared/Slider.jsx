"use client"

import { useId } from "react"

export default function Slider({ label, min = 0, max = 100, value, onChange, step = 1, id, ...props }) {
  const generatedId = useId()
  const sliderId = id || `slider-${generatedId}`

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={sliderId}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        <input
          {...props}
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          aria-label={label || "Slider"}
          style={{ flex: 1 }}
        />
        <span style={{ fontWeight: "600", minWidth: "40px" }}>{value}</span>
      </div>
    </div>
  )
}
