import React, { useState } from 'react';
import {
  Users,
  Clock,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
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
  ReferenceLine
} from 'recharts';
import { SimulationResponse, ScenarioParameters } from '../types';
import { KpiCard } from '../components/KpiCard';

interface Props {
  simulation: SimulationResponse | null;
  onUpdateParameters: (params: ScenarioParameters) => void;
  isLoading: boolean;
}

export const WorkforcePlanningPage: React.FC<Props> = ({
  simulation,
  onUpdateParameters,
  isLoading,
}) => {
  if (!simulation) return null;

  const { workforce, parameters } = simulation;
  const [overtimePct, setOvertimePct] = useState(parameters.overtime_pct);
  const [hires, setHires] = useState(parameters.additional_hires);

  const handleApply = () => {
    onUpdateParameters({
      ...parameters,
      overtime_pct: Number(overtimePct),
      additional_hires: Number(hires),
    });
  };

  const deptChartData = workforce.departments.map((d) => ({
    department: d.department,
    'Utilization %': d.utilization_pct,
    'Available Hours': Math.round(d.total_hours_available / 1000),
    'Required Hours': Math.round(d.required_labor_hours / 1000),
    shortfall: d.shortfall_hours > 0,
  }));

  const costBreakdownData = workforce.departments.map((d) => ({
    department: d.department,
    'Regular Wages': d.regular_labor_cost_cr,
    'Overtime Premium': d.ot_labor_cost_cr,
    'New Hire Payroll': d.recurring_salary_cost_cr + d.hiring_cost_cr,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Workforce Capacity & Labor Economics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate shop-floor man-hour deficits, shift overtime authorizations, and technician recruitment costs.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Labor Policy Levers
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Overtime Pool Authorization</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{overtimePct}% Allowed</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={overtimePct}
              onChange={(e) => setOvertimePct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Standard 8h Shift)</span>
              <span>25% (+6h/wk)</span>
              <span>100% (Max Statutory)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">New Technician Recruitment</span>
              <span className="font-mono text-blue-400 font-bold text-sm">+{hires} Full-Time Technicians</span>
            </div>
            <input
              type="range"
              min="0"
              max="1200"
              step="25"
              value={hires}
              onChange={(e) => setHires(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 Hires</span>
              <span>450 Hires (Expansion)</span>
              <span>1,200 Max Pool</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Current Bottleneck Department:{' '}
            <strong className="text-amber-400">{workforce.bottleneck_department}</strong>
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Workforce</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Headcount"
          value={(workforce.total_active_headcount + workforce.total_additional_hires).toLocaleString()}
          subtitle={`+${workforce.total_additional_hires} new hires across 6 departments`}
          icon={Users}
          accentColor="blue"
        />
        <KpiCard
          title="Overall Labor Load"
          value={`${workforce.overall_utilization_pct}%`}
          subtitle={
            workforce.total_shortfall_hours > 0
              ? `${Math.round(workforce.total_shortfall_hours).toLocaleString()} hrs deficit`
              : 'Within productive hours'
          }
          icon={Clock}
          accentColor={workforce.overall_utilization_pct > 100 ? 'rose' : 'emerald'}
          trend={{
            value: workforce.overall_utilization_pct > 100 ? 'Overburdened' : 'Feasible',
            isPositive: workforce.overall_utilization_pct <= 100,
            isWarning: workforce.overall_utilization_pct > 100,
          }}
        />
        <KpiCard
          title="Total Labor Cost"
          value={`₹${workforce.total_labor_cost_cr} Cr`}
          subtitle={`Overtime: ₹${workforce.total_ot_cost_cr} Cr | Hires: ₹${workforce.total_hiring_cost_cr} Cr`}
          icon={DollarSign}
          accentColor="amber"
        />
        <KpiCard
          title="Max Units Supported"
          value={workforce.max_units_supported_by_workforce.toLocaleString()}
          subtitle={`Capped by ${workforce.bottleneck_department}`}
          icon={workforce.is_feasible ? CheckCircle2 : AlertTriangle}
          accentColor={workforce.is_feasible ? 'emerald' : 'rose'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Utilization Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Capacity Utilization by Department
              </h3>
              <p className="text-xs text-slate-400">
                Red reference line indicates 100% capacity limit
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">% Load</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="department" stroke="#64748B" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748B" domain={[0, 130]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <ReferenceLine y={100} stroke="#E11D48" strokeDasharray="4 4" label={{ value: '100% Limit', fill: '#E11D48', fontSize: 11, position: 'top' }} />
                <Bar dataKey="Utilization %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Stack Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Labor Cost Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Regular direct wages vs Overtime vs New recruitment payroll
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">₹ in Crores</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="department" stroke="#64748B" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Regular Wages" stackId="a" fill="#1E40AF" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Overtime Premium" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="New Hire Payroll" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Department Table */}
      <div className="glass-panel p-5 rounded-2xl border border-tata-border">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3">
          Departmental Labor Hours & Capacity Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Headcount</th>
                <th className="py-2.5 px-3 text-right">Required (k hrs)</th>
                <th className="py-2.5 px-3 text-right">Available (k hrs)</th>
                <th className="py-2.5 px-3 text-right">Utilization</th>
                <th className="py-2.5 px-3 text-right">Deficit / Surplus</th>
                <th className="py-2.5 px-3 text-right">Cost (₹ Cr)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {workforce.departments.map((d) => (
                <tr key={d.department} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-white">{d.department}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {d.active_headcount + d.additional_hires}
                    {d.additional_hires > 0 && <span className="text-blue-400 ml-1">+{d.additional_hires}</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{(d.required_labor_hours / 1000).toFixed(1)}k</td>
                  <td className="py-3 px-3 text-right font-mono">{(d.total_hours_available / 1000).toFixed(1)}k</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={d.utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                      {d.utilization_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {d.shortfall_hours > 0 ? (
                      <span className="text-rose-400 font-semibold">-{(d.shortfall_hours / 1000).toFixed(1)}k hrs</span>
                    ) : (
                      <span className="text-slate-400">+{(d.surplus_hours / 1000).toFixed(1)}k hrs</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    ₹{d.total_workforce_cost_cr}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {d.utilization_pct > 100 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        BOTTLENECK
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
