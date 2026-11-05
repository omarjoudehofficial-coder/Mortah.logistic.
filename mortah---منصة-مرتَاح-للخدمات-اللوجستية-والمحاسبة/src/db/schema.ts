/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  bigserial,
  smallint,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ============================================================================
// 1. MASTER & REFERENCE DATA (البيانات المرجعية)
// ============================================================================

export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(), // 'SYP', 'USD'
  nameAr: varchar('name_ar', { length: 50 }).notNull(),
  decimals: smallint('decimals').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const exchangeRatesHistory = pgTable(
  'exchange_rates_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromCurrency: varchar('from_currency', { length: 3 })
      .references(() => currencies.code)
      .notNull(),
    toCurrency: varchar('to_currency', { length: 3 })
      .references(() => currencies.code)
      .notNull(),
    rate: numeric('rate', { precision: 14, scale: 6 }).notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by'),
  },
  (table) => [
    index('idx_exchange_rates_lookup').on(table.fromCurrency, table.toCurrency, table.effectiveAt),
  ]
);

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  governorate: varchar('governorate', { length: 50 }).notNull(),
  centerLat: numeric('center_lat', { precision: 10, scale: 7 }),
  centerLng: numeric('center_lng', { precision: 10, scale: 7 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const serviceTypes = pgTable('service_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).unique().notNull(), // 'standard', 'express', 'same_day', 'fragile_heavy'
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const chartOfAccounts = pgTable('chart_of_accounts', {
  code: varchar('code', { length: 20 }).primaryKey(), // '1010', '1020', '2010', '2015', '2016', '2020', '4010', '4020'
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(), // 'asset', 'liability', 'equity', 'revenue', 'expense'
  currency: varchar('currency', { length: 3 })
    .references(() => currencies.code)
    .default('SYP')
    .notNull(),
  isReconcilable: boolean('is_reconcilable').default(true).notNull(),
});

// ============================================================================
// 2. PARTIES & RBAC (المستخدمون، التجار، الكباتن)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 30 }).notNull(), // 'super_admin', 'operations', 'accountant', 'pricing_officer', 'merchant', 'captain'
  fullName: varchar('full_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  businessName: varchar('business_name', { length: 150 }).notNull(),
  ownerName: varchar('owner_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  defaultZoneId: uuid('default_zone_id').references(() => zones.id),
  currency: varchar('currency', { length: 3 })
    .references(() => currencies.code)
    .default('SYP')
    .notNull(),
  prepaidBalanceCached: numeric('prepaid_balance_cached', { precision: 15, scale: 2 }).default('0.00').notNull(),
  prepaidReservedCached: numeric('prepaid_reserved_cached', { precision: 15, scale: 2 }).default('0.00').notNull(),
  codEscrowCached: numeric('cod_escrow_cached', { precision: 15, scale: 2 }).default('0.00').notNull(),
  overdraftLimit: numeric('overdraft_limit', { precision: 15, scale: 2 }).default('0.00').notNull(),
  isFrozen: boolean('is_frozen').default(false).notNull(),
  isSandbox: boolean('is_sandbox').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const captains = pgTable('captains', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  vehicleType: varchar('vehicle_type', { length: 30 }).notNull(), // 'motorcycle', 'car', 'van'
  currency: varchar('currency', { length: 3 })
    .references(() => currencies.code)
    .default('SYP')
    .notNull(),
  cashOnHandCached: numeric('cash_on_hand_cached', { precision: 15, scale: 2 }).default('0.00').notNull(),
  earningsPayableCached: numeric('earnings_payable_cached', { precision: 15, scale: 2 }).default('0.00').notNull(),
  activeStatus: varchar('active_status', { length: 30 }).default('available').notNull(),
  isSandbox: boolean('is_sandbox').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 3. PRICING MATRIX & TEMPORAL RULES (مصفوفة التسعير والقواعد الزمنية)
// ============================================================================

export const pricingRules = pgTable(
  'pricing_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ruleCode: varchar('rule_code', { length: 50 }).notNull(),
    nameAr: varchar('name_ar', { length: 150 }).notNull(),
    merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }), // NULL = General Rule
    pickupZoneId: uuid('pickup_zone_id').references(() => zones.id).notNull(),
    deliveryZoneId: uuid('delivery_zone_id').references(() => zones.id).notNull(),
    serviceTypeId: uuid('service_type_id').references(() => serviceTypes.id).notNull(),
    baseDeliveryFee: numeric('base_delivery_fee', { precision: 15, scale: 2 }).notNull(),
    captainShareFormula: jsonb('captain_share_formula').notNull(), // { type: 'fixed' | 'percentage', value: number }
    companyShareFormula: jsonb('company_share_formula').notNull(), // { type: 'fixed' | 'percentage', value: number }
    maxAllowedSurcharge: numeric('max_allowed_surcharge', { precision: 15, scale: 2 }).default('0.00').notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    isSandbox: boolean('is_sandbox').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_pricing_lookup').on(
      table.pickupZoneId,
      table.deliveryZoneId,
      table.serviceTypeId,
      table.merchantId,
      table.isActive
    ),
  ]
);

// ============================================================================
// 4. ORDERS & STATUS SEGREGATION (الطلبات وتفكيك المسارات)
// ============================================================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trackingCode: varchar('tracking_code', { length: 30 }).unique().notNull(),
    merchantId: uuid('merchant_id')
      .references(() => merchants.id, { onDelete: 'restrict' })
      .notNull(),
    captainId: uuid('captain_id').references(() => captains.id, { onDelete: 'restrict' }),
    pickupZoneId: uuid('pickup_zone_id').references(() => zones.id).notNull(),
    deliveryZoneId: uuid('delivery_zone_id').references(() => zones.id).notNull(),
    serviceTypeId: uuid('service_type_id').references(() => serviceTypes.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
    customerAddress: text('customer_address').notNull(),
    customerLat: numeric('customer_lat', { precision: 10, scale: 7 }),
    customerLng: numeric('customer_lng', { precision: 10, scale: 7 }),
    preferredDeliveryWindow: varchar('preferred_delivery_window', { length: 50 }),
    packageDescription: text('package_description').notNull(),
    weightKg: numeric('weight_kg', { precision: 6, scale: 2 }).default('1.00').notNull(),
    isFragile: boolean('is_fragile').default(false).notNull(),
    feePayer: varchar('fee_payer', { length: 20 }).notNull(), // 'customer', 'merchant'

    // Financial Snapshot (Frozen at Order Creation)
    currency: varchar('currency', { length: 3 })
      .references(() => currencies.code)
      .default('SYP')
      .notNull(),
    exchangeRateSnapshot: numeric('exchange_rate_snapshot', { precision: 14, scale: 6 })
      .default('1.000000')
      .notNull(),
    goodsCodAmount: numeric('goods_cod_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
    deliveryFeeTotal: numeric('delivery_fee_total', { precision: 15, scale: 2 }).default('0.00').notNull(),
    captainDeliveryFee: numeric('captain_delivery_fee', { precision: 15, scale: 2 }).default('0.00').notNull(),
    companyCommissionNet: numeric('company_commission_net', { precision: 15, scale: 2 }).default('0.00').notNull(),
    pricingRuleId: uuid('pricing_rule_id').references(() => pricingRules.id),
    pricingSnapshot: jsonb('pricing_snapshot').notNull(),
    paidFromPrepaid: numeric('paid_from_prepaid', { precision: 15, scale: 2 }).default('0.00').notNull(),

    // Distinct Operational & Financial Lifecycles
    operationalStatus: varchar('operational_status', { length: 30 }).default('draft').notNull(), // 'draft', 'pending_pricing', 'confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
    customerCollectionStatus: varchar('customer_collection_status', { length: 30 }).default('pending').notNull(), // 'pending', 'collected_cash', 'prepaid_covered', 'failed_collection'
    captainRemittanceStatus: varchar('captain_remittance_status', { length: 30 }).default('not_applicable').notNull(), // 'not_applicable', 'holding_cash', 'remitted_to_vault', 'settled_direct_to_merchant', 'deficit_under_investigation'
    merchantPayoutStatus: varchar('merchant_payout_status', { length: 30 }).default('pending').notNull(), // 'pending', 'accrued_unpaid', 'ready_for_payout', 'payout_completed', 'offset_with_debt'
    companyFeeStatus: varchar('company_fee_status', { length: 30 }).default('unearned').notNull(), // 'unearned', 'earned_accrued', 'collected_from_cod', 'collected_from_prepaid', 'voided'

    // Cancellation & Piggyback Returns
    cancellationStage: varchar('cancellation_stage', { length: 40 }).default('none').notNull(),
    cancellationFee: numeric('cancellation_fee', { precision: 15, scale: 2 }).default('0.00').notNull(),
    cancellationReason: text('cancellation_reason'),
    returnCost: numeric('return_cost', { precision: 15, scale: 2 }).default('0.00').notNull(),
    isPiggybackedReturn: boolean('is_piggybacked_return').default(false).notNull(),
    piggybackOrderId: uuid('piggyback_order_id'),

    // Metadata & Concurrency Controls
    proofOfDeliveryUrl: text('proof_of_delivery_url'),
    deliveryNotes: text('delivery_notes'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
    payloadHash: varchar('payload_hash', { length: 64 }),
    isSandbox: boolean('is_sandbox').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_delivery_fee_split',
      sql`${table.deliveryFeeTotal} = (${table.captainDeliveryFee} + ${table.companyCommissionNet})`
    ),
    index('idx_orders_merchant').on(table.merchantId, table.createdAt),
    index('idx_orders_captain').on(table.captainId, table.operationalStatus),
    index('idx_orders_tracking').on(table.trackingCode),
  ]
);

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  statusType: varchar('status_type', { length: 30 }).notNull(), // 'operational', 'customer_collection', 'captain_remittance', 'merchant_payout', 'company_fee'
  oldValue: varchar('old_value', { length: 50 }),
  newValue: varchar('new_value', { length: 50 }).notNull(),
  reason: text('reason'),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 5. DOUBLE-ENTRY ACCOUNTING LEDGER (دفتر الأستاذ المزدوج المحمي)
// ============================================================================

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryNumber: bigserial('entry_number', { mode: 'number' }).unique().notNull(),
    annualCode: varchar('annual_code', { length: 30 }).unique().notNull(), // e.g. '2026-000001'
    fiscalYear: smallint('fiscal_year').notNull(),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).defaultNow().notNull(),
    descriptionAr: text('description_ar').notNull(),
    sourceModule: varchar('source_module', { length: 40 }).notNull(), // 'order_lifecycle', 'captain_remittance', 'merchant_settlement', 'debt_management', 'reversal', 'reconciliation_adjustment'
    relatedOrderId: uuid('related_order_id').references(() => orders.id),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique().notNull(),
    payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
    isPosted: boolean('is_posted').default(true).notNull(),
    isReversal: boolean('is_reversal').default(false).notNull(),
    reversedEntryId: uuid('reversed_entry_id'),
    reversalReason: text('reversal_reason'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    isSandbox: boolean('is_sandbox').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_journal_entries_date').on(table.transactionDate),
    index('idx_journal_entries_order').on(table.relatedOrderId),
    uniqueIndex('uq_single_reversal_per_entry')
      .on(table.reversedEntryId)
      .where(sql`${table.isReversal} = true AND ${table.reversedEntryId} IS NOT NULL`),
  ]
);

