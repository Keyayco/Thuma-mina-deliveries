import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-10 bg-slate-900 text-white flex items-center justify-between px-8 text-[10px] font-mono uppercase tracking-[0.2em] shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-slate-400">TMD Build</span>
        <span className="text-emerald-400 font-semibold">v1.0.0-alpha</span>
      </div>
      <div className="hidden sm:block text-slate-400">
        Lead Product Architect Session: <span className="text-white font-semibold">Active</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span className="text-slate-300">docs/SOURCE_OF_TRUTH.md sync: 100%</span>
      </div>
    </footer>
  );
};
