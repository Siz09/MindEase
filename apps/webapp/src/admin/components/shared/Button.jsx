export default function Button({ variant = "primary", size = "md", disabled = false, children, ...props }) {
  const baseClass = "btn"
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const className = `${baseClass} ${variantClass} ${sizeClass}`

  return (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