export const journalLines = pgTable(
  'journal_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .references(() => journalEntries.id, { onDelete: 'restrict' })
      .notNull(),
    lineNumber: smallint('line_number').notNull(),
    accountCode: varchar('account_code', { length: 20 })
      .references(() => chartOfAccounts.code)
      .notNull(),

    // Multi-Currency & Syrian Pound Base Fields
    currency: varchar('currency', { length: 3 })
      .references(() => currencies.code)
      .default('SYP')
      .notNull(),
    debitOriginal: numeric('debit_original', { precision: 15, scale: 2 }).default('0.00').notNull(),
    creditOriginal: numeric('credit_original', { precision: 15, scale: 2 }).default('0.00').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 14, scale: 6 }).default('1.000000').notNull(),
    debitBaseSyp: numeric('debit_base_syp', { precision: 15, scale: 2 }).default('0.00').notNull(),
    creditBaseSyp: numeric('credit_base_syp', { precision: 15, scale: 2 }).default('0.00').notNull(),

    // Party Subledger (دفتر الأستاذ المساعد)
    partyType: varchar('party_type', { length: 30 }), // 'merchant', 'captain', 'company_vault'
    partyId: uuid('party_id'),
    notes: text('notes'),
  },
  (table) => [
    check(
      'chk_positive_debit_credit',
      sql`(${table.debitBaseSyp} >= 0 AND ${table.creditBaseSyp} >= 0 AND (${table.debitBaseSyp} > 0 OR ${table.creditBaseSyp} > 0))`
    ),
    uniqueIndex('uq_entry_line_number').on(table.entryId, table.lineNumber),
    index('idx_lines_party').on(table.partyType, table.partyId, table.accountCode),
  ]
);

