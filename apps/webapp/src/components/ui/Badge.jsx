import * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = (variant) => {
  const variants = {
    default:
      'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500',
    secondary:
      'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
    outline: 'text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700',
    success:
      'border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500',
    warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
  };
  return variants[variant] || variants.default;
};

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
        badgeVariants(variant),
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
export default Badge;
