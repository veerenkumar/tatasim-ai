import React from 'react';
import { Play, Download, Sparkles, RefreshCw, ShieldAlert, Layers } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ScenarioListItem } from '../types';

interface Props {
  scenarios: ScenarioListItem[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  feasibilityStatus: string;
  growthTargetPct: number;
  onQuickSimulate20: () => void;
  onOpenNewScenarioModal: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  feasibilityStatus,
  growthTargetPct,
  onQuickSimulate20,
  onOpenNewScenarioModal,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-tata-border bg-tata-navy/90 backdrop-blur-md px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-600 text-white font-black text-lg shadow-lg shadow-blue-500/20">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                TataSim AI
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Tata Motors
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              What-If Business & Capacity Simulator
            </p>
          </div>
        </div>

        {/* Center: Scenario Switcher */}
        <div className="hidden md:flex items-center gap-3 bg-tata-card/80 border border-tata-border px-3 py-1.5 rounded-lg">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400 font-medium">Scenario:</span>
          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer max-w-xs truncate"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} ({s.parameters.sales_growth_target_pct}% Growth)
              </option>
            ))}
          </select>
          <StatusBadge status={feasibilityStatus} size="sm" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Synthetic Data pill disclaimer */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Illustrative Synthetic Data</span>
          </div>

          {/* Quick 20% Growth Action */}
          <button
            onClick={onQuickSimulate20}
            disabled={isLoading}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
            title="Switch immediately to the core 20% growth scenario"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run 20% Growth</span>
          </button>

          {/* New Custom Scenario Button */}
          <button
            onClick={onOpenNewScenarioModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-tata-card hover:bg-tata-hover border border-tata-border text-slate-200 hover:text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>New Scenario</span>
          </button>

          {/* CSV Export */}
          <a
            href={`/api/reports/export/csv/${activeScenarioId || 'scenario-sales-growth-only'}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-tata-card hover:bg-tata-hover border border-tata-border text-slate-200 hover:text-white transition-all"
            title="Download complete scenario simulation report in CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </a>
        </div>
      </div>
    </header>
  );
};
