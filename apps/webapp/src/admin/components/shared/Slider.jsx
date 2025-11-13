"use client"

export default function Slider({ label, min = 0, max = 100, value, onChange, step = 1 }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} style={{ flex: 1 }} />
        <span style={{ fontWeight: "600", minWidth: "40px" }}>{value}</span>
      </div>
    </div>
  )
}
