import React, { useState } from 'react';
import { TabKey } from './Sidebar';
import { FileText, Copy, Check, Search, Download } from 'lucide-react';

interface DocsTabProps {
  docKey: 'source_of_truth' | 'ai_handoff' | 'project_state' | 'dev_log';
}

const DOC_CONTENT: Record<string, { title: string; filename: string; text: string }> = {
  source_of_truth: {
    title: 'Authoritative Specification',
    filename: 'docs/SOURCE_OF_TRUTH.md',
    text: `# SOURCE OF TRUTH — Thuma Mina Deliveries (TMD)
Status: Active & Authoritative | Version: 1.0.0

## 1. Business Identity
Company Name: Thuma Mina Deliveries (TMD)
Operating Location: Soshanguve, Gauteng, South Africa
Fleet: 2 dedicated motorbikes (including founder/owner)
Payment: Cash on Delivery (COD) & Manual EFT / Capitec Pay

## 2. Business Rules
1. ONE ORDER = ONE VENDOR: Shopping carts strictly cannot contain items from multiple stores.
2. Mandatory Landmark Navigation: Township delivery addresses must capture section/block + landmark description.
3. Currency in Integer Cents: Stored in ZAR cents (R45.00 = 4500).
4. Order Lifecycle: pending -> accepted -> preparing -> ready_for_pickup -> out_for_delivery -> delivered.

## 3. Technology Architecture
Frontend: React 19 + Vite + Tailwind CSS (PWA format)
Backend: Python + Flask REST API (SQLAlchemy + Alembic + JWT)
Database: PostgreSQL on Neon in Frankfurt (eu-central-1)
Hosting: Render (Static Site frontend + Python Web Service backend)
Security: Sole server-side database access (Zero direct client database access)

## 4. Deferral Boundaries (Out of MVP)
- Live continuous GPS tracking on maps
- Algorithmic automated dispatch
- Multi-vendor carts
- Automated card payment gateways
- Native iOS / Android apps`
  },
  ai_handoff: {
    title: 'AI Transfer Protocol',
    filename: 'docs/AI_HANDOFF.md',
    text: `# AI HANDOFF — Thuma Mina Deliveries (TMD)
Handoff Target: Future AI Agent Sessions
Version: 0.2.0-phase1 | Git: main

## Objective
Formally transition TMD to the approved decoupled stack: React 19 + Vite Frontend PWA communicating via HTTPS / REST API with a Python Flask Backend (SQLAlchemy + Alembic), deployed on Render, with persistence on PostgreSQL hosted on Neon in Frankfurt (eu-central-1).

## Completed Work
- backend/ directory initialized with application factory create_app()
- SQLAlchemy models created for all 11 entities (User, Address, Vendor, Menu, Driver, Order, Delivery, Payment)
- Alembic migration environment initialized with 001_initial_schema.py
- render.yaml updated for Python Web Service + Static Site
- docs/ updated with ADR-005 (Flask + Neon Frankfurt)

## Things NOT to Change
1. Frontend communicates ONLY with Flask REST API via JSON.
2. ONE ORDER = ONE VENDOR (no multi-vendor carts in MVP).
3. Do not connect browser directly to Neon.
4. Do not add live GPS map tracking in MVP.

## Recommended Next Action for Next AI
Complete JWT authentication endpoints in /backend/app/routes/auth.py and apply initial Alembic migration once Neon DATABASE_URL credentials are provided.`
  },
  project_state: {
    title: 'Project Snapshot',
    filename: 'docs/PROJECT_STATE.md',
    text: `# PROJECT STATE — Thuma Mina Deliveries (TMD)
Phase: Phase 1 — Architecture Synchronization & Backend Foundation
Version: 0.2.0-phase1

## Health Status
- Documentation: Completed (4 required files active & synchronized)
- Deployment Target: Render (Flask Web Service + Static Site)
- Database: PostgreSQL on Neon in Frankfurt (eu-central-1)
- Backend Models: 11 SQLAlchemy models implemented
- Migration System: Alembic initialized with 001_initial_schema.py
- Auth System: JWT foundation configured (Flask-JWT-Extended)
- Frontend Shell: React 19 + Tailwind CSS 4 + Motion

## Active Risks
1. Connectivity volatility in Soshanguve
2. Two-bike fleet dispatch bottleneck
3. Awaiting production Neon Frankfurt DATABASE_URL for live migration execution`
  },
  dev_log: {
    title: 'Engineering History',
    filename: 'docs/DEV_LOG.md',
    text: `# DEV LOG — Thuma Mina Deliveries (TMD)
Log ID: LOG-20260905-05
Type: Architecture Synchronization & Backend Foundation (Phase 1)
Status: Resolved

Context:
Formally transitioning TMD repository from client-direct Supabase architecture to decoupled Python Flask REST API + SQLAlchemy ORM + Alembic + PostgreSQL hosted on Neon in Frankfurt (eu-central-1).

Resolution:
1. Created backend/ directory with application factory pattern create_app().
2. Implemented modular SQLAlchemy models for 11 core entities.
3. Enforced invariant rule: ONE ORDER = ONE VENDOR.
4. Configured Alembic migration environment with 001_initial_schema.py.
5. Added /api/health diagnostic endpoint.
6. Updated render.yaml for Flask Web Service and Static Site.
7. Superseded ADR-001 with ADR-005 in docs/SOURCE_OF_TRUTH.md.`
  }
};

export const DocsTab: React.FC<DocsTabProps> = ({ docKey }) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const doc = DOC_CONTENT[docKey] || DOC_CONTENT.source_of_truth;

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#FF6321]" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-mono">{doc.filename}</h2>
            <p className="text-[11px] text-slate-500">{doc.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>
        </div>
      </div>

      {/* Document Body */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-orange-100">
        {doc.text}
      </div>
    </div>
  );
};
