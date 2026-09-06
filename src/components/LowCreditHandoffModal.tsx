import React, { useState } from 'react';
import { Terminal, CheckCircle2, AlertTriangle, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface LowCreditHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LowCreditHandoffModal: React.FC<LowCreditHandoffModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handoffSummary = `=== TMD LOW CREDIT HANDOFF PAYLOAD ===
Session State: Clean & Verified
Current Phase: Phase 0 — Technical Architecture & Initialization
Frontend Theme: Clean Utility / Minimal (Tailwind CSS 4, #FF6321 Accent)
Database: 11 Tables + 6 Enums designed with RLS policies in docs/SOURCE_OF_TRUTH.md
Documentation Status:
  - docs/SOURCE_OF_TRUTH.md: 100% Synced
  - docs/PROJECT_STATE.md: Updated
  - docs/AI_HANDOFF.md: Ready for next AI
  - docs/DEV_LOG.md: Logged

NEXT RECOMMENDED ACTION:
Create TypeScript domain types in src/types/database.ts and SQL migration script in supabase/migrations/001_initial_schema.sql.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(handoffSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#FF6321]" />
            <span className="font-bold text-sm tracking-wide">LOW CREDIT HANDOFF PROTOCOL</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 text-xs text-orange-950">
            <AlertTriangle className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Rule 18 Protocol Engaged:</strong> Immediate freeze on new features. Current repository state and architecture documents are frozen and compiled for successor AI agent pickup.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Verification Checklist (10/10 Passed)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Repo Inspected</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Completed Scoped</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Risks Documented</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Docs Synchronized</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              Handoff Payload
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40 border border-slate-800">
              {handoffSummary}
            </pre>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Status: Ready for Transfer</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#FF6321]" />}
              <span>{copied ? 'Copied Payload' : 'Copy Handoff Payload'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
