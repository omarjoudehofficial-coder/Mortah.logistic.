-- ============================================================================
-- MORTAH LOGISTICS PLATFORM - MIGRATION 0001
-- Accounting Integrity, Temporal Rule Exclusion, Ledger Immutability & RLS Policies
-- ============================================================================

-- ============================================================================
-- 1. TEMPORAL OVERLAP PROTECTION FOR PRICING RULES (منع تداخل القواعد الزمنية)
-- Uses Advisory Transaction Locks and native OVERLAPS without external extensions
-- ============================================================================

-- Drop the naive non-temporal indexes from 0000 to allow consecutive non-overlapping active rules
DROP INDEX IF EXISTS uq_active_merchant_pricing_rule;
DROP INDEX IF EXISTS uq_active_general_pricing_rule;

CREATE OR REPLACE FUNCTION fn_check_pricing_rule_temporal_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_lock_key BIGINT;
    v_conflict_id UUID;
    v_conflict_code VARCHAR;
BEGIN
    -- Only active rules are subject to temporal non-overlap enforcement
    IF NEW.is_active = FALSE THEN
        RETURN NEW;
    END IF;

    -- Generate a deterministic 64-bit advisory lock hash based on the rule scope
    -- This serializes concurrent inserts for the same merchant/zones/service tuple
    v_lock_key := ('x' || substr(md5(
        COALESCE(NEW.merchant_id::text, 'GENERAL') || ':' ||
        NEW.pickup_zone_id::text || ':' ||
        NEW.delivery_zone_id::text || ':' ||
        NEW.service_type_id::text
    ), 1, 16))::bit(64)::bigint;

    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- Search for any overlapping active rule within the same scope
    SELECT id, rule_code INTO v_conflict_id, v_conflict_code
    FROM pricing_rules
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          (NEW.merchant_id IS NULL AND merchant_id IS NULL)
          OR (NEW.merchant_id IS NOT NULL AND merchant_id = NEW.merchant_id)
      )
      AND pickup_zone_id = NEW.pickup_zone_id
      AND delivery_zone_id = NEW.delivery_zone_id
      AND service_type_id = NEW.service_type_id
      AND is_active = TRUE
      AND (
          -- Infinite future vs infinite future
          (NEW.effective_to IS NULL AND effective_to IS NULL)
          -- Open-ended overlap with bounded interval
          OR (NEW.effective_to IS NULL AND effective_to > NEW.effective_from)
          OR (effective_to IS NULL AND NEW.effective_to > effective_from)
          -- Bounded intervals overlap
          OR (
              NEW.effective_to IS NOT NULL 
              AND effective_to IS NOT NULL 
              AND (effective_from, effective_to) OVERLAPS (NEW.effective_from, NEW.effective_to)
          )
      )
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'Conflicting active pricing rule: Rule % (%) overlaps with the requested effective period [% to %].',
            v_conflict_code, v_conflict_id, NEW.effective_from, COALESCE(NEW.effective_to::text, 'INFINITY');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_rules_temporal_overlap ON pricing_rules;
CREATE TRIGGER trg_pricing_rules_temporal_overlap
BEFORE INSERT OR UPDATE ON pricing_rules
FOR EACH ROW
EXECUTE FUNCTION fn_check_pricing_rule_temporal_overlap();


-- ============================================================================
-- 2. REVERSAL RULES & DOUBLE REVERSAL PREVENTION (حظر العكس المتكرر)
-- ============================================================================

-- Ensure a posted journal entry can only ever be reversed ONCE
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_reversal_per_entry 
ON journal_entries (reversed_entry_id) 
WHERE is_reversal = TRUE AND reversed_entry_id IS NOT NULL;

CREATE OR REPLACE FUNCTION fn_validate_journal_reversal()
RETURNS TRIGGER AS $$
DECLARE
    v_target_posted BOOLEAN;
    v_target_is_reversal BOOLEAN;
BEGIN
    IF NEW.is_reversal = TRUE THEN
        IF NEW.reversed_entry_id IS NULL THEN
            RAISE EXCEPTION 'Reversal entry % must specify reversed_entry_id.', NEW.id;
        END IF;

        IF NEW.reversed_entry_id = NEW.id THEN
            RAISE EXCEPTION 'A journal entry cannot reverse itself.';
        END IF;

        SELECT is_posted, is_reversal INTO v_target_posted, v_target_is_reversal
        FROM journal_entries
        WHERE id = NEW.reversed_entry_id;

        IF v_target_posted IS NULL THEN
            RAISE EXCEPTION 'Target entry % to be reversed does not exist.', NEW.reversed_entry_id;
        END IF;

        IF v_target_posted = FALSE THEN
            RAISE EXCEPTION 'Cannot reverse unposted journal entry %.', NEW.reversed_entry_id;
        END IF;

        IF v_target_is_reversal = TRUE THEN
            RAISE EXCEPTION 'Cannot reverse an entry (%) that is already a reversal voucher.', NEW.reversed_entry_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_journal_reversal ON journal_entries;
