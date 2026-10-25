import React, { useState } from 'react';
import {
  Factory,
  Layers,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Cog,
  RefreshCw,
  TrendingUp,
  MapPin
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

export const ManufacturingCapacityPage: React.FC<Props> = ({
  simulation,
  onUpdateParameters,
  isLoading,
}) => {
  if (!simulation) return null;

  const { production, parameters } = simulation;
  const [shiftPlants, setShiftPlants] = useState<string[]>(parameters.plants_with_3rd_shift);
  const [subcontract, setSubcontract] = useState(parameters.subcontracting_units);
  const [downtimeOpt, setDowntimeOpt] = useState(parameters.downtime_reduction_pct);

  const togglePlantShift = (pid: string) => {
    let next: string[];
    if (shiftPlants.includes(pid)) {
      next = shiftPlants.filter((p) => p !== pid);
    } else {
      next = [...shiftPlants, pid];
    }
    setShiftPlants(next);
  };

  const handleApply = () => {
    onUpdateParameters({
      ...parameters,
      plants_with_3rd_shift: shiftPlants,
      subcontracting_units: Number(subcontract),
      downtime_reduction_pct: Number(downtimeOpt),
    });
  };

  const plantChartData = production.plants.map((p) => ({
    name: p.plant_name.replace(' Plant', '').replace(' Heavy Vehicle', ''),
    'Effective Capacity': p.effective_capacity,
    'Required Starts': p.required_starts,
    'Finished Output': p.finished_output_feasible,
    utilization: p.utilization_pct,
  }));

  const yieldData = production.plants.map((p) => ({
    name: p.plant_name.replace(' Plant', '').replace(' Heavy Vehicle', ''),
    'Finished Units': p.finished_output_feasible,
    'Yield Loss Scrap': p.yield_loss_scrap_units,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-400" />
            <span>Manufacturing Plants & Assembly Lines</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate Pune, Sanand, Jamshedpur, Pantnagar, and Lucknow plant utilization subject to yield losses and shift schedules.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Plant Shift & Outsource Operations
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3rd Shift Activation */}
          <div>
            <span className="block text-xs text-slate-300 font-medium mb-2">
              Activate 3rd Production Shift (+50% Capacity)
            </span>
            <div className="space-y-2">
              {[
                { id: 'PLANT-PUN', name: 'Pune Plant (PV/EV)' },
                { id: 'PLANT-SAN', name: 'Sanand Plant (PV/EV)' },
                { id: 'PLANT-JAM', name: 'Jamshedpur Heavy Plant (CV)' },
              ].map((pl) => {
                const active = shiftPlants.includes(pl.id);
                return (
                  <label
                    key={pl.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      active
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{pl.name}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => togglePlantShift(pl.id)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Subcontracting */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Contract Assembly / Subcontracting</span>
              <span className="font-mono text-sky-400 font-bold text-sm">
                {subcontract.toLocaleString()} Units
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="500"
              value={subcontract}
              onChange={(e) => setSubcontract(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 Internal Only</span>
              <span>3,000 Units</span>
              <span>10,000 Max Partner Cap</span>
            </div>
          </div>

          {/* Downtime Optimization */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Preventive Maintenance Optimization</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {downtimeOpt}% Downtime Saved
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={downtimeOpt}
              onChange={(e) => setDowntimeOpt(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% Standard</span>
              <span>20% Lean Kaizen</span>
              <span>40% TPM Max</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Current Constrained Facility:{' '}
            <strong className="text-amber-400">{production.bottleneck_plant}</strong>
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Plant Capacities</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Internal Plant Capacity"
          value={production.total_internal_capacity.toLocaleString()}
          subtitle="Effective capacity across active shifts"
          icon={Factory}
          accentColor="blue"
        />
        <KpiCard
          title="Required Production Starts"
          value={production.total_required_starts.toLocaleString()}
          subtitle={`Includes ${production.total_yield_scrap_units.toLocaleString()} scrap/rework units`}
          icon={Layers}
          accentColor="sky"
        />
        <KpiCard
          title="Overall Plant Load"
          value={`${production.overall_mfg_utilization_pct}%`}
          subtitle={
            production.total_shortfall_units > 0
              ? `${production.total_shortfall_units.toLocaleString()} starts shortfall`
              : 'Within facility limits'
          }
          icon={production.is_feasible ? CheckCircle2 : AlertTriangle}
          accentColor={production.overall_mfg_utilization_pct > 100 ? 'rose' : 'emerald'}
          trend={{
            value: production.overall_mfg_utilization_pct > 100 ? 'Over capacity' : 'Feasible',
            isPositive: production.overall_mfg_utilization_pct <= 100,
            isWarning: production.overall_mfg_utilization_pct > 100,
          }}
        />
        <KpiCard
          title="Variable Mfg & Capex Cost"
          value={`₹${production.total_mfg_cost_cr} Cr`}
          subtitle={`Shift Capex: ₹${production.total_shift_capex_amortized_cr} Cr/mo`}
          icon={Percent}
          accentColor="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant Capacity vs Starts */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Plant Capacity vs Assembly Demand Starts
              </h3>
              <p className="text-xs text-slate-400">
                Monthly vehicle capacity vs allocated production starts
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Vehicles</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Effective Capacity" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required Starts" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Finished Output" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finished vs Yield Scrap Loss */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Yield Conversion & Scrap Units
              </h3>
              <p className="text-xs text-slate-400">
                First-pass manufacturing yield losses (~96.5% typical)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Units</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Finished Units" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Yield Loss Scrap" stackId="a" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plant Capacity Table */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Manufacturing Plant Operating Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Plant Facility</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Tooled Segments</th>
                <th className="py-2.5 px-3 text-center">Shifts</th>
                <th className="py-2.5 px-3 text-right">Effective Cap</th>
                <th className="py-2.5 px-3 text-right">Starts Required</th>
                <th className="py-2.5 px-3 text-right">Utilization</th>
                <th className="py-2.5 px-3 text-right">Output Feasible</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {production.plants.map((p) => (
                <tr key={p.plant_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{p.plant_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.plant_id}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{p.location}</td>
                  <td className="py-3 px-3 font-mono text-blue-400 font-semibold">{p.primary_segments}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.active_shifts === 3 ? 'bg-blue-900 text-blue-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.active_shifts} Shifts
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{p.effective_capacity.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    {p.required_starts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={p.utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                      {p.utilization_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                    {p.finished_output_feasible.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.utilization_pct > 100 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        CONSTRAINED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        FEASIBLE
                      </span>
                    )}
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
