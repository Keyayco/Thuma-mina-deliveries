/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, TabKey } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OverviewTab } from './components/OverviewTab';
import { SchemaTab } from './components/SchemaTab';
import { SecurityTab } from './components/SecurityTab';
import { VendorsTab } from './components/VendorsTab';
import { DriversTab } from './components/DriversTab';
import { OrderPipelineTab } from './components/OrderPipelineTab';
import { DocsTab } from './components/DocsTab';
import { LowCreditHandoffModal } from './components/LowCreditHandoffModal';
import { INITIAL_VENDORS, INITIAL_DRIVERS } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [initializationNotice, setInitializationNotice] = useState<string | null>(null);

  const handleExecuteInitialization = () => {
    setInitializationNotice(
      'Architecture specifications verified. Ready to apply supabase/migrations/001_initial_schema.sql.'
    );
    setTimeout(() => {
      setInitializationNotice(null);
    }, 4000);
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        vendorCount={INITIAL_VENDORS.length}
        driverCount={INITIAL_DRIVERS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onTriggerLowCreditHandoff={() => setIsHandoffModalOpen(true)}
        />

        {/* Global Notice Toast if triggered */}
        {initializationNotice && (
          <div className="bg-slate-900 text-white text-xs px-8 py-2.5 flex items-center justify-between border-b border-slate-800 transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-ping"></span>
              <span className="font-mono">{initializationNotice}</span>
            </div>
            <button
              onClick={() => setInitializationNotice(null)}
              className="text-slate-400 hover:text-white font-mono text-[10px]"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'overview' && (
            <OverviewTab
              onNavigateTab={setActiveTab}
              onExecuteInitialization={handleExecuteInitialization}
            />
          )}

          {activeTab === 'schema' && <SchemaTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'vendors' && <VendorsTab />}
          {activeTab === 'drivers' && <DriversTab />}
          {activeTab === 'pipeline' && <OrderPipelineTab />}

          {activeTab === 'source_of_truth' && (
            <DocsTab docKey="source_of_truth" />
          )}
          {activeTab === 'ai_handoff' && (
            <DocsTab docKey="ai_handoff" />
          )}
          {activeTab === 'project_state' && (
            <DocsTab docKey="project_state" />
          )}
          {activeTab === 'dev_log' && (
            <DocsTab docKey="dev_log" />
          )}
        </div>

        {/* Terminal Style Operational Footer */}
        <Footer />
      </main>

      {/* Low Credit Handoff Modal */}
      <LowCreditHandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
      />
    </div>
  );
}

