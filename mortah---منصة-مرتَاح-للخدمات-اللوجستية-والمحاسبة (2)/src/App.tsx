/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { DynamicPricingManager } from './components/DynamicPricingManager';
import { MerchantPortal } from './components/MerchantPortal';
import { CaptainView } from './components/CaptainView';
import { CustomerTrackingView } from './components/CustomerTrackingView';
import { AccountingLedgerView } from './components/AccountingLedgerView';
import { InventoryView } from './components/InventoryView';
import { NewOrderModal } from './components/NewOrderModal';

const AppContent: React.FC = () => {
  const { activeRole } = useApp();
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header onOpenNewOrder={() => setIsNewOrderModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeRole === 'admin' && <AdminDashboard onOpenNewOrder={() => setIsNewOrderModalOpen(true)} />}
        {activeRole === 'pricing' && <DynamicPricingManager />}
        {activeRole === 'merchant' && <MerchantPortal onOpenNewOrder={() => setIsNewOrderModalOpen(true)} />}
        {activeRole === 'captain' && <CaptainView />}
        {activeRole === 'customer' && <CustomerTrackingView />}
        {activeRole === 'accounting' && <AccountingLedgerView />}
        {activeRole === 'inventory' && <InventoryView />}
      </main>

      {/* Modal for Creating New Order */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
      />

      {/* Clean Footer adhering to Anti-Slop Constitution */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">شركة مرتَاح للخدمات اللوجستية (Mortah Express)</span>
            <span aria-hidden="true">·</span>
            <span>الجمهورية العربية السورية</span>
            <span aria-hidden="true">·</span>
            <span>نظام الإدارة والمحاسبة والمخزون</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>العملة الدفترية: ليرة سورية (SYP)</span>
            <span aria-hidden="true">·</span>
            <span>معمارية القيد المزدوج ومصفوفة الأزواج</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
