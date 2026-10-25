import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Download,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { ScenarioListItem, ScenarioComparisonResponse } from '../types';
import { compareScenarios, getExportComparisonCsvUrl } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  scenarios: ScenarioListItem[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
}

export const ScenarioComparisonPage: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  // Default select 3 core scenarios: Baseline, Sales Growth Only, Balanced Growth Strategy
  const defaultSelected = [
    'scenario-baseline',
    'scenario-sales-growth-only',
    'scenario-balanced-growth',
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>(
    defaultSelected.filter((id) => scenarios.some((s) => s.id === id))
  );

  const [comparison, setComparison] = useState<ScenarioComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      loadComparison();
    }
  }, [selectedIds]);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const data = await compareScenarios(selectedIds);
      setComparison(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) return; // Keep at least 2
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const profitChartData = comparison?.scenarios.map((s) => ({
    name: s.scenario_name.replace(/^[0-9]\.\s*/, '').slice(0, 16),
    'Operating Profit (₹ Cr)': s.operating_profit_cr,
    'Incremental EBIT (₹ Cr)': s.incremental_profit_cr,
    'Realized Revenue (₹ Cr)': s.revenue_cr,
  })) || [];

  const utilizationChartData = comparison?.scenarios.map((s) => ({
    name: s.scenario_name.replace(/^[0-9]\.\s*/, '').slice(0, 16),
    'Workforce %': s.workforce_utilization_pct,
    'Plant Mfg %': s.production_utilization_pct,
    'Logistics %': s.logistics_utilization_pct,
    'Fulfillment %': s.fulfillment_rate_pct,
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <span>Multi-Scenario Comparison & Trade-Off Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate simultaneous growth options side-by-side to select the optimal, highest-margin operational strategy.
          </p>
        </div>

        {selectedIds.length >= 2 && (
          <a
            href={getExportComparisonCsvUrl(selectedIds)}
            download
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-tata-card hover:bg-tata-hover border border-tata-border text-white transition-all flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Comparison CSV</span>
          </a>
        )}
      </div>

      {/* Scenario Multi-Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-tata-border bg-tata-card/70 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Scenarios to Compare (Minimum 2)
          </span>
          <span className="text-xs text-blue-400 font-mono">
            {selectedIds.length} of {scenarios.length} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {scenarios.map((s) => {
            const isChecked = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSelect(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-2 ${
                  isChecked
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] opacity-75">({s.parameters.sales_growth_target_pct}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Analysis Callout */}
      {comparison && (
        <div className="glass-panel p-4 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-950/30 via-slate-900 to-blue-950/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs leading-relaxed text-slate-300">
            <strong className="text-white block font-semibold mb-0.5">Strategic Comparison Findings:</strong>
            {comparison.summary_analysis}
          </div>
        </div>
      )}

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Profit Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Operating Profit (EBIT) & Incremental Gain
              </h3>
              <p className="text-xs text-slate-400">
                Total monthly operating profit vs baseline contribution
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">₹ in Crores</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Operating Profit (₹ Cr)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incremental EBIT (₹ Cr)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fulfillment Rate & Resource Utilizations */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Demand Fulfillment & Resource Load %
              </h3>
              <p className="text-xs text-slate-400">
                Comparing operational stress levels across scenarios
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">% Rate</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" domain={[0, 130]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <ReferenceLine y={100} stroke="#E11D48" strokeDasharray="3 3" />
                <Bar dataKey="Fulfillment %" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Workforce %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Plant Mfg %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Side-by-Side Comparison Matrix */}
      {comparison && (
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <h3 className="text-sm font-bold text-white tracking-wide mb-3">
            Comprehensive Operational & Financial Comparison Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Scenario Name</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Target Growth</th>
                  <th className="py-3 px-3 text-right">Fulfillment</th>
                  <th className="py-3 px-3 text-right">Revenue (₹ Cr)</th>
                  <th className="py-3 px-3 text-right">EBIT (₹ Cr)</th>
                  <th className="py-3 px-3 text-right">Incr EBIT (₹ Cr)</th>
                  <th className="py-3 px-3 text-right">Total Cost (₹ Cr)</th>
                  <th className="py-3 px-3 text-right">Working Cap (₹ Cr)</th>
                  <th className="py-3 px-3">Limiting Barrier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {comparison.scenarios.map((s) => (
                  <tr key={s.scenario_id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {s.scenario_id === comparison.best_profit_scenario_id && (
                          <span title="Best Profit Scenario">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        <span>{s.scenario_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={s.feasibility_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-blue-400">
                      +{s.sales_growth_target_pct}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={s.fulfillment_rate_pct >= 98 ? 'text-emerald-400' : 'text-amber-400'}>
                        {s.fulfillment_rate_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                      ₹{s.revenue_cr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={s.operating_profit_cr > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        ₹{s.operating_profit_cr.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-400">
                      {s.incremental_profit_cr >= 0 ? '+' : ''}₹{s.incremental_profit_cr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      ₹{s.total_operating_cost_cr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300">
                      ₹{s.working_capital_cr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 max-w-xs truncate">
                      {s.limiting_resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
