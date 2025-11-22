import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type = 'text', error = false, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
        'focus:outline-none focus:ring-2 focus:border-transparent transition-smooth',
        error
          ? 'border-red-300 focus:ring-red-500'
          : 'border-gray-300 dark:border-gray-700 focus:ring-primary-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
