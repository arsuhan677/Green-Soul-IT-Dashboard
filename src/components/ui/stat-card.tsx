import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
}

export function StatCard({ title, value, icon, trend, subtitle, variant = 'default' }: StatCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'kpi-card-primary';
      case 'accent':
        return 'kpi-card-accent';
      case 'success':
        return 'kpi-card-success';
      case 'warning':
        return 'kpi-card-warning';
      default:
        return 'kpi-card';
    }
  };

  return (
    <div className={getVariantClasses()}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${variant === 'default' ? 'text-muted-foreground' : 'opacity-90'}`}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              variant === 'default' 
                ? trend.isPositive ? 'text-success' : 'text-destructive'
                : 'opacity-90'
            }`}>
              <span>{trend.value}</span>
            </div>
          )}
          {subtitle && (
            <p className={`text-sm mt-2 ${variant === 'default' ? 'text-muted-foreground' : 'opacity-90'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${variant === 'default' ? 'bg-muted' : 'bg-white/20'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
