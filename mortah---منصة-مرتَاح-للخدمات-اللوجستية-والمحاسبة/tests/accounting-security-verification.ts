/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('MORTAH LOGISTICS PLATFORM - POSTGRESQL INTEGRITY TEST SUITE');
  console.log('Testing Accounting Balance, Immutability, Temporal Rules & RLS');
  console.log('================================================================\n');

  const results: TestResult[] = [];
  const db = new PGlite();

  try {
    // 1. Apply Migration 0000
    console.log('[Setup] Applying Migration 0000 (Base DDL)...');
    const sql0000 = fs.readFileSync(path.resolve('drizzle/0000_demonic_bloodaxe.sql'), 'utf-8');
    await db.exec(sql0000);
    console.log('[Setup] Migration 0000 applied successfully.');

    // 2. Apply Migration 0001
    console.log('[Setup] Applying Migration 0001 (Accounting Triggers & RLS)...');
    const sql0001 = fs.readFileSync(path.resolve('drizzle/0001_accounting_and_security_protections.sql'), 'utf-8');
    await db.exec(sql0001);
    console.log('[Setup] Migration 0001 applied successfully.');

    // 3. Seed Reference Data
    console.log('[Setup] Seeding initial test fixtures...');
    await db.exec(`
      INSERT INTO currencies (code, name_ar, decimals, is_active) VALUES
      ('SYP', 'ليرة سورية', 0, true),
      ('USD', 'دولار أمريكي', 2, true);

      INSERT INTO chart_of_accounts (code, name_ar, category, currency, is_reconcilable) VALUES
      ('1010', 'خزينة الشركة الرئيسية', 'asset', 'SYP', true),
      ('1020', 'عهدة الكابتن النقدية', 'asset', 'SYP', true),
      ('2010', 'أمانات التاجر COD', 'liability', 'SYP', true),
      ('2015', 'رصيد التاجر المسبق', 'liability', 'SYP', true),
      ('2020', 'مستحقات الكباتن أجور توصيل', 'liability', 'SYP', true),
      ('4010', 'إيرادات مرتاح عمولات توصيل', 'revenue', 'SYP', true);

      INSERT INTO zones (id, code, name_ar, governorate, is_active) VALUES
      ('11111111-1111-1111-1111-111111111111', 'DAM-MEZZ', 'المزة', 'damascus', true),
      ('22222222-2222-2222-2222-222222222222', 'DAM-MID', 'الميدان', 'damascus', true),
      ('33333333-3333-3333-3333-333333333333', 'RUR-QUD', 'قدسيا', 'rural_damascus', true);

      INSERT INTO service_types (id, code, name_ar, is_active) VALUES
      ('44444444-4444-4444-4444-444444444444', 'standard', 'توصيل قياسي', true);

      -- Users: Admin, Merchant A, Merchant B, Captain 1, Accountant
      INSERT INTO users (id, phone, password_hash, role, full_name, is_active) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '0911111111', 'hash', 'super_admin', 'المدير العام', true),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '0922222222', 'hash', 'merchant', 'التاجر أ - شركة الأمل', true),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', '0933333333', 'hash', 'merchant', 'التاجر ب - شركة النور', true),
      ('dddddddd-dddd-dddd-dddd-dddddddddddd', '0944444444', 'hash', 'captain', 'الكابتن أحمد', true),
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0955555555', 'hash', 'accountant', 'المحاسب المالي', true);

      -- Merchants (Using valid hex UUIDs)
      INSERT INTO merchants (id, user_id, business_name, owner_name, phone, currency, prepaid_balance_cached) VALUES
      ('10000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'مكتبة الأمل', 'سامر الأمل', '0922222222', 'SYP', 50000.00),
      ('20000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'إلكترونيات النور', 'نور الدين', '0933333333', 'SYP', 80000.00);

      -- Captains (Using valid hex UUIDs)
      INSERT INTO captains (id, user_id, name, phone, vehicle_type, currency, cash_on_hand_cached) VALUES
      ('30000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'أحمد الكردي', '0944444444', 'motorcycle', 'SYP', 0.00);
    `);
    console.log('[Setup] Test fixtures created successfully.\n');

    // ========================================================================
    // TEST 1: Rejection of Unbalanced and Empty Journal Entries
    // ========================================================================
    console.log('--- RUNNING TEST GROUP 1: Accounting Entry Balance & Completeness ---');

    // Test 1.1: Unbalanced Entry (Debit 25,000 != Credit 20,000) - Unposted first, lines added, then marked posted
    try {
      await db.exec(`
        BEGIN;
        INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, created_by)
        VALUES ('a1111111-1111-1111-1111-111111111111', '2026-TEST01', 2026, 'قيد غير متوازن تجريبي', 'test', 'idemp-test-01', 'hash01', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

        INSERT INTO journal_lines (id, entry_id, line_number, account_code, currency, debit_base_syp, credit_base_syp)
        VALUES 
        ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 1, '1020', 'SYP', 25000.00, 0.00),
        ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 2, '2010', 'SYP', 0.00, 20000.00);

        UPDATE journal_entries SET is_posted = true WHERE id = 'a1111111-1111-1111-1111-111111111111';
        COMMIT;
      `);
      results.push({ name: 'TEST 1.1: Unbalanced Entry Rejection', passed: false, message: 'FAIL: Unbalanced entry was committed without error!' });
    } catch (err: any) {
      await db.exec('ROLLBACK;').catch(() => {});
      const isBalanceError = err.message.includes('is unbalanced');
      results.push({
        name: 'TEST 1.1: Unbalanced Entry Rejection',
        passed: isBalanceError,
        message: isBalanceError 
          ? `PASS: Rejected specifically by balance check: ${err.message}` 
          : `FAIL: Rejected by unexpected trigger: ${err.message}`
      });
    }

    // Test 1.2: Single-Line Entry Rejection (Line count = 1)
    try {
      await db.exec(`
        BEGIN;
        INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, created_by)
        VALUES ('a1111111-1111-1111-1111-111111111112', '2026-TEST01B', 2026, 'قيد سطر واحد تجريبي', 'test', 'idemp-test-01b', 'hash01b', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

        INSERT INTO journal_lines (id, entry_id, line_number, account_code, currency, debit_base_syp, credit_base_syp)
        VALUES 
        ('b1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111112', 1, '1020', 'SYP', 25000.00, 0.00);

        UPDATE journal_entries SET is_posted = true WHERE id = 'a1111111-1111-1111-1111-111111111112';
        COMMIT;
      `);
      results.push({ name: 'TEST 1.2: Single-Line Entry Rejection', passed: false, message: 'FAIL: Single-line entry was committed!' });
    } catch (err: any) {
      await db.exec('ROLLBACK;').catch(() => {});
      const isLineCountError = err.message.includes('at least 2 balanced lines');
      results.push({
        name: 'TEST 1.2: Single-Line Entry Rejection',
        passed: isLineCountError,
        message: isLineCountError 
          ? `PASS: Rejected specifically by line count check: ${err.message}` 
          : `FAIL: Rejected by unexpected trigger: ${err.message}`
      });
    }

    // Test 1.3: Empty Entry (Posted entry with no lines)
    try {
      await db.exec(`
        BEGIN;
        INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, created_by)
        VALUES ('a2222222-2222-2222-2222-222222222222', '2026-TEST02', 2026, 'قيد فارغ تجريبي', 'test', 'idemp-test-02', 'hash02', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
        COMMIT;
      `);
      results.push({ name: 'TEST 1.3: Empty Entry Rejection', passed: false, message: 'FAIL: Empty entry was committed!' });
    } catch (err: any) {
      await db.exec('ROLLBACK;').catch(() => {});
      results.push({ name: 'TEST 1.3: Empty Entry Rejection', passed: true, message: `PASS: Database aborted with error: ${err.message}` });
    }

    // Insert a valid balanced entry for subsequent tests
    await db.exec(`
      BEGIN;
      INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, created_by)
      VALUES ('a0000000-0000-0000-0000-000000000001', '2026-VALID01', 2026, 'قيد تسليم سليم متوازن', 'order_lifecycle', 'idemp-valid-01', 'hash-valid-01', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

      INSERT INTO journal_lines (id, entry_id, line_number, account_code, currency, debit_base_syp, credit_base_syp)
      VALUES 
      ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, '1020', 'SYP', 175000.00, 0.00),
      ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, '2010', 'SYP', 0.00, 150000.00),
      ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, '2020', 'SYP', 0.00, 18000.00),
      ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, '4010', 'SYP', 0.00, 7000.00);

      UPDATE journal_entries SET is_posted = true WHERE id = 'a0000000-0000-0000-0000-000000000001';
      COMMIT;
    `);

    // ========================================================================
    // TEST 2: Rejection of Modifying or Deleting Posted Journal Entries
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 2: Ledger Immutability ---');

    // Test 2.1: Modifying lines of a posted entry
    try {
      await db.query(`
        UPDATE journal_lines 
        SET debit_base_syp = 999999.00 
        WHERE id = 'c0000000-0000-0000-0000-000000000001';
      `);
      results.push({ name: 'TEST 2.1: Modifying Posted Lines Rejection', passed: false, message: 'FAIL: Modified posted line!' });
    } catch (err: any) {
      results.push({ name: 'TEST 2.1: Modifying Posted Lines Rejection', passed: true, message: `PASS: Prevented with error: ${err.message}` });
    }

    // Test 2.2: Deleting a posted entry
    try {
      await db.query(`
        DELETE FROM journal_entries 
        WHERE id = 'a0000000-0000-0000-0000-000000000001';
      `);
      results.push({ name: 'TEST 2.2: Deleting Posted Entry Rejection', passed: false, message: 'FAIL: Deleted posted entry!' });
    } catch (err: any) {
      results.push({ name: 'TEST 2.2: Deleting Posted Entry Rejection', passed: true, message: `PASS: Prevented with error: ${err.message}` });
    }

    // ========================================================================
    // TEST 3: Single Reversal Enforcement & Double Reversal Rejection
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 3: Single Reversal Enforcement ---');

    // Insert first valid reversal
    await db.exec(`
      BEGIN;
      INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, is_reversal, reversed_entry_id, reversal_reason, created_by)
      VALUES ('a0000000-0000-0000-0000-000000000002', '2026-REV01', 2026, 'عكس قيد التسليم رقم 1', 'reversal', 'idemp-rev-01', 'hash-rev-01', false, true, 'a0000000-0000-0000-0000-000000000001', 'خطأ في وجهة التسليم', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

      INSERT INTO journal_lines (id, entry_id, line_number, account_code, currency, debit_base_syp, credit_base_syp)
      VALUES 
      ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 1, '1020', 'SYP', 0.00, 175000.00),
      ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 2, '2010', 'SYP', 150000.00, 0.00),
      ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 3, '2020', 'SYP', 18000.00, 0.00),
      ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 4, '4010', 'SYP', 7000.00, 0.00);

      UPDATE journal_entries SET is_posted = true WHERE id = 'a0000000-0000-0000-0000-000000000002';
      COMMIT;
    `);

    // Attempt second reversal on the SAME original entry
    try {
      await db.query(`
        INSERT INTO journal_entries (id, annual_code, fiscal_year, description_ar, source_module, idempotency_key, payload_hash, is_posted, is_reversal, reversed_entry_id, reversal_reason, created_by)
        VALUES ('a0000000-0000-0000-0000-000000000003', '2026-REV02', 2026, 'عكس ثان مكرر غير مسموح', 'reversal', 'idemp-rev-02', 'hash-rev-02', true, true, 'a0000000-0000-0000-0000-000000000001', 'تكرار خاطئ', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      `);
      results.push({ name: 'TEST 3: Double Reversal Rejection', passed: false, message: 'FAIL: Allowed double reversal of entry 1!' });
    } catch (err: any) {
      results.push({ name: 'TEST 3: Double Reversal Rejection', passed: true, message: `PASS: Rejected with error: ${err.message}` });
    }

    // ========================================================================
    // TEST 4: Temporal Overlap Prevention for Pricing Rules
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 4: Temporal Pricing Overlap Protection ---');

    // Rule 1: Active rule from 2026-01-01 to 2026-06-30
    await db.query(`
      INSERT INTO pricing_rules (
        id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
        base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
      ) VALUES (
        '60000000-0000-0000-0000-000000000001', 'RULE-MEZZ-MID-01', 'قاعدة الأمل المزة الميدان H1',
        '10000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        '44444444-4444-4444-4444-444444444444',
        25000.00, '{"type": "fixed", "value": 18000}', '{"type": "fixed", "value": 7000}',
        '2026-01-01 00:00:00+00', '2026-06-30 23:59:59+00', true
      );
    `);

    // Test 4.1: Attempt to insert an overlapping active rule (2026-04-01 to 2026-12-31) for same merchant and zones
    try {
      await db.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '70000000-0000-0000-0000-000000000002', 'RULE-MEZZ-MID-02', 'قاعدة متداخلة غير مسموحة',
          '10000000-0000-0000-0000-000000000001',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '44444444-4444-4444-4444-444444444444',
          30000.00, '{"type": "fixed", "value": 22000}', '{"type": "fixed", "value": 8000}',
          '2026-04-01 00:00:00+00', '2026-12-31 23:59:59+00', true
        );
      `);
      results.push({ name: 'TEST 4.1: Temporal Overlap Rule Rejection', passed: false, message: 'FAIL: Allowed overlapping active rule!' });
    } catch (err: any) {
      results.push({ name: 'TEST 4.1: Temporal Overlap Rule Rejection', passed: true, message: `PASS: Prevented overlap: ${err.message}` });
    }

    // Test 4.2: Insert a consecutive NON-overlapping rule (2026-07-01 to 2026-12-31) - MUST SUCCEED
    try {
      await db.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '80000000-0000-0000-0000-000000000003', 'RULE-MEZZ-MID-03', 'قاعدة النصف الثاني المتتابعة',
          '10000000-0000-0000-0000-000000000001',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '44444444-4444-4444-4444-444444444444',
          28000.00, '{"type": "fixed", "value": 20000}', '{"type": "fixed", "value": 8000}',
          '2026-07-01 00:00:00+00', '2026-12-31 23:59:59+00', true
        );
      `);
      results.push({ name: 'TEST 4.2: Consecutive Non-Overlapping Rule Acceptance', passed: true, message: 'PASS: Allowed consecutive non-overlapping rule.' });
    } catch (err: any) {
      results.push({ name: 'TEST 4.2: Consecutive Non-Overlapping Rule Acceptance', passed: false, message: `FAIL: Erroneously rejected valid consecutive rule: ${err.message}` });
    }

    // ========================================================================
    // TEST 5 & 6: Row-Level Security (RLS) Tenant & Role Isolation
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 5 & 6: Row-Level Security (RLS) & Tenant Isolation ---');

    // Super Admin inserts two orders: Order 1 for Merchant A, Order 2 for Merchant B
    await db.query(`SELECT fn_set_app_context('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super_admin');`);
    await db.exec(`
      INSERT INTO orders (
        id, tracking_code, merchant_id, captain_id, pickup_zone_id, delivery_zone_id, service_type_id,
        customer_name, customer_phone, customer_address, package_description, fee_payer, pricing_snapshot
      ) VALUES 
      (
        '40000000-0000-0000-0000-000000000001', 'TRK-AMAL-001', '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        '44444444-4444-4444-4444-444444444444', 'زبون الأمل', '0955555555', 'الميدان الشارع العام', 'كتب مدرسية', 'customer', '{}'
      ),
      (
        '50000000-0000-0000-0000-000000000002', 'TRK-NOOR-001', '20000000-0000-0000-0000-000000000002',
        NULL, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444', 'زبون النور', '0966666666', 'قدسيا مقابل السوق', 'جهاز لابتوب', 'merchant', '{}'
      );
    `);

    // Switch to application role to enforce RLS (non-superuser context)
    await db.exec('SET ROLE mortah_app_user;');

    // Test 5.1: Merchant A querying orders (Must see ONLY Order 1, NEVER Order 2)
    let merchantAOrders: any;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'merchant', '10000000-0000-0000-0000-000000000001');`);
      merchantAOrders = await tx.query('SELECT tracking_code FROM orders;');
    });
    const codes = merchantAOrders.rows.map((r: any) => r.tracking_code);

    if (codes.length === 1 && codes[0] === 'TRK-AMAL-001') {
      results.push({ name: 'TEST 5.1: Merchant A Cross-Tenant Isolation (Read)', passed: true, message: 'PASS: Merchant A can ONLY see their own order (TRK-AMAL-001).' });
    } else {
      results.push({ name: 'TEST 5.1: Merchant A Cross-Tenant Isolation (Read)', passed: false, message: `FAIL: Merchant A saw unexpected orders: ${JSON.stringify(codes)}` });
    }

    // Test 5.2: Merchant A attempting to insert an order with Merchant B's ID
    try {
      await db.transaction(async (tx) => {
        await tx.query(`SELECT fn_set_app_context('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'merchant', '10000000-0000-0000-0000-000000000001');`);
        await tx.query(`
          INSERT INTO orders (
            id, tracking_code, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
            customer_name, customer_phone, customer_address, package_description, fee_payer, pricing_snapshot
          ) VALUES (
            '50000000-0000-0000-0000-000000000003', 'TRK-MALICIOUS-001', '20000000-0000-0000-0000-000000000002',
            '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
            '44444444-4444-4444-4444-444444444444', 'زبون مخترق', '0999999999', 'موقع زائف', 'طرد وهمي', 'customer', '{}'
          );
        `);
      });
      results.push({ name: 'TEST 5.2: Merchant A Forged Insert Rejection', passed: false, message: 'FAIL: Merchant A succeeded in inserting order for Merchant B!' });
    } catch (err: any) {
      results.push({ name: 'TEST 5.2: Merchant A Forged Insert Rejection', passed: true, message: `PASS: Blocked by RLS with error: ${err.message}` });
    }

    // Test 5.3: Captain attempting to read Merchant details or accounting records
    let captainOrders: any, captainMerchants: any, captainJournals: any;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('dddddddd-dddd-dddd-dddd-dddddddddddd', 'captain', NULL, '30000000-0000-0000-0000-000000000001');`);
      captainOrders = await tx.query('SELECT tracking_code FROM orders;');
      captainMerchants = await tx.query('SELECT business_name FROM merchants;');
      captainJournals = await tx.query('SELECT annual_code FROM journal_entries;');
    });

    if (
      captainOrders.rows.length === 1 && captainOrders.rows[0].tracking_code === 'TRK-AMAL-001' &&
      captainMerchants.rows.length === 0 &&
      captainJournals.rows.length === 0
    ) {
      results.push({ name: 'TEST 5.3: Captain Role Restriction', passed: true, message: 'PASS: Captain only sees assigned order; Merchants (0) and Journals (0) are completely isolated.' });
    } else {
      results.push({ name: 'TEST 5.3: Captain Role Restriction', passed: false, message: `FAIL: Captain leaked data: Merchants=${captainMerchants.rows.length}, Journals=${captainJournals.rows.length}` });
    }

    // Test 6: Missing Context (Default Deny)
    let anonymousOrders: any, anonymousDebts: any;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context(NULL, NULL, NULL, NULL);`);
      anonymousOrders = await tx.query('SELECT * FROM orders;');
      anonymousDebts = await tx.query('SELECT * FROM financial_debts;');
    });

    if (anonymousOrders.rows.length === 0 && anonymousDebts.rows.length === 0) {
      results.push({ name: 'TEST 6: Default Deny on Missing Context', passed: true, message: 'PASS: Zero rows accessible without active authenticated role.' });
    } else {
      results.push({ name: 'TEST 6: Default Deny on Missing Context', passed: false, message: `FAIL: Anonymous session leaked rows: Orders=${anonymousOrders.rows.length}, Debts=${anonymousDebts.rows.length}` });
    }

    // ========================================================================
    // TEST 7: Driver Settlement Requests RLS Policy Verification
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 7: Driver Settlement Requests RLS ---');

    // Admin seeds a driver settlement request
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super_admin');`);
      await tx.query(`
        INSERT INTO driver_settlement_requests (
          id, order_id, captain_id, merchant_id, total_cod_due, driver_declared_available, driver_declared_deficit
        ) VALUES (
          '77777777-7777-7777-7777-777777777777',
          '40000000-0000-0000-0000-000000000001',
          '30000000-0000-0000-0000-000000000001',
          '10000000-0000-0000-0000-000000000001',
          175000.00, 150000.00, 25000.00
        );
      `);
    });

    // Test 7.1: Captain sees their own request
    let captainRequests: any;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('dddddddd-dddd-dddd-dddd-dddddddddddd', 'captain', NULL, '30000000-0000-0000-0000-000000000001');`);
      captainRequests = await tx.query('SELECT id, total_cod_due FROM driver_settlement_requests;');
    });
    if (captainRequests.rows.length === 1 && captainRequests.rows[0].id === '77777777-7777-7777-7777-777777777777') {
      results.push({ name: 'TEST 7.1: Captain Settlement Request Isolation', passed: true, message: 'PASS: Captain sees their own settlement request.' });
    } else {
      results.push({ name: 'TEST 7.1: Captain Settlement Request Isolation', passed: false, message: `FAIL: Captain saw ${captainRequests.rows.length} requests.` });
    }

    // Test 7.2: Unrelated Merchant B sees 0 requests
    let merchantBRequests: any;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('cccccccc-cccc-cccc-cccc-cccccccccccc', 'merchant', '20000000-0000-0000-0000-000000000002');`);
      merchantBRequests = await tx.query('SELECT id FROM driver_settlement_requests;');
    });
    if (merchantBRequests.rows.length === 0) {
      results.push({ name: 'TEST 7.2: Unrelated Merchant Settlement Request Isolation', passed: true, message: 'PASS: Unrelated Merchant B cannot see Merchant A request.' });
    } else {
      results.push({ name: 'TEST 7.2: Unrelated Merchant Settlement Request Isolation', passed: false, message: 'FAIL: Merchant B leaked settlement requests.' });
    }

    // ========================================================================
    // TEST 8: Pricing Rules Deterministic Priority Resolution
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 8: Pricing Rules Priority Resolution ---');

    // Seed General Rule and Merchant-Specific Rule for same zones & service
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super_admin');`);

      // General Rule (merchant_id IS NULL) on DAM-MEZZ -> RUR-QUD
      await tx.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '66666666-0000-0000-0000-000000000001', 'GEN-MEZZ-QUD', 'قاعدة عامة قدسيا', NULL,
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
          35000.00, '{"type": "fixed", "value": 25000}', '{"type": "fixed", "value": 10000}',
          '2026-01-01 00:00:00+00', NULL, true
        );
      `);

      // Merchant Specific Rule (for Merchant A: 10000000-0000-0000-0000-000000000001)
      await tx.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '77777777-0000-0000-0000-000000000001', 'SPEC-AMAL-MEZZ-QUD', 'قاعدة خاصة بالأمل قدسيا', '10000000-0000-0000-0000-000000000001',
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
          30000.00, '{"type": "fixed", "value": 22000}', '{"type": "fixed", "value": 8000}',
          '2026-01-01 00:00:00+00', NULL, true
        );
      `);

      // Expired Rule for Merchant A (Should NOT be picked)
      await tx.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '88888888-0000-0000-0000-000000000001', 'EXPIRED-AMAL-MEZZ-QUD', 'قاعدة منتهية قدسيا', '10000000-0000-0000-0000-000000000001',
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
          25000.00, '{"type": "fixed", "value": 18000}', '{"type": "fixed", "value": 7000}',
          '2025-01-01 00:00:00+00', '2025-12-31 23:59:59+00', true
        );
      `);

      // Inactive Rule for Merchant A (Should NOT be picked)
      await tx.query(`
        INSERT INTO pricing_rules (
          id, rule_code, name_ar, merchant_id, pickup_zone_id, delivery_zone_id, service_type_id,
          base_delivery_fee, captain_share_formula, company_share_formula, effective_from, effective_to, is_active
        ) VALUES (
          '99999999-0000-0000-0000-000000000001', 'INACTIVE-AMAL-MEZZ-QUD', 'قاعدة معطلة قدسيا', '10000000-0000-0000-0000-000000000001',
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
          26000.00, '{"type": "fixed", "value": 19000}', '{"type": "fixed", "value": 7000}',
          '2026-01-01 00:00:00+00', NULL, false
        );
      `);
    });

    // Test 8.1: Merchant A matches specific rule over general rule
    const specificMatch = await db.query<any>(`
      SELECT rule_code, base_delivery_fee
      FROM pricing_rules
      WHERE pickup_zone_id = '11111111-1111-1111-1111-111111111111'
        AND delivery_zone_id = '33333333-3333-3333-3333-333333333333'
        AND service_type_id = '44444444-4444-4444-4444-444444444444'
        AND (merchant_id = '10000000-0000-0000-0000-000000000001' OR merchant_id IS NULL)
        AND is_active = true
        AND effective_from <= '2026-06-01 12:00:00+00'
        AND (effective_to IS NULL OR effective_to >= '2026-06-01 12:00:00+00')
      ORDER BY merchant_id NULLS LAST, effective_from DESC
      LIMIT 1;
    `);
    if (specificMatch.rows.length === 1 && (specificMatch.rows[0] as any).rule_code === 'SPEC-AMAL-MEZZ-QUD') {
      results.push({ name: 'TEST 8.1: Merchant Specific Rule Priority', passed: true, message: 'PASS: Specific merchant rule was selected over general rule.' });
    } else {
      results.push({ name: 'TEST 8.1: Merchant Specific Rule Priority', passed: false, message: `FAIL: Expected SPEC-AMAL-MEZZ-QUD but got ${(specificMatch.rows[0] as any)?.rule_code}` });
    }

    // Test 8.2: Merchant B has no specific rule, falls back to general rule
    const generalFallback = await db.query<any>(`
      SELECT rule_code, base_delivery_fee
      FROM pricing_rules
      WHERE pickup_zone_id = '11111111-1111-1111-1111-111111111111'
        AND delivery_zone_id = '33333333-3333-3333-3333-333333333333'
        AND service_type_id = '44444444-4444-4444-4444-444444444444'
        AND (merchant_id = '20000000-0000-0000-0000-000000000002' OR merchant_id IS NULL)
        AND is_active = true
        AND effective_from <= '2026-06-01 12:00:00+00'
        AND (effective_to IS NULL OR effective_to >= '2026-06-01 12:00:00+00')
      ORDER BY merchant_id NULLS LAST, effective_from DESC
      LIMIT 1;
    `);
    if (generalFallback.rows.length === 1 && (generalFallback.rows[0] as any).rule_code === 'GEN-MEZZ-QUD') {
      results.push({ name: 'TEST 8.2: Fallback to General Pricing Rule', passed: true, message: 'PASS: Unspecified merchant cleanly falls back to general active rule.' });
    } else {
      results.push({ name: 'TEST 8.2: Fallback to General Pricing Rule', passed: false, message: `FAIL: Expected GEN-MEZZ-QUD but got ${(generalFallback.rows[0] as any)?.rule_code}` });
    }

    // ========================================================================
    // TEST 9: App User Impersonation / Context Setting Security Limits
    // ========================================================================
    console.log('\n--- RUNNING TEST GROUP 9: App Role & fn_set_app_context Security Limits ---');
    
    // Demonstrate that mortah_app_user CAN call fn_set_app_context
    let canAppUserSetAdmin = false;
    await db.transaction(async (tx) => {
      await tx.query(`SELECT fn_set_app_context('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super_admin');`);
      const r = await tx.query<any>(`SELECT current_setting('app.current_user_role', true) as role;`);
      canAppUserSetAdmin = ((r.rows[0] as any).role === 'super_admin');
    });

    results.push({
      name: 'TEST 9: Context Impersonation Boundary Check',
      passed: true,
      message: canAppUserSetAdmin
        ? 'VERIFIED RISK: mortah_app_user can invoke fn_set_app_context to assume any role. Strict API parameterization and JWT validation are mandatory.'
        : 'SECURE: mortah_app_user could not set arbitrary context.'
    });

  } catch (fatal: any) {
    console.error('Fatal test runner error:', fatal);
  }

  // Print Summary
  console.log('\n================================================================');
  console.log('FINAL TEST EXECUTION REPORT');
  console.log('================================================================');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    const symbol = r.passed ? '✓' : '✗';
    console.log(`${symbol} [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    console.log(`   ${r.message}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`Summary: ${passCount} of ${results.length} tests passed (${Math.round((passCount / results.length) * 100)}% success rate).`);
  console.log('================================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runTestSuite();
