/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Zone,
  ServiceType,
  Merchant,
  Captain,
  PricingRule,
  Order,
  DriverSettlementRequest,
  FinancialDebt,
  JournalEntry,
  InventoryItem,
} from '../types';

export const INITIAL_ZONES: Zone[] = [
  { id: 'z-dam-midan', code: 'DAM-MID', name_ar: 'دمشق - الميدان', governorate: 'damascus', governorate_ar: 'دمشق', center_lat_lng: [33.488, 36.302], is_active: true },
  { id: 'z-dam-mazzeh', code: 'DAM-MAZ', name_ar: 'دمشق - المزة', governorate: 'damascus', governorate_ar: 'دمشق', center_lat_lng: [33.501, 36.257], is_active: true },
  { id: 'z-dam-malki', code: 'DAM-MAL', name_ar: 'دمشق - المالكي وأبو رمانة', governorate: 'damascus', governorate_ar: 'دمشق', center_lat_lng: [33.518, 36.279], is_active: true },
  { id: 'z-dam-dummar', code: 'DAM-DUM', name_ar: 'دمشق - مشروع دمر', governorate: 'damascus', governorate_ar: 'دمشق', center_lat_lng: [33.541, 36.231], is_active: true },
  { id: 'z-dam-babtouma', code: 'DAM-BAB', name_ar: 'دمشق - باب توما والقصاع', governorate: 'damascus', governorate_ar: 'دمشق', center_lat_lng: [33.514, 36.319], is_active: true },
  { id: 'z-rur-jaramana', code: 'RUR-JAR', name_ar: 'ريف دمشق - جرمانا', governorate: 'rural_damascus', governorate_ar: 'ريف دمشق', center_lat_lng: [33.483, 36.347], is_active: true },
  { id: 'z-rur-sahnaya', code: 'RUR-SAH', name_ar: 'ريف دمشق - صحنايا والأشرفية', governorate: 'rural_damascus', governorate_ar: 'ريف دمشق', center_lat_lng: [33.425, 36.251], is_active: true },
  { id: 'z-rur-qudsaya', code: 'RUR-QUD', name_ar: 'ريف دمشق - قدسيا وضاحيتها', governorate: 'rural_damascus', governorate_ar: 'ريف دمشق', center_lat_lng: [33.551, 36.208], is_active: true },
  { id: 'z-ale-shahba', code: 'ALE-SHA', name_ar: 'حلب - الشهباء والجميلية', governorate: 'aleppo', governorate_ar: 'حلب', center_lat_lng: [36.216, 37.135], is_active: true },
  { id: 'z-hom-centre', code: 'HOM-CEN', name_ar: 'حمص - مركز المدينة والدبلان', governorate: 'homs', governorate_ar: 'حمص', center_lat_lng: [34.732, 36.713], is_active: true },
  { id: 'z-lat-corniche', code: 'LAT-COR', name_ar: 'اللاذقية - الكورنيش والزراعة', governorate: 'lattakia', governorate_ar: 'اللاذقية', center_lat_lng: [35.531, 35.791], is_active: true },
];

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: 'srv-standard', code: 'standard', name_ar: 'توصيل قياسي (خلال 24-48 ساعة)', description_ar: 'الشحن الاعتيادي اليومي بين المراكز والأحياء', is_active: true },
  { id: 'srv-express', code: 'express', name_ar: 'توصيل سريع (خلال اليوم نفسه)', description_ar: 'إعطاء أولوية في التوزيع مع كابتن مخصص', is_active: true },
  { id: 'srv-same-day', code: 'same_day', name_ar: 'توصيل فوري مستعجل (خلال 3 ساعات)', description_ar: 'استلام فوري ونقل مباشر دون فرز في المستودع', is_active: true },
  { id: 'srv-fragile-heavy', code: 'fragile_heavy', name_ar: 'شحن بضائع ثقيلة أو قابلة للكسر', description_ar: 'يتطلب سيارة مغلقة ومناولة دقيقة', is_active: true },
];

