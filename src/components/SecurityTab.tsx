import React from 'react';
import { Shield, Lock, CheckCircle2, User, Store, Bike, ShieldAlert } from 'lucide-react';

const ROLES = [
  {
    role: 'customer',
    name: 'Customer',
    desc: 'Public ordering clients in Soshanguve',
    icon: User,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    permissions: [
      'Read active vendors & menu items',
      'Create and manage own delivery addresses',
      'Place single-vendor orders for self',
      'Track real-time status of own orders',
      'BLOCKED: Cannot read other customers orders or vendor financial data'
    ]
  },
  {
    role: 'vendor',
    name: 'Vendor Operator',
    desc: 'Township restaurant & spaza owners',
    icon: Store,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    permissions: [
      'Update own store profile & prep times',
      'Manage own menu categories & item availability (86 toggle)',
      'Receive live incoming order queue for own store',
      'Accept or reject orders with reasons',
      'BLOCKED: Cannot access other vendors or customer payment cards'
    ]
  },
  {
    role: 'driver',
    name: 'Bike Driver',
    desc: '2-bike fleet delivery riders',
    icon: Bike,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    permissions: [
      'Toggle availability status (online/offline)',
      'View assigned delivery tickets and pickup items',
      'Access customer landmark description & click-to-call',
      'Mark deliveries as picked up & completed',
      'Record physical cash collected on COD drops'
    ]
  },
  {
    role: 'admin',
    name: 'TMD Admin / Dispatcher',
    desc: 'Platform owner & central dispatcher',
    icon: ShieldAlert,
    color: 'text-[#FF6321] bg-orange-50 border-orange-200',
    permissions: [
      'Full administrative oversight across all 11 tables',
      'Manual driver assignment to active vendor orders',
      'Manual verification of bank EFT / PFTS payments',
      'Vendor onboarding approval & store activation',
      'Audit log inspection on order_status_history'
    ]
  }
];

export const SecurityTab: React.FC = () => {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Security Architecture & Role-Based Access Control (RBAC)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Security is enforced server-side by the Flask REST API and PostgreSQL database on Neon Frankfurt. TMD never relies solely on frontend button hiding for data isolation. Every request is verified via stateless JSON Web Tokens (JWT) with role claims and strict resource ownership checks before database interaction.
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROLES.map(role => {
          const Icon = role.icon;
          return (
            <div key={role.role} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${role.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{role.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">role: {role.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    RLS Guarded
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {role.permissions.map((perm, idx) => {
                    const isBlocked = perm.startsWith('BLOCKED:');
                    return (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        {isBlocked ? (
                          <Lock className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        )}
                        <span className={isBlocked ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                          {perm}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>jwt_required() + role guard</span>
                <span className="text-emerald-600 font-bold">VERIFIED</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
