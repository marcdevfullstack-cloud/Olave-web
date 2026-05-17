import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  gradient?: 'primary' | 'navy' | 'green' | 'warning';
  loading?: boolean;
}

const gradients = {
  primary: 'bg-gradient-primary',
  navy:    'bg-gradient-navy',
  green:   'bg-gradient-green',
  warning: 'bg-gradient-to-br from-warning to-amber-400',
};

export default function StatCard({
  icon: Icon, label, value, sub, trend, gradient = 'primary', loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 w-24 bg-light-grey rounded mb-4" />
        <div className="h-8 w-32 bg-light-grey rounded mb-2" />
        <div className="h-3 w-20 bg-light-grey rounded" />
      </div>
    );
  }

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
            gradients[gradient]
          )}
        >
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
              trend >= 0
                ? 'text-green-dark bg-green/10'
                : 'text-error bg-error/10'
            )}
          >
            <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-navy truncate">{value}</div>
      <div className="text-sm text-text-secondary mt-1">{label}</div>
      {sub && <div className="text-xs text-text-light mt-1">{sub}</div>}
    </div>
  );
}