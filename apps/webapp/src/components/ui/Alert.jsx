import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
        warning: 'bg-amber-50 text-amber-900 border-amber-200 [&>svg]:text-amber-600',
        success: 'bg-green-50 text-green-900 border-green-200 [&>svg]:text-green-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({ className, variant, ...props }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

function AlertIndicator({ variant = 'default', isPulsing = false, className, ...props }) {
  const colorMap = {
    default: 'rgb(156 163 175)',
    destructive: 'rgb(239 68 68)',
    warning: 'rgb(217 119 6)',
    success: 'rgb(34 197 94)',
    error: 'rgb(239 68 68)',
  };

  const color = colorMap[variant] || colorMap.default;

  return (
    <div
      className={cn('relative size-4 shrink-0', isPulsing && 'animate-pulse', className)}
      {...props}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export { Alert, AlertTitle, AlertDescription, AlertIndicator };
export default Alert;
