import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  PackageCheck,
  Zap
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
import { SimulationResponse, ScenarioParameters } from '../types';
import { KpiCard } from '../components/KpiCard';

interface Props {
  simulation: SimulationResponse | null;
  onUpdateParameters: (params: ScenarioParameters) => void;
  isLoading: boolean;
}

export const InventorySuppliersPage: React.FC<Props> = ({
  simulation,
  onUpdateParameters,
  isLoading,
}) => {
  if (!simulation) return null;

  const { inventory, parameters } = simulation;
  const [safetyBuffer, setSafetyBuffer] = useState(parameters.safety_stock_buffer_pct);
  const [expedite, setExpedite] = useState(parameters.expedite_inventory);

  const handleApply = () => {
    onUpdateParameters({
      ...parameters,
      safety_stock_buffer_pct: Number(safetyBuffer),
      expedite_inventory: expedite,
    });
  };

  const coverageChartData = inventory.components.map((c) => ({
    name: c.component_name.length > 22 ? c.component_name.slice(0, 20) + '...' : c.component_name,
    'Coverage (Days)': c.coverage_days > 90 ? 90 : Math.round(c.coverage_days),
    isShortage: c.is_shortage,
  }));

  const workingCapitalData = inventory.components.map((c) => ({
    name: c.component_name.length > 18 ? c.component_name.slice(0, 16) + '..' : c.component_name,
    'BOM Cost (₹ Cr)': c.bom_cost_cr,
    'Reorder Procurement (₹ Cr)': c.procurement_cost_cr,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-400" />
            <span>Inventory, Bill-of-Materials & Supplier Continuity</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor automotive raw materials, battery cells, microchips, inventory coverage, and supplier lead-time exposure.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Procurement & Inventory Buffer Policies
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Safety Stock Buffer Expansion</span>
              <span className="font-mono text-amber-400 font-bold text-sm">+{safetyBuffer}% Buffer</span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="5"
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-20% Lean</span>
              <span>0% Baseline</span>
              <span>+50% Heavy Buffer</span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500 transition-all">
              <input
                type="checkbox"
                checked={expedite}
                onChange={(e) => setExpedite(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">Authorize Expedited Supplier Orders</span>
                <span className="text-[11px] text-slate-400">
                  Reduces component lead times by 30% with a +6% logistics/expedite premium
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Limiting Component:{' '}
            <strong className="text-amber-400">{inventory.primary_bottleneck_component}</strong>
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Direct BOM Cost"
          value={`₹${inventory.total_bom_consumption_cr} Cr`}
          subtitle="Monthly raw material burn rate"
          icon={DollarSign}
          accentColor="blue"
        />
        <KpiCard
          title="Reorder Procurement"
          value={`₹${inventory.total_procurement_cost_cr} Cr`}
          subtitle="Cash outlay to replenish buffers"
          icon={PackageCheck}
          accentColor="sky"
        />
        <KpiCard
          title="Working Capital Tied Up"
          value={`₹${inventory.total_working_capital_cr} Cr`}
          subtitle={`Carrying cost: ₹${inventory.total_holding_cost_cr} Cr/mo`}
          icon={TrendingUp}
          accentColor="amber"
        />
        <KpiCard
          title="Component Stockouts"
          value={`${inventory.shortage_component_count} SKUs`}
          subtitle={
            inventory.shortage_component_count > 0
              ? `Critical: ${inventory.primary_bottleneck_component}`
              : 'All materials covered'
          }
          icon={inventory.shortage_component_count === 0 ? ShieldCheck : AlertTriangle}
          accentColor={inventory.shortage_component_count === 0 ? 'emerald' : 'rose'}
          trend={{
            value: inventory.shortage_component_count === 0 ? 'Secured' : 'Shortage Risk',
            isPositive: inventory.shortage_component_count === 0,
            isWarning: inventory.shortage_component_count > 0,
          }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Component Inventory Coverage
              </h3>
              <p className="text-xs text-slate-400">
                Days of inventory remaining at projected monthly run-rate (30-day target)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Days</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" domain={[0, 90]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748B" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <ReferenceLine x={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: '30d Safe Buffer', fill: '#10B981', fontSize: 10, position: 'top' }} />
                <Bar dataKey="Coverage (Days)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Working Capital Stack */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Procurement & Consumption Spend by Component
              </h3>
              <p className="text-xs text-slate-400">
                Direct monthly bill of materials vs new reorder commitments
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">₹ in Crores</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workingCapitalData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="BOM Cost (₹ Cr)" stackId="a" fill="#1E40AF" />
                <Bar dataKey="Reorder Procurement (₹ Cr)" stackId="a" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Bill-of-Materials Table */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Bill-of-Materials & Component Stock Status
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">SKU & Component</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Required</th>
                <th className="py-2.5 px-3 text-right">Coverage</th>
                <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                <th className="py-2.5 px-3 text-right">Procure Cost (₹ Cr)</th>
                <th className="py-2.5 px-3 text-right">Lead Time</th>
                <th className="py-2.5 px-3 text-center">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {inventory.components.map((c) => (
                <tr key={c.component_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{c.component_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.component_id}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.category}</td>
                  <td className="py-3 px-3 text-right font-mono">{c.current_stock.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    {c.required_units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={c.coverage_days < 25 ? 'text-rose-400' : 'text-emerald-400'}>
                      {c.coverage_days.toFixed(1)} days
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sky-400 font-semibold">
                    {c.reorder_units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white font-bold">
                    ₹{c.procurement_cost_cr}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{c.lead_time_weeks} wks</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.risk_level === 'High'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : c.risk_level === 'Medium'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {c.risk_level}
                    </span>
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
