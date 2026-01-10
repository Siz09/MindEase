import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Card = forwardRef(({ className, hover = false, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-white dark:bg-gray-800 shadow-sm',
        'flex flex-col',
        hover && 'transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex flex-col gap-2 px-6 pt-6', className)} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-none text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props}>
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex items-center px-6 pb-6 pt-4', className)} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

const CardAction = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('self-start justify-self-end', className)} {...props}>
      {children}
    </div>
  );
});

CardAction.displayName = 'CardAction';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction };
