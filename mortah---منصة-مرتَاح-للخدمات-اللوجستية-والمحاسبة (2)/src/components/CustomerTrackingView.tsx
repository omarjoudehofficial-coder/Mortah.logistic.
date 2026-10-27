/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  XCircle,
  Building2,
  Package,
  AlertCircle,
  Phone,
} from 'lucide-react';

export const CustomerTrackingView: React.FC = () => {
  const {
    orders,
    merchants,
    zones,
    customerTrackingQuery,
    setCustomerTrackingQuery,
    updateCustomerLocationAndTime,
    cancelOrder,
  } = useApp();

  const [inputCode, setInputCode] = useState<string>(customerTrackingQuery || 'MRT-88301');
  const [activeCode, setActiveCode] = useState<string>(customerTrackingQuery || 'MRT-88301');
  const [preferredWindowInput, setPreferredWindowInput] = useState<string>('بعد الساعة 5:00 عصراً');
  const [isEditingTime, setIsEditingTime] = useState<boolean>(false);
  const [showLocationUpdatedAlert, setShowLocationUpdatedAlert] = useState<boolean>(false);

  const matchedOrder = orders.find(
    (o) => o.tracking_code.toLowerCase() === activeCode.trim().toLowerCase()
  );

  const matchedMerchant = matchedOrder ? merchants.find((m) => m.id === matchedOrder.merchant_id) : null;
  const dZone = matchedOrder ? zones.find((z) => z.id === matchedOrder.delivery_zone_id) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCode(inputCode);
    setCustomerTrackingQuery(inputCode);
  };

  const handleUpdatePinpoint = () => {
    if (!matchedOrder) return;
    // Simulate updating GPS coordinates & address
    updateCustomerLocationAndTime(
      matchedOrder.id,
      [33.502, 36.265], // Precise updated pin
      matchedOrder.preferred_delivery_window || 'خلال الظهيرة'
    );
    setShowLocationUpdatedAlert(true);
    setTimeout(() => setShowLocationUpdatedAlert(false), 4000);
  };

  const handleSavePreferredWindow = () => {
    if (!matchedOrder) return;
    updateCustomerLocationAndTime(
      matchedOrder.id,
      matchedOrder.customer_lat_lng || [33.5, 36.25],
      preferredWindowInput
    );
    setIsEditingTime(false);
  };

  const steps = [
    { key: 'confirmed', label: 'تم تأكيد الطلب' },
    { key: 'assigned', label: 'إسناد لكابتن التوصيل' },
    { key: 'picked_up', label: 'استلام الطرد' },
    { key: 'out_for_delivery', label: 'قيد التوصيل في طريقك' },
    { key: 'delivered', label: 'تم التسليم بنجاح' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 0;
      case 'assigned':
        return 1;
      case 'picked_up':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = matchedOrder ? getStepIndex(matchedOrder.operational_status) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-white">بوابة تتبع الشحنة الذاتية للزبون</h2>
        <p className="text-xs text-slate-400">
          تتبع مسار شحنتك لحظياً، وتحديد موقعك الدقيق على الخريطة بنقرة واحدة لتسهيل وصول الكابتن
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="أدخل رقم التتبع (مثال: MRT-88301)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 shadow-md"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            تتبع
          </button>
        </form>

        {/* Quick Demo Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
          <span>شحنات نموذجية للتجربة:</span>
          {orders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setInputCode(o.tracking_code);
                setActiveCode(o.tracking_code);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono transition-colors"
            >
              {o.tracking_code} ({o.operational_status})
            </button>
          ))}
        </div>
      </div>

      {showLocationUpdatedAlert && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم تثبيت إحداثيات موقع منزلك الدقيقة وإرسالها مباشرة للكابتن لتفادي التأخير!</span>
        </div>
      )}

      {/* Tracking Card */}
      {!matchedOrder ? (
        <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
          لم يتم العثور على شحنة بالرمز <span className="font-mono text-white font-bold">"{activeCode}"</span>. يرجى التأكد من الرقم.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Top Order Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">رقم بوليصة التتبع</span>
              <span className="text-lg font-bold font-mono text-white">{matchedOrder.tracking_code}</span>
            </div>

            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">المتجر المرسل</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <Building2 className="w-3.5 h-3.5" />
                <span>{matchedMerchant?.business_name}</span>
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {matchedOrder.operational_status !== 'cancelled' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 block">مراحل الشحنة الحية:</span>
              <div className="grid grid-cols-5 gap-1 text-center relative">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="space-y-1.5 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-mono'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        } ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] leading-tight block ${
                          isDone ? 'text-slate-200 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedOrder.operational_status === 'cancelled' && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>تم إلغاء هذه الشحنة</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                سبب الإلغاء المسجل: "{matchedOrder.cancellation_reason || 'طلب التاجر أو العميل'}"
              </p>
            </div>
          )}

          {/* Destination & Rescheduling Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>عنوان الاستلام وموقعك الدقيق</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {matchedOrder.customer_address} ({dZone?.name_ar})
              </p>
              <button
                onClick={handleUpdatePinpoint}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>تحديث موقع البيت بالـ GPS الدقيق</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>الموعد المفضل للتسليم</span>
              </div>
              {!isEditingTime ? (
                <>
                  <p className="text-slate-300 text-[11px]">
                    {matchedOrder.preferred_delivery_window || 'خلال ساعات العمل الرسمية'}
                  </p>
                  <button
                    onClick={() => setIsEditingTime(true)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تعديل الفترة المفضلة (إعادة جدولة)</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={preferredWindowInput}
                    onChange={(e) => setPreferredWindowInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePreferredWindow}
                      className="flex-1 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                    >
                      حفظ الموعد
                    </button>
                    <button
                      onClick={() => setIsEditingTime(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment summary */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[11px] block">المبلغ المطلوب سداده عند الاستلام (COD)</span>
              <span className="text-base font-bold text-white">
                {matchedOrder.cod_amount.toLocaleString()} ل.س
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 text-[11px] block">أجرة التوصيل</span>
              <span className="text-xs text-emerald-400 font-bold">
                {matchedOrder.fee_payer === 'customer'
                  ? `${matchedOrder.final_delivery_fee.toLocaleString()} ل.س (على الزبون)`
                  : 'مدفوعة من المتجر (شحن مجاني)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