// ============================================================================
// 6. DRIVER DEFICIT, DEBTS & RECONCILIATION (العجز، الذمم، والمطابقات)
// ============================================================================

export const driverSettlementRequests = pgTable(
  'driver_settlement_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    captainId: uuid('captain_id').references(() => captains.id).notNull(),
    merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
    totalCodDue: numeric('total_cod_due', { precision: 15, scale: 2 }).notNull(),
    driverDeclaredAvailable: numeric('driver_declared_available', { precision: 15, scale: 2 }).notNull(),
    driverDeclaredDeficit: numeric('driver_declared_deficit', { precision: 15, scale: 2 }).notNull(),
    driverNotes: text('driver_notes'),
    merchantConfirmedAmount: numeric('merchant_confirmed_amount', { precision: 15, scale: 2 }),
    merchantConfirmedAt: timestamp('merchant_confirmed_at', { withTimezone: true }),
    discrepancyStatus: varchar('discrepancy_status', { length: 40 }).default('pending').notNull(), // 'pending', 'under_investigation', 'confirmed'
    mortahReviewDecision: varchar('mortah_review_decision', { length: 40 }).default('pending').notNull(), // 'pending', 'approved_transfer_debt', 'rejected'
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_deficit_requests_status').on(table.discrepancyStatus, table.mortahReviewDecision),
  ]
);

