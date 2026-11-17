
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
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
    <div className="flex min-h-[180px] min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-h-[40px] min-w-0 flex-1">
          <p className="text-sm leading-5 text-gray-500">
            {title}
          </p>
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${color}15`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>

      <p className="mt-1 break-words text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>

      {trend && (
        <p className="mt-3 text-xs font-normal leading-5 text-green-700">
          {trend}
        </p>
      )}
    </div>
  );
}
