/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  Filter,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Order, CancellationStage, OperationalStatus } from '../types';

export const AdminDashboard: React.FC<{ onOpenNewOrder: () => void }> = ({ onOpenNewOrder }) => {
  const {
    orders,
    merchants,
    captains,
    zones,
    settlementRequests,
    overrideOrderPricing,
    updateOperationalStatus,
    cancelOrder,
    reviewDriverSettlement,
    transferDriverDebtToMortah,
    isSandboxMode,
    purgeSandboxData,
    resetSandboxToDefaults,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<Order | null>(null);
  const [overrideFee, setOverrideFee] = useState<number>(25000);
  const [overrideSurcharge, setOverrideSurcharge] = useState<number>(5000);
  const [overrideReason, setOverrideReason] = useState<string>('طريق وعر في الريف ووزن ثقيل متفق عليه مع التاجر');
  const [overrideUser, setOverrideUser] = useState<string>('مدير العمليات - عمر الخطيب');

  // Cancellation Modal State
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelStage, setCancelStage] = useState<CancellationStage>('after_pickup_pre_dest');
  const [cancelReason, setCancelReason] = useState<string>('الزبون غير موجود وتم التنسيق مع التاجر');

  // Filtered orders
  const displayOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.operational_status !== statusFilter) return false;
    return true;
  });

  const unpricedOrders = orders.filter((o) => o.operational_status === 'pending_pricing');
  const pendingSettlements = settlementRequests.filter((s) => s.mortah_review_status === 'pending');
  const approvedSettlements = settlementRequests.filter(
    (s) => s.mortah_review_status === 'approved' && s.liability_status === 'confirmed_on_driver'
  );

  // KPIs
  const totalOrders = orders.length;
  const inFlightCount = orders.filter((o) => ['assigned', 'picked_up', 'out_for_delivery'].includes(o.operational_status)).length;
  const deliveredCount = orders.filter((o) => o.operational_status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.operational_status === 'cancelled').length;
  const totalCodCollected = orders
    .filter((o) => o.operational_status === 'delivered')
    .reduce((sum, o) => sum + o.cod_amount, 0);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForOverride) return;
    overrideOrderPricing(
      selectedOrderForOverride.id,
      Number(overrideFee),
      Number(overrideSurcharge),
      overrideReason,
      overrideUser
    );
    setSelectedOrderForOverride(null);
  };

  const handleApplyCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCancel) return;
    cancelOrder(selectedOrderForCancel.id, cancelStage, cancelReason);
    setSelectedOrderForCancel(null);
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Notice & Reset Toolbar */}
      {isSandboxMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-2xl text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">وضع البيانات التجريبية (Sandbox Mode) نشط حالياً:</span>
            <span className="text-amber-400/80">جميع العمليات والحسابات معزولة بالكامل عن أي سجلات إنتاجية حقيقية.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSandboxToDefaults}
              className="px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 border border-amber-700/60 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة البيانات الافتراضية</span>
            </button>
            <button
              onClick={purgeSandboxData}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
            >
              تصفير بيانات التجربة
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">إجمالي الشحنات</span>
          <span className="text-xl font-bold font-mono text-white">{totalOrders}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">قيد التوصيل الآن</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{inFlightCount}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">مسلمة بالكامل</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{deliveredCount}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">شحنات ملغاة</span>
          <span className="text-xl font-bold font-mono text-rose-400">{cancelledCount}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">بانتظار التسعير</span>
          <span className="text-xl font-bold font-mono text-amber-400">{unpricedOrders.length}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 block mb-1">كاش محصل (COD)</span>
          <div className="text-base font-bold font-mono text-emerald-300 truncate">
            {totalCodCollected.toLocaleString()} <span className="text-[10px]">ل.س</span>
          </div>
        </div>
      </div>

      {/* Unpriced Orders Alert Box */}
      {unpricedOrders.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-200">
                  تنبيه تشغيلي: يوجد ({unpricedOrders.length}) طلبات بانتظار التسعير الاستثنائي (Pending Pricing Approval)
                </h3>
                <p className="text-[11px] text-amber-400/80">
                  القاعدة المحاسبية المعتمدة: يُمنع إسناد أو توزيع هذه الطلبات حتى يتم تحديد أجورها رسمياً مع تسجيل سبب التعديل وهوية المستخدم.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-800/40">
            {unpricedOrders.map((ord) => {
              const merchant = merchants.find((m) => m.id === ord.merchant_id);
              const pZone = zones.find((z) => z.id === ord.pickup_zone_id);
              const dZone = zones.find((z) => z.id === ord.delivery_zone_id);
              return (
                <div key={ord.id} className="p-3 bg-slate-900/90 rounded-xl border border-amber-800/50 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-amber-300">{ord.tracking_code}</span>
                      <span className="text-[11px] text-slate-300">{merchant?.business_name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      من: {pZone?.name_ar} ⟵ إلى: {dZone?.name_ar}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">قيمة البضاعة: {ord.cod_amount.toLocaleString()} ل.س</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrderForOverride(ord);
                      setOverrideFee(22000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-colors whitespace-nowrap"
                  >
                    تسعير معتمد الآن
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Driver-to-Merchant Advance Review Queue (Mortah Step 2) */}
      {pendingSettlements.length > 0 && (
        <div className="p-4 bg-slate-900 border border-cyan-800/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-cyan-200">
                  طلبات مراجعة عجز السائق عند استلام الطرد ({pendingSettlements.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  دورة العمل المعتمدة: السائق لا يملك كامل المبلغ للتاجر ⟵ مراجعة مرتاح ⟵ تأكيد التاجر للمبلغ الفعلي ⟵ إثبات الذمة دون تكرار الدين.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingSettlements.map((req) => {
              const ord = orders.find((o) => o.id === req.order_id);
              const cap = captains.find((c) => c.id === req.captain_id);
              const mer = merchants.find((m) => m.id === req.merchant_id);
              return (
                <div key={req.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">الشحنة: {ord?.tracking_code}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-cyan-400 font-semibold">الكابتن: {cap?.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300">التاجر: {mer?.business_name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs mt-1 font-mono">
                      <span className="text-slate-300">إجمالي المطلوب: {req.total_cod_amount.toLocaleString()} ل.س</span>
                      <span className="text-emerald-400">المتوفر مع السائق: {req.driver_declared_available.toLocaleString()} ل.س</span>
                      <span className="text-rose-400 font-bold">العجز المطلوب اعتماده كذمة: {req.driver_declared_deficit.toLocaleString()} ل.س</span>
                    </div>
                    {req.driver_notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">ملاحظة السائق: "{req.driver_notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reviewDriverSettlement(req.id, 'approved', 'تمت الموافقة من إدارة العمليات بعد مراجعة سجل السائق', 'مدير العمليات')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>موافقة مرتاح</span>
                    </button>
                    <button
                      onClick={() => reviewDriverSettlement(req.id, 'rejected', 'رفض الطلب لعدم وجود مبرر مالي كافٍ', 'مدير العمليات')}
                      className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmed Settlements Ready for Liability Transfer to Mortah */}
      {approvedSettlements.length > 0 && (
        <div className="p-4 bg-slate-900 border border-teal-800/80 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-teal-200">
              ذمم سائقين مثبتة بعد تأكيد التاجر (جاهزة للتحويل لمرتاح كحركة محاسبية مستقلة)
            </h3>
          </div>
          <div className="space-y-2">
            {approvedSettlements.map((req) => {
              const mer = merchants.find((m) => m.id === req.merchant_id);
              const cap = captains.find((c) => c.id === req.captain_id);
              return (
                <div key={req.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">التاجر {mer?.business_name}</span> أكد استلام المبلغ. الذمة الحالية على الكابتن <span className="font-semibold text-cyan-400">{cap?.name}</span> بقيمة <span className="font-mono font-bold text-rose-400">{req.driver_declared_deficit.toLocaleString()} ل.س</span>.
                  </div>
                  <button
                    onClick={() => transferDriverDebtToMortah(req.id)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                  >
                    تحويل الذمة لمرتاح وقيد السند
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Order Pipeline Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">سجل شحنات التوصيل والحالات التشغيلية</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setStatusFilter('out_for_delivery')}
                className={`px-2 py-1 rounded-lg transition-colors ${statusFilter === 'out_for_delivery' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                قيد التوصيل
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-2 py-1 rounded-lg transition-colors ${statusFilter === 'delivered' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                المسملة
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-2 py-1 rounded-lg transition-colors ${statusFilter === 'cancelled' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                الملغاة
              </button>
            </div>

            <button
              onClick={onOpenNewOrder}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              + إضافة شحنة
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">رقم التتبع والتاجر</th>
                <th className="py-3 px-3">المسار (زوج المناطق)</th>
                <th className="py-3 px-3">الزبون والعنوان</th>
                <th className="py-3 px-3">الكابتن</th>
                <th className="py-3 px-3">ثمن البضاعة (COD)</th>
                <th className="py-3 px-3">أجرة التوصيل والعمولة</th>
                <th className="py-3 px-3">الحالة التشغيلية</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد شحنات تطابق معايير التصفية الحالية
                  </td>
                </tr>
              ) : (
                displayOrders.map((ord) => {
                  const merchant = merchants.find((m) => m.id === ord.merchant_id);
                  const pZone = zones.find((z) => z.id === ord.pickup_zone_id);
                  const dZone = zones.find((z) => z.id === ord.delivery_zone_id);
                  const captain = captains.find((c) => c.id === ord.captain_id);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white text-xs">{ord.tracking_code}</div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">{merchant?.business_name}</div>
                        {ord.paid_from_prepaid_balance > 0 && (
                          <span className="text-[10px] text-cyan-300 font-mono block">
                            سُدد {ord.paid_from_prepaid_balance.toLocaleString()} من الرصيد المسبق
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-slate-300 text-xs">{dZone?.name_ar}</div>
                        <div className="text-[10px] text-slate-500">انطلاقاً من: {pZone?.name_ar}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-200">{ord.customer_name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{ord.customer_address}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ord.customer_phone}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        {captain ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-medium text-slate-200">{captain.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">غير مسند</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateOperationalStatus(ord.id, 'assigned');
                                  ord.captain_id = e.target.value;
                                }
                              }}
                              className="bg-slate-800 border border-slate-700 text-[11px] rounded px-1.5 py-0.5 text-white"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                إسناد...
                              </option>
                              {captains.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.active_status === 'available' ? 'متاح' : 'مشغول'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-100">
                        {ord.cod_amount.toLocaleString()} <span className="text-[10px] text-slate-400">ل.س</span>
                      </td>

                      <td className="py-3.5 px-3">
                        {ord.operational_status === 'pending_pricing' ? (
                          <span className="text-amber-400 font-bold text-[11px]">غير مسعر</span>
                        ) : (
                          <div>
                            <div className="font-mono font-bold text-white text-xs">
                              {ord.final_delivery_fee.toLocaleString()} <span className="text-[10px]">ل.س</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              عمولة: <span className="font-mono text-teal-400">{ord.company_commission_amount.toLocaleString()}</span> ل.س
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {ord.operational_status === 'pending_pricing' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            بانتظار التسعير
                          </span>
                        )}
                        {ord.operational_status === 'confirmed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                            مؤكد للتوزيع
                          </span>
                        )}
                        {ord.operational_status === 'assigned' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            مسند للكابتن
                          </span>
                        )}
                        {ord.operational_status === 'picked_up' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            تم الاستلام
                          </span>
                        )}
                        {ord.operational_status === 'out_for_delivery' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            قيد التوصيل
                          </span>
                        )}
                        {ord.operational_status === 'delivered' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            تم التسليم ✓
                          </span>
                        )}
                        {ord.operational_status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            ملغي ({ord.cancellation_stage === 'before_pickup' ? 'قبل الاستلام' : 'بعد الاستلام'})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {ord.operational_status === 'pending_pricing' && (
                            <button
                              onClick={() => {
                                setSelectedOrderForOverride(ord);
                                setOverrideFee(20000);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-[11px] font-bold"
                            >
                              تسعير
                            </button>
                          )}

                          {ord.operational_status !== 'delivered' && ord.operational_status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => updateOperationalStatus(ord.id, 'delivered')}
                                title="تحديد كمسلم يدوياً"
                                className="p-1 hover:bg-slate-800 text-emerald-400 rounded"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedOrderForCancel(ord)}
                                title="إلغاء مرحلي"
                                className="p-1 hover:bg-slate-800 text-rose-400 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Override Modal */}
      {selectedOrderForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">تسعير استثنائي معتمد للطلب {selectedOrderForOverride.tracking_code}</h3>
            <p className="text-xs text-slate-400">
              يتطلب النظام تسجيل مبرر إلزامي واسم الموظف المخول لضمان نزاهة سجلات التدقيق (Audit Trail).
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">أجرة التوصيل الإجمالية المعتمدة (ل.س)</label>
                <input
                  type="number"
                  value={overrideFee}
                  onChange={(e) => setOverrideFee(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">الزيادة الاستثنائية المضمنة (Surcharge)</label>
                <input
                  type="number"
                  value={overrideSurcharge}
                  onChange={(e) => setOverrideSurcharge(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">سبب التسعير الاستثنائي (إلزامي للتدقيق)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">الموظف المخول بالاعتماد</label>
                <input
                  type="text"
                  value={overrideUser}
                  onChange={(e) => setOverrideUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForOverride(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  اعتماد التسعير وفك تعليق الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staged Cancellation Modal */}
      {selectedOrderForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">إلغاء الطلب {selectedOrderForCancel.tracking_code} وفق القواعد المرحلية</h3>

            <form onSubmit={handleApplyCancel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">مرحلة الإلغاء الفعلية</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelStage"
                      value="before_pickup"
                      checked={cancelStage === 'before_pickup'}
                      onChange={() => setCancelStage('before_pickup')}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-white block">إلغاء قبل استلام السائق للطرد</span>
                      <span className="text-[11px] text-emerald-400">القاعدة المعتمدة: لا تترتب أي أجور توصيل نهائياً (0 ل.س).</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelStage"
                      value="after_pickup_pre_dest"
                      checked={cancelStage === 'after_pickup_pre_dest'}
                      onChange={() => setCancelStage('after_pickup_pre_dest')}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-white block">إلغاء بعد الاستلام وقبل الوصول لوجهة التسليم</span>
                      <span className="text-[11px] text-amber-400">تُحتسب أجور إلغاء جزئية، مع فحص رحلات التاجر القادمة خلال 24 ساعة.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelStage"
                      value="after_pickup_at_dest"
                      checked={cancelStage === 'after_pickup_at_dest'}
                      onChange={() => setCancelStage('after_pickup_at_dest')}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-white block">إلغاء بعد وصول السائق لوجهة التسليم</span>
                      <span className="text-[11px] text-rose-400">تُحتسب كامل أجور الزيارة/التوصيل المعتمدة.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">سبب الإلغاء</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white h-16"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForCancel(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                >
                  تنفيذ الإلغاء المرحلي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
