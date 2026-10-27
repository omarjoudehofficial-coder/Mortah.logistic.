/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Barcode,
  Search,
  Building2,
  AlertCircle,
  Layers,
  ArrowDownToLine,
  Boxes,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { inventoryItems, merchants } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');

  const filteredItems = inventoryItems.filter((item) => {
    if (selectedMerchant !== 'all' && item.merchant_id !== selectedMerchant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name_ar.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/80 border border-indigo-800 text-indigo-400 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              مستودع تخزين بضائع التجار المركزي (Merchant Fulfillment Hub)
            </h2>
            <p className="text-[11px] text-slate-400">
              إدارة المخزون المودع لدى مرتَاح، جرد الأرصدة المتاحة والمحجوزة لشحنات قيد التجهيز، وتتبع المواقع الرفية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">تصفية التاجر:</span>
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="all">كافة التجار المودعين</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.business_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم العربي، كود SKU، أو الباركود..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">كود SKU والباركود</th>
                <th className="py-3 px-3">اسم المنتج والمواصفات</th>
                <th className="py-3 px-3">التاجر المالك</th>
                <th className="py-3 px-3">الموقع الرفي</th>
                <th className="py-3 px-3">الرصيد المتاح للطلب</th>
                <th className="py-3 px-3">المحجوز لشحنات</th>
                <th className="py-3 px-3">إجمالي الكمية</th>
                <th className="py-3 px-4 text-center">حالة المخزون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {filteredItems.map((item) => {
                const isLowStock = item.available_quantity <= 5;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{item.sku}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Barcode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.barcode}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-sans">
                      <div className="font-bold text-slate-100 text-xs">{item.name_ar}</div>
                      <span className="text-[10px] text-slate-400">الوحدة: {item.unit}</span>
                    </td>

                    <td className="py-3.5 px-3 font-sans">
                      <span className="text-emerald-400 font-medium text-xs">{item.merchant_name}</span>
                    </td>

                    <td className="py-3.5 px-3 font-sans text-slate-300 text-[11px]">
                      {item.location_rack}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-emerald-400 text-sm">
                      {item.available_quantity} <span className="text-[10px] font-normal text-slate-400 font-sans">{item.unit}</span>
                    </td>

                    <td className="py-3.5 px-3 text-amber-400 font-bold">
                      {item.reserved_quantity} <span className="text-[10px] font-normal text-slate-400 font-sans">{item.unit}</span>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-white">
                      {item.total_quantity} <span className="text-[10px] font-normal text-slate-400 font-sans">{item.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-sans">
                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          منخفض (إعادة طلب)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          متوفر كافٍ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