CREATE TRIGGER trg_validate_journal_reversal
BEFORE INSERT OR UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION fn_validate_journal_reversal();


-- ============================================================================
-- 3. LEDGER IMMUTABILITY FOR POSTED ENTRIES (حظر تعديل أو حذف القيود المرحلة)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_protect_posted_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Block deletion of posted journal entries
    IF TG_OP = 'DELETE' AND OLD.is_posted = TRUE THEN
        RAISE EXCEPTION 'Posted journal entry % (Annual Code %) cannot be deleted. Create an authorized reversal entry instead.',
            OLD.id, OLD.annual_code;
    END IF;

    -- Block modification of posted journal entries except for marking reversed
    IF TG_OP = 'UPDATE' AND OLD.is_posted = TRUE THEN
        IF NEW.is_posted = FALSE THEN
            RAISE EXCEPTION 'A posted journal entry cannot be reverted to unposted.';
        END IF;

        IF NEW.entry_number != OLD.entry_number
           OR NEW.annual_code != OLD.annual_code
           OR NEW.fiscal_year != OLD.fiscal_year
           OR NEW.transaction_date != OLD.transaction_date
           OR NEW.source_module != OLD.source_module
           OR NEW.related_order_id IS DISTINCT FROM OLD.related_order_id
           OR NEW.idempotency_key != OLD.idempotency_key
           OR NEW.payload_hash != OLD.payload_hash
           OR NEW.created_by != OLD.created_by THEN
            RAISE EXCEPTION 'Financial and operational fields of posted journal entry % are strictly immutable.', OLD.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_posted_journal_entry ON journal_entries;
CREATE TRIGGER trg_protect_posted_journal_entry
BEFORE UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION fn_protect_posted_journal_entry();

CREATE OR REPLACE FUNCTION fn_protect_posted_journal_lines()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_posted BOOLEAN;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT is_posted INTO v_entry_posted FROM journal_entries WHERE id = OLD.entry_id;
        IF v_entry_posted = TRUE THEN
            RAISE EXCEPTION 'Cannot modify or delete lines of a posted journal entry (Entry ID %).', OLD.entry_id;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        SELECT is_posted INTO v_entry_posted FROM journal_entries WHERE id = NEW.entry_id;
        IF v_entry_posted = TRUE THEN
            RAISE EXCEPTION 'Cannot append new lines to an already posted journal entry (Entry ID %).', NEW.entry_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_posted_journal_lines ON journal_lines;
CREATE TRIGGER trg_protect_posted_journal_lines
BEFORE INSERT OR UPDATE OR DELETE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION fn_protect_posted_journal_lines();


-- ============================================================================
-- 4. COMMIT-TIME FULL BALANCE & NON-EMPTY ENFORCEMENT (التحقق الإجباري عند COMMIT)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_verify_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_id UUID;
    v_is_posted BOOLEAN;
    v_total_debit NUMERIC(15, 2);
    v_total_credit NUMERIC(15, 2);
    v_line_count INT;
BEGIN
    v_entry_id := COALESCE(NEW.entry_id, OLD.entry_id);

    SELECT is_posted INTO v_is_posted FROM journal_entries WHERE id = v_entry_id;
    IF v_is_posted IS NULL OR v_is_posted = FALSE THEN
        RETURN NEW;
    END IF;

    -- Check line count
    SELECT COUNT(*), COALESCE(SUM(debit_base_syp), 0.00), COALESCE(SUM(credit_base_syp), 0.00)
    INTO v_line_count, v_total_debit, v_total_credit
    FROM journal_lines
    WHERE entry_id = v_entry_id;

    IF v_line_count < 2 THEN
        RAISE EXCEPTION 'Accounting Integrity Error: Journal entry % must contain at least 2 balanced lines (Found: %).',
            v_entry_id, v_line_count;
    END IF;

    IF v_total_debit != v_total_credit THEN
        RAISE EXCEPTION 'Accounting Integrity Error: Journal entry % is unbalanced. Total Debit = % SYP, Total Credit = % SYP (Difference: % SYP).',
            v_entry_id, v_total_debit, v_total_credit, (v_total_debit - v_total_credit);
    END IF;

    IF v_total_debit <= 0.00 THEN
        RAISE EXCEPTION 'Accounting Integrity Error: Journal entry % total monetary balance must be greater than zero.',
            v_entry_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deferred_journal_balance ON journal_lines;
