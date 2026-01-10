import * as React from 'react';
import { cn } from '../../lib/utils';

const Slider = React.forwardRef(
  (
    {
      className,
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      onValueChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : min
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleChange = (e) => {
      if (disabled) return;
      const newValue = parseFloat(e.target.value);
      setInternalValue(newValue);
      if (onValueChange) {
        onValueChange([newValue]);
      }
    };

    const percentage = ((internalValue - min) / (max - min)) * 100;

    return (
      <div
        ref={ref}
        className={cn('relative flex w-full touch-none items-center select-none', className)}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          className="slider-input"
          style={{
            background: `linear-gradient(to right, rgb(22, 163, 74) 0%, rgb(22, 163, 74) ${percentage}%, rgb(229, 231, 235) ${percentage}%, rgb(229, 231, 235) 100%)`,
          }}
          {...props}
        />
        <style jsx>{`
          .slider-input {
            width: 100%;
            height: 6px;
            border-radius: 9999px;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
          }

          .slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid rgb(22, 163, 74);
            cursor: pointer;
            box-shadow:
              0 1px 3px 0 rgba(0, 0, 0, 0.1),
              0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: all 0.2s;
          }

          .slider-input::-webkit-slider-thumb:hover {
            box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
          }

          .slider-input::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid rgb(22, 163, 74);
            cursor: pointer;
            box-shadow:
              0 1px 3px 0 rgba(0, 0, 0, 0.1),
              0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: all 0.2s;
          }

          .slider-input::-moz-range-thumb:hover {
            box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
          }

          .slider-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .slider-input:disabled::-webkit-slider-thumb {
            cursor: not-allowed;
          }

          .slider-input:disabled::-moz-range-thumb {
            cursor: not-allowed;
          }

          [data-theme='dark'] .slider-input {
            background: linear-gradient(
              to right,
              rgb(34, 197, 94) 0%,
              rgb(34, 197, 94) ${percentage}%,
              rgb(55, 65, 81) ${percentage}%,
              rgb(55, 65, 81) 100%
            ) !important;
          }
        `}</style>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
