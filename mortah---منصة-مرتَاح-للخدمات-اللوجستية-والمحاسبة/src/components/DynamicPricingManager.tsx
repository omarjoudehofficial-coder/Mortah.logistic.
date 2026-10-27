/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  Plus,
  Calculator,
  Sliders,
  ShieldAlert,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import { PricingRule } from '../types';

export const DynamicPricingManager: React.FC = () => {
  const {
    pricingRules,
    zones,
    serviceTypes,
    merchants,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    calculatePrice,
  } = useApp();

  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);
  const [ruleCode, setRuleCode] = useState<string>('R-DAM-CUSTOM');
  const [nameAr, setNameAr] = useState<string>('تسعيرة مخصصة جديدة');
  const [merchantId, setMerchantId] = useState<string>('all');
  const [pickupZoneId, setPickupZoneId] = useState<string>(zones[0]?.id || '');
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>(zones[1]?.id || '');
  const [serviceTypeId, setServiceTypeId] = useState<string>(serviceTypes[0]?.id || '');
  const [baseFee, setBaseFee] = useState<number>(20000);
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('fixed');
  const [commissionValue, setCommissionValue] = useState<number>(4000);
  const [maxSurcharge, setMaxSurcharge] = useState<number>(10000);
  const [maxWeightKg, setMaxWeightKg] = useState<number>(5);

  // Test Simulator state
  const [testPickup, setTestPickup] = useState<string>(zones[0]?.id || '');
  const [testDelivery, setTestDelivery] = useState<string>(zones[1]?.id || '');
  const [testService, setTestService] = useState<string>(serviceTypes[0]?.id || '');
  const [testMerchant, setTestMerchant] = useState<string>('all');
  const [testWeight, setTestWeight] = useState<number>(2.5);

  const testResult = calculatePrice(
    testPickup,
    testDelivery,
    testService,
    testMerchant === 'all' ? '' : testMerchant,
    testWeight
  );

  const handleSaveNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    addPricingRule({
      rule_code: ruleCode,
      name_ar: nameAr,
      merchant_id: merchantId === 'all' ? null : merchantId,
      pickup_zone_id: pickupZoneId,
      delivery_zone_id: deliveryZoneId,
      service_type_id: serviceTypeId,
      criteria_factors: { max_weight_kg: Number(maxWeightKg) },
      base_delivery_fee: Number(baseFee),
      commission_formula: { type: commissionType, value: Number(commissionValue) },
      max_allowed_surcharge: Number(maxSurcharge),
      is_active: true,
      is_sandbox: true,
      effective_from: new Date().toISOString().split('T')[0],
    });
    setIsAddingRule(false);
  };

  return (
    <div className="space-y-6">
      {/* Excel Preparedness Notice */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-800/80 text-teal-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">إدارة مصفوفة الأسعار والعمولات متعددة العوامل (Admin Rate Sheet)</h2>
            <p className="text-[11px] text-slate-400">
              النظام مهيأ معمارياً لاستقبال ملف Excel مستقبلاً؛ وحالياً تُدار القواعد وتُعدل فورياً من لوحة الإدارة دون لمس الكود، مع تجميد السعر في كل طلب وقت إنشائه.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingRule(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قاعدة تسعير لزوج مناطق</span>
        </button>
      </div>

      {/* Interactive Simulator */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white">محاكي فحص محرك التسعير اللحظي (Interactive Rate Simulator)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">التاجر المستهدف</label>
            <select
              value={testMerchant}
              onChange={(e) => setTestMerchant(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
            >
              <option value="all">كافة التجار (القاعدة العامة)</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.business_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">منطقة الاستلام</label>
            <select
              value={testPickup}
              onChange={(e) => setTestPickup(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">منطقة التسليم</label>
            <select
              value={testDelivery}
              onChange={(e) => setTestDelivery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">نوع الخدمة</label>
            <select
              value={testService}
              onChange={(e) => setTestService(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
            >
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">وزن الطرد (كغ)</label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              value={testWeight}
              onChange={(e) => setTestWeight(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
            />
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">القاعدة المطابقة:</span>
            {testResult.isUnpriced ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                لا توجد تسعيرة لزوج المناطق هذا (غير مسعر)
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-400">
                {testResult.rule?.name_ar} ({testResult.rule?.rule_code})
              </span>
            )}
          </div>

          {!testResult.isUnpriced && (
            <div className="flex items-center gap-5 text-xs font-mono">
              <div>
                <span className="text-slate-400 ml-1">الأجرة:</span>
                <span className="text-white font-bold text-sm">{testResult.baseDeliveryFee.toLocaleString()}</span> ل.س
              </div>
              <div>
                <span className="text-slate-400 ml-1">عمولة مرتاح:</span>
                <span className="text-teal-400 font-bold text-sm">{testResult.commissionAmount.toLocaleString()}</span> ل.س
              </div>
              <div>
                <span className="text-slate-400 ml-1">سقف الزيادة:</span>
                <span className="text-amber-400 font-bold">+{testResult.maxAllowedSurcharge.toLocaleString()}</span> ل.س
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            قواعد الأسعار والعمولات النشطة ({pricingRules.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            تعديل أي قاعدة ينعكس فقط على الشحنات المستقبلية
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">كود واسم القاعدة</th>
                <th className="py-3 px-3">التاجر المستهدف</th>
                <th className="py-3 px-3">منطقة الاستلام</th>
                <th className="py-3 px-3">منطقة التسليم</th>
                <th className="py-3 px-3">نوع الخدمة</th>
                <th className="py-3 px-3">أجرة التوصيل</th>
                <th className="py-3 px-3">عمولة مرتاح</th>
                <th className="py-3 px-3">سقف الزيادة</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {pricingRules.map((r) => {
                const merchant = merchants.find((m) => m.id === r.merchant_id);
                const pZone = zones.find((z) => z.id === r.pickup_zone_id);
                const dZone = zones.find((z) => z.id === r.delivery_zone_id);
                const sType = serviceTypes.find((s) => s.id === r.service_type_id);

                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white text-xs">{r.rule_code}</div>
                      <div className="text-[11px] text-slate-400">{r.name_ar}</div>
                    </td>

                    <td className="py-3 px-3">
                      {merchant ? (
                        <span className="text-emerald-400 font-semibold">{merchant.business_name}</span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">عام (كافة التجار)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300">{pZone?.name_ar}</td>
                    <td className="py-3 px-3 text-slate-300">{dZone?.name_ar}</td>
                    <td className="py-3 px-3 text-slate-400">{sType?.name_ar.split(' ')[0]}</td>

                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {r.base_delivery_fee.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ل.س</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-teal-400 font-semibold">
                      {r.commission_formula.type === 'percentage'
                        ? `${r.commission_formula.value}%`
                        : `${r.commission_formula.value.toLocaleString()} ل.س`}
                    </td>

                    <td className="py-3 px-3 font-mono text-amber-400">
                      +{r.max_allowed_surcharge.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deletePricingRule(r.id)}
                        className="p-1 hover:bg-slate-800 text-rose-400 rounded transition-colors"
                        title="حذف القاعدة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">إضافة قاعدة تسعير جديدة لزوج مناطق</h3>
            <p className="text-xs text-slate-400">
              تحديد أجور التوصيل وعمولة مرتاح وسقف الزيادة مع دعم تخصيصها لتاجر محدد.
            </p>

            <form onSubmit={handleSaveNewRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">كود القاعدة (رمز فريد)</label>
                  <input
                    type="text"
                    value={ruleCode}
                    onChange={(e) => setRuleCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">اسم القاعدة التوضيحي</label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">التاجر المستهدف</label>
                <select
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                >
                  <option value="all">قاعدة عامة (تطبق على كل التجار)</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.business_name} (عقد مخصص)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">منطقة الاستلام</label>
                  <select
                    value={pickupZoneId}
                    onChange={(e) => setPickupZoneId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">منطقة التسليم</label>
                  <select
                    value={deliveryZoneId}
                    onChange={(e) => setDeliveryZoneId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">نوع الخدمة</label>
                  <select
                    value={serviceTypeId}
                    onChange={(e) => setServiceTypeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    {serviceTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">الوزن الأقصى المشمول (كغ)</label>
                  <input
                    type="number"
                    value={maxWeightKg}
                    onChange={(e) => setMaxWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 mb-1">أجرة التوصيل (ل.س)</label>
                  <input
                    type="number"
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">عمولة مرتاح (مبلغ ثابت)</label>
                  <input
                    type="number"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">سقف الزيادة المسموح</label>
                  <input
                    type="number"
                    value={maxSurcharge}
                    onChange={(e) => setMaxSurcharge(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  حفظ القاعدة وتفعيلها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
