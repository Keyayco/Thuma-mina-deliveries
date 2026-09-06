import React from 'react';
import { TabKey } from './Sidebar';
import { Shield, Sparkles, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: TabKey;
  onTriggerLowCreditHandoff: () => void;
}

const TAB_TITLES: Record<TabKey, string> = {
  overview: 'Project Initialization Dashboard',
  schema: 'PostgreSQL Relational Schema',
  security: 'Security & Row Level Security (RLS)',
  vendors: 'Vendor Directory & Prep Times',
  drivers: '2-Bike Fleet Operations',
  pipeline: 'One Order = One Vendor State Machine',
  source_of_truth: 'docs/SOURCE_OF_TRUTH.md',
  ai_handoff: 'docs/AI_HANDOFF.md',
  project_state: 'docs/PROJECT_STATE.md',
  dev_log: 'docs/DEV_LOG.md'
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTriggerLowCreditHandoff
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">TMD</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-900">
          {TAB_TITLES[activeTab]}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          id="btn-low-credit-handoff"
          onClick={onTriggerLowCreditHandoff}
          className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Terminal className="w-3.5 h-3.5 text-[#FF6321]" />
          <span>LOW CREDIT HANDOFF</span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            PA
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">Lead Architect</span>
            <span className="text-[10px] text-slate-400 font-mono">Soshanguve Unit</span>
          </div>
        </div>
      </div>
    </header>
  );
};
