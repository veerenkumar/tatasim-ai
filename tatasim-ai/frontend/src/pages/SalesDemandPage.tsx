import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Calendar,
  AlertCircle,
  Car,
  Truck,
  Zap,
  BarChart2,
  RefreshCw
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SimulationResponse, ScenarioParameters } from '../types';
import { KpiCard } from '../components/KpiCard';

interface Props {
  simulation: SimulationResponse | null;
  onUpdateParameters: (params: ScenarioParameters) => void;
  isLoading: boolean;
}

export const SalesDemandPage: React.FC<Props> = ({
  simulation,
  onUpdateParameters,
  isLoading,
}) => {
  if (!simulation) return null;

  const { demand, finance, parameters } = simulation;
  const [growth, setGrowth] = useState(parameters.sales_growth_target_pct);
  const [horizon, setHorizon] = useState(parameters.planning_horizon);
  const [segments, setSegments] = useState<string[]>(parameters.target_segments);

  const toggleSegment = (seg: string) => {
    let next: string[];
    if (segments.includes(seg)) {
      if (segments.length === 1) return; // Keep at least one
      next = segments.filter((s) => s !== seg);
    } else {
      next = [...segments, seg];
    }
    setSegments(next);
  };

  const handleApply = () => {
    onUpdateParameters({
      ...parameters,
      sales_growth_target_pct: Number(growth),
      planning_horizon: horizon,
      target_segments: segments,
    });
  };

  const pieColors = ['#3B82F6', '#6366F1', '#10B981'];

  const segmentShareData = demand.segment_breakdown.map((s, idx) => ({
    name: s.segment,
    value: s.net_order_units,
    color: pieColors[idx % pieColors.length],
  }));

  const chartData = demand.segment_breakdown.map((s) => ({
    segment: s.segment,
    Baseline: s.baseline_units,
    'Gross Demanded': s.gross_demanded_units,
    'Net Orders': s.net_order_units,
    'Cancellations': s.cancellation_units,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Sales & Demand Planning</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Model domestic demand ramp-up, booking cancellation attrition, and revenue potential for Tata Motors.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Demand Scenario Levers
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Growth Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Sales Growth Target</span>
              <span className="font-mono text-blue-400 font-bold text-sm">+{growth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Baseline)</span>
              <span>20% (Default)</span>
              <span>50% (Max)</span>
            </div>
          </div>

          {/* Planning Horizon */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">
              Planning Horizon
            </label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="monthly">Monthly (1 Month)</option>
              <option value="quarterly">Quarterly (3 Months)</option>
              <option value="annual">Annual (12 Months)</option>
            </select>
          </div>

          {/* Segment Selection */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">
              Target Product Segments
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: 'PV', label: 'PV', icon: Car },
                { id: 'CV', label: 'CV', icon: Truck },
                { id: 'EV', label: 'EV', icon: Zap },
              ].map((seg) => {
                const isSelected = segments.includes(seg.id);
                const Icon = seg.icon;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => toggleSegment(seg.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Formula applied: <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">Net Orders = Baseline × (1 + Growth) × (1 − Cancellation)</code>
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Demand</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Baseline Vehicle Demand"
          value={demand.total_baseline_units.toLocaleString()}
          subtitle="Contracted steady-state volume"
          icon={Car}
          accentColor="blue"
        />
        <KpiCard
          title="Gross Demanded Units"
          value={demand.total_gross_demanded_units.toLocaleString()}
          subtitle={`+${demand.total_gross_demanded_units - demand.total_baseline_units} incremental orders`}
          icon={TrendingUp}
          accentColor="sky"
        />
        <KpiCard
          title="Cancellation Attrition"
          value={demand.total_cancellation_units.toLocaleString()}
          subtitle="Drop-offs before assembly scheduling"
          icon={AlertCircle}
          accentColor="amber"
        />
        <KpiCard
          title="Net Firm Orders"
          value={demand.total_net_order_units.toLocaleString()}
          subtitle={`Target Revenue: ₹${demand.total_target_revenue_cr} Cr`}
          icon={Zap}
          accentColor="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Vehicle Units by Product Segment
              </h3>
              <p className="text-xs text-slate-400">
                Baseline vs Demanded vs Firm Orders
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="segment" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Baseline" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gross Demanded" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart for Segment Volume Share */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide mb-1">
              Volume Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Net order share across divisions</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {segmentShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {demand.segment_breakdown.map((s, idx) => (
              <div key={s.segment} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                  />
                  <span className="text-slate-300 font-medium">{s.segment}</span>
                </div>
                <span className="font-mono text-white font-semibold">
                  {s.net_order_units.toLocaleString()} units
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segment Detail Table */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Segment Economics & Average Selling Prices (ASP)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Segment</th>
                <th className="py-2.5 px-3">Model Lines</th>
                <th className="py-2.5 px-3 text-right">Avg Price (₹)</th>
                <th className="py-2.5 px-3 text-right">Baseline Units</th>
                <th className="py-2.5 px-3 text-right">Target Net Units</th>
                <th className="py-2.5 px-3 text-right">Target Rev (₹ Cr)</th>
                <th className="py-2.5 px-3 text-right">Incremental Rev (₹ Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {demand.segment_breakdown.map((s) => (
                <tr key={s.segment} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-bold text-blue-400">{s.segment}</td>
                  <td className="py-3 px-3 text-slate-300">{s.model_family}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{(s.asp_inr / 100000).toFixed(1)} Lakh</td>
                  <td className="py-3 px-3 text-right font-mono">{s.baseline_units.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {s.net_order_units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white font-semibold">
                    ₹{s.target_revenue_cr.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                    +₹{s.incremental_revenue_target_cr.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
