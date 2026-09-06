import React, { useState } from 'react';
import { INITIAL_DRIVERS, DriverSeed } from '../data/initialData';
import { Bike, Phone, CheckCircle, Shield, AlertTriangle, Battery, Navigation } from 'lucide-react';

export const DriversTab: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverSeed[]>(INITIAL_DRIVERS);

  const toggleDriverStatus = (id: string) => {
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === id) {
          const nextStatus = d.status === 'online' ? 'busy' : d.status === 'busy' ? 'offline' : 'online';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6321] bg-orange-50 px-2 py-0.5 rounded">
                MVP Fleet Architecture
              </span>
              <h2 className="text-base font-bold text-slate-900">2-Bike Delivery Fleet Management</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thuma Mina Deliveries operates with two dedicated motorbikes in Soshanguve. Fleet dispatch is managed via centralized dispatcher queue control.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
            <div className="text-right">
              <div className="font-bold text-slate-800">14 Drops Completed</div>
              <div className="text-[10px] text-emerald-600 font-medium">100% On-Time Delivery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drivers.map(driver => (
          <div
            key={driver.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200">
                    <Bike className="w-5 h-5 text-[#FF6321]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{driver.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400">{driver.callsign}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleDriverStatus(driver.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize flex items-center gap-1.5 transition-colors cursor-pointer ${
                    driver.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : driver.status === 'busy'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    driver.status === 'online' ? 'bg-emerald-500 animate-pulse' : driver.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></span>
                  <span>{driver.status}</span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active</div>
                  <div className="text-sm font-bold text-slate-800">{driver.assignedOrders} order</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Today Drops</div>
                  <div className="text-sm font-bold text-slate-800">{driver.completedToday}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle</div>
                  <div className="text-xs font-mono font-bold text-slate-800">{driver.registration}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                  <span className="text-slate-400">Driver Phone / WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-800">{driver.phone}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                  <span className="text-slate-400">Township Coverage:</span>
                  <span className="font-semibold text-slate-800">Soshanguve North & South</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Rider</span>
              </span>
              <span className="text-[11px] font-mono">Cash Collection: Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
