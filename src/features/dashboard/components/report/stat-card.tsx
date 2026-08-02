// components/admin/report/stat-card.tsx

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({
  icon: Icon,
  color,
  label,
  value,
  unit,
  trend,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number;
  unit: string;
  trend?: number;
}) {
  const colorMap: Record<string, { text: string; bg: string }> = {
    blue: { text: 'text-info', bg: 'bg-info/10' },
    orange: { text: 'text-primary', bg: 'bg-primary/10' },
    cyan: { text: 'text-info', bg: 'bg-info/10' },
    pink: { text: 'text-chart-4', bg: 'bg-chart-4/10' },
    teal: { text: 'text-success', bg: 'bg-success/10' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-background border border-border rounded-xl p-4 hover:border-border transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${c.text}`} />
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-1">{unit}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {trend > 0 ? <TrendingUp className="w-4 h-4 text-success" /> :
           trend < 0 ? <TrendingDown className="w-4 h-4 text-destructive" /> :
           <Minus className="w-4 h-4 text-muted-foreground" />}
          <span className={`text-xs font-semibold ${
            trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </div>
  );
}
