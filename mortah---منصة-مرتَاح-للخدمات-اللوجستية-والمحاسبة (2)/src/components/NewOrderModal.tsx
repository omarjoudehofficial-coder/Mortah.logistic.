/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calculator, AlertTriangle, CheckCircle, Wallet, ArrowLeft } from 'lucide-react';
import { FeePayer } from '../types';

export const NewOrderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    merchants,
    zones,
    serviceTypes,
    calculatePrice,
    createOrder,
  } = useApp();

  const [merchantId, setMerchantId] = useState<string>(merchants[0]?.id || '');
  const [pickupZoneId, setPickupZoneId] = useState<string>(zones[0]?.id || '');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>(zones[1]?.id || '');
  const [serviceTypeId, setServiceTypeId] = useState<string>(serviceTypes[0]?.id || '');
  const [weightKg, setWeightKg] = useState<number>(1.5);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [packageDesc, setPackageDesc] = useState<string>('طرد بضائع تجارية');
  const [codAmount, setCodAmount] = useState<number>(350000); // 350,000 SYP
  const [feePayer, setFeePayer] = useState<FeePayer>('customer');

  // Customer info
  const [customerName, setCustomerName] = useState<string>('ماجد الحموي');
  const [customerPhone, setCustomerPhone] = useState<string>('+963 944 887766');
  const [customerAddress, setCustomerAddress] = useState<string>('دمشق، المزة شيخ سعد، جانب جامع الهدى');
  const [preferredWindow, setPreferredWindow] = useState<string>('بين الساعة 2:00 ظهراً و 6:00 مساءً');

  // Prepaid balance usage
  const [usePrepaid, setUsePrepaid] = useState<boolean>(false);
  const [prepaidAmount, setPrepaidAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedMerchant = merchants.find((m) => m.id === merchantId);

  // Dynamic price calculation
  const priceResult = calculatePrice(
    pickupZoneId,
    deliveryZoneId,
    serviceTypeId,
    merchantId,
    weightKg
  );

  useEffect(() => {
    if (usePrepaid && selectedMerchant && !priceResult.isUnpriced) {
      setPrepaidAmount(Math.min(selectedMerchant.prepaid_balance, priceResult.baseDeliveryFee));
    } else {
      setPrepaidAmount(0);
    }
  }, [usePrepaid, selectedMerchant, priceResult.baseDeliveryFee, priceResult.isUnpriced]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = createOrder(
      {
        merchant_id: merchantId,
        pickup_zone_id: pickupZoneId,
        delivery_zone_id: deliveryZoneId,
        service_type_id: serviceTypeId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        preferred_delivery_window: preferredWindow,
        package_description: packageDesc,
        weight_kg: Number(weightKg),
        is_fragile: isFragile,
        cod_amount: Number(codAmount),
        fee_payer: feePayer,
      },
      usePrepaid ? Number(prepaidAmount) : 0
    );

    if (!result.success) {
      setErrorMsg(result.error || 'حدث خطأ أثناء حفظ الطلب');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white">إنشاء شحنة توصيل جديدة</h2>
            <p className="text-xs text-slate-400">احتساب الأجرة ديناميكياً وفق زوج المناطق وحالة الرصيد المسبق</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Merchant & Routing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">التاجر المرسل</label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.business_name} (رصيد: {m.prepaid_balance.toLocaleString()} ل.س)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الخدمة اللوجستية</label>
              <select
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">منطقة الاستلام (Pickup Zone)</label>
              <select
                value={pickupZoneId}
                onChange={(e) => setPickupZoneId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">منطقة التسليم (Delivery Zone)</label>
              <select
                value={deliveryZoneId}
                onChange={(e) => setDeliveryZoneId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Pricing Preview Box */}
          <div className="p-3.5 rounded-xl border bg-slate-950/60 transition-all border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">معاينة احتساب التسعير والعمولة اللحظية</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {priceResult.isUnpriced ? 'غير مسعر' : `قاعدة: ${priceResult.rule?.rule_code}`}
              </span>
            </div>

            {priceResult.isUnpriced ? (
              <div className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">مسار أزواج المناطق غير مسعر حالياً في المنظومة!</p>
                  <p className="text-[11px] text-amber-400/90 mt-0.5">
                    سيتم حفظ الطلب ووضعه تلقائياً بحالة <span className="font-mono underline">pending_pricing</span> ولن يُعتمد للتوزيع حتى يحدد موظف الإدارة سعره استثنائياً.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">أجرة التوصيل</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono">
                    {priceResult.baseDeliveryFee.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">ل.س</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">عمولة مرتاح المستحقة</span>
                  <span className="font-bold text-teal-400 text-sm font-mono">
                    {priceResult.commissionAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">ل.س</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">أقصى زيادة مسموحة</span>
                  <span className="font-bold text-amber-400 text-sm font-mono">
                    +{priceResult.maxAllowedSurcharge.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">ل.س</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Prepaid Balance Usage Option */}
          {selectedMerchant && !priceResult.isUnpriced && (
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePrepaid}
                    onChange={(e) => setUsePrepaid(e.target.checked)}
                    disabled={selectedMerchant.prepaid_balance <= 0}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>خصم أجور التوصيل من الرصيد المسبق للتاجر</span>
                </label>
                <span className="text-xs font-mono text-emerald-400">
                  المتاح: {selectedMerchant.prepaid_balance.toLocaleString()} ل.س
                </span>
              </div>

              {usePrepaid && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                  <span className="text-xs text-slate-400 whitespace-nowrap">المبلغ المراد خصمه:</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(selectedMerchant.prepaid_balance, priceResult.baseDeliveryFee)}
                    value={prepaidAmount}
                    onChange={(e) => setPrepaidAmount(Number(e.target.value))}
                    className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    (المتبقي بعد الخصم: {(selectedMerchant.prepaid_balance - prepaidAmount).toLocaleString()} ل.س)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Package Details & COD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تحصيل ثمن البضاعة (COD)</label>
              <div className="relative">
                <input
                  type="number"
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="350000"
                />
                <span className="absolute left-3 top-2.5 text-[10px] text-slate-400">ل.س</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوزن التقديري (كغ)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">طرف سداد التوصيل</label>
              <select
                value={feePayer}
                onChange={(e) => setFeePayer(e.target.value as FeePayer)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="customer">الزبون المستلم</option>
                <option value="merchant">التاجر المرسل</option>
                <option value="free_promo">شحن مجاني ترويجي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">وصف محتويات الطرد</label>
            <input
              type="text"
              value={packageDesc}
              onChange={(e) => setPackageDesc(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Section 4: Customer Details */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-bold text-emerald-400 block">بيانات العميل النهائي وعنوان الاستلام</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">اسم العميل</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">رقم الهاتف (موبايل)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">العنوان التفصيلي ونقاط الدلالة</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">الوقت المفضل للتسليم</label>
              <input
                type="text"
                value={preferredWindow}
                onChange={(e) => setPreferredWindow(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تأكيد وتسجيل الشحنة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