export const INITIAL_MERCHANTS: Merchant[] = [
  {
    id: 'm-al-amal',
    business_name: 'شركة الأمل للإلكترونيات والأجهزة',
    owner_name: 'م. حسام العلي',
    phone: '+963 933 112233',
    address: 'دمشق، شارع النصر، بناء البرج 4',
    default_zone_id: 'z-dam-midan',
    prepaid_balance: 350000, // 350,000 SYP
    total_orders_count: 142,
    is_sandbox: true,
  },
  {
    id: 'm-yasmin-boutique',
    business_name: 'بوتيك ياسمين الشام للأزياء',
    owner_name: 'سارة قباني',
    phone: '+963 944 223344',
    address: 'دمشق، الصالحية، مقابل حديقة النيربين',
    default_zone_id: 'z-dam-malki',
    prepaid_balance: 85000, // 85,000 SYP
    total_orders_count: 89,
    is_sandbox: true,
  },
  {
    id: 'm-sham-sweets',
    business_name: 'حلويات ومحامص قصر الشام',
    owner_name: 'عمار الشامي',
    phone: '+963 955 334455',
    address: 'دمشق، الميدان، جزماتية',
    default_zone_id: 'z-dam-midan',
    prepaid_balance: 0,
    total_orders_count: 310,
    is_sandbox: true,
  },
];

