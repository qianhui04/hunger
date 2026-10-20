import { Badge } from './ui/badge';

type StatusVariant =
  | 'available'
  | 'not_available'
  | 'inappropriate'
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  available: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  not_available: 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-100',
  inappropriate: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
  approved: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  pending: 'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100',
  rejected: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100',
  active: 'border-transparent bg-green-100 text-green-800 hover:bg-green-100',
  inactive: 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-100',
  default: 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-100',
};

/** Consistent status presentation. Pass an explicit variant when database values differ from labels. */
export function StatusBadge({ status, variant = 'default', label }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={statusStyles[variant]}>
      {label ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
