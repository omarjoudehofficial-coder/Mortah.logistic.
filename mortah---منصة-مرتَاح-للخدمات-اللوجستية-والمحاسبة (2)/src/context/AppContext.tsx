/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Order,
  PricingRule,
  Merchant,
  Captain,
  Zone,
  ServiceType,
  DriverSettlementRequest,
  FinancialDebt,
  JournalEntry,
  InventoryItem,
  CancellationStage,
  OperationalStatus,
} from '../types';
import {
  INITIAL_ZONES,
  INITIAL_SERVICE_TYPES,
  INITIAL_MERCHANTS,
  INITIAL_CAPTAINS,
  INITIAL_PRICING_RULES,
  INITIAL_ORDERS,
  INITIAL_SETTLEMENT_REQUESTS,
  INITIAL_FINANCIAL_DEBTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_INVENTORY_ITEMS,
} from '../data/mockData';

export type UserRole =
  | 'admin'
  | 'merchant'
  | 'captain'
  | 'customer'
  | 'accounting'
  | 'pricing'
  | 'inventory';

interface PriceCalculationResult {
  rule: PricingRule | null;
  baseDeliveryFee: number;
  commissionAmount: number;
  commissionRate: { type: string; value: number };
  maxAllowedSurcharge: number;
  isUnpriced: boolean;
}

interface AppContextType {
  // Navigation & Role
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isSandboxMode: boolean;
  toggleSandboxMode: () => void;
  purgeSandboxData: () => void;
  resetSandboxToDefaults: () => void;

  // Selected Entities
  currentMerchantId: string;
  setCurrentMerchantId: (id: string) => void;
  currentCaptainId: string;
  setCurrentCaptainId: (id: string) => void;
  customerTrackingQuery: string;
  setCustomerTrackingQuery: (code: string) => void;

  // Data Collections
  zones: Zone[];
  serviceTypes: ServiceType[];
  merchants: Merchant[];
  captains: Captain[];
  pricingRules: PricingRule[];
  orders: Order[];
  settlementRequests: DriverSettlementRequest[];
  financialDebts: FinancialDebt[];
  journalEntries: JournalEntry[];
  inventoryItems: InventoryItem[];

  // Calculation & Business Handlers
  calculatePrice: (
    pickupZoneId: string,
    deliveryZoneId: string,
    serviceTypeId: string,
    merchantId: string,
    weightKg?: number
  ) => PriceCalculationResult;

  createOrder: (orderData: Partial<Order>, usePrepaidAmount?: number) => { success: boolean; orderId?: string; error?: string };
  overrideOrderPricing: (orderId: string, finalFee: number, surcharge: number, reason: string, authorizedBy: string) => void;
  updateOperationalStatus: (orderId: string, newStatus: OperationalStatus, podUrl?: string, notes?: string) => void;
  cancelOrder: (orderId: string, stage: CancellationStage, reason: string) => void;

  // Driver-to-Merchant Settlement Workflow
  submitDriverSettlement: (orderId: string, declaredAvailable: number, declaredDeficit: number, notes?: string) => void;
  reviewDriverSettlement: (requestId: string, decision: 'approved' | 'rejected', reason: string, reviewer: string) => void;
  confirmMerchantSettlement: (requestId: string, confirmedAmount: number) => void;
  transferDriverDebtToMortah: (requestId: string) => void;

  // Pricing Matrix Management
  addPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  updatePricingRule: (id: string, rule: Partial<PricingRule>) => void;
  deletePricingRule: (id: string) => void;

  // Accounting & Debts
  createManualDebt: (debt: Omit<FinancialDebt, 'id' | 'created_at' | 'settlement_status'>) => void;
  reverseJournalEntry: (entryId: string, reason: string, user: string) => void;

