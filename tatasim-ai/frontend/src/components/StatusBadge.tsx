import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface Props {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status || 'Unknown';

  if (norm.includes('FEASIBLE') && !norm.includes('IN') && !norm.includes('CONSTRAINED')) {
    bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50 shadow-sm shadow-emerald-900/30';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    label = 'Operationally Feasible';
  } else if (norm.includes('CONSTRAINED') || norm.includes('BOTTLENECK')) {
    bg = 'bg-amber-950/70 text-amber-300 border-amber-600/50 shadow-sm shadow-amber-900/30';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    label = 'Capacity Constrained';
  } else if (norm.includes('INFEASIBLE') || norm.includes('CRITICAL')) {
    bg = 'bg-rose-950/70 text-rose-300 border-rose-600/50 shadow-sm shadow-rose-900/30';
    icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    label = 'Infeasible / Deficit';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${sizeClasses[size]} ${bg}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
