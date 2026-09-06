import React, { useState } from 'react';
import { INITIAL_VENDORS, VendorSeed } from '../data/initialData';
import { Store, Clock, MapPin, Search, ToggleLeft, ToggleRight, Plus, CheckCircle2 } from 'lucide-react';

export const VendorsTab: React.FC = () => {
  const [vendors, setVendors] = useState<VendorSeed[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState('');

  const toggleAccepting = (id: string) => {
    setVendors(prev =>
      prev.map(v => (v.id === id ? { ...v, isAcceptingOrders: !v.isAcceptingOrders } : v))
    );
  };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.townshipSection.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Soshanguve Vendor Marketplace Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Initial cohort of township takeaways, eateries, and spaza shops onboarded to Thuma Mina Deliveries.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search township vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF6321] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid of Vendors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(vendor => (
          <div
            key={vendor.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6321] bg-orange-50 px-2 py-0.5 rounded">
                    {vendor.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-2">{vendor.name}</h3>
                </div>

                <button
                  onClick={() => toggleAccepting(vendor.id)}
                  className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                  title="Toggle accepting orders"
                >
                  {vendor.isAcceptingOrders ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Open
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      Closed
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{vendor.townshipSection}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Est. Prep: <strong className="text-slate-700">{vendor.estimatedPrepMinutes} mins</strong></span>
                </div>
              </div>

              <div className="mt-4 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Top Signature Item</div>
                <div className="font-medium text-slate-800 mt-0.5">{vendor.popularItem}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{vendor.itemCount} items listed</span>
              <span className="font-bold text-slate-900 font-mono">Avg: R{vendor.avgPriceZAR}.00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