  // Customer Self-Service
  updateCustomerLocationAndTime: (orderId: string, latLng: [number, number], preferredWindow: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(true);

  // Entities selection
  const [currentMerchantId, setCurrentMerchantId] = useState<string>('m-al-amal');
  const [currentCaptainId, setCurrentCaptainId] = useState<string>('c-ahmad-kurdi');
  const [customerTrackingQuery, setCustomerTrackingQuery] = useState<string>('MRT-88301');

  // Stored state with local storage hydration
  const [zones] = useState<Zone[]>(INITIAL_ZONES);
  const [serviceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);

  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    const saved = localStorage.getItem('mortah_merchants');
    return saved ? JSON.parse(saved) : INITIAL_MERCHANTS;
  });

  const [captains, setCaptains] = useState<Captain[]>(() => {
    const saved = localStorage.getItem('mortah_captains');
    return saved ? JSON.parse(saved) : INITIAL_CAPTAINS;
  });

  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => {
    const saved = localStorage.getItem('mortah_pricing_rules');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_RULES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('mortah_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [settlementRequests, setSettlementRequests] = useState<DriverSettlementRequest[]>(() => {
    const saved = localStorage.getItem('mortah_settlements');
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENT_REQUESTS;
  });

  const [financialDebts, setFinancialDebts] = useState<FinancialDebt[]>(() => {
    const saved = localStorage.getItem('mortah_debts');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_DEBTS;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('mortah_journal');
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_ENTRIES;
  });

  const [inventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('mortah_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_ITEMS;
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('mortah_merchants', JSON.stringify(merchants));
  }, [merchants]);

  useEffect(() => {
    localStorage.setItem('mortah_captains', JSON.stringify(captains));
  }, [captains]);

  useEffect(() => {
    localStorage.setItem('mortah_pricing_rules', JSON.stringify(pricingRules));
  }, [pricingRules]);

  useEffect(() => {
    localStorage.setItem('mortah_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mortah_settlements', JSON.stringify(settlementRequests));
  }, [settlementRequests]);

  useEffect(() => {
    localStorage.setItem('mortah_debts', JSON.stringify(financialDebts));
  }, [financialDebts]);

  useEffect(() => {
    localStorage.setItem('mortah_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  const toggleSandboxMode = () => {
    setIsSandboxMode((prev) => !prev);
  };

  const purgeSandboxData = () => {
    setOrders((prev) => prev.filter((o) => !o.is_sandbox));
    setPricingRules((prev) => prev.filter((r) => !r.is_sandbox));
    setFinancialDebts((prev) => prev.filter((d) => d.notes.indexOf('[SANDBOX]') === -1));
    setJournalEntries((prev) => prev.filter((j) => !j.is_sandbox));
  };

  const resetSandboxToDefaults = () => {
    setMerchants(INITIAL_MERCHANTS);
    setCaptains(INITIAL_CAPTAINS);
    setPricingRules(INITIAL_PRICING_RULES);
    setOrders(INITIAL_ORDERS);
    setSettlementRequests(INITIAL_SETTLEMENT_REQUESTS);
    setFinancialDebts(INITIAL_FINANCIAL_DEBTS);
    setJournalEntries(INITIAL_JOURNAL_ENTRIES);
  };

  /**
   * Flexible Pricing Engine with Strict Precedence:
   * Level 1: Merchant custom rule for specific service type and zone pair
   * Level 2: Merchant custom rule for zone pair
   * Level 3: General rule for specific service type and zone pair
   * Level 4: General rule for zone pair
   */
  const calculatePrice = (
    pickupZoneId: string,
    deliveryZoneId: string,
    serviceTypeId: string,
    merchantId: string,
    weightKg: number = 1
  ): PriceCalculationResult => {
    const activeRules = pricingRules.filter((r) => r.is_active);

    // 1. Level 1: Specific merchant + specific service + exact pair
    let match = activeRules.find(
      (r) =>
        r.merchant_id === merchantId &&
        r.pickup_zone_id === pickupZoneId &&
        r.delivery_zone_id === deliveryZoneId &&
        r.service_type_id === serviceTypeId
    );

    // 2. Level 2: Specific merchant + exact pair (any service)
    if (!match) {
      match = activeRules.find(
        (r) =>
          r.merchant_id === merchantId &&
          r.pickup_zone_id === pickupZoneId &&
          r.delivery_zone_id === deliveryZoneId
      );
    }

    // 3. Level 3: General rule + specific service + exact pair
    if (!match) {
      match = activeRules.find(
        (r) =>
          r.merchant_id === null &&
          r.pickup_zone_id === pickupZoneId &&
          r.delivery_zone_id === deliveryZoneId &&
          r.service_type_id === serviceTypeId
      );
    }

    // 4. Level 4: General rule + exact pair
    if (!match) {
      match = activeRules.find(
        (r) =>
          r.merchant_id === null &&
          r.pickup_zone_id === pickupZoneId &&
          r.delivery_zone_id === deliveryZoneId
      );
    }

    if (!match) {
      return {
        rule: null,
        baseDeliveryFee: 0,
        commissionAmount: 0,
        commissionRate: { type: 'unpriced', value: 0 },
        maxAllowedSurcharge: 0,
        isUnpriced: true,
      };
    }

    // Factor adjustment (weight)
    let calculatedBase = match.base_delivery_fee;
    if (match.criteria_factors.max_weight_kg && weightKg > match.criteria_factors.max_weight_kg) {
      const extraKg = weightKg - match.criteria_factors.max_weight_kg;
      calculatedBase += Math.ceil(extraKg) * 2000; // 2,000 SYP per extra kg
    }

    let calculatedCommission = 0;
    if (match.commission_formula.type === 'percentage') {
      calculatedCommission = Math.round((calculatedBase * match.commission_formula.value) / 100);
    } else {
      calculatedCommission = match.commission_formula.value;
    }

    return {
      rule: match,
      baseDeliveryFee: calculatedBase,
      commissionAmount: calculatedCommission,
      commissionRate: match.commission_formula,
      maxAllowedSurcharge: match.max_allowed_surcharge,
      isUnpriced: false,
    };
  };

  /**
   * Create an order with price snapshot & optional prepaid deduction
   */
  const createOrder = (
    orderData: Partial<Order>,
    usePrepaidAmount: number = 0
  ): { success: boolean; orderId?: string; error?: string } => {
    if (!orderData.merchant_id || !orderData.pickup_zone_id || !orderData.delivery_zone_id) {
      return { success: false, error: 'بيانات التاجر ومناطق الاستلام والتسليم إلزامية' };
    }

    const merchant = merchants.find((m) => m.id === orderData.merchant_id);
    if (!merchant) {
      return { success: false, error: 'التاجر غير موجود في النظام' };
    }

    // Check pricing
    const priceResult = calculatePrice(
      orderData.pickup_zone_id,
      orderData.delivery_zone_id,
      orderData.service_type_id || 'srv-standard',
      orderData.merchant_id,
      orderData.weight_kg || 1
    );

    let finalFee = priceResult.baseDeliveryFee;
    let operationalStatus: OperationalStatus = 'confirmed';

    if (priceResult.isUnpriced) {
      operationalStatus = 'pending_pricing';
      finalFee = 0;
    }

    // Prepaid deduction validation
    let prepaidApplied = 0;
    if (usePrepaidAmount > 0 && !priceResult.isUnpriced) {
      if (usePrepaidAmount > merchant.prepaid_balance) {
        return { success: false, error: `المبلغ المطلوب (${usePrepaidAmount.toLocaleString()} ل.س) يتجاوز رصيد التاجر المتاح (${merchant.prepaid_balance.toLocaleString()} ل.س)` };
      }
      prepaidApplied = Math.min(usePrepaidAmount, finalFee);
      // Deduct from merchant balance
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchant.id ? { ...m, prepaid_balance: m.prepaid_balance - prepaidApplied } : m
        )
      );
    }

    const newId = `ord-${Date.now().toString().slice(-6)}`;
    const trackingCode = `MRT-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: newId,
      tracking_code: trackingCode,
      merchant_id: orderData.merchant_id,
      captain_id: orderData.captain_id || null,
      customer_name: orderData.customer_name || 'عميل غير مسجل',
      customer_phone: orderData.customer_phone || '+963 900 000000',
      customer_address: orderData.customer_address || 'عنوان تفصيلي',
      customer_lat_lng: orderData.customer_lat_lng || [33.5138, 36.2765],
      preferred_delivery_window: orderData.preferred_delivery_window || 'خلال ساعات العمل الرسمية',
      pickup_zone_id: orderData.pickup_zone_id,
      delivery_zone_id: orderData.delivery_zone_id,
      service_type_id: orderData.service_type_id || 'srv-standard',
      package_description: orderData.package_description || 'طرد بضائع',
      weight_kg: orderData.weight_kg || 1,
      is_fragile: orderData.is_fragile || false,
      is_sandbox: isSandboxMode,

      // Price Snapshot
      pricing_rule_id: priceResult.rule ? priceResult.rule.id : null,
      pricing_factors_applied: {
        weight_kg: orderData.weight_kg || 1,
        rule_code: priceResult.rule ? priceResult.rule.rule_code : 'UNPRICED',
        service_type: orderData.service_type_id,
      },
      base_delivery_fee: priceResult.baseDeliveryFee,
      fee_surcharge: 0,
      final_delivery_fee: finalFee,
      fee_payer: orderData.fee_payer || 'customer',
      cod_amount: orderData.cod_amount || 0,
      exchange_rate_snapshot: 14850,

      // Commission Snapshot
      company_commission_rate_applied: priceResult.commissionRate,
      company_commission_amount: priceResult.commissionAmount,
      commission_entitlement_status: 'pending_delivery',
      commission_collection_status: 'uncollected',

      // Cancellation & Return
      cancellation_stage: 'none',
      cancellation_fee: 0,
      return_cost: 0,
      is_piggybacked_return: false,

      // Prepaid
      paid_from_prepaid_balance: prepaidApplied,

      operational_status: operationalStatus,
      financial_status: prepaidApplied >= finalFee ? 'prepaid_covered' : 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, orderId: newId };
  };

  /**
   * Override an unpriced or special order with mandatory reason
   */
  const overrideOrderPricing = (
    orderId: string,
    finalFee: number,
    surcharge: number,
    reason: string,
    authorizedBy: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          base_delivery_fee: finalFee - surcharge,
          fee_surcharge: surcharge,
          surcharge_reason: reason,
          surcharge_authorized_by: authorizedBy,
          final_delivery_fee: finalFee,
          operational_status: ord.operational_status === 'pending_pricing' ? 'confirmed' : ord.operational_status,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  /**
   * Move order through delivery pipeline & trigger balanced double-entry
   */
  const updateOperationalStatus = (
    orderId: string,
    newStatus: OperationalStatus,
    podUrl?: string,
    notes?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const updated: Order = {
          ...ord,
          operational_status: newStatus,
          proof_of_delivery_url: podUrl || ord.proof_of_delivery_url,
          delivery_notes: notes || ord.delivery_notes,
          updated_at: new Date().toISOString(),
        };

        if (newStatus === 'delivered') {
          updated.financial_status = 'settled';
          updated.commission_entitlement_status = 'earned';
          updated.commission_collection_status = 'collected';

          // Increase captain's cash on hand if COD
          if (ord.captain_id && ord.cod_amount > 0) {
            setCaptains((caps) =>
              caps.map((c) =>
                c.id === ord.captain_id
                  ? { ...c, cash_on_hand: c.cash_on_hand + ord.cod_amount }
                  : c
              )
            );
          }

          // Generate balanced double-entry accounting entry
          const captain = captains.find((c) => c.id === ord.captain_id);
          const merchant = merchants.find((m) => m.id === ord.merchant_id);

          const newEntry: JournalEntry = {
            id: `je-${Date.now()}`,
            entry_number: journalEntries.length + 1001,
            transaction_date: new Date().toISOString(),
            description_ar: `إثبات تسليم وتحصيل الشحنة رقم ${ord.tracking_code} للتاجر ${merchant?.business_name}`,
            related_order_id: ord.id,
            is_reversal: false,
            items: [
              {
                id: `ji-${Date.now()}-1`,
                account_code: '11200',
                account_name: `عهدة الكباتن النقدية (${captain?.name || 'كابتن'})`,
                debit: ord.cod_amount,
                credit: 0,
                party_type: 'captain',
                party_id: ord.captain_id || undefined,
                party_name: captain?.name,
              },
              {
                id: `ji-${Date.now()}-2`,
                account_code: '21100',
                account_name: `أمانات ذمم التجار الدائنة (${merchant?.business_name || 'تاجر'})`,
                debit: 0,
                credit: ord.cod_amount,
                party_type: 'merchant',
                party_id: ord.merchant_id,
                party_name: merchant?.business_name,
              },
            ],
            created_by: 'النظام المحاسبي الآلي',
            is_sandbox: isSandboxMode,
          };

          setJournalEntries((jEntries) => [newEntry, ...jEntries]);
        }

        return updated;
      })
    );
  };

  /**
   * Cancellation with Staged rules and 24h Merchant Piggybacked Return
   */
  const cancelOrder = (orderId: string, stage: CancellationStage, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        let fee = 0;
        let returnCost = 0;
        let isPiggybacked = false;
        let piggybackId: string | undefined = undefined;

        if (stage === 'before_pickup') {
          // Rule: Cancellation before driver pickup incurs ZERO delivery fee
          fee = 0;
          returnCost = 0;
        } else {
          // Rule: After pickup, fee depends on stage & 24h subsequent trip
          if (stage === 'after_pickup_pre_dest') {
            fee = Math.round(ord.final_delivery_fee * 0.5); // Partial staged fee
          } else {
            fee = ord.final_delivery_fee; // Full delivery fee after reaching destination
          }

          // Check if merchant has another active/upcoming trip within 24h
          const merchantOtherOrder = prev.find(
            (o) =>
              o.id !== orderId &&
              o.merchant_id === ord.merchant_id &&
              o.operational_status !== 'cancelled' &&
              o.operational_status !== 'delivered'
          );

          if (merchantOtherOrder) {
            isPiggybacked = true;
            piggybackId = merchantOtherOrder.id;
            returnCost = 0; // Free return bundled with next courier visit!
          } else {
            isPiggybacked = false;
            returnCost = 10000; // Standalone return trip fee
          }
        }

        return {
          ...ord,
          operational_status: 'cancelled',
          cancellation_stage: stage,
          cancellation_reason: reason,
          cancellation_fee: fee,
          return_cost: returnCost,
          is_piggybacked_return: isPiggybacked,
          piggyback_order_id: piggybackId,
          // Commercial rule: Cancellation doesn't void Mortah's entitlement,
          // but collection remains 'uncollected' pending administrative settlement
          commission_entitlement_status: stage === 'before_pickup' ? 'void' : 'earned',
          commission_collection_status: 'uncollected',
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  /**
   * Driver submits shortage/deficit request
   */
  const submitDriverSettlement = (
    orderId: string,
    declaredAvailable: number,
    declaredDeficit: number,
    notes?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.captain_id) return;

    const newRequest: DriverSettlementRequest = {
      id: `set-req-${Date.now().toString().slice(-5)}`,
      order_id: orderId,
      captain_id: order.captain_id,
      merchant_id: order.merchant_id,
      total_cod_amount: order.cod_amount,
      driver_declared_available: declaredAvailable,
      driver_declared_deficit: declaredDeficit,
      driver_notes: notes,
      mortah_review_status: 'pending', // Awaiting company decision
      discrepancy_amount: 0,
      discrepancy_status: 'none',
      liability_status: 'unconfirmed',
      created_at: new Date().toISOString(),
    };

    setSettlementRequests((prev) => [newRequest, ...prev]);
  };

  /**
   * Mortah admin approves or rejects the driver's request
   */
  const reviewDriverSettlement = (
    requestId: string,
    decision: 'approved' | 'rejected',
    reason: string,
    reviewer: string
  ) => {
    setSettlementRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          mortah_review_status: decision,
          mortah_reviewed_by: reviewer,
          mortah_reviewed_at: new Date().toISOString(),
          mortah_review_reason: reason,
        };
      })
    );
  };

  /**
   * Merchant confirms actual amount received, checking for discrepancy
   */
  const confirmMerchantSettlement = (requestId: string, confirmedAmount: number) => {
    setSettlementRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        // Discrepancy calculation: What driver claimed he gave + confirmed
        const difference = req.total_cod_amount - (confirmedAmount + req.driver_declared_deficit);

        let discrepancyStatus: 'none' | 'discrepancy_investigation' | 'confirmed' = 'confirmed';
        let liabilityStatus = req.liability_status;

        if (difference !== 0) {
          discrepancyStatus = 'discrepancy_investigation'; // Sent to special audit
        } else {
          liabilityStatus = 'confirmed_on_driver'; // Settled onto driver as active debt
        }

        return {
          ...req,
          merchant_confirmed_amount: confirmedAmount,
          merchant_confirmed_at: new Date().toISOString(),
          discrepancy_amount: difference,
          discrepancy_status: discrepancyStatus,
          liability_status: liabilityStatus,
        };
      })
    );
  };

  /**
   * Transfer driver liability to Mortah (Company assumes liability to merchant, driver owes Mortah)
   */
  const transferDriverDebtToMortah = (requestId: string) => {
    const req = settlementRequests.find((r) => r.id === requestId);
    if (!req) return;

    const merchant = merchants.find((m) => m.id === req.merchant_id);
    const captain = captains.find((c) => c.id === req.captain_id);

    // 1. Create debt on driver in favor of Mortah
    const debtId = `deb-${Date.now().toString().slice(-5)}`;
    const newDebt: FinancialDebt = {
      id: debtId,
      debt_origin: 'driver_deficit_transferred',
      debtor_type: 'driver',
      debtor_id: req.captain_id,
      debtor_name: captain?.name || 'كابتن',
      creditor_type: 'company',
      creditor_id: 'comp-mortah',
      creditor_name: 'شركة مرتَاح للخدمات اللوجستية',
      amount: req.driver_declared_deficit,
      currency: 'SYP',
      exchange_rate_snapshot: 14850,
      related_order_id: req.order_id,
      reason_code: 'DRIVER_ADVANCE_ASSUMPTION',
      notes: `تحويل عجز ثمن الشحنة المستحقة للتاجر ${merchant?.business_name} إلى ذمة مستحقة لمرتاح`,
      settlement_status: 'active',
      created_by: 'المحاسب المالي',
      created_at: new Date().toISOString(),
    };

    setFinancialDebts((prev) => [newDebt, ...prev]);

    // 2. Update settlement request state
    setSettlementRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              liability_status: 'transferred_to_mortah',
              debt_transfer_record_id: debtId,
            }
          : r
      )
    );

    // 3. Post double-entry journal voucher
    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entry_number: journalEntries.length + 1001,
      transaction_date: new Date().toISOString(),
      description_ar: `إثبات تحويل ذمة عجز السائق ${captain?.name} لصالح التاجر ${merchant?.business_name} وتحمل مرتاح للالتزام`,
      related_order_id: req.order_id,
      is_reversal: false,
      items: [
        {
          id: `ji-${Date.now()}-1`,
          account_code: '11350',
          account_name: 'ذمم مستحقة على السائقين (تحويل عجز)',
          debit: req.driver_declared_deficit,
          credit: 0,
          party_type: 'captain',
          party_id: req.captain_id,
          party_name: captain?.name,
        },
        {
          id: `ji-${Date.now()}-2`,
          account_code: '21150',
          account_name: 'أمانات مستحقة للتجار (تحمل شركة مرتاح)',
          debit: 0,
          credit: req.driver_declared_deficit,
          party_type: 'merchant',
          party_id: req.merchant_id,
          party_name: merchant?.business_name,
        },
      ],
      created_by: 'المحاسب المالي',
      is_sandbox: isSandboxMode,
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
  };

  // Pricing Rule Management
  const addPricingRule = (rule: Omit<PricingRule, 'id'>) => {
    const newRule: PricingRule = {
      ...rule,
      id: `pr-${Date.now().toString().slice(-6)}`,
      is_sandbox: isSandboxMode,
    };
    setPricingRules((prev) => [newRule, ...prev]);
  };

  const updatePricingRule = (id: string, rule: Partial<PricingRule>) => {
    setPricingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...rule } : r))
    );
  };

  const deletePricingRule = (id: string) => {
    setPricingRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Debts and Accounting
  const createManualDebt = (debt: Omit<FinancialDebt, 'id' | 'created_at' | 'settlement_status'>) => {
    const newDebt: FinancialDebt = {
      ...debt,
      id: `deb-${Date.now().toString().slice(-5)}`,
      settlement_status: 'active',
      created_at: new Date().toISOString(),
    };
    setFinancialDebts((prev) => [newDebt, ...prev]);
  };

  const reverseJournalEntry = (entryId: string, reason: string, user: string) => {
    const original = journalEntries.find((j) => j.id === entryId);
    if (!original || original.is_reversal) return;

    const reversalItems = original.items.map((item) => ({
      ...item,
      id: `rev-${item.id}`,
      debit: item.credit, // Invert
      credit: item.debit, // Invert
    }));

    const reversalEntry: JournalEntry = {
      id: `je-rev-${Date.now()}`,
      entry_number: journalEntries.length + 1001,
      transaction_date: new Date().toISOString(),
      description_ar: `قيد عكسي تصحيحي للقيد رقم #${original.entry_number} - سبب: ${reason}`,
      related_order_id: original.related_order_id,
      is_reversal: true,
      reversed_entry_id: original.id,
      reversal_reason: reason,
      items: reversalItems,
      created_by: user,
      is_sandbox: original.is_sandbox,
    };

    setJournalEntries((prev) => [reversalEntry, ...prev]);
  };

  // Customer Self-Service
  const updateCustomerLocationAndTime = (
    orderId: string,
    latLng: [number, number],
    preferredWindow: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          customer_lat_lng: latLng,
          preferred_delivery_window: preferredWindow,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        isSandboxMode,
        toggleSandboxMode,
        purgeSandboxData,
        resetSandboxToDefaults,

        currentMerchantId,
        setCurrentMerchantId,
        currentCaptainId,
        setCurrentCaptainId,
        customerTrackingQuery,
        setCustomerTrackingQuery,

        zones,
        serviceTypes,
        merchants,
        captains,
        pricingRules,
        orders,
        settlementRequests,
        financialDebts,
        journalEntries,
        inventoryItems,

        calculatePrice,
        createOrder,
        overrideOrderPricing,
        updateOperationalStatus,
        cancelOrder,

        submitDriverSettlement,
        reviewDriverSettlement,
        confirmMerchantSettlement,
        transferDriverDebtToMortah,

        addPricingRule,
        updatePricingRule,
        deletePricingRule,

        createManualDebt,
        reverseJournalEntry,
        updateCustomerLocationAndTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