CREATE CONSTRAINT TRIGGER trg_deferred_journal_balance
AFTER INSERT OR UPDATE OR DELETE ON journal_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_verify_journal_entry_balance();


-- Also enforce at entry level when entry is inserted or marked posted
CREATE OR REPLACE FUNCTION fn_verify_entry_level_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit NUMERIC(15, 2);
    v_total_credit NUMERIC(15, 2);
    v_line_count INT;
BEGIN
    IF NEW.is_posted = TRUE THEN
        SELECT COUNT(*), COALESCE(SUM(debit_base_syp), 0.00), COALESCE(SUM(credit_base_syp), 0.00)
        INTO v_line_count, v_total_debit, v_total_credit
        FROM journal_lines
        WHERE entry_id = NEW.id;

        IF v_line_count < 2 THEN
            RAISE EXCEPTION 'Accounting Integrity Error: Posted journal entry % has less than 2 lines (Found: %).',
                NEW.id, v_line_count;
        END IF;

        IF v_total_debit != v_total_credit THEN
            RAISE EXCEPTION 'Accounting Integrity Error: Posted journal entry % is unbalanced (% != % SYP).',
                NEW.id, v_total_debit, v_total_credit;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deferred_entry_level_balance ON journal_entries;
CREATE CONSTRAINT TRIGGER trg_deferred_entry_level_balance
AFTER INSERT OR UPDATE ON journal_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_verify_entry_level_balance();


-- ============================================================================
-- 5. SESSION CONTEXT & ROW-LEVEL SECURITY (RLS) POLICIES (سياسات العزل والأمان)
-- ============================================================================

-- Function to set session context safely inside current transaction
CREATE OR REPLACE FUNCTION fn_set_app_context(
    p_user_id UUID,
    p_user_role VARCHAR,
    p_merchant_id UUID DEFAULT NULL,
    p_captain_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), true);
    PERFORM set_config('app.current_user_role', COALESCE(p_user_role, ''), true);
    PERFORM set_config('app.current_merchant_id', COALESCE(p_merchant_id::text, ''), true);
    PERFORM set_config('app.current_captain_id', COALESCE(p_captain_id::text, ''), true);
END;
$$ LANGUAGE plpgsql;

-- Enable and FORCE Row Level Security on Sensitive Operational & Financial Tables
-- FORCE guarantees RLS is evaluated even for the table owner / app connection
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

ALTER TABLE financial_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_debts FORCE ROW LEVEL SECURITY;

ALTER TABLE driver_settlement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_settlement_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines FORCE ROW LEVEL SECURITY;

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants FORCE ROW LEVEL SECURITY;

ALTER TABLE captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE captains FORCE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- ORDERS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS orders_super_admin_all ON orders;
CREATE POLICY orders_super_admin_all ON orders
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'super_admin');

DROP POLICY IF EXISTS orders_operations_manage ON orders;
CREATE POLICY orders_operations_manage ON orders
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'operations')
WITH CHECK (current_setting('app.current_user_role', true) = 'operations');

DROP POLICY IF EXISTS orders_accountant_read ON orders;
CREATE POLICY orders_accountant_read ON orders
FOR SELECT TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'accountant');

DROP POLICY IF EXISTS orders_merchant_select ON orders;
CREATE POLICY orders_merchant_select ON orders
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND merchant_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
);

DROP POLICY IF EXISTS orders_merchant_insert ON orders;
CREATE POLICY orders_merchant_insert ON orders
FOR INSERT TO PUBLIC
WITH CHECK (
    current_setting('app.current_user_role', true) = 'merchant'
    AND merchant_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
);

DROP POLICY IF EXISTS orders_captain_select ON orders;
CREATE POLICY orders_captain_select ON orders
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'captain'
    AND captain_id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID
);

-- ----------------------------------------------------------------------------
-- MERCHANTS & CAPTAINS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS merchants_admin_all ON merchants;
CREATE POLICY merchants_admin_all ON merchants
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) IN ('super_admin', 'operations', 'accountant'));

