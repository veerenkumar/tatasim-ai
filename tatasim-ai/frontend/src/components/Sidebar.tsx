import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Boxes,
  Factory,
  Truck,
  SlidersHorizontal,
  GitCompare,
  Sparkles,
  BrainCircuit,
  Activity,
  Database,
  Building2
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Executive Overview', icon: LayoutDashboard },
  { to: '/sales', label: 'Sales & Demand', icon: TrendingUp },
  { to: '/workforce', label: 'Workforce Capacity', icon: Users },
  { to: '/inventory', label: 'Inventory & Suppliers', icon: Boxes },
  { to: '/manufacturing', label: 'Manufacturing Plants', icon: Factory },
  { to: '/logistics', label: 'Logistics & Fleet', icon: Truck },
  { to: '/simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
  { to: '/compare', label: 'Scenario Comparison', icon: GitCompare },
  { to: '/optimize', label: 'Constrained Optimizer', icon: Sparkles },
  { to: '/recommendations', label: 'AI Recommendations', icon: BrainCircuit },
  { to: '/risk', label: 'Monte Carlo Risk', icon: Activity },
  { to: '/data', label: 'Data Management', icon: Database },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-tata-border bg-tata-navy/95 min-h-[calc(100vh-57px)] flex flex-col justify-between py-4 px-3">
      <div>
        <div className="px-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Analytics
          </span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-tata-card hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Info */}
      <div className="pt-4 border-t border-tata-border px-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium text-slate-300">Tata Motors Ltd</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Decision Support System v1.0. All KPIs deterministic and uncoupled from paid AI APIs.
        </p>
      </div>
    </aside>
  );
};
