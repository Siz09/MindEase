import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Badge = forwardRef(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      calm: 'bg-calm-100 text-calm-800 dark:bg-calm-900/30 dark:text-calm-200',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-base px-3 py-1',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
