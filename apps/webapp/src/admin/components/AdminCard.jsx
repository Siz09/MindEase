import { cn } from '../../lib/utils';

export default function AdminCard({ children, className }) {
  return <div className={cn('card', className)}>{children}</div>;
}
