import { Badge } from './ui/badge';

export type StatusVariant =
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
    status: StatusVariant;
    label?: string;
}

const statusStyles: Record<StatusVariant, string> = {
    available:
        'border-transparent bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]',

    approved:
        'border-transparent bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]',

    active:
        'border-transparent bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]',

    pending:
        'border-transparent bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]',

    not_available:
        'border-transparent bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-text)]',

    inactive:
        'border-transparent bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-text)]',

    inappropriate:
        'border-transparent bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-text)]',

    rejected:
        'border-transparent bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-text)]',

    default:
        'border-transparent bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-text)]',
};

export function StatusBadge({
    status,
    label,
}: StatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={statusStyles[status]}
        >
            {label ?? status.replace(/_/g, ' ')}
        </Badge>
    );
}