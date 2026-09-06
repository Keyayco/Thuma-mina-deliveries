import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, ShoppingBag, Clock, UserCheck, Bike, PackageCheck, RefreshCw } from 'lucide-react';

const ORDER_STEPS = [
  { key: 'pending', title: 'Pending', actor: 'Customer', desc: 'Order placed, awaiting vendor confirmation' },
  { key: 'accepted', title: 'Accepted', actor: 'Vendor', desc: 'Vendor confirmed stock & capacity' },
  { key: 'preparing', title: 'Preparing', actor: 'Vendor', desc: 'Food or goods being prepared' },
  { key: 'ready_for_pickup', title: 'Ready', actor: 'Vendor', desc: 'Packed & ready for TMD rider' },
  { key: 'out_for_delivery', title: 'In Transit', actor: 'Driver', desc: 'Rider en route to customer landmark' },
  { key: 'delivered', title: 'Delivered', actor: 'Driver & Customer', desc: 'Handed over, COD cash collected' }
];

export const OrderPipelineTab: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // 'preparing'

  const handleNextStep = () => {
    if (currentStepIndex < ORDER_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  const currentStep = ORDER_STEPS[currentStepIndex];

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6321] bg-orange-50 px-2 py-0.5 rounded">
                Core Rule Invariant
              </span>
              <h2 className="text-base font-bold text-slate-900">ONE ORDER = ONE VENDOR Pipeline</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-vendor carts are strictly banned in MVP to ensure clean vendor fulfillment, zero-split delivery dispatch, and reliable accounting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Simulator</span>
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex === ORDER_STEPS.length - 1}
              className="text-xs px-4 py-1.5 rounded-lg bg-[#FF6321] hover:bg-[#e05518] disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Advance Stage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Live Order State Progression
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.key}
                onClick={() => setCurrentStepIndex(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#FF6321] bg-orange-50/50 shadow-sm ring-1 ring-[#FF6321]'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCurrent ? 'bg-[#FF6321] text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    0{idx + 1}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">{step.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">{step.actor}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Order Simulation Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-900">Active Order Ticket: TMD-260905-001</h3>
            <span className="text-[11px] font-mono font-bold text-[#FF6321] bg-orange-50 px-2 py-0.5 rounded uppercase">
              {currentStep.key}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vendor:</span>
              <strong className="text-slate-800">Soshanguve Crossing Kota King</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Items:</span>
              <span className="text-slate-700">2x Quarter Russian & Cheese Kota</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Customer Drop-off:</span>
              <span className="text-slate-800 font-medium">Block L, Stand 4108 (Opposite falala)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Cash on Delivery (R 110.00)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Assigned Driver:</span>
              <span className="text-slate-800 font-medium">Kabelo (TMD-BIKE-ALPHA)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">Stage Invariant & Security Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Current state is <strong className="text-slate-900 font-mono">"{currentStep.key}"</strong>. 
              {currentStep.desc}. Database triggers automatically record a timestamped entry in <code className="font-mono text-[11px] bg-slate-100 px-1 rounded">order_status_history</code>.
            </p>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
            <div className="text-[#FF6321] font-bold uppercase tracking-wider text-[9px]">PostgreSQL State Guard</div>
            <div>CHECK (status IN ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'))</div>
          </div>
        </div>
      </div>
    </div>
  );
};