DROP POLICY IF EXISTS merchants_self_read ON merchants;
CREATE POLICY merchants_self_read ON merchants
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
);

DROP POLICY IF EXISTS captains_admin_all ON captains;
CREATE POLICY captains_admin_all ON captains
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) IN ('super_admin', 'operations', 'accountant'));

DROP POLICY IF EXISTS captains_self_read ON captains;
CREATE POLICY captains_self_read ON captains
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'captain'
    AND id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID
);

-- ----------------------------------------------------------------------------
-- FINANCIAL DEBTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS debts_super_admin_all ON financial_debts;
CREATE POLICY debts_super_admin_all ON financial_debts
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'super_admin');

DROP POLICY IF EXISTS debts_accountant_manage ON financial_debts;
CREATE POLICY debts_accountant_manage ON financial_debts
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'accountant')
WITH CHECK (current_setting('app.current_user_role', true) = 'accountant');

DROP POLICY IF EXISTS debts_merchant_read ON financial_debts;
CREATE POLICY debts_merchant_read ON financial_debts
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND (
        (debtor_type = 'merchant' AND debtor_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID)
        OR (creditor_type = 'merchant' AND creditor_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID)
    )
);

DROP POLICY IF EXISTS debts_captain_read ON financial_debts;
CREATE POLICY debts_captain_read ON financial_debts
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'captain'
    AND (
        (debtor_type = 'captain' AND debtor_id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID)
        OR (creditor_type = 'captain' AND creditor_id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID)
    )
);

-- ----------------------------------------------------------------------------
-- DRIVER SETTLEMENT REQUESTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS settlement_admin_all ON driver_settlement_requests;
CREATE POLICY settlement_admin_all ON driver_settlement_requests
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) IN ('super_admin', 'operations', 'accountant'))
WITH CHECK (current_setting('app.current_user_role', true) IN ('super_admin', 'operations', 'accountant'));

DROP POLICY IF EXISTS settlement_captain_manage ON driver_settlement_requests;
CREATE POLICY settlement_captain_manage ON driver_settlement_requests
FOR ALL TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'captain'
    AND captain_id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID
)
WITH CHECK (
    current_setting('app.current_user_role', true) = 'captain'
    AND captain_id = NULLIF(current_setting('app.current_captain_id', true), '')::UUID
);

DROP POLICY IF EXISTS settlement_merchant_read ON driver_settlement_requests;
CREATE POLICY settlement_merchant_read ON driver_settlement_requests
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND merchant_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
);

-- ----------------------------------------------------------------------------
-- JOURNAL ENTRIES & LINES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS journal_entries_super_admin_all ON journal_entries;
CREATE POLICY journal_entries_super_admin_all ON journal_entries
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'super_admin');

DROP POLICY IF EXISTS journal_entries_accountant_manage ON journal_entries;
CREATE POLICY journal_entries_accountant_manage ON journal_entries
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'accountant')
WITH CHECK (current_setting('app.current_user_role', true) = 'accountant');

DROP POLICY IF EXISTS journal_entries_merchant_read ON journal_entries;
CREATE POLICY journal_entries_merchant_read ON journal_entries
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND related_order_id IN (
        SELECT id FROM orders WHERE merchant_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
    )
);

DROP POLICY IF EXISTS journal_lines_super_admin_all ON journal_lines;
CREATE POLICY journal_lines_super_admin_all ON journal_lines
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'super_admin');

DROP POLICY IF EXISTS journal_lines_accountant_manage ON journal_lines;
CREATE POLICY journal_lines_accountant_manage ON journal_lines
FOR ALL TO PUBLIC
USING (current_setting('app.current_user_role', true) = 'accountant')
WITH CHECK (current_setting('app.current_user_role', true) = 'accountant');

DROP POLICY IF EXISTS journal_lines_merchant_read ON journal_lines;
CREATE POLICY journal_lines_merchant_read ON journal_lines
FOR SELECT TO PUBLIC
USING (
    current_setting('app.current_user_role', true) = 'merchant'
    AND party_type = 'merchant'
    AND party_id = NULLIF(current_setting('app.current_merchant_id', true), '')::UUID
);

-- ----------------------------------------------------------------------------
-- APPLICATION ROLE PROVISIONING (دور مستخدم التطبيق غير المالك لفرض RLS)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mortah_app_user') THEN
        CREATE ROLE mortah_app_user;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO mortah_app_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO mortah_app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mortah_app_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO mortah_app_user;
