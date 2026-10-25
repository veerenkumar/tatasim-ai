import React, { useState } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import { SimulationResponse } from '../types';

interface Props {
  simulation: SimulationResponse | null;
}

export const AiRecommendationsPage: React.FC<Props> = ({ simulation }) => {
  if (!simulation) return null;

  const { recommendations, finance, parameters } = simulation;
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Workforce', 'Inventory', 'Manufacturing', 'Logistics', 'Financial', 'Strategic'];

  const filteredCards = recommendations.cards.filter((card) =>
    selectedCategory === 'ALL' ? true : card.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-400" />
            <span>AI Strategic Recommendations & Bottleneck Playbook</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic, explainable operational guidance rooted directly in verified calculations and constraint gaps.
          </p>
        </div>
      </div>

      {/* Executive Narrative Memo */}
      <div className="glass-panel p-6 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-tata-card to-blue-950/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <span>EXECUTIVE MANAGEMENT DIRECTIVE — TATA MOTORS</span>
        </div>
        <div className="text-xs lg:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-mono bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          {recommendations.executive_narrative}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-400 font-semibold mr-2">Filter:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all border ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendation Action Cards Grid */}
      <div className="space-y-4">
        {filteredCards.map((card) => {
          const isCritical = card.priority === 'CRITICAL';
          const isHigh = card.priority === 'HIGH';

          const priorityBorder = isCritical
            ? 'border-rose-500/60 shadow-lg shadow-rose-950/20'
            : isHigh
            ? 'border-amber-500/60 shadow-lg shadow-amber-950/20'
            : 'border-blue-500/40';

          const badgeBg = isCritical
            ? 'bg-rose-950 text-rose-300 border-rose-800'
            : isHigh
            ? 'bg-amber-950 text-amber-300 border-amber-800'
            : 'bg-blue-950 text-blue-300 border-blue-800';

          return (
            <div
              key={card.id}
              className={`glass-panel p-6 rounded-2xl border transition-all duration-200 bg-tata-card/85 space-y-4 ${priorityBorder}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeBg}`}>
                    {card.priority} PRIORITY
                  </span>
                  <span className="text-xs font-semibold text-blue-400 font-mono">
                    {card.category}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({card.id})</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Incremental Cost:{' '}
                  <strong className="text-white">₹{card.estimated_incremental_cost_cr} Cr</strong>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{card.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-200">Problem Identified: </strong>
                  {card.identified_problem}
                </p>
              </div>

              {/* Numerical Evidence & Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Supporting Numerical Evidence
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {card.supporting_numerical_evidence}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    Recommended Executive Action
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {card.recommended_action}
                  </p>
                </div>
              </div>

              {/* Financial Return & Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="flex items-start gap-2 text-slate-300">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-400 block">Expected Financial Impact:</span>
                    <span className="text-slate-300">{card.estimated_financial_impact}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-400">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-400 block">Assumptions & Risks:</span>
                    <span className="text-slate-300">{card.key_assumptions_and_risks}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
