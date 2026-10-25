import React from 'react';
import {
  TrendingUp,
  Users,
  Factory,
  Boxes,
  Truck,
  IndianRupee,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  BarChart3
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { SimulationResponse } from '../types';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

interface Props {
  simulation: SimulationResponse | null;
  isLoading: boolean;
  onSelectScenario: (id: string) => void;
}

export const OverviewDashboard: React.FC<Props> = ({ simulation, isLoading }) => {
  if (isLoading || !simulation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Executing deterministic simulation engine...</p>
        </div>
      </div>
    );
  }

  const { demand, workforce, inventory, production, logistics, finance, recommendations, parameters } = simulation;

  // Data for Revenue comparison chart
  const revenueChartData = [
    {
      name: 'Monthly Revenue',
      'Baseline (₹ Cr)': finance.baseline_revenue_cr,
      'Target Demand (₹ Cr)': finance.target_potential_revenue_cr,
      'Realized Real (₹ Cr)': finance.realized_fulfilled_revenue_cr,
    },
  ];

  // Data for Resource Utilization radar/bar
  const utilizationData = [
    { subject: 'Workforce Assembly', utilization: workforce.overall_utilization_pct, threshold: 100 },
    { subject: 'Mfg Plants', utilization: production.overall_mfg_utilization_pct, threshold: 100 },
    { subject: 'Outbound Logistics', utilization: logistics.overall_logistics_utilization_pct, threshold: 100 },
    { subject: 'Material Inventory', utilization: Math.min(120, ((demand.total_net_order_units / inventory.max_units_supported_by_inventory) * 100)), threshold: 100 },
  ];

  // Data for Segment Fulfillment
  const segmentFulfillmentData = demand.segment_breakdown.map((s) => ({
    segment: s.segment,
    model: s.model_family.split(' ')[0],
    demanded: s.net_order_units,
    fulfilled: Math.round(s.net_order_units * (finance.fulfillment_rate_pct / 100.0)),
    unfulfilled: Math.round(s.net_order_units * ((100.0 - finance.fulfillment_rate_pct) / 100.0)),
  }));

  const isFeasible = finance.feasibility_status === 'FEASIBLE';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Executive Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-tata-border relative overflow-hidden bg-gradient-to-r from-tata-navy via-tata-card to-tata-navy">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                ACTIVE SCENARIO
              </span>
              <StatusBadge status={finance.feasibility_status} size="md" />
              <span className="text-xs text-slate-400">
                Target: <strong className="text-white">+{parameters.sales_growth_target_pct}% Sales Growth</strong>
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {simulation.scenario_name}
            </h1>
            <p className="mt-1 text-xs lg:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Evaluating physical feasibility for Tata Motors to scale production from{' '}
              <span className="font-semibold text-white">{demand.total_baseline_units.toLocaleString()}</span> to{' '}
              <span className="font-semibold text-white">{demand.total_net_order_units.toLocaleString()}</span> vehicles across workforce, plant shifts, supply chain, and carrier fleets.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/70 p-4 rounded-xl shrink-0">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Limiting Operational Resource
              </div>
              <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{finance.limiting_resource}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Fulfilled: <strong className="text-white">{finance.fulfillment_rate_pct}%</strong> ({finance.fulfilled_units.toLocaleString()} units)
              </div>
            </div>
          </div>
        </div>

        {/* Synthetic Data notice banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Illustrative Synthetic Model:</strong> All operational figures are synthesized for algorithmic what-if testing and do not represent verified confidential records of Tata Motors Limited.
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monthly Target Revenue"
          value={`₹${finance.target_potential_revenue_cr.toLocaleString()} Cr`}
          subtitle={`Baseline: ₹${finance.baseline_revenue_cr.toLocaleString()} Cr`}
          icon={TrendingUp}
          accentColor="blue"
          trend={{
            value: `+₹${finance.incremental_revenue_cr} Cr`,
            isPositive: finance.incremental_revenue_cr >= 0,
          }}
          tooltip="Gross target revenue at full demand fulfillment prior to capacity bottleneck limits."
        />

        <KpiCard
          title="Realized Fulfilled Revenue"
          value={`₹${finance.realized_fulfilled_revenue_cr.toLocaleString()} Cr`}
          subtitle={
            finance.unfulfilled_units > 0
              ? `Lost to Bottlenecks: ₹${finance.lost_revenue_from_bottlenecks_cr} Cr`
              : '100% Demand Realized'
          }
          icon={IndianRupee}
          accentColor={finance.unfulfilled_units > 0 ? 'amber' : 'emerald'}
          trend={{
            value: `${finance.fulfillment_rate_pct}% Fulfilled`,
            isPositive: finance.fulfillment_rate_pct >= 95,
            isWarning: finance.fulfillment_rate_pct < 95,
          }}
          tooltip="Net realized billing revenue after applying physical manufacturing, supply, and logistics limits."
        />

        <KpiCard
          title="Projected Operating Profit (EBIT)"
          value={`₹${finance.operating_profit_ebit_cr.toLocaleString()} Cr`}
          subtitle={`Margin: ${finance.operating_margin_pct}% (Base: ₹${finance.baseline_operating_profit_cr} Cr)`}
          icon={BarChart3}
          accentColor={finance.is_financially_viable ? 'emerald' : 'rose'}
          trend={{
            value: `${finance.incremental_operating_profit_cr >= 0 ? '+' : ''}₹${finance.incremental_operating_profit_cr} Cr EBIT`,
            isPositive: finance.incremental_operating_profit_cr > 0,
          }}
          tooltip="Operating profit after subtracting variable BOM, direct labor, OT, logistics, holding, and fixed plant SG&A."
        />

        <KpiCard
          title="Operational Bottlenecks"
          value={
            isFeasible ? '0 Bottlenecks' : `${finance.unfulfilled_units.toLocaleString()} Deficit`
          }
          subtitle={`Limiting: ${finance.limiting_resource}`}
          icon={isFeasible ? CheckCircle2 : AlertTriangle}
          accentColor={isFeasible ? 'emerald' : 'rose'}
          trend={{
            value: isFeasible ? 'Feasible' : 'Constrained',
            isPositive: isFeasible,
            isWarning: !isFeasible,
          }}
          tooltip="Number of plant departments, material lines, or transport corridors that cannot support the growth target."
        />
      </div>

      {/* Second Row of KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-tata-border">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Workforce Load</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {workforce.overall_utilization_pct}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {workforce.bottleneck_department !== 'None' ? `Bottleneck: ${workforce.bottleneck_department}` : 'Within Safe Limit'}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-tata-border">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manufacturing Load</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {production.overall_mfg_utilization_pct}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {production.bottleneck_plant !== 'None' ? `Constrained: ${production.bottleneck_plant}` : 'Capacity Adequate'}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-tata-border">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            <span>Inventory Shortages</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {inventory.shortage_component_count} SKUs
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {inventory.shortage_component_count > 0 ? `Risk: ${inventory.primary_bottleneck_component}` : 'Buffers Covered'}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-tata-border">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Logistics Dispatch</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {logistics.overall_logistics_utilization_pct}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {logistics.bottleneck_zone !== 'None' ? `Corridor: ${logistics.bottleneck_zone}` : 'Fleet Sufficient'}
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Fulfillment Gap Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Revenue Realization vs Baseline
              </h3>
              <p className="text-xs text-slate-400">
                Baseline vs Projected Target vs Realized (after physical bottlenecks)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">₹ in Crores</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Baseline (₹ Cr)" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target Demand (₹ Cr)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realized Real (₹ Cr)" fill={isFeasible ? '#10B981' : '#F59E0B'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Utilization Radar */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Operational Stress Radar
              </h3>
              <p className="text-xs text-slate-400">
                Resource loads vs 100% statutory / physical ceiling
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">% Capacity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={utilizationData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 130]} stroke="#475569" />
                <Radar
                  name="Load %"
                  dataKey="utilization"
                  stroke="#38BDF8"
                  fill="#0284C7"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segment Breakdown Table & Quick AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segment Table (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Vehicle Segment Fulfillment Breakdown
              </h3>
              <p className="text-xs text-slate-400">Passenger, Commercial, and EV volume distribution</p>
            </div>
            <Link to="/sales" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>Detailed Sales Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">Representative Line</th>
                  <th className="py-2.5 px-3 text-right">Baseline</th>
                  <th className="py-2.5 px-3 text-right">Demanded</th>
                  <th className="py-2.5 px-3 text-right">Fulfilled</th>
                  <th className="py-2.5 px-3 text-right">Revenue (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {demand.segment_breakdown.map((s) => (
                  <tr key={s.segment} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-blue-400">{s.segment}</td>
                    <td className="py-3 px-3 text-slate-300">{s.model_family}</td>
                    <td className="py-3 px-3 text-right font-mono">{s.baseline_units.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                      {s.net_order_units.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {Math.round(s.net_order_units * (finance.fulfillment_rate_pct / 100.0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-white font-bold">
                      ₹{s.target_revenue_cr.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority AI Recommendations Callout */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Key AI Recommendation
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                HIGH PRIORITY
              </span>
            </div>

            {recommendations.cards.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-bold text-white mb-1">
                    {recommendations.cards[0].title}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {recommendations.cards[0].identified_problem}
                  </p>
                  <div className="mt-2 text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                    <span>Action:</span>
                    <span className="text-slate-200 font-normal">
                      {recommendations.cards[0].recommended_action.slice(0, 90)}...
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/40 text-xs text-slate-300">
                  <div className="font-semibold text-blue-300 mb-0.5">Financial Upside</div>
                  <p>{recommendations.cards[0].estimated_financial_impact}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">All systems within normal operational limits.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              to="/recommendations"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
            >
              <span>View All {recommendations.cards.length} Strategic Initiatives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
