'use client';

import { useId } from 'react';

export default function Select({
  label,
  value,
  onChange,
  options = [],
  error,
  helper,
  className = '',
  id,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const describedBy = [error && errorId, helper && helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={`form-select select-field ${className}`.trim()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div id={errorId} className="form-helper" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {helper && (
        <div id={helperId} className="form-helper">
          {helper}
        </div>
      )}
    </div>
  );
}
