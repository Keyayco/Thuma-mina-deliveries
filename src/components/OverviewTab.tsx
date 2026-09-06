import React from 'react';
import { TabKey } from './Sidebar';
import { ROADMAP_STEPS } from '../data/initialData';
import { CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Database, Layers } from 'lucide-react';

interface OverviewTabProps {
  onNavigateTab: (tab: TabKey) => void;
  onExecuteInitialization: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateTab,
  onExecuteInitialization
}) => {
  return (
    <section className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
      {/* Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium mb-1">Target MVP Users</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">240+</div>
            <div className="text-[10px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Soshanguve Region</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium mb-1">Active Core Tables</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">14</div>
            <div className="text-[10px] text-slate-400 mt-2 font-medium">
              11 Tables + 6 Enums Schema
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium mb-1">System Latency</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">24ms</div>
            <div className="text-[10px] text-slate-400 mt-2 font-medium">
              Render + Neon Frankfurt
            </div>
          </div>
        </div>

        {/* Database Architecture Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#FF6321]" />
              <h2 className="font-bold text-sm text-slate-900">Database Architecture Snapshot</h2>
            </div>
            <button
              onClick={() => onNavigateTab('schema')}
              className="text-[10px] bg-[#FF6321]/10 text-[#FF6321] px-2 py-0.5 rounded uppercase font-bold hover:bg-[#FF6321]/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Verified — View DDL</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-2.5">
            <div 
              onClick={() => onNavigateTab('schema')}
              className="flex items-center justify-between text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-2 font-mono text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>public.profiles</span>
              </div>
              <span className="text-slate-400 italic text-[11px] font-mono">ORM Model: active</span>
            </div>

            <div 
              onClick={() => onNavigateTab('schema')}
              className="flex items-center justify-between text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-2 font-mono text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>public.vendors</span>
              </div>
              <span className="text-slate-400 italic text-[11px] font-mono">ORM Model: active</span>
            </div>

            <div 
              onClick={() => onNavigateTab('pipeline')}
              className="flex items-center justify-between text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-2 font-mono text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#FF6321]"></span>
                <span>public.orders</span>
              </div>
              <span className="text-[#FF6321] font-bold text-[11px] font-mono">ONE_VENDOR_RULE</span>
            </div>

            <div 
              onClick={() => onNavigateTab('drivers')}
              className="flex items-center justify-between text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-2 font-mono text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>public.deliveries</span>
              </div>
              <span className="text-slate-500 font-medium text-[11px] font-mono">DRIVER_ASSIGNMENT</span>
            </div>
          </div>
        </div>

        {/* Phase 1 Brand Banner */}
        <div className="bg-[#FF6321] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-85 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Clearance Granted</span>
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">Phase 1: Architecture Verdict</h3>
            <p className="text-sm opacity-95 leading-relaxed max-w-lg text-orange-50 font-normal">
              The proposed stack (React + Supabase + PWA) configured for Render Static Site deployment is officially approved. Mobile-first architecture ensures compatibility with local South African bandwidth constraints and offline township reliability.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button 
                id="btn-execute-init"
                onClick={onExecuteInitialization}
                className="bg-white hover:bg-orange-50 text-[#FF6321] text-xs font-bold px-6 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Execute Initialization
              </button>
              <button 
                onClick={() => onNavigateTab('source_of_truth')}
                className="bg-[#FF6321]/30 hover:bg-[#FF6321]/50 border border-white/40 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                Review Source of Truth
              </button>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <svg width="220" height="220" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 13h9v8h-9v-8zm0-11h9v9h-9v-9zM2 13h9v8H2v-8zm0-11h9v9H2v-9z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Column: Roadmap & Risks */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-slate-900">Technical Implementation Roadmap</h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Milestones</span>
            </div>

            <div className="space-y-4">
              {ROADMAP_STEPS.map((step) => (
                <div 
                  key={step.step}
                  className={`flex gap-3 transition-opacity ${step.active ? 'opacity-100' : 'opacity-65 hover:opacity-100'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    step.active 
                      ? 'bg-[#FF6321] text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {step.step}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{step.title}</span>
                      {step.active && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded font-mono font-medium border border-emerald-200">
                          Current Focus
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Risks */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
              Active Risks & Mitigations
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-[11px] font-medium text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                <span>Connectivity volatility in Soshanguve (Mitigation: PWA cache + SMS/WhatsApp fallback)</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] font-medium text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                <span>Payment method abstraction logic (Mitigation: Decoupled PaymentService for COD & EFT)</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                <span>Two-bike capacity limit (Mitigation: Admin dispatcher queue control)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
