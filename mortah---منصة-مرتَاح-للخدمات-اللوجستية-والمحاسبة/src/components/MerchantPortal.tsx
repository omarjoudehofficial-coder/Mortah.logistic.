/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Wallet,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Download,
  Clock,
} from 'lucide-react';
import { DriverSettlementRequest } from '../types';

export const MerchantPortal: React.FC<{ onOpenNewOrder: () => void }> = ({ onOpenNewOrder }) => {
  const {
    merchants,
    currentMerchantId,
    setCurrentMerchantId,
    orders,
    settlementRequests,
    confirmMerchantSettlement,
  } = useApp();

  const currentMerchant = merchants.find((m) => m.id === currentMerchantId) || merchants[0];

  // Orders of this merchant
  const merchantOrders = orders.filter((o) => o.merchant_id === currentMerchant?.id);

  // Settlements pending confirmation from this merchant
  const merchantSettlementRequests = settlementRequests.filter(
    (s) => s.merchant_id === currentMerchant?.id && s.mortah_review_status === 'approved'
  );

  const [confirmInputs, setConfirmInputs] = useState<Record<string, number>>({});
  const [selectedPodImage, setSelectedPodImage] = useState<string | null>(null);

  const handleConfirmReceived = (req: DriverSettlementRequest) => {
    const amount = confirmInputs[req.id] !== undefined ? confirmInputs[req.id] : req.driver_declared_available;
    confirmMerchantSettlement(req.id, Number(amount));
  };

  // Statement calculations
  const totalDeliveredCod = merchantOrders
    .filter((o) => o.operational_status === 'delivered')
    .reduce((sum, o) => sum + o.cod_amount, 0);

  const totalDeliveryFees = merchantOrders
    .filter((o) => o.operational_status === 'delivered')
    .reduce((sum, o) => sum + o.final_delivery_fee, 0);

  const totalPrepaidDeducted = merchantOrders.reduce((sum, o) => sum + o.paid_from_prepaid_balance, 0);

  const netPayableToMerchant = totalDeliveredCod - (totalDeliveryFees - totalPrepaidDeducted);

  return (
    <div className="space-y-6">
      {/* Merchant Profile Switcher */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{currentMerchant?.business_name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                كود التاجر: {currentMerchant?.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مسؤول الحساب: {currentMerchant?.owner_name} · هاتف: {currentMerchant?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">تبديل حساب التاجر:</span>
          <select
            value={currentMerchantId}
            onChange={(e) => setCurrentMerchantId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.business_name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewOrder}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>طلب شحنة جديدة</span>
          </button>
        </div>
      </div>

      {/* Financial Overview & Prepaid Balance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prepaid Wallet Card */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-800/60 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">الرصيد المسبق المتاح لدى مرتاح</span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
              محفظة التاجر
            </span>
          </div>

          <div className="text-2xl font-black font-mono text-white mb-2">
            {currentMerchant?.prepaid_balance.toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span>
          </div>

          <p className="text-[11px] text-slate-400">
            خيار استخدام الرصيد اختياري عند إنشاء الشحنة؛ لا يُخصم إلا المبلغ المعتمد من طرفك، ولا تنشأ أي ذمة إضافية عن المبالغ المسددة من الرصيد.
          </p>
        </div>

        {/* Collected COD */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">إجمالي ثمن بضائعك المسلمة (COD)</span>
          <div className="text-2xl font-bold font-mono text-white mb-2">
            {totalDeliveredCod.toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span>
          </div>
          <p className="text-[11px] text-slate-400">
            إجمالي الأموال المقبوضة من الزبائن لصالح متجرك للشحنات المكتملة.
          </p>
        </div>

        {/* Net Due */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">صافي مستحقات متجرك الجاهزة للصرف</span>
            <span className="text-[10px] text-emerald-400 font-bold">جاهز للتحويل</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mb-2">
            {netPayableToMerchant.toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span>
          </div>
          <p className="text-[11px] text-slate-400">
            صافي المبلغ بعد خصم أجور التوصيل مع احتساب ما سُدد مسبقاً من رصيدك.
          </p>
        </div>
      </div>

      {/* Driver-to-Merchant Advance Confirmation Queue (Mortah approved, waiting merchant confirmation) */}
      {merchantSettlementRequests.length > 0 && (
        <div className="p-4 bg-slate-900 border border-amber-800/80 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xs font-bold text-amber-200">
                شحنات سلمها الكابتن مع وجود عجز نقدي تتطلب تأكيدك ({merchantSettlementRequests.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                وافقت مرتاح على خروج الطرد مع الكابتن؛ يرجى تأكيد المبلغ الذي استلمته فعلياً لتثبيت الذمة دون أي تعارض مالي.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {merchantSettlementRequests.map((req) => {
              const ord = orders.find((o) => o.id === req.order_id);
              const isConfirmed = req.liability_status !== 'unconfirmed';

              return (
                <div key={req.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span>الشحنة: {ord?.tracking_code}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300">القيمة الإجمالية: {req.total_cod_amount.toLocaleString()} ل.س</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      صرح الكابتن أنه سلّمك: <span className="font-mono text-emerald-400 font-bold">{req.driver_declared_available.toLocaleString()} ل.س</span>
                      {' '}| العجز كذمة: <span className="font-mono text-rose-400 font-bold">{req.driver_declared_deficit.toLocaleString()} ل.س</span>
                    </div>
                    {req.discrepancy_status === 'discrepancy_investigation' && (
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>يوجد خلاف في المبالغ قيد المراجعة والتحقيق الإداري مع مرتاح</span>
                      </div>
                    )}
                  </div>

                  {!isConfirmed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 whitespace-nowrap">المبلغ المستلم فعلياً:</span>
                      <input
                        type="number"
                        defaultValue={req.driver_declared_available}
                        onChange={(e) =>
                          setConfirmInputs((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))
                        }
                        className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleConfirmReceived(req)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-sm"
                      >
                        تأكيد الاستلام
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        تم تأكيد استلام {req.merchant_confirmed_amount?.toLocaleString()} ل.س
                        {req.liability_status === 'transferred_to_mortah' && ' (حُوّلت الذمة لمرتاح)'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Table for this Merchant */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              شحنات متجر {currentMerchant?.business_name} ({merchantOrders.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('تم توليد كشف حساب متجرك بصيغة PDF وتنزيله بنجاح.')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير كشف حساب PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">رقم التتبع والزبون</th>
                <th className="py-3 px-3">العنوان والمحتوى</th>
                <th className="py-3 px-3">ثمن البضاعة (COD)</th>
                <th className="py-3 px-3">أجرة التوصيل</th>
                <th className="py-3 px-3">الرصيد المسبق المخصوم</th>
                <th className="py-3 px-3">الحالة التشغيلية</th>
                <th className="py-3 px-4 text-center">إثبات التسليم (PoD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {merchantOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    لا توجد شحنات مسجلة لهذا التاجر حالياً
                  </td>
                </tr>
              ) : (
                merchantOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-xs">{ord.tracking_code}</div>
                      <div className="text-[11px] text-slate-300 font-medium">{ord.customer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{ord.customer_phone}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-300 truncate max-w-xs">{ord.customer_address}</div>
                      <div className="text-[10px] text-slate-500">{ord.package_description} ({ord.weight_kg} كغ)</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {ord.cod_amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ل.س</span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      {ord.operational_status === 'pending_pricing' ? (
                        <span className="text-amber-400 font-semibold">بانتظار التسعير</span>
                      ) : (
                        `${ord.final_delivery_fee.toLocaleString()} ل.س`
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-cyan-400">
                      {ord.paid_from_prepaid_balance > 0 ? (
                        `${ord.paid_from_prepaid_balance.toLocaleString()} ل.س`
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {ord.operational_status === 'delivered' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          تم التسليم
                        </span>
                      )}
                      {ord.operational_status === 'out_for_delivery' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          قيد التوصيل
                        </span>
                      )}
                      {ord.operational_status === 'pending_pricing' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          بانتظار التسعير
                        </span>
                      )}
                      {ord.operational_status === 'confirmed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          مؤكد
                        </span>
                      )}
                      {ord.operational_status === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          ملغي
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {ord.proof_of_delivery_url ? (
                        <button
                          onClick={() => setSelectedPodImage(ord.proof_of_delivery_url || null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>عرض الإثبات</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof of Delivery Photo Modal */}
      {selectedPodImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>صورة إثبات التسليم الميداني (PoD) الملتقطة من الكابتن</span>
              </h4>
              <button
                onClick={() => setSelectedPodImage(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={selectedPodImage}
                alt="إثبات التسليم"
                className="w-full h-72 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
