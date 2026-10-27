/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Coins,
  Send,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../types';

export const CaptainView: React.FC = () => {
  const {
    captains,
    currentCaptainId,
    setCurrentCaptainId,
    orders,
    merchants,
    settlementRequests,
    updateOperationalStatus,
    submitDriverSettlement,
  } = useApp();

  const currentCaptain = captains.find((c) => c.id === currentCaptainId) || captains[0];

  // Captain's active orders
  const captainOrders = orders.filter((o) => o.captain_id === currentCaptain?.id);

  // Captain's settlement requests
  const captainSettlementRequests = settlementRequests.filter((s) => s.captain_id === currentCaptain?.id);

  // Modal / Shortage Request State
  const [selectedOrderForDeficit, setSelectedOrderForDeficit] = useState<Order | null>(null);
  const [declaredAvailable, setDeclaredAvailable] = useState<number>(0);
  const [driverNotes, setDriverNotes] = useState<string>('نقص سيولة صباحية، سأقوم بتسديد الفارق بعد تحصيل الطلبات الأولى');

  // PoD completion state
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [podNote, setPodNote] = useState<string>('تم التسليم للزبون شخصياً واستلام المبلغ كاملاً نقداً');

  const handleOpenDeficit = (ord: Order) => {
    setSelectedOrderForDeficit(ord);
    setDeclaredAvailable(Math.round(ord.cod_amount * 0.6)); // Default 60% available
  };

  const handleSubmitDeficit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDeficit) return;
    const deficit = selectedOrderForDeficit.cod_amount - declaredAvailable;
    submitDriverSettlement(selectedOrderForDeficit.id, Number(declaredAvailable), Number(deficit), driverNotes);
    setSelectedOrderForDeficit(null);
  };

  const handleCompleteDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOrder) return;
    updateOperationalStatus(
      completingOrder.id,
      'delivered',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
      podNote
    );
    setCompletingOrder(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Driver Header & Switcher */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{currentCaptain?.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
                {currentCaptain?.vehicle_type === 'motorcycle' ? 'دراجة نارية' : currentCaptain?.vehicle_type === 'car' ? 'سيارة' : 'فان بضائع'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              هاتف: {currentCaptain?.phone} · تقييم: ★ {currentCaptain?.rating}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">تبديل الكابتن:</span>
          <select
            value={currentCaptainId}
            onChange={(e) => setCurrentCaptainId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            {captains.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cash on Hand Escrow Meter */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/60 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950 rounded-xl text-cyan-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">العهدة النقدية المحصلة في حوزتك (Cash on Hand)</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {currentCaptain?.cash_on_hand.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ل.س</span>
            </div>
          </div>
        </div>

        <div className="text-left">
          <span className="text-[10px] text-slate-400 block">نافذة التوريد</span>
          <span className="text-xs font-bold text-emerald-400">خلال 24 ساعة للخزانة</span>
        </div>
      </div>

      {/* Driver Settlement Requests Status Box */}
      {captainSettlementRequests.length > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>طلبات العجز النقدي المقدمة من طرفك للتاجر</span>
          </h3>

          <div className="space-y-2">
            {captainSettlementRequests.map((req) => (
              <div key={req.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-white">طلب عجز للشحنة: {req.total_cod_amount.toLocaleString()} ل.س</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    المتوفر: {req.driver_declared_available.toLocaleString()} | العجز: {req.driver_declared_deficit.toLocaleString()} ل.س
                  </div>
                </div>

                <div>
                  {req.mortah_review_status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      قيد مراجعة مرتاح
                    </span>
                  )}
                  {req.mortah_review_status === 'approved' && req.liability_status === 'unconfirmed' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      وافقت مرتاح (بانتظار تأكيد التاجر)
                    </span>
                  )}
                  {req.liability_status === 'confirmed_on_driver' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ذمة مثبتة لصالح التاجر
                    </span>
                  )}
                  {req.liability_status === 'transferred_to_mortah' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      حُوّلت الذمة لمرتاح وقُيدت
                    </span>
                  )}
                  {req.mortah_review_status === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      تم رفض الطلب من مرتاح
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Orders Pipeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          مهام الشحنات المسندة إليك ({captainOrders.length})
        </h3>

        {captainOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            لا توجد شحنات مسندة إليك في الوقت الراهن
          </div>
        ) : (
          captainOrders.map((ord) => {
            const merchant = merchants.find((m) => m.id === ord.merchant_id);
            const isDelivered = ord.operational_status === 'delivered';
            const isCancelled = ord.operational_status === 'cancelled';

            return (
              <div
                key={ord.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">{ord.tracking_code}</span>
                    <span className="text-xs text-emerald-400 font-semibold">{merchant?.business_name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    COD: {ord.cod_amount.toLocaleString()} ل.س
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-bold">{ord.customer_name}</span>
                    <a
                      href={`tel:${ord.customer_phone}`}
                      className="text-emerald-400 flex items-center gap-1 hover:underline font-mono"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{ord.customer_phone}</span>
                    </a>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{ord.customer_address}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    محتوى الشحنة: <span className="text-white">{ord.package_description}</span> ({ord.weight_kg} كغ)
                  </div>
                </div>

                {/* Actions row */}
                {!isDelivered && !isCancelled && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setCompletingOrder(ord)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>إثبات التسليم وقبض المبلغ</span>
                    </button>

                    <button
                      onClick={() => handleOpenDeficit(ord)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-colors border border-amber-800/40 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>عجز نقدي عند الاستلام</span>
                    </button>
                  </div>
                )}

                {isDelivered && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم التسليم بنجاح وإيداع المبلغ في عهدتك النقدية.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Driver Shortage / Deficit Request Modal */}
      {selectedOrderForDeficit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">طلب عجز نقدي عند استلام الشحنة {selectedOrderForDeficit.tracking_code}</h3>
            <p className="text-slate-400">
              وفق دورة العمل المعتمدة: يتم إرسال طلبك لإدارة مرتاح؛ بعد الموافقة يقر التاجر بالمبلغ الفعلي المستلم لتثبيت الذمة دون تكرار الدين.
            </p>

            <form onSubmit={handleSubmitDeficit} className="space-y-3">
              <div>
                <span className="text-slate-400 block mb-0.5">إجمالي قيمة الشحنة المطلوب تسليمها للتاجر</span>
                <span className="text-base font-bold font-mono text-white">
                  {selectedOrderForDeficit.cod_amount.toLocaleString()} ل.س
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المبلغ المتوفر معك الآن وتريد تسليمه للتاجر</label>
                <input
                  type="number"
                  min="0"
                  max={selectedOrderForDeficit.cod_amount}
                  value={declaredAvailable}
                  onChange={(e) => setDeclaredAvailable(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">المبلغ المتبقي كعجز (المطلوب اعتماده كذمة)</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {(selectedOrderForDeficit.cod_amount - declaredAvailable).toLocaleString()} ل.س
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مبرر العجز النقدي للكابتن</label>
                <textarea
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white h-16"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDeficit(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الطلب لمرتاح</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Delivery Modal */}
      {completingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">إثبات تسليم الشحنة {completingOrder.tracking_code}</h3>
            <p className="text-slate-400">
              سيتم تسجيل إتمام التسليم، ورفع صورة إثبات التسليم، وترحيل القيد المحاسبي المزدوج آلياً.
            </p>

            <form onSubmit={handleCompleteDelivery} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">المبلغ المقبوض نقداً (COD)</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {completingOrder.cod_amount.toLocaleString()} ل.س
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">صورة إثبات التسليم (Proof of Delivery)</label>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-dashed border-slate-700 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs text-white font-semibold block">تم التقاط الصورة تلقائياً</span>
                    <span className="text-[10px] text-slate-400 font-mono">pod_snapshot_verified_gps.jpg</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ملاحظات التسليم الميدانية</label>
                <input
                  type="text"
                  value={podNote}
                  onChange={(e) => setPodNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingOrder(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  تأكيد التسليم وترحيل الكاش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
