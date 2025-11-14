export default function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  className: customClassName,
  children,
  ...props
}) {
  const baseClass = "btn"
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const className = `${baseClass} ${variantClass} ${sizeClass}${customClassName ? ` ${customClassName}` : ""}`

  return (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
