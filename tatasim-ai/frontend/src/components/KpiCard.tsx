import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isWarning?: boolean;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'sky';
  tooltip?: string;
}

export const KpiCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'blue',
  tooltip,
}) => {
  const accentBorder = {
    blue: 'border-blue-500/30 hover:border-blue-500/60',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60',
    amber: 'border-amber-500/30 hover:border-amber-500/60',
    rose: 'border-rose-500/30 hover:border-rose-500/60',
    sky: 'border-sky-500/30 hover:border-sky-500/60',
  }[accentColor];

  const iconBg = {
    blue: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
    emerald: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-600/20 text-rose-400 border border-rose-500/30',
    sky: 'bg-sky-600/20 text-sky-400 border border-sky-500/30',
  }[accentColor];

  return (
    <div
      className={`glass-panel p-5 rounded-xl border transition-all duration-200 glass-panel-hover relative group ${accentBorder}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          {tooltip && (
            <div className="relative group/tip cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/tip:block w-48 p-2 text-xs bg-slate-900 border border-slate-700 rounded-md text-slate-200 shadow-xl z-50 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isWarning
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                : trend.isPositive
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-normal truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
