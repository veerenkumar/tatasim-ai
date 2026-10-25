import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Percent,
  Sliders,
  DollarSign
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
import { MonteCarloRiskResult, SimulationResponse } from '../types';
import { runRiskAnalysis } from '../services/api';
import { KpiCard } from '../components/KpiCard';

interface Props {
  simulation: SimulationResponse | null;
}

export const RiskAnalysisPage: React.FC<Props> = ({ simulation }) => {
  const [iterations, setIterations] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [growthTarget, setGrowthTarget] = useState(
    simulation?.parameters.sales_growth_target_pct || 20
  );

  const [riskData, setRiskData] = useState<MonteCarloRiskResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    executeSimulation();
  }, []);

  const executeSimulation = async () => {
    setIsSimulating(true);
    try {
      const data = await runRiskAnalysis(iterations, seed, growthTarget);
      setRiskData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const histogramData = riskData?.histogram_bins.map((b) => ({
    range: b.bin_center_cr,
    'Probability (%)': b.probability_pct,
    frequency: b.frequency,
  })) || [];

  const tornadoData = riskData?.sensitivity_ranking.map((s) => ({
    factor: s.risk_factor,
    correlation: s.correlation_with_profit,
    severity: s.impact_severity,
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Monte Carlo Risk & Uncertainty Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Probabilistic stress testing across demand shocks, supplier lead-time slippage, machine breakdowns, and material inflation.
          </p>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="glass-panel p-5 rounded-xl border border-tata-border bg-tata-card/70 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Stochastic Parameters & Seed Configuration
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Monte Carlo Iterations</span>
              <span className="font-mono text-blue-400 font-bold">{iterations.toLocaleString()} runs</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="100"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>200 Quick</span>
              <span>1,000 Standard</span>
              <span>3,000 Rigorous</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Random Reproducibility Seed</span>
              <span className="font-mono text-emerald-400 font-bold">{seed}</span>
            </div>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Target Growth Baseline</span>
              <span className="font-mono text-sky-400 font-bold">+{growthTarget}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={growthTarget}
              onChange={(e) => setGrowthTarget(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Probability distributions applied: Normal(Demand, std=6%), Beta(Supplier Uptime), Poisson(Machine Breakdown)
          </div>
          <button
            onClick={executeSimulation}
            disabled={isSimulating}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Running Iterations...' : 'Execute Monte Carlo Run'}</span>
          </button>
        </div>
      </div>

      {riskData && (
        <>
          {/* Risk Level Banner */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-white block font-semibold mb-0.5">Probabilistic Risk Diagnostic:</strong>
              {riskData.risk_level_summary}
            </div>
          </div>

          {/* Risk KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Mean Projected Profit"
              value={`₹${riskData.mean_operating_profit_cr} Cr`}
              subtitle={`Std Dev: ±₹${riskData.std_dev_profit_cr} Cr`}
              icon={DollarSign}
              accentColor="blue"
            />
            <KpiCard
              title="5th Percentile (VaR)"
              value={`₹${riskData.percentile_5th_var_cr} Cr`}
              subtitle="95% confidence lower profit bound"
              icon={TrendingUp}
              accentColor="rose"
            />
            <KpiCard
              title="P(Meet Sales Target)"
              value={`${riskData.probability_meeting_sales_target_pct}%`}
              subtitle="Probability of achieving >= 98% fulfillment"
              icon={riskData.probability_meeting_sales_target_pct >= 80 ? ShieldCheck : AlertTriangle}
              accentColor={riskData.probability_meeting_sales_target_pct >= 80 ? 'emerald' : 'amber'}
            />
            <KpiCard
              title="P(Material Shortage)"
              value={`${riskData.probability_material_shortage_pct}%`}
              subtitle="Likelihood of supplier stockouts"
              icon={AlertTriangle}
              accentColor={riskData.probability_material_shortage_pct > 25 ? 'rose' : 'emerald'}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Histogram of Operating Profit Distribution */}
            <div className="glass-panel p-5 rounded-2xl border border-tata-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Operating Profit Probability Distribution
                  </h3>
                  <p className="text-xs text-slate-400">
                    20-bin histogram across {riskData.iterations_run.toLocaleString()} simulated market trials
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">₹ Cr (Midpoint)</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="range" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                    />
                    <ReferenceLine x={riskData.mean_operating_profit_cr} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#10B981', fontSize: 11, position: 'top' }} />
                    <ReferenceLine x={riskData.percentile_5th_var_cr} stroke="#E11D48" strokeDasharray="3 3" label={{ value: '5% VaR', fill: '#E11D48', fontSize: 11, position: 'top' }} />
                    <Bar dataKey="Probability (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tornado / Sensitivity Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-tata-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Sensitivity & Correlation Tornado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Which stochastic variables contribute most to profit volatility
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">Corr Coeff</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tornadoData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis type="number" stroke="#64748B" domain={[-0.8, 0.8]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="factor" type="category" stroke="#64748B" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B172E', borderColor: '#1E3567', borderRadius: '8px' }}
                    />
                    <ReferenceLine x={0} stroke="#475569" />
                    <Bar dataKey="correlation" fill="#818CF8" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sensitivity Table */}
          <div className="glass-panel p-5 rounded-2xl border border-tata-border">
            <h3 className="text-sm font-bold text-white tracking-wide mb-3">
              Risk Factor Sensitivity Rankings & Operational Impact
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Uncertainty Factor</th>
                    <th className="py-2.5 px-3 text-right">Profit Correlation</th>
                    <th className="py-2.5 px-3 text-center">Severity Tier</th>
                    <th className="py-2.5 px-3">Operational Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {riskData.sensitivity_ranking.map((s) => (
                    <tr key={s.risk_factor} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-white">{s.risk_factor}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-400">
                        {s.correlation_with_profit > 0 ? '+' : ''}{s.correlation_with_profit}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.impact_severity === 'HIGH'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : s.impact_severity === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {s.impact_severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
