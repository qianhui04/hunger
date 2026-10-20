import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = '#2563EB',
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm leading-5 text-gray-500">
            {title}
          </p>

          <p className="mb-2 break-words text-3xl font-semibold tracking-tight text-gray-900 mt-2">
            {value}
          </p>

          {trend && (
            <div
              className={`mt-3 text-xs font-small ${trend.isPositive
                ? 'text-green-700'
                : 'text-red-600'
                }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${color}15`,
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}