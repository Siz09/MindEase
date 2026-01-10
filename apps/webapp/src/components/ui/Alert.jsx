const Alert = ({
  children,
  className,
  style,
  variant = 'default',
  position = 'absolute',
  ...props
}) => {
  const baseStyles = {
    position,
    top: '0.5rem',
    left: variant === 'success' ? undefined : position === 'absolute' ? '50%' : undefined,
    transform: position === 'absolute' ? 'translateX(-50%)' : undefined,
    right: variant === 'success' ? '0.5rem' : undefined,
    zIndex: 50,
    padding: '0.5rem 1rem',
    borderRadius: '1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: 'var(--shadow-md)',
    ...style,
  };

  const variantStyles = {
    default: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
    },
    error: {
      backgroundColor: 'var(--color-error-bg)',
      color: 'var(--color-error)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
    },
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success)',
    },
  };

  return (
    <div className={className} style={{ ...baseStyles, ...variantStyles[variant] }} {...props}>
      {children}
    </div>
  );
};

const AlertIndicator = ({ variant = 'default', isPulsing = false, style, ...props }) => {
  const variantColors = {
    default: 'var(--color-warning)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    success: 'var(--color-success)',
  };

  return (
    <div
      style={{
        width: '0.5rem',
        height: '0.5rem',
        borderRadius: '50%',
        backgroundColor: variantColors[variant],
        animation: isPulsing ? 'pulse 2s infinite' : 'none',
        ...style,
      }}
      {...props}
    />
  );
};

export default Alert;
export { AlertIndicator };
