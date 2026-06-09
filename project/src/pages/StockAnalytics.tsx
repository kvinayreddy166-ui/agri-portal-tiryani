import React, { useState } from 'react';
import { PackageCheck, ClipboardList } from 'lucide-react';
import { StockManagement } from './StockManagement';
import { StockInventory } from './StockInventory';
import { useAuth } from '../context/AuthContext';

export default function StockAnalytics() {
  const { isDealerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'fertilizer' | 'inventory'>('fertilizer');

  // For dealer users, only show Fertilizer Tracking (which will show the redirect message)
  if (isDealerUser) {
    return <StockManagement />;
  }

  return (
    <div className="space-y-6">
      {/* Tab Switching Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveTab('fertilizer')}
          className={`flex items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition ${
            activeTab === 'fertilizer'
              ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/30'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            activeTab === 'fertilizer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <PackageCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Fertilizer Tracking</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Track fertilizer stock and movements</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition ${
            activeTab === 'inventory'
              ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/30'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            activeTab === 'inventory' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Stock Inventory</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">View and manage stock inventory</p>
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'fertilizer' ? <StockManagement /> : <StockInventory />}
    </div>
  );
}
