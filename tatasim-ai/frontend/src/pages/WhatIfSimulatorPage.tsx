import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
  Boxes,
  Factory,
  Truck,
  DollarSign,
  AlertOctagon,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { SimulationResponse, ScenarioParameters, ScenarioListItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { simulateScenario, createScenario } from '../services/api';

interface Props {
  simulation: SimulationResponse | null;
  scenarios: ScenarioListItem[];
  onSelectScenario: (id: string) => void;
  onRefreshScenarios: () => void;
}

export const WhatIfSimulatorPage: React.FC<Props> = ({
  simulation,
  scenarios,
  onSelectScenario,
  onRefreshScenarios,
}) => {
  if (!simulation) return null;

  // Local state for interactive sandbox
  const [params, setParams] = useState<ScenarioParameters>(simulation.parameters);
  const [liveResult, setLiveResult] = useState<SimulationResponse>(simulation);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize when active scenario changes externally
  useEffect(() => {
    setParams(simulation.parameters);
    setLiveResult(simulation);
  }, [simulation.scenario_id]);

  // Debounced real-time simulation on parameter changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSimulating(true);
      try {
        const res = await simulateScenario(params);
        setLiveResult(res);
      } catch (err) {
        console.error('Simulation error', err);
      } finally {
        setIsSimulating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [params]);

  const updateParam = <K extends keyof ScenarioParameters>(key: K, value: ScenarioParameters[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlantShift = (pid: string) => {
    const current = params.plants_with_3rd_shift;
    const next = current.includes(pid) ? current.filter((p) => p !== pid) : [...current, pid];
    updateParam('plants_with_3rd_shift', next);
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    try {
      await createScenario(saveName, saveDesc, params);
      setSavedSuccess(true);
      onRefreshScenarios();
      setTimeout(() => {
        setSavedSuccess(false);
        setShowSaveModal(false);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const { finance, demand, workforce, production, inventory, logistics } = liveResult;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-400" />
            <span>Interactive What-If Scenario Builder</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test policy combinations in real-time. Instantly recalculates production constraints, demand fulfillment, and operating profits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Scenario</span>
          </button>
        </div>
      </div>

      {/* Preset Scenario Selector Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-tata-border flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Quick Presets:</span>
        <div className="flex items-center gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectScenario(s.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all border ${
                simulation.scenario_id === s.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Financial & Feasibility Summary Ribbon */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-tata-card to-blue-950/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className={`w-6 h-6 ${isSimulating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Simulation Outcome
                </span>
                <StatusBadge status={finance.feasibility_status} size="sm" />
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {finance.fulfilled_units.toLocaleString()} / {demand.total_net_order_units.toLocaleString()} Vehicles Fulfilled ({finance.fulfillment_rate_pct}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Realized Revenue</span>
              <span className="text-base font-bold font-mono text-white">
                ₹{finance.realized_fulfilled_revenue_cr.toLocaleString()} Cr
              </span>
              <span className="text-[10px] text-emerald-400 block">+₹{finance.incremental_revenue_cr} Cr vs Base</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Operating Profit</span>
              <span className={`text-base font-bold font-mono ${finance.operating_profit_ebit_cr > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{finance.operating_profit_ebit_cr.toLocaleString()} Cr
              </span>
              <span className="text-[10px] text-slate-300 block">
                {finance.incremental_operating_profit_cr >= 0 ? '+' : ''}₹{finance.incremental_operating_profit_cr} Cr EBIT
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Limiting Resource</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{finance.limiting_resource}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Sales & Labor Levers */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Sales Growth & Workforce Levers
            </h3>
          </div>

          {/* Sales Target */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Sales Target Growth Rate</span>
              <span className="font-mono text-blue-400 font-bold text-sm">+{params.sales_growth_target_pct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={params.sales_growth_target_pct}
              onChange={(e) => updateParam('sales_growth_target_pct', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% Baseline</span>
              <span>20% Management Goal</span>
              <span>50% Rapid Stretch</span>
            </div>
          </div>

          {/* Overtime */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Overtime Pool Authorized</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{params.overtime_pct}% Pool</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.overtime_pct}
              onChange={(e) => updateParam('overtime_pct', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% Standard Shift</span>
              <span>25% Moderate OT</span>
              <span>100% Max Allowed</span>
            </div>
          </div>

          {/* Technician Hires */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Additional Technician Hires</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">+{params.additional_hires} Operators</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="25"
              value={params.additional_hires}
              onChange={(e) => updateParam('additional_hires', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 Hires</span>
              <span>300 Hires</span>
              <span>1,000 FTE</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Workforce Status:</span>
              <span className={`font-bold ${workforce.overall_utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {workforce.overall_utilization_pct}% Load ({workforce.bottleneck_department})
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Plant Shifts & Outsourcing */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Factory className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Plant Shift Schedules & Subcontracting
            </h3>
          </div>

          {/* Plant Shifts */}
          <div>
            <span className="block text-xs text-slate-300 font-medium mb-2">
              Activate 3rd Shift (+50% Plant Capacity)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PLANT-PUN', name: 'Pune Plant (PV/EV)' },
                { id: 'PLANT-SAN', name: 'Sanand Plant (PV/EV)' },
                { id: 'PLANT-JAM', name: 'Jamshedpur Heavy (CV)' },
                { id: 'PLANT-PAN', name: 'Pantnagar (CV Small)' },
              ].map((pl) => {
                const active = params.plants_with_3rd_shift.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => togglePlantShift(pl.id)}
                    className={`p-2.5 rounded-lg text-xs font-semibold text-left transition-all border ${
                      active
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{pl.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {active ? '3 Shifts' : '2 Shifts'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcontracting */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Subcontracted Assembly Units</span>
              <span className="font-mono text-sky-400 font-bold text-sm">
                {params.subcontracting_units.toLocaleString()} Units
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8000"
              step="500"
              value={params.subcontracting_units}
              onChange={(e) => updateParam('subcontracting_units', Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Maintenance optimization */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Downtime Reduction (Kaizen / TPM)</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {params.downtime_reduction_pct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={params.downtime_reduction_pct}
              onChange={(e) => updateParam('downtime_reduction_pct', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Plant Load Status:</span>
              <span className={`font-bold ${production.overall_mfg_utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {production.overall_mfg_utilization_pct}% Load ({production.bottleneck_plant})
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Inventory & Supply Chain Levers */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Inventory & Supplier Lead Times
            </h3>
          </div>

          {/* Safety Stock */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Safety Stock Buffer Expansion</span>
              <span className="font-mono text-amber-400 font-bold text-sm">+{params.safety_stock_buffer_pct}% Buffer</span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="5"
              value={params.safety_stock_buffer_pct}
              onChange={(e) => updateParam('safety_stock_buffer_pct', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-20% Lean JIT</span>
              <span>0% Baseline</span>
              <span>+50% Risk Buffer</span>
            </div>
          </div>

          {/* Expedited Orders Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500 transition-all">
            <input
              type="checkbox"
              checked={params.expedite_inventory}
              onChange={(e) => updateParam('expedite_inventory', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-white block">Expedite Critical Component Purchase Orders</span>
              <span className="text-[11px] text-slate-400">
                Compresses lead times by 30% to prevent stockouts of ECUs and battery modules
              </span>
            </div>
          </label>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Inventory Stockout Risk:</span>
              <span className={`font-bold ${inventory.shortage_component_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inventory.shortage_component_count} SKUs at Risk
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Logistics & Dispatch Levers */}
        <div className="glass-panel p-5 rounded-2xl border border-tata-border space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Logistics & Corridor Distribution
            </h3>
          </div>

          {/* 3PL Fleet */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">3PL Spot Carrier Fleet Expansion</span>
              <span className="font-mono text-sky-400 font-bold text-sm">{params.third_party_logistics_pct}% Deployed</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.third_party_logistics_pct}
              onChange={(e) => updateParam('third_party_logistics_pct', Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Express Freight */}
          <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500 transition-all">
            <input
              type="checkbox"
              checked={params.express_freight}
              onChange={(e) => updateParam('express_freight', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-white block">Dedicated Rail & Express Carrier Dispatch</span>
              <span className="text-[11px] text-slate-400">
                Speeds up transit days along Northern and Western trunks
              </span>
            </div>
          </label>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Logistics Fleet Load:</span>
              <span className={`font-bold ${logistics.overall_logistics_utilization_pct > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {logistics.overall_logistics_utilization_pct}% Load ({logistics.bottleneck_zone})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-tata-border p-6 bg-tata-navy space-y-4">
            <h3 className="text-base font-bold text-white">Save Current Configuration</h3>
            <p className="text-xs text-slate-400">
              Store this combination of growth targets, shift schedules, and operational buffers for future multi-scenario comparison.
            </p>

            <form onSubmit={handleSaveScenario} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balanced Q3 Growth"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes on assumptions and trade-offs"
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savedSuccess}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
                >
                  {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Saved!' : 'Save Scenario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