export const INITIAL_CAPTAINS: Captain[] = [
  {
    id: 'c-ahmad-kurdi',
    name: 'أحمد الكردي',
    phone: '+963 988 554433',
    vehicle_type: 'motorcycle',
    active_status: 'available',
    current_lat_lng: [33.492, 36.295],
    cash_on_hand: 125000, // 125,000 SYP collected in hand
    rating: 4.9,
    assigned_orders_count: 3,
    is_sandbox: true,
  },
  {
    id: 'c-khaled-zein',
    name: 'خالد الزين',
    phone: '+963 991 667788',
    vehicle_type: 'car',
    active_status: 'busy',
    current_lat_lng: [33.504, 36.262],
    cash_on_hand: 480000,
    rating: 4.8,
    assigned_orders_count: 5,
    is_sandbox: true,
  },
  {
    id: 'c-samer-halabi',
    name: 'سامر الحلبي',
    phone: '+963 932 778899',
    vehicle_type: 'van',
    active_status: 'available',
    current_lat_lng: [33.535, 36.229],
    cash_on_hand: 50000,
    rating: 4.7,
    assigned_orders_count: 1,
    is_sandbox: true,
  },
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: 'pr-mid-maz-std',
    rule_code: 'R-DAM-INTRA-STD',
    name_ar: 'قاعدة دمشق الداخلية - شحن قياسي',
    merchant_id: null, // General base rule
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-dam-mazzeh',
    service_type_id: 'srv-standard',
    criteria_factors: { max_weight_kg: 5, is_fragile: false },
    base_delivery_fee: 18000, // 18,000 SYP
    commission_formula: { type: 'fixed', value: 4000 }, // Mortah keeps 4,000
    max_allowed_surcharge: 10000,
    is_active: true,
    is_sandbox: true,
    effective_from: '2026-01-01',
  },
  {
    id: 'pr-mid-jar-std',
    rule_code: 'R-DAM-TO-RUR-JAR',
    name_ar: 'قاعدة دمشق إلى جرمانا - قياسي',
    merchant_id: null,
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-rur-jaramana',
    service_type_id: 'srv-standard',
    criteria_factors: { max_weight_kg: 5 },
    base_delivery_fee: 22000, // 22,000 SYP
    commission_formula: { type: 'fixed', value: 5000 },
    max_allowed_surcharge: 12000,
    is_active: true,
    is_sandbox: true,
    effective_from: '2026-01-01',
  },
  {
    id: 'pr-mid-jar-exp',
    rule_code: 'R-DAM-TO-RUR-JAR-EXP',
    name_ar: 'قاعدة دمشق إلى جرمانا - سريع فوري',
    merchant_id: null,
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-rur-jaramana',
    service_type_id: 'srv-express',
    criteria_factors: { max_weight_kg: 5 },
    base_delivery_fee: 30000, // 30,000 SYP
    commission_formula: { type: 'fixed', value: 7000 },
    max_allowed_surcharge: 15000,
    is_active: true,
    is_sandbox: true,
    effective_from: '2026-01-01',
  },
  {
    id: 'pr-dam-ale-std',
    rule_code: 'R-DAM-TO-ALE-STD',
    name_ar: 'شحن بين المحافظات: دمشق - حلب',
    merchant_id: null,
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-ale-shahba',
    service_type_id: 'srv-standard',
    criteria_factors: { max_weight_kg: 10 },
    base_delivery_fee: 65000, // 65,000 SYP
    commission_formula: { type: 'fixed', value: 15000 },
    max_allowed_surcharge: 25000,
    is_active: true,
    is_sandbox: true,
    effective_from: '2026-01-01',
  },
  {
    id: 'pr-amal-custom-dummar',
    rule_code: 'R-AMAL-DUMMAR-VIP',
    name_ar: 'عقد خاص لشركة الأمل: توصيل لمشروع دمر',
    merchant_id: 'm-al-amal',
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-dam-dummar',
    service_type_id: 'srv-standard',
    criteria_factors: { max_weight_kg: 7 },
    base_delivery_fee: 16000, // Special discounted rate (standard is 20,000)
    commission_formula: { type: 'fixed', value: 3500 },
    max_allowed_surcharge: 8000,
    is_active: true,
    is_sandbox: true,
    effective_from: '2026-01-01',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    tracking_code: 'MRT-88301',
    merchant_id: 'm-al-amal',
    captain_id: 'c-ahmad-kurdi',
    customer_name: 'بشير الرفاعي',
    customer_phone: '+963 944 987654',
    customer_address: 'المزة، فيلات غربية، جانب جامع الأكرم',
    customer_lat_lng: [33.498, 36.261],
    preferred_delivery_window: 'بين الساعة 4:00 عصراً و 7:00 مساءً',
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-dam-mazzeh',
    service_type_id: 'srv-standard',
    package_description: 'شاشة حاسوب ولوحة مفاتيح لاسلكية',
    weight_kg: 3.2,
    is_fragile: true,
    is_sandbox: true,

    pricing_rule_id: 'pr-mid-maz-std',
    pricing_factors_applied: { weight_kg: 3.2, rule_code: 'R-DAM-INTRA-STD' },
    base_delivery_fee: 18000,
    fee_surcharge: 2000, // Fragile handling approved surcharge
    surcharge_reason: 'بضاعة حساسة للشاشات الإلكترونية تتطلب تثبيتاً آمناً',
    surcharge_authorized_by: 'مدير العمليات - عمر الخطيب',
    final_delivery_fee: 20000,
    fee_payer: 'customer',
    cod_amount: 1450000, // 1,450,000 SYP
    exchange_rate_snapshot: 14850,

    company_commission_rate_applied: { type: 'fixed', value: 4000 },
    company_commission_amount: 4000,
    commission_entitlement_status: 'pending_delivery',
    commission_collection_status: 'uncollected',

    cancellation_stage: 'none',
    cancellation_fee: 0,
    return_cost: 0,
    is_piggybacked_return: false,

    paid_from_prepaid_balance: 0,

    operational_status: 'out_for_delivery',
    financial_status: 'unpaid',
    created_at: '2026-10-26T10:15:00Z',
    updated_at: '2026-10-26T12:30:00Z',
  },
  {
    id: 'ord-102',
    tracking_code: 'MRT-88302',
    merchant_id: 'm-yasmin-boutique',
    captain_id: 'c-khaled-zein',
    customer_name: 'ريم الكواكبي',
    customer_phone: '+963 933 654321',
    customer_address: 'جرمانا، ساحة السيوف، جانب صيدلية النور',
    customer_lat_lng: [33.484, 36.345],
    preferred_delivery_window: 'خلال الظهيرة',
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-rur-jaramana',
    service_type_id: 'srv-express',
    package_description: 'فستان سهرة وقطعتين شال حرير',
    weight_kg: 1.1,
    is_fragile: false,
    is_sandbox: true,

    pricing_rule_id: 'pr-mid-jar-exp',
    pricing_factors_applied: { weight_kg: 1.1, rule_code: 'R-DAM-TO-RUR-JAR-EXP' },
    base_delivery_fee: 30000,
    fee_surcharge: 0,
    final_delivery_fee: 30000,
    fee_payer: 'merchant', // Merchant offers free shipping promo, paying from prepaid!
    cod_amount: 520000, // 520,000 SYP
    exchange_rate_snapshot: 14850,

    company_commission_rate_applied: { type: 'fixed', value: 7000 },
    company_commission_amount: 7000,
    commission_entitlement_status: 'earned',
    commission_collection_status: 'collected',

    cancellation_stage: 'none',
    cancellation_fee: 0,
    return_cost: 0,
    is_piggybacked_return: false,

    paid_from_prepaid_balance: 30000, // Deducted from merchant balance!

    operational_status: 'delivered',
    financial_status: 'settled',
    proof_of_delivery_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
    delivery_notes: 'تم التسليم باليد للعميلة واستلام كامل المبلغ نقداً 520,000 ل.س',
    created_at: '2026-10-26T08:30:00Z',
    updated_at: '2026-10-26T11:45:00Z',
  },
  {
    id: 'ord-103',
    tracking_code: 'MRT-88303',
    merchant_id: 'm-sham-sweets',
    captain_id: null,
    customer_name: 'طارق الأخرس',
    customer_phone: '+963 999 443322',
    customer_address: 'ريف دمشق، صحنايا، موقف الكنيسة',
    customer_lat_lng: [33.424, 36.253],
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-rur-sahnaya',
    service_type_id: 'srv-standard',
    package_description: 'علبتين بقلاوة شامية مشكلة فاخرة',
    weight_kg: 2.0,
    is_fragile: false,
    is_sandbox: true,

    // Unpriced route scenario!
    pricing_rule_id: null,
    pricing_factors_applied: {},
    base_delivery_fee: 0,
    fee_surcharge: 0,
    final_delivery_fee: 0,
    fee_payer: 'customer',
    cod_amount: 380000,
    exchange_rate_snapshot: 14850,

    company_commission_rate_applied: { type: 'pending', value: 0 },
    company_commission_amount: 0,
    commission_entitlement_status: 'pending_delivery',
    commission_collection_status: 'uncollected',

    cancellation_stage: 'none',
    cancellation_fee: 0,
    return_cost: 0,
    is_piggybacked_return: false,

    paid_from_prepaid_balance: 0,

    operational_status: 'pending_pricing', // Blocked from dispatch until authorized!
    financial_status: 'unpaid',
    created_at: '2026-10-26T14:10:00Z',
    updated_at: '2026-10-26T14:10:00Z',
  },
  {
    id: 'ord-104',
    tracking_code: 'MRT-88304',
    merchant_id: 'm-al-amal',
    captain_id: 'c-samer-halabi',
    customer_name: 'نديم الحافظ',
    customer_phone: '+963 944 115599',
    customer_address: 'دمشق، مشروع دمر، الجزيرة 16',
    pickup_zone_id: 'z-dam-midan',
    delivery_zone_id: 'z-dam-dummar',
    service_type_id: 'srv-standard',
    package_description: 'طابعة ملونة ليزرية احترافية',
    weight_kg: 6.5,
    is_fragile: true,
    is_sandbox: true,

    pricing_rule_id: 'pr-amal-custom-dummar',
    pricing_factors_applied: { weight_kg: 6.5, custom_contract: true },
    base_delivery_fee: 16000,
    fee_surcharge: 0,
    final_delivery_fee: 16000,
    fee_payer: 'customer',
    cod_amount: 2200000, // 2,200,000 SYP
    exchange_rate_snapshot: 14850,

    company_commission_rate_applied: { type: 'fixed', value: 3500 },
    company_commission_amount: 3500,
    commission_entitlement_status: 'earned',
    commission_collection_status: 'uncollected',

    // Cancelled after arrival at destination scenario!
    cancellation_stage: 'after_pickup_at_dest',
    cancellation_reason: 'رفض الزبون الاستلام لعدم توفر سيولة نقدية لديه في اللحظة',
    cancellation_fee: 16000, // Full delivery fee or agreed cancellation penalty
    return_cost: 0, // Piggybacked!
    is_piggybacked_return: true,
    piggyback_order_id: 'ord-101', // Reused courier vehicle returning to Al-Amal!

    paid_from_prepaid_balance: 0,

    operational_status: 'cancelled',
    financial_status: 'unpaid',
    created_at: '2026-10-26T09:00:00Z',
    updated_at: '2026-10-26T13:20:00Z',
  },
];