export const financialDebts = pgTable(
  'financial_debts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    debtOrigin: varchar('debt_origin', { length: 40 }).notNull(), // 'driver_deficit_transferred', 'unpaid_delivery_fee', 'cancellation_penalty', 'manual_admin'
    debtorType: varchar('debtor_type', { length: 20 }).notNull(), // 'captain', 'merchant', 'company'
    debtorId: uuid('debtor_id').notNull(),
    creditorType: varchar('creditor_type', { length: 20 }).notNull(), // 'company', 'merchant', 'captain'
    creditorId: uuid('creditor_id').notNull(),
    originalRequestId: uuid('original_request_id').references(() => driverSettlementRequests.id),
    parentDebtId: uuid('parent_debt_id'), // For transferred debt lineage
    relatedOrderId: uuid('related_order_id').references(() => orders.id),
    currency: varchar('currency', { length: 3 })
      .references(() => currencies.code)
      .default('SYP')
      .notNull(),
    amountTotal: numeric('amount_total', { precision: 15, scale: 2 }).notNull(),
    amountSettled: numeric('amount_settled', { precision: 15, scale: 2 }).default('0.00').notNull(),
    settlementStatus: varchar('settlement_status', { length: 30 }).default('active').notNull(), // 'active', 'partially_settled', 'fully_settled', 'transferred', 'cancelled'
    reasonCode: varchar('reason_code', { length: 50 }).notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_debts_debtor').on(table.debtorType, table.debtorId, table.settlementStatus),
    index('idx_debts_creditor').on(table.creditorType, table.creditorId, table.settlementStatus),
  ]
);

