import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

const Dialog = ({ open = false, onOpenChange, children }) => {
  return (
    <DialogContext.Provider
      value={{ open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) }}
    >
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef(
  ({ className, asChild = false, children, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    if (asChild) {
      return React.cloneElement(children, {
        ...props,
        onClick: (e) => {
          onOpenChange(true);
          if (children.props.onClick) children.props.onClick(e);
        },
      });
    }
    return (
      <button ref={ref} className={className} onClick={() => onOpenChange(true)} {...props}>
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

const DialogOverlay = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <div
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-black/50 animate-in fade-in-0', className)}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(
  ({ className, children, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);

    React.useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && open) {
          onOpenChange(false);
        }
      };
      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <>
        <DialogOverlay />
        <div
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white dark:bg-gray-800 p-6 shadow-lg rounded-lg animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950 dark:focus:ring-gray-300"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </>
    );
  }
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

const DialogClose = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button
      ref={ref}
      className={className}
      onClick={(e) => {
        onOpenChange(false);
        if (onClick) onClick(e);
      }}
      {...props}
    />
  );
});
DialogClose.displayName = 'DialogClose';

export {
  Dialog,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
