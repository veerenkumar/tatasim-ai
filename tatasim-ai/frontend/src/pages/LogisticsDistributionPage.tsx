import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Navigation
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

export const LogisticsDistributionPage: React.FC<Props> = ({
  simulation,
  onUpdateParameters,
  isLoading,
}) => {
  if (!simulation) return null;

  const { logistics, parameters } = simulation;
  const [expansion3PL, setExpansion3PL] = useState(parameters.third_party_logistics_pct);
  const [express, setExpress] = useState(parameters.express_freight);

  const handleApply = () => {
    onUpdateParameters({
      ...parameters,
      third_party_logistics_pct: Number(expansion3PL),
      express_freight: express,
    });
  };

  const corridorChartData = logistics.zones.map((z) => ({
    name: z.zone_name.replace(' Corridor', ''),
    'Contracted Fleet': z.contracted_capacity,
    '3PL Emergency Buffer': z.third_party_buffer_capacity,
    'Demanded Dispatch': z.required_dispatch_units,
    'Feasible Dispatch': z.feasible_dispatch_units,
  }));

  const transitData = logistics.zones.map((z) => ({
    name: z.zone_name.replace(' Corridor', ''),
    'Average Transit (Days)': z.transit_days_avg,
    'Cost per Vehicle (₹k)': Math.round((z.total_corridor_cost_cr * 1e7) / Math.max(1, z.feasible_dispatch_units) / 1000),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <span>Logistics & Outbound Distribution Networks</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Model car-carrier trailer availability, regional distribution hubs (Bhiwandi, Manesar, Hosur, Kolkata), and freight transit times.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Distribution Fleet & Carrier Policies
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">3PL Spot-Market Fleet Expansion</span>
              <span className="font-mono text-sky-400 font-bold text-sm">{expansion3PL}% Deployed</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={expansion3PL}
              onChange={(e) => setExpansion3PL(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% Contracted Only</span>
              <span>35% Standard Buffer</span>
              <span>100% Full Emergency Carrier Fleet</span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500 transition-all">
              <input
                type="checkbox"
                checked={express}
                onChange={(e) => setExpress(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-white block">Express Multimodal Freight Delivery</span>
                <span className="text-[11px] text-slate-400">
                  Prioritizes dedicated rail-rake paths, shortening transit by 20% with a +10% freight tariff
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Bottleneck Freight Corridor:{' '}
            <strong className="text-amber-400">{logistics.bottleneck_zone}</strong>
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Logistics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Outbound Dispatch Needed"
          value={logistics.total_dispatch_demanded.toLocaleString()}
          subtitle="Vehicles ready for dealer transport"
          icon={Truck}
          accentColor="blue"
        />
        <KpiCard
          title="Effective Fleet Throughput"
          value={logistics.total_effective_capacity.toLocaleString()}
          subtitle="Contracted + 3PL carrier capacity"
          icon={Navigation}
          accentColor="sky"
        />
        <KpiCard
          title="Logistics Fleet Load"
          value={`${logistics.overall_logistics_utilization_pct}%`}
          subtitle={
            logistics.total_shortfall_units > 0
              ? `${logistics.total_shortfall_units.toLocaleString()} vehicles delayed`
              : 'Fleet throughput adequate'
          }
          icon={logistics.is_feasible ? CheckCircle2 : AlertTriangle}
          accentColor={logistics.overall_logistics_utilization_pct > 100 ? 'rose' : 'emerald'}
          trend={{
            value: logistics.overall_logistics_utilization_pct > 100 ? 'Capacity deficit' : 'Feasible',
            isPositive: logistics.overall_logistics_utilization_pct <= 100,
            isWarning: logistics.overall_logistics_utilization_pct > 100,
          }}
        />
        <KpiCard
          title="Total Outbound Freight"
          value={`₹${logistics.total_logistics_cost_cr} Cr`}
          subtitle={`Spot premium: ₹${logistics.total_spot_premium_cost_cr} Cr`}
          icon={DollarSign}
          accentColor="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Corridor Capacity vs Dispatch */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Carrier Fleet Capacity vs Dispatch Volume
              </h3>
              <p className="text-xs text-slate-400">
                Monthly vehicle carrier trailers across distribution zones
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Vehicles</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corridorChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Contracted Fleet" stackId="cap" fill="#1E40AF" />
                <Bar dataKey="3PL Emergency Buffer" stackId="cap" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Demanded Dispatch" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Feasible Dispatch" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transit Lead Time and Unit Freight */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Average Transit Lead Time to Dealerships
              </h3>
              <p className="text-xs text-slate-400">
                Factory gate to regional hub delivery transit in days
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Days</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transitData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" domain={[0, 8]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Bar dataKey="Average Transit (Days)" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Corridor Table */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Regional Distribution Corridors & Carrier Logistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Corridor & Marshaling Hub</th>
                <th className="py-2.5 px-3">Transport Fleet Mode</th>
                <th className="py-2.5 px-3 text-right">Contracted Cap</th>
                <th className="py-2.5 px-3 text-right">3PL Buffer</th>
                <th className="py-2.5 px-3 text-right">Dispatch Needed</th>
                <th className="py-2.5 px-3 text-right">Utilization</th>
                <th className="py-2.5 px-3 text-right">Total Freight (₹ Cr)</th>
                <th className="py-2.5 px-3 text-center">Delay Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {logistics.zones.map((z) => (
                <tr key={z.zone_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{z.zone_name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>{z.primary_hub}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{z.transport_mode}</td>
                  <td className="py-3 px-3 text-right font-mono">{z.contracted_capacity.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-sky-400">+{z.third_party_buffer_capacity.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    {z.required_dispatch_units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={z.utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                      {z.utilization_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    ₹{z.total_corridor_cost_cr}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        z.delay_risk_level === 'Critical'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : z.delay_risk_level === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {z.delay_risk_level}
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
