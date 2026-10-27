/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Governorate = 'damascus' | 'rural_damascus' | 'aleppo' | 'homs' | 'lattakia' | 'tartus' | 'hama';

export interface Zone {
  id: string;
  code: string;
  name_ar: string;
  governorate: Governorate;
  governorate_ar: string;
  center_lat_lng?: [number, number];
  is_active: boolean;
}

export interface ServiceType {
  id: string;
  code: 'standard' | 'express' | 'same_day' | 'fragile_heavy';
  name_ar: string;
  description_ar: string;
  multiplier_estimate?: number;
  is_active: boolean;
}

export interface PricingFactorCriteria {
  max_weight_kg?: number;
  is_fragile?: boolean;
  requires_refrigeration?: boolean;
  package_tier?: 'small' | 'medium' | 'large' | 'cargo';
}

export interface PricingRule {
  id: string;
  rule_code: string;
  name_ar: string;
  merchant_id: string | null; // null = General base rule
  pickup_zone_id: string;
  delivery_zone_id: string;
  service_type_id: string;
  criteria_factors: PricingFactorCriteria;
  base_delivery_fee: number; // in SYP
  commission_formula: {
    type: 'percentage' | 'fixed' | 'tiered';
    value: number; // e.g. 15% or 5,000 SYP
  };
  max_allowed_surcharge: number; // in SYP
  is_active: boolean;
  is_sandbox: boolean;
  effective_from: string;
  effective_to?: string;
}

export type OperationalStatus =
  | 'draft'
  | 'pending_pricing' // When zone pair is unpriced
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type FinancialStatus =
  | 'unpaid'
  | 'prepaid_covered'
  | 'settled'
  | 'partial_settlement'
  | 'disputed'
  | 'refunded';

export type CancellationStage =
  | 'none'
  | 'before_pickup'
  | 'after_pickup_pre_dest'
  | 'after_pickup_at_dest';

export type FeePayer = 'customer' | 'merchant' | 'free_promo';

export interface Order {
  id: string;
  tracking_code: string;
  merchant_id: string;
  captain_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat_lng?: [number, number];
  preferred_delivery_window?: string;
  pickup_zone_id: string;
  delivery_zone_id: string;
  service_type_id: string;
  package_description: string;
  weight_kg: number;
  is_fragile: boolean;
  is_sandbox: boolean;

  // Pricing Snapshot (Frozen at creation)
  pricing_rule_id: string | null;
  pricing_factors_applied: Record<string, any>;
  base_delivery_fee: number; // in SYP
  fee_surcharge: number; // in SYP
  surcharge_reason?: string;
  surcharge_authorized_by?: string;
  final_delivery_fee: number; // in SYP
  fee_payer: FeePayer;
  cod_amount: number; // Cash on delivery (goods value) in SYP
  exchange_rate_snapshot: number; // 1 USD = X SYP

  // Company Commission (Decoupled entitlement vs collection)
  company_commission_rate_applied: { type: string; value: number };
  company_commission_amount: number;
  commission_entitlement_status: 'pending_delivery' | 'earned' | 'void';
  commission_collection_status: 'uncollected' | 'collected' | 'on_hold';

  // Staged Cancellation & 24h Return
  cancellation_stage: CancellationStage;
  cancellation_reason?: string;
  cancellation_fee: number;
  return_cost: number;
  is_piggybacked_return: boolean;
  piggyback_order_id?: string;

  // Merchant Prepaid Balance
  paid_from_prepaid_balance: number;
  prepaid_deduction_id?: string;

  // Statuses
  operational_status: OperationalStatus;
  financial_status: FinancialStatus;
  proof_of_delivery_url?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  address: string;
  default_zone_id: string;
  prepaid_balance: number; // in SYP
  total_orders_count: number;
  is_sandbox: boolean;
}

export interface Captain {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'motorcycle' | 'car' | 'van';
  active_status: 'available' | 'busy' | 'off_duty';
  current_lat_lng?: [number, number];
  cash_on_hand: number; // Cash Escrow (COD collected) in SYP
  rating: number;
  assigned_orders_count: number;
  is_sandbox: boolean;
}

export interface DriverSettlementRequest {
  id: string;
  order_id: string;
  captain_id: string;
  merchant_id: string;
  total_cod_amount: number;
  driver_declared_available: number;
  driver_declared_deficit: number;
  driver_notes?: string;

  // Mortah review
  mortah_review_status: 'pending' | 'approved' | 'rejected';
  mortah_reviewed_by?: string;
  mortah_reviewed_at?: string;
  mortah_review_reason?: string;

  // Merchant confirmation
  merchant_confirmed_amount?: number;
  merchant_confirmed_at?: string;
  discrepancy_amount: number;
  discrepancy_status: 'none' | 'discrepancy_investigation' | 'confirmed';

  // Final Liability State
  liability_status: 'unconfirmed' | 'confirmed_on_driver' | 'transferred_to_mortah' | 'settled';
  debt_transfer_record_id?: string;
  created_at: string;
}

export type DebtOrigin =
  | 'manual_admin'
  | 'operational_disbursement'
  | 'unpaid_delivery_fee'
  | 'driver_deficit_transferred'
  | 'cancellation_penalty';

export interface FinancialDebt {
  id: string;
  debt_origin: DebtOrigin;
  debtor_type: 'merchant' | 'driver' | 'company';
  debtor_id: string;
  debtor_name: string;
  creditor_type: 'company' | 'merchant' | 'driver';
  creditor_id: string;
  creditor_name: string;
  amount: number; // in SYP
  currency: 'SYP';
  exchange_rate_snapshot: number;
  related_order_id?: string;
  reason_code: string;
  notes: string;
  settlement_status: 'active' | 'partially_settled' | 'settled' | 'reversed';
  created_by: string;
  created_at: string;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name_ar: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

export interface JournalItem {
  id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  party_type?: 'merchant' | 'captain' | 'company_vault';
  party_id?: string;
  party_name?: string;
}

export interface JournalEntry {
  id: string;
  entry_number: number;
  transaction_date: string;
  description_ar: string;
  related_order_id?: string;
  is_reversal: boolean;
  reversed_entry_id?: string;
  reversal_reason?: string;
  items: JournalItem[];
  created_by: string;
  is_sandbox: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name_ar: string;
  merchant_id: string;
  merchant_name: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  location_rack: string;
  unit: string;
  is_sandbox: boolean;
}
