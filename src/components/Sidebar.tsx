import React from 'react';
import { 
  Layers, 
  Database, 
  ShieldCheck, 
  Store, 
  Bike, 
  GitCommit, 
  FileText, 
  Share2, 
  Clock, 
  CheckCircle2,
  Activity
} from 'lucide-react';

export type TabKey = 
  | 'overview' 
  | 'schema' 
  | 'security' 
  | 'vendors' 
  | 'drivers' 
  | 'pipeline' 
  | 'source_of_truth' 
  | 'ai_handoff' 
  | 'project_state' 
  | 'dev_log';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  vendorCount: number;
  driverCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  vendorCount,
  driverCount
}) => {
  const getNavClass = (tab: TabKey) => {
    const isActive = activeTab === tab;
    return `flex items-center gap-2.5 px-3 py-2 text-sm rounded-md font-medium transition-colors ${
      isActive 
        ? 'bg-slate-100 text-[#FF6321]' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FF6321] rounded flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
          TMD
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">
            Thuma Mina
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">
            Soshanguve Platform
          </span>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-2 tracking-widest">
          Architecture
        </div>
        <button 
          id="nav-overview"
          onClick={() => onSelectTab('overview')} 
          className={`w-full text-left ${getNavClass('overview')}`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button 
          id="nav-schema"
          onClick={() => onSelectTab('schema')} 
          className={`w-full text-left ${getNavClass('schema')}`}
        >
          <Database className="w-4 h-4" />
          <span>Database Schema</span>
        </button>
        <button 
          id="nav-security"
          onClick={() => onSelectTab('security')} 
          className={`w-full text-left ${getNavClass('security')}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Model (RLS)</span>
        </button>

        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 mt-6 mb-2 tracking-widest">
          MVP Management
        </div>
        <button 
          id="nav-vendors"
          onClick={() => onSelectTab('vendors')} 
          className={`w-full text-left ${getNavClass('vendors')}`}
        >
          <Store className="w-4 h-4" />
          <span className="flex-1">Vendors</span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {vendorCount}
          </span>
        </button>
        <button 
          id="nav-drivers"
          onClick={() => onSelectTab('drivers')} 
          className={`w-full text-left ${getNavClass('drivers')}`}
        >
          <Bike className="w-4 h-4" />
          <span className="flex-1">Drivers (Fleet)</span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {driverCount}
          </span>
        </button>
        <button 
          id="nav-pipeline"
          onClick={() => onSelectTab('pipeline')} 
          className={`w-full text-left ${getNavClass('pipeline')}`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Order Pipeline</span>
        </button>

        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 mt-6 mb-2 tracking-widest">
          System Docs
        </div>
        <button 
          id="nav-source-of-truth"
          onClick={() => onSelectTab('source_of_truth')} 
          className={`w-full text-left ${getNavClass('source_of_truth')}`}
        >
          <FileText className="w-4 h-4" />
          <span>Source of Truth</span>
        </button>
        <button 
          id="nav-ai-handoff"
          onClick={() => onSelectTab('ai_handoff')} 
          className={`w-full text-left ${getNavClass('ai_handoff')}`}
        >
          <Share2 className="w-4 h-4" />
          <span>AI Handoff</span>
        </button>
        <button 
          id="nav-project-state"
          onClick={() => onSelectTab('project_state')} 
          className={`w-full text-left ${getNavClass('project_state')}`}
        >
          <Activity className="w-4 h-4" />
          <span>Project State</span>
        </button>
        <button 
          id="nav-dev-log"
          onClick={() => onSelectTab('dev_log')} 
          className={`w-full text-left ${getNavClass('dev_log')}`}
        >
          <Clock className="w-4 h-4" />
          <span>Dev Log</span>
        </button>
      </nav>

      {/* Project State Indicator */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider flex items-center justify-between">
            <span>Project State</span>
            <span className="font-mono text-[9px] text-slate-400">v0.1.0-init</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-700">Initialization Phase</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
