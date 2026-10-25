import React, { useState } from 'react';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { ScenarioParameters } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, params: ScenarioParameters) => void;
}

export const NewScenarioModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('Custom 20% Ramp-up Strategy');
  const [description, setDescription] = useState('Custom scenario created to evaluate targeted overtime and supplier expediting.');
  const [growthTarget, setGrowthTarget] = useState(20);
  const [horizon, setHorizon] = useState('monthly');
  const [overtimePct, setOvertimePct] = useState(15);
  const [hires, setHires] = useState(250);
  const [shiftPune, setShiftPune] = useState(true);
  const [shiftSanand, setShiftSanand] = useState(false);
  const [safetyBuffer, setSafetyBuffer] = useState(15);
  const [expedite, setExpedite] = useState(false);
  const [thirdParty3PL, setThirdParty3PL] = useState(25);
  const [subcontractUnits, setSubcontractUnits] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shiftPlants: string[] = [];
    if (shiftPune) shiftPlants.push('PLANT-PUN');
    if (shiftSanand) shiftPlants.push('PLANT-SAN');

    const params: ScenarioParameters = {
      sales_growth_target_pct: Number(growthTarget),
      planning_horizon: horizon,
      target_segments: ['PV', 'CV', 'EV'],
      additional_hires: Number(hires),
      overtime_pct: Number(overtimePct),
      plants_with_3rd_shift: shiftPlants,
      safety_stock_buffer_pct: Number(safetyBuffer),
      expedite_inventory: expedite,
      subcontracting_units: Number(subcontractUnits),
      third_party_logistics_pct: Number(thirdParty3PL),
      downtime_reduction_pct: 10,
      express_freight: false,
    };

    onSubmit(name, description, params);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-tata-border shadow-2xl p-6 relative bg-tata-navy max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create What-If Scenario</h2>
            <p className="text-xs text-slate-400">Configure business assumptions and test capacity feasibility</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Description & Executive Rationale
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Grid of Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Sales Growth Target</span>
                <span className="font-mono text-blue-400 font-bold">{growthTarget}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={growthTarget}
                onChange={(e) => setGrowthTarget(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Planning Horizon</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="monthly">Monthly (1 Month)</option>
                <option value="quarterly">Quarterly (3 Months)</option>
                <option value="annual">Annual (12 Months)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Overtime Pool Authorized</span>
                <span className="font-mono text-emerald-400 font-bold">{overtimePct}%</span>
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
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Additional Technician Hires</span>
                <span className="font-mono text-emerald-400 font-bold">+{hires} FTE</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={hires}
                onChange={(e) => setHires(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Inventory Safety Stock Buffer</span>
                <span className="font-mono text-amber-400 font-bold">+{safetyBuffer}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">3PL Logistics Expansion</span>
                <span className="font-mono text-sky-400 font-bold">{thirdParty3PL}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={thirdParty3PL}
                onChange={(e) => setThirdParty3PL(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Plant Shifts & Options */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Manufacturing & Procurement Actions
            </span>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={shiftPune}
                  onChange={(e) => setShiftPune(e.target.checked)}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <span>3rd Shift: Pune Plant (PV/EV)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={shiftSanand}
                  onChange={(e) => setShiftSanand(e.target.checked)}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <span>3rd Shift: Sanand Plant</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={expedite}
                  onChange={(e) => setExpedite(e.target.checked)}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <span>Expedite Supplier Purchase Orders</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simulate & Save Scenario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