export const debtSettlementAllocations = pgTable('debt_settlement_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  debtId: uuid('debt_id')
    .references(() => financialDebts.id, { onDelete: 'restrict' })
    .notNull(),
  journalEntryId: uuid('journal_entry_id')
    .references(() => journalEntries.id, { onDelete: 'restrict' })
    .notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  allocationType: varchar('allocation_type', { length: 40 }).notNull(), // 'cash_payment', 'offset_with_earnings', 'debt_assumption_transfer'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reconciliationAuditLogs = pgTable('reconciliation_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  partyType: varchar('party_type', { length: 30 }).notNull(), // 'merchant', 'captain'
  partyId: uuid('party_id').notNull(),
  accountCode: varchar('account_code', { length: 20 }).notNull(),
  cachedBalance: numeric('cached_balance', { precision: 15, scale: 2 }).notNull(),
  ledgerBalance: numeric('ledger_balance', { precision: 15, scale: 2 }).notNull(),
  discrepancy: numeric('discrepancy', { precision: 15, scale: 2 }).notNull(),
  isMatched: boolean('is_matched').notNull(),
  actionTaken: varchar('action_taken', { length: 50 }).default('none').notNull(), // 'none', 'account_frozen', 'adjusted_by_entry'
  adjustmentEntryId: uuid('adjustment_entry_id').references(() => journalEntries.id),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  payloadBefore: jsonb('payload_before'),
  payloadAfter: jsonb('payload_after'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 7. DRIZZLE RELATIONS (العلاقات بين الجداول)
// ============================================================================

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, { fields: [merchants.userId], references: [users.id] }),
  defaultZone: one(zones, { fields: [merchants.defaultZoneId], references: [zones.id] }),
  orders: many(orders),
  pricingRules: many(pricingRules),
}));

export const captainsRelations = relations(captains, ({ one, many }) => ({
  user: one(users, { fields: [captains.userId], references: [users.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  merchant: one(merchants, { fields: [orders.merchantId], references: [merchants.id] }),
  captain: one(captains, { fields: [orders.captainId], references: [captains.id] }),
  pickupZone: one(zones, { fields: [orders.pickupZoneId], references: [zones.id] }),
  deliveryZone: one(zones, { fields: [orders.deliveryZoneId], references: [zones.id] }),
  serviceType: one(serviceTypes, { fields: [orders.serviceTypeId], references: [serviceTypes.id] }),
  pricingRule: one(pricingRules, { fields: [orders.pricingRuleId], references: [pricingRules.id] }),
  statusHistory: many(orderStatusHistory),
  journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  relatedOrder: one(orders, { fields: [journalEntries.relatedOrderId], references: [orders.id] }),
  author: one(users, { fields: [journalEntries.createdBy], references: [users.id] }),
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  entry: one(journalEntries, { fields: [journalLines.entryId], references: [journalEntries.id] }),
  account: one(chartOfAccounts, { fields: [journalLines.accountCode], references: [chartOfAccounts.code] }),
}));

export const financialDebtsRelations = relations(financialDebts, ({ one, many }) => ({
  originalRequest: one(driverSettlementRequests, { fields: [financialDebts.originalRequestId], references: [driverSettlementRequests.id] }),
  relatedOrder: one(orders, { fields: [financialDebts.relatedOrderId], references: [orders.id] }),
  settlementAllocations: many(debtSettlementAllocations),
}));
