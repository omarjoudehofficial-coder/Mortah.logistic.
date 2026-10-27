/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp, UserRole } from '../context/AppContext';
import {
  Truck,
  Building2,
  UserCheck,
  Search,
  BookOpen,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC<{ onOpenNewOrder: () => void }> = ({ onOpenNewOrder }) => {
  const {
    activeRole,
    setActiveRole,
    isSandboxMode,
    toggleSandboxMode,
    orders,
    settlementRequests,
  } = useApp();

  const pendingPricingCount = orders.filter((o) => o.operational_status === 'pending_pricing').length;
  const pendingSettlementsCount = settlementRequests.filter((s) => s.mortah_review_status === 'pending').length;

  const navLinks: { role: UserRole; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      role: 'admin',
      label: 'لوحة الإدارة والتوزيع',
      icon: <Truck className="w-4 h-4 ml-1.5" />,
      badge: pendingPricingCount + pendingSettlementsCount > 0 ? pendingPricingCount + pendingSettlementsCount : undefined,
    },
    {
      role: 'pricing',
      label: 'مصفوفة التسعير المرنة',
      icon: <DollarSign className="w-4 h-4 ml-1.5" />,
    },
    {
      role: 'merchant',
      label: 'بوابة التاجر والرصيد',
      icon: <Building2 className="w-4 h-4 ml-1.5" />,
    },
    {
      role: 'captain',
      label: 'تطبيق الكابتن (PWA)',
      icon: <UserCheck className="w-4 h-4 ml-1.5" />,
    },
    {
      role: 'customer',
      label: 'بوابة تتبع الزبون',
      icon: <Search className="w-4 h-4 ml-1.5" />,
    },
    {
      role: 'accounting',
      label: 'الدفتر المحاسبي والذمم',
      icon: <BookOpen className="w-4 h-4 ml-1.5" />,
    },
    {
      role: 'inventory',
      label: 'المخزون والتجهيز',
      icon: <Package className="w-4 h-4 ml-1.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            م
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">مرتَاح</span>
              <span className="text-xs font-mono text-emerald-400 font-medium">MORTAH</span>
            </div>
            <p className="text-[10px] text-slate-400">اللوجستيات والمحاسبة الذكية</p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {navLinks.map((tab) => {
            const isActive = activeRole === tab.role;
            return (
              <button
                key={tab.role}
                onClick={() => setActiveRole(tab.role)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="mr-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400 text-slate-950 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Sandbox Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleSandboxMode}
            title="تبديل بيئة العرض بين التجريبية والإنتاج"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSandboxMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/40'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">
              {isSandboxMode ? 'وضع التجربة (SANDBOX)' : 'وضع الإنتاج (LIVE)'}
            </span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ طلب جديد</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-900/70">
        {navLinks.map((tab) => {
          const isActive = activeRole === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => setActiveRole(tab.role)}
              className={`flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="mr-1 px-1 py-0.1 text-[9px] rounded-full bg-amber-400 text-slate-950 font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
