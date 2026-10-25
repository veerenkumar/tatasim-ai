import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Check
} from 'lucide-react';
import { OptimizationResult } from '../types';
import { runOptimization } from '../services/api';

export const OptimizationEnginePage: React.FC = () => {
  const [objective, setObjective] = useState<'maximize_profit' | 'minimize_cost'>('maximize_profit');
  const [growthTarget, setGrowthTarget] = useState(20);
  const [minFulfillment, setMinFulfillment] = useState(98);
  const [allowOT, setAllowOT] = useState(true);
  const [allowHires, setAllowHires] = useState(true);
  const [allowShifts, setAllowShifts] = useState(true);
  const [allowSubcontract, setAllowSubcontract] = useState(true);
  const [allow3PL, setAllow3PL] = useState(true);

  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const res = await runOptimization({
        objective,
        growth_target_pct: Number(growthTarget),
        min_fulfillment_pct: Number(minFulfillment),
        allow_overtime: allowOT,
        allow_hiring: allowHires,
        allow_extra_shifts: allowShifts,
        allow_subcontracting: allowSubcontract,
        allow_3pl_logistics: allow3PL,
      });
      setOptResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to solve constrained optimization problem.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>Constrained Optimization Engine (SciPy SLSQP)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Solves multi-variable non-linear programming problems to mathematically determine the optimal growth strategy.
          </p>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-tata-border bg-tata-card/70 space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Optimization Objective & Target Growth
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                objective === 'maximize_profit'
                  ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="objective"
                checked={objective === 'maximize_profit'}
                onChange={() => setObjective('maximize_profit')}
                className="mt-1 accent-blue-600"
              />
              <div>
                <span className="text-sm font-bold text-white block">Maximize Incremental Operating Profit</span>
                <span className="text-xs text-slate-400 mt-0.5 block leading-relaxed">
                  Maximizes net operating earnings (EBIT) subject to target fulfillment and physical resource bounds.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                objective === 'minimize_cost'
                  ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="objective"
                checked={objective === 'minimize_cost'}
                onChange={() => setObjective('minimize_cost')}
                className="mt-1 accent-blue-600"
              />
              <div>
                <span className="text-sm font-bold text-white block">Minimize Cost of Achieving Target</span>
                <span className="text-xs text-slate-400 mt-0.5 block leading-relaxed">
                  Minimizes incremental operational and capex expenses required to fulfill at least 98% of target demand.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Sales Target Growth Rate</span>
              <span className="font-mono text-blue-400 font-bold text-sm">+{growthTarget}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={growthTarget}
              onChange={(e) => setGrowthTarget(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Minimum Order Fulfillment Constraint</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{minFulfillment}%</span>
            </div>
            <input
              type="range"
              min="85"
              max="100"
              step="1"
              value={minFulfillment}
              onChange={(e) => setMinFulfillment(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Permitted Decision Variables */}
        <div className="pt-4 border-t border-slate-800">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Permitted Operational Decision Levers
          </span>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowOT}
                onChange={(e) => setAllowOT(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Allow Overtime Authorization</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowHires}
                onChange={(e) => setAllowHires(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Allow Technician Hiring</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowShifts}
                onChange={(e) => setAllowShifts(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Allow 3rd Plant Shifts</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSubcontract}
                onChange={(e) => setAllowSubcontract(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Allow Subcontracting</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allow3PL}
                onChange={(e) => setAllow3PL(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Allow 3PL Spot Fleet</span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Solving Constrained Optimizer...' : 'Solve Optimal Allocation (SciPy)'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Optimization Results */}
      {optResult && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-tata-card to-emerald-950/20 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Mathematically Optimal Strategy Found
                </h2>
                <p className="text-xs text-slate-400">
                  SciPy solver verified all physical manufacturing and workforce bounds.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              {optResult.achieved_fulfillment_pct}% Fulfillment
            </span>
          </div>

          {/* Mathematical Explanation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-200">
            {optResult.explanation}
          </div>

          {/* Optimal Action Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Optimal Operational Decisions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overtime</span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                  {optResult.allocation.recommended_overtime_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Shop-floor pool</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tech Hires</span>
                <span className="text-lg font-bold font-mono text-blue-400 mt-1 block">
                  +{optResult.allocation.recommended_additional_hires}
                </span>
                <span className="text-[10px] text-slate-400">Assembly operators</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">3rd Shifts</span>
                <span className="text-sm font-bold font-mono text-indigo-300 mt-1 block truncate">
                  {optResult.allocation.recommended_3rd_shift_plants.length > 0
                    ? optResult.allocation.recommended_3rd_shift_plants.map(p => p.replace('PLANT-', '')).join(', ')
                    : 'None'}
                </span>
                <span className="text-[10px] text-slate-400">Plant lines</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inventory Buffer</span>
                <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                  +{optResult.allocation.recommended_safety_stock_buffer_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Safety stock</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">3PL Fleet</span>
                <span className="text-lg font-bold font-mono text-sky-400 mt-1 block">
                  {optResult.allocation.recommended_3pl_logistics_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Carrier dispatch</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subcontract</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  {optResult.allocation.recommended_subcontracting_units.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Partner units</span>
              </div>
            </div>
          </div>

          {/* Verified Constraints Status */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Constraint Verification Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(optResult.constraints_satisfied).map(([name, satisfied]) => (
                <div key={name} className="flex items-center gap-2 text-slate-300">
                  {satisfied ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={satisfied ? 'text-slate-300' : 'text-rose-400 font-semibold'}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