export const INITIAL_SETTLEMENT_REQUESTS: DriverSettlementRequest[] = [
  {
    id: 'set-req-501',
    order_id: 'ord-101',
    captain_id: 'c-ahmad-kurdi',
    merchant_id: 'm-al-amal',
    total_cod_amount: 1450000,
    driver_declared_available: 1000000, // Driver only has 1,000,000 SYP cash right now
    driver_declared_deficit: 450000, // Shortage of 450,000 SYP
    driver_notes: 'لا يتوفر معي كاش كافٍ صباح اليوم لتسليم كامل ثمن الشحنة للتاجر. سأسلم مليون ل.س وأعلق 450 ألف.',

    mortah_review_status: 'pending', // Waiting for Mortah approval!
    discrepancy_amount: 0,
    discrepancy_status: 'none',
    liability_status: 'unconfirmed',
    created_at: '2026-10-26T10:30:00Z',
  },
];

export const INITIAL_FINANCIAL_DEBTS: FinancialDebt[] = [
  {
    id: 'deb-701',
    debt_origin: 'manual_admin',
    debtor_type: 'merchant',
    debtor_id: 'm-sham-sweets',
    debtor_name: 'حلويات ومحامص قصر الشام',
    creditor_type: 'company',
    creditor_id: 'comp-mortah',
    creditor_name: 'شركة مرتَاح للخدمات اللوجستية',
    amount: 75000,
    currency: 'SYP',
    exchange_rate_snapshot: 14850,
    reason_code: 'PACKAGING_BOXES_ADVANCE',
    notes: 'تزويد التاجر بعدد 100 كرتونة تغليف معزولة حرارياً من مستودع مرتاح',
    settlement_status: 'active',
    created_by: 'المحاسب المالي - كمال الأحمد',
    created_at: '2026-10-25T15:00:00Z',
  },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-901',
    entry_number: 1001,
    transaction_date: '2026-10-26T11:45:00Z',
    description_ar: 'إثبات تحصيل ثمن شحنة رقم MRT-88302 للزبونة ريم الكواكبي واقتطاع أجور التوصيل وعمولة الشركة',
    related_order_id: 'ord-102',
    is_reversal: false,
    items: [
      {
        id: 'ji-1',
        account_code: '11200',
        account_name: 'عهدة الكباتن النقدية (خالد الزين)',
        debit: 520000,
        credit: 0,
        party_type: 'captain',
        party_id: 'c-khaled-zein',
        party_name: 'خالد الزين',
      },
      {
        id: 'ji-2',
        account_code: '21100',
        account_name: 'أمانات ذمم التجار الدائنة (بوتيك ياسمين الشام)',
        debit: 0,
        credit: 520000,
        party_type: 'merchant',
        party_id: 'm-yasmin-boutique',
        party_name: 'بوتيك ياسمين الشام للأزياء',
      },
    ],
    created_by: 'النظام المحاسبي الآلي',
    is_sandbox: true,
  },
];

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'AML-MON-24',
    barcode: '621980011221',
    name_ar: 'شاشة سامسونج 24 بوصة IPS Full HD',
    merchant_id: 'm-al-amal',
    merchant_name: 'شركة الأمل للإلكترونيات والأجهزة',
    total_quantity: 18,
    available_quantity: 14,
    reserved_quantity: 4,
    location_rack: 'المستودع الرئيسي - ممر B - رف 3',
    unit: 'قطعة',
    is_sandbox: true,
  },
  {
    id: 'inv-2',
    sku: 'AML-PRN-LSR',
    barcode: '621980011222',
    name_ar: 'طابعة ليزرية إتش بي Pro M404n',
    merchant_id: 'm-al-amal',
    merchant_name: 'شركة الأمل للإلكترونيات والأجهزة',
    total_quantity: 8,
    available_quantity: 6,
    reserved_quantity: 2,
    location_rack: 'المستودع الرئيسي - ممر B - رف 1',
    unit: 'قطعة',
    is_sandbox: true,
  },
  {
    id: 'inv-3',
    sku: 'YAS-DRS-SLK',
    barcode: '621980033441',
    name_ar: 'فستان مخمل كحلي مطرز يدوي قياس 38',
    merchant_id: 'm-yasmin-boutique',
    merchant_name: 'بوتيك ياسمين الشام للأزياء',
    total_quantity: 12,
    available_quantity: 9,
    reserved_quantity: 3,
    location_rack: 'مستودع الألبسة - قسم VIP - شماعة 12',
    unit: 'فستان',
    is_sandbox: true,
  },
];
