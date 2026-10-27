/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Plus,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Scale,
  Receipt,
  FileText,
} from 'lucide-react';
import { FinancialDebt, DebtOrigin } from '../types';

export const AccountingLedgerView: React.FC = () => {
  const {
    journalEntries,
    financialDebts,
    merchants,
    captains,
    reverseJournalEntry,
    createManualDebt,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'journal' | 'debts' | 'currency'>('journal');

  // Manual debt modal state
  const [isAddingDebt, setIsAddingDebt] = useState<boolean>(false);
  const [debtOrigin, setDebtOrigin] = useState<DebtOrigin>('manual_admin');
  const [debtorType, setDebtorType] = useState<'merchant' | 'driver'>('merchant');
  const [debtorId, setDebtorId] = useState<string>(merchants[0]?.id || '');
  const [amount, setAmount] = useState<number>(50000);
  const [reasonCode, setReasonCode] = useState<string>('PACKAGING_MATERIALS_ADVANCE');
  const [notes, setNotes] = useState<string>('تزويد التاجر بمواد تغليف وشحن خاصة من مستودع مرتاح');

  // Reversal Entry modal state
  const [reversalTargetId, setReversalTargetId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('تصحيح خطأ إدخال بناءً على مطابقة كشف الحساب');
  const [reversalUser, setReversalUser] = useState<string>('المحاسب المالي - كمال الأحمد');

  // Currency snapshot demonstration state
  const [currentUsdRate, setCurrentUsdRate] = useState<number>(14850);
  const [sampleUsdVal, setSampleUsdVal] = useState<number>(100);

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const debtorName =
      debtorType === 'merchant'
        ? merchants.find((m) => m.id === debtorId)?.business_name || 'تاجر'
        : captains.find((c) => c.id === debtorId)?.name || 'كابتن';

    createManualDebt({
      debt_origin: debtOrigin,
      debtor_type: debtorType,
      debtor_id: debtorId,
      debtor_name: debtorName,
      creditor_type: 'company',
      creditor_id: 'comp-mortah',
      creditor_name: 'شركة مرتَاح للخدمات اللوجستية',
      amount: Number(amount),
      currency: 'SYP',
      exchange_rate_snapshot: currentUsdRate,
      reason_code: reasonCode,
      notes,
      created_by: 'المحاسب المالي - كمال الأحمد',
    });

    setIsAddingDebt(false);
  };

  const handleExecuteReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTargetId) return;
    reverseJournalEntry(reversalTargetId, reversalReason, reversalUser);
    setReversalTargetId(null);
  };

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>سجل القيود المزدوجة (Journal Entries)</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>سجل الذمم المالية المستقلة ({financialDebts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'currency'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>تثبيت سعر الصرف والليرة السورية</span>
          </button>
        </div>

        {activeTab === 'debts' && (
          <button
            onClick={() => setIsAddingDebt(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة ذمة مالية يدوية</span>
          </button>
        )}
      </div>

      {/* Tab 1: Double-Entry Journal Entries */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">مبدأ القيد المزدوج الإلزامي (Double-Entry Bookkeeping)</span>
                <span className="text-[11px] text-slate-400">
                  القاعدة المحاسبية الصارمة: لا يُحذف أي قيد في المنظومة نهائياً؛ التصحيح يتم حصراً عبر إصدار قيد عكسي مطابق ومبرر.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
                توازن الدفاتر: Σ المدين = Σ الدائن (100%)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {journalEntries.map((entry) => {
              const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0);
              const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0);
              const isBalanced = totalDebit === totalCredit;

              return (
                <div
                  key={entry.id}
                  className={`p-4 bg-slate-900 border rounded-2xl space-y-3 shadow-md ${
                    entry.is_reversal ? 'border-amber-800/80 bg-amber-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">قيد #{entry.entry_number}</span>
                      {entry.is_reversal && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700">
                          قيد عكسي تصحيحي
                        </span>
                      )}
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(entry.transaction_date).toLocaleString('ar-SY')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">المحرر: {entry.created_by}</span>
                      {!entry.is_reversal && (
                        <button
                          onClick={() => {
                            setReversalTargetId(entry.id);
                            setReversalReason(`تصحيح للقيد #${entry.entry_number}`);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-semibold border border-amber-800/40 flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>إصدار قيد عكسي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">{entry.description_ar}</p>

                  {/* Journal Items Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950/90 text-slate-400 text-[10px] font-mono uppercase">
                        <tr>
                          <th className="py-2 px-3">رقم واسم الحساب</th>
                          <th className="py-2 px-3">الطرف المرتبط</th>
                          <th className="py-2 px-3 text-left">مدين (Debit)</th>
                          <th className="py-2 px-3 text-left">دائن (Credit)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                        {entry.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3">
                              <span className="text-emerald-400 ml-1 font-bold">{item.account_code}</span>
                              <span className="text-slate-300 text-[11px] font-sans">{item.account_name}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                              {item.party_name || '-'}
                            </td>
                            <td className="py-2 px-3 text-left font-bold text-white">
                              {item.debit > 0 ? `${item.debit.toLocaleString()} ل.س` : '-'}
                            </td>
                            <td className="py-2 px-3 text-left font-bold text-white">
                              {item.credit > 0 ? `${item.credit.toLocaleString()} ل.س` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-950/90 text-xs font-mono font-bold border-t border-slate-800">
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-slate-400 text-left font-sans">
                            إجمالي طرفي القيد:
                          </td>
                          <td className="py-2 px-3 text-left text-emerald-400">
                            {totalDebit.toLocaleString()} ل.س
                          </td>
                          <td className="py-2 px-3 text-left text-emerald-400">
                            {totalCredit.toLocaleString()} ل.س
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Financial Debts Registry */}
      {activeTab === 'debts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                سجل الذمم المالية المستقلة والالتزامات الموثقة ({financialDebts.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تنشأ الذمة إما يدوياً من الإدارة أو آلياً من حركة تشغيلية كالمصروفات وعجز السائقين دون حذف أي سجل تاريخي.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">كود ومصدر الذمة</th>
                  <th className="py-3 px-3">الطرف المدين (الملزم بالسداد)</th>
                  <th className="py-3 px-3">الطرف الدائن (المستحق له)</th>
                  <th className="py-3 px-3">المبلغ (ل.س)</th>
                  <th className="py-3 px-3">سبب الذمة وتفاصيلها</th>
                  <th className="py-3 px-3">المحرر والتاريخ</th>
                  <th className="py-3 px-4 text-center">حالة السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {financialDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-white text-xs">{debt.id}</span>
                      <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                        {debt.debt_origin === 'manual_admin'
                          ? 'إدخال إداري يدوي'
                          : debt.debt_origin === 'driver_deficit_transferred'
                          ? 'تحويل عجز سائق لمرتاح'
                          : 'تشغيلي تلقائي'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-rose-400">{debt.debtor_name}</div>
                      <span className="text-[10px] text-slate-500">
                        {debt.debtor_type === 'merchant' ? 'تاجر' : debt.debtor_type === 'driver' ? 'كابتن' : 'شركة'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-emerald-400">{debt.creditor_name}</div>
                      <span className="text-[10px] text-slate-500">
                        {debt.creditor_type === 'company' ? 'شركة مرتاح' : debt.creditor_type === 'merchant' ? 'تاجر' : 'كابتن'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {debt.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ل.س</span>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-mono text-[10px] text-amber-300">{debt.reason_code}</div>
                      <div className="text-[11px] text-slate-300 truncate">{debt.notes}</div>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] text-slate-400">
                      <div>{debt.created_by}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(debt.created_at).toLocaleDateString('ar-SY')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        ذمة نشطة قائمة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Currency Snapshot Stability */}
      {activeTab === 'currency' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-emerald-950 rounded-xl text-emerald-400 border border-emerald-800">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                محاكاة قاعدة ثبات الحركات التاريخية لليرة السورية والدولار
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                القاعدة المحاسبية المعتمدة: كافة القيود الدفترية تُقيد بالليرة السورية (SYP). عند تسجيل أي حركة، يُجمد سعر الصرف المعادل لحظياً، وتعديل سعر الصرف اليومي لا يُغير نهائياً أي حركة تاريخية سابقة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-400 block">سعر الصرف المعتمد اليوم في النظام</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 whitespace-nowrap">1 دولار أمريكي =</span>
                <input
                  type="number"
                  value={currentUsdRate}
                  onChange={(e) => setCurrentUsdRate(Number(e.target.value))}
                  className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm"
                />
                <span className="text-slate-400">ليرة سورية</span>
              </div>
              <p className="text-[11px] text-slate-400">
                يمكنك تجربة تغيير سعر الصرف هنا لمشاهدة كيف تظل الحركات المسجلة بالأمس ثابتة تماماً دون أي تشوه في القوائم المالية.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-teal-400 block">حالة شحنة مسجلة بسعر صرف تاريخي</span>
              <div className="font-mono space-y-1 text-slate-300">
                <div>المبلغ الأصلي: <span className="font-bold text-white">{sampleUsdVal} $</span></div>
                <div>سعر الصرف وقت الحركة (Snapshot): <span className="text-amber-400 font-bold">14,850 ل.س</span></div>
                <div>القيد الدفتري المسجل الثابت: <span className="text-emerald-400 font-bold">{(sampleUsdVal * 14850).toLocaleString()} ل.س</span></div>
                <div className="text-[10px] text-slate-500 pt-1">
                  لو كان السعر اليوم {currentUsdRate.toLocaleString()} ل.س، فإن القيد الدفتري لا يتغير ويظل {(sampleUsdVal * 14850).toLocaleString()} ل.س لحماية الذمم.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Debt Creation Modal */}
      {isAddingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">إضافة ذمة مالية يدوية للتاجر أو السائق</h3>
            <p className="text-slate-400">
              تسجيل ذمة مستحقة لصالح مرتاح مع توثيق السبب والمستندات الإلزامية.
            </p>

            <form onSubmit={handleSaveDebt} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">الطرف المدين (الملزم بالسداد)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDebtorType('merchant');
                      setDebtorId(merchants[0]?.id || '');
                    }}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      debtorType === 'merchant'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    تاجر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDebtorType('driver');
                      setDebtorId(captains[0]?.id || '');
                    }}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      debtorType === 'driver'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    سائق / كابتن
                  </button>
                </div>

                <select
                  value={debtorId}
                  onChange={(e) => setDebtorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                >
                  {debtorType === 'merchant'
                    ? merchants.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.business_name}
                        </option>
                      ))
                    : captains.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مبلغ الذمة (ليرة سورية)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رمز سبب الذمة (Reason Code)</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                >
                  <option value="PACKAGING_MATERIALS_ADVANCE">مواد وتغليف كراتين خاصة (PACKAGING_ADVANCE)</option>
                  <option value="OPERATIONAL_EXPENSE_PAID_BY_MORTAH">مصاريف سددتها مرتاح نيابة عن التاجر</option>
                  <option value="DAMAGE_GOODS_COMPENSATION">تعويض تلفيات متفق عليها</option>
                  <option value="UNPAID_PREVIOUS_LOGISTICS_FEES">أجور سابقة غير مسددة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">الملاحظات والشرح المحاسبي</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white h-16"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDebt(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  قيد الذمة في الدفاتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Entry Confirmation Modal */}
      {reversalTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">إصدار قيد عكسي تصحيحي للقيد المحدد</h3>
            <p className="text-slate-400">
              سيقوم النظام بإنشاء قيد عكسي متطابق يقلب المدين والدائن مع توثيق سبب التصحيح وهوية المستخدم، دون حذف القيد السابق.
            </p>

            <form onSubmit={handleExecuteReversal} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">سبب إصدار القيد العكسي (إلزامي للتدقيق)</label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المحاسب المسؤول عن الإجراء</label>
                <input
                  type="text"
                  value={reversalUser}
                  onChange={(e) => setReversalUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReversalTargetId(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  تأكيد وترحيل القيد العكسي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
