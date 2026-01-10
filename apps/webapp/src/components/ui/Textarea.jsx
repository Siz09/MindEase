import { forwardRef } from 'react';

const Textarea = forwardRef(({ className, style, onFocus, onBlur, ...props }, ref) => {
  const defaultStyles = {
    width: '100%',
    padding: '0.625rem 1rem',
    borderRadius: '1.25rem',
    border: '2px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    fontFamily: 'var(--font-family)',
    resize: 'none',
    minHeight: '2.5rem',
    maxHeight: '7.5rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    lineHeight: '1.5',
    ...style,
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--primary-green)';
    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--border-color)';
    e.target.style.boxShadow = 'none';
    onBlur?.(e);
  };

  return (
    <textarea
      ref={ref}
      className={className}
      style={defaultStyles}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
