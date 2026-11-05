CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"payload_before" jsonb,
	"payload_after" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "captains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"vehicle_type" varchar(30) NOT NULL,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"cash_on_hand_cached" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"earnings_payable_cached" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"active_status" varchar(30) DEFAULT 'available' NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "captains_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"category" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"is_reconcilable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name_ar" varchar(50) NOT NULL,
	"decimals" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_settlement_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_id" uuid NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"allocated_amount" numeric(15, 2) NOT NULL,
	"allocation_type" varchar(40) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_settlement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"captain_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"total_cod_due" numeric(15, 2) NOT NULL,
	"driver_declared_available" numeric(15, 2) NOT NULL,
	"driver_declared_deficit" numeric(15, 2) NOT NULL,
	"driver_notes" text,
	"merchant_confirmed_amount" numeric(15, 2),
	"merchant_confirmed_at" timestamp with time zone,
	"discrepancy_status" varchar(40) DEFAULT 'pending' NOT NULL,
	"mortah_review_decision" varchar(40) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(14, 6) NOT NULL,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "financial_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_origin" varchar(40) NOT NULL,
	"debtor_type" varchar(20) NOT NULL,
	"debtor_id" uuid NOT NULL,
	"creditor_type" varchar(20) NOT NULL,
	"creditor_id" uuid NOT NULL,
	"original_request_id" uuid,
	"parent_debt_id" uuid,
	"related_order_id" uuid,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"amount_total" numeric(15, 2) NOT NULL,
	"amount_settled" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"settlement_status" varchar(30) DEFAULT 'active' NOT NULL,
	"reason_code" varchar(50) NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" bigserial NOT NULL,
	"annual_code" varchar(30) NOT NULL,
	"fiscal_year" smallint NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"description_ar" text NOT NULL,
	"source_module" varchar(40) NOT NULL,
	"related_order_id" uuid,
	"idempotency_key" varchar(100) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"is_posted" boolean DEFAULT true NOT NULL,
	"is_reversal" boolean DEFAULT false NOT NULL,
	"reversed_entry_id" uuid,
	"reversal_reason" text,
	"created_by" uuid NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_entry_number_unique" UNIQUE("entry_number"),
	CONSTRAINT "journal_entries_annual_code_unique" UNIQUE("annual_code"),
	CONSTRAINT "journal_entries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"debit_original" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"credit_original" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"exchange_rate" numeric(14, 6) DEFAULT '1.000000' NOT NULL,
	"debit_base_syp" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"credit_base_syp" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"party_type" varchar(30),
	"party_id" uuid,
	"notes" text,
	CONSTRAINT "chk_positive_debit_credit" CHECK (("journal_lines"."debit_base_syp" >= 0 AND "journal_lines"."credit_base_syp" >= 0 AND ("journal_lines"."debit_base_syp" > 0 OR "journal_lines"."credit_base_syp" > 0)))
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(150) NOT NULL,
	"owner_name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"default_zone_id" uuid,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"prepaid_balance_cached" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"prepaid_reserved_cached" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"cod_escrow_cached" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"overdraft_limit" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status_type" varchar(30) NOT NULL,
	"old_value" varchar(50),
	"new_value" varchar(50) NOT NULL,
	"reason" text,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_code" varchar(30) NOT NULL,
	"merchant_id" uuid NOT NULL,
	"captain_id" uuid,
	"pickup_zone_id" uuid NOT NULL,
	"delivery_zone_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_address" text NOT NULL,
	"customer_lat" numeric(10, 7),
	"customer_lng" numeric(10, 7),
	"preferred_delivery_window" varchar(50),
	"package_description" text NOT NULL,
	"weight_kg" numeric(6, 2) DEFAULT '1.00' NOT NULL,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"fee_payer" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'SYP' NOT NULL,
	"exchange_rate_snapshot" numeric(14, 6) DEFAULT '1.000000' NOT NULL,
	"goods_cod_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"delivery_fee_total" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"captain_delivery_fee" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"company_commission_net" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"pricing_rule_id" uuid,
	"pricing_snapshot" jsonb NOT NULL,
	"paid_from_prepaid" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"operational_status" varchar(30) DEFAULT 'draft' NOT NULL,
	"customer_collection_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"captain_remittance_status" varchar(30) DEFAULT 'not_applicable' NOT NULL,
	"merchant_payout_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"company_fee_status" varchar(30) DEFAULT 'unearned' NOT NULL,
	"cancellation_stage" varchar(40) DEFAULT 'none' NOT NULL,
	"cancellation_fee" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"cancellation_reason" text,
	"return_cost" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"is_piggybacked_return" boolean DEFAULT false NOT NULL,
	"piggyback_order_id" uuid,
	"proof_of_delivery_url" text,
	"delivery_notes" text,
	"idempotency_key" varchar(100),
	"payload_hash" varchar(64),
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_tracking_code_unique" UNIQUE("tracking_code"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "chk_delivery_fee_split" CHECK ("orders"."delivery_fee_total" = ("orders"."captain_delivery_fee" + "orders"."company_commission_net"))
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"name_ar" varchar(150) NOT NULL,
	"merchant_id" uuid,
	"pickup_zone_id" uuid NOT NULL,
	"delivery_zone_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"base_delivery_fee" numeric(15, 2) NOT NULL,
	"captain_share_formula" jsonb NOT NULL,
	"company_share_formula" jsonb NOT NULL,
	"max_allowed_surcharge" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_type" varchar(30) NOT NULL,
	"party_id" uuid NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"cached_balance" numeric(15, 2) NOT NULL,
	"ledger_balance" numeric(15, 2) NOT NULL,
	"discrepancy" numeric(15, 2) NOT NULL,
	"is_matched" boolean NOT NULL,
	"action_taken" varchar(50) DEFAULT 'none' NOT NULL,
	"adjustment_entry_id" uuid,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "service_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(30) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"governorate" varchar(50) NOT NULL,
	"center_lat" numeric(10, 7),
	"center_lng" numeric(10, 7),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "zones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captains" ADD CONSTRAINT "captains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captains" ADD CONSTRAINT "captains_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_settlement_allocations" ADD CONSTRAINT "debt_settlement_allocations_debt_id_financial_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."financial_debts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_settlement_allocations" ADD CONSTRAINT "debt_settlement_allocations_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_settlement_requests" ADD CONSTRAINT "driver_settlement_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_settlement_requests" ADD CONSTRAINT "driver_settlement_requests_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_settlement_requests" ADD CONSTRAINT "driver_settlement_requests_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_settlement_requests" ADD CONSTRAINT "driver_settlement_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates_history" ADD CONSTRAINT "exchange_rates_history_from_currency_currencies_code_fk" FOREIGN KEY ("from_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates_history" ADD CONSTRAINT "exchange_rates_history_to_currency_currencies_code_fk" FOREIGN KEY ("to_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_debts" ADD CONSTRAINT "financial_debts_original_request_id_driver_settlement_requests_id_fk" FOREIGN KEY ("original_request_id") REFERENCES "public"."driver_settlement_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_debts" ADD CONSTRAINT "financial_debts_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_debts" ADD CONSTRAINT "financial_debts_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_debts" ADD CONSTRAINT "financial_debts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_code_chart_of_accounts_code_fk" FOREIGN KEY ("account_code") REFERENCES "public"."chart_of_accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_default_zone_id_zones_id_fk" FOREIGN KEY ("default_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_zone_id_zones_id_fk" FOREIGN KEY ("pickup_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_pickup_zone_id_zones_id_fk" FOREIGN KEY ("pickup_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_delivery_zone_id_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_audit_logs" ADD CONSTRAINT "reconciliation_audit_logs_adjustment_entry_id_journal_entries_id_fk" FOREIGN KEY ("adjustment_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_deficit_requests_status" ON "driver_settlement_requests" USING btree ("discrepancy_status","mortah_review_decision");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_lookup" ON "exchange_rates_history" USING btree ("from_currency","to_currency","effective_at");--> statement-breakpoint
CREATE INDEX "idx_debts_debtor" ON "financial_debts" USING btree ("debtor_type","debtor_id","settlement_status");--> statement-breakpoint
CREATE INDEX "idx_debts_creditor" ON "financial_debts" USING btree ("creditor_type","creditor_id","settlement_status");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_date" ON "journal_entries" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_order" ON "journal_entries" USING btree ("related_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_entry_line_number" ON "journal_lines" USING btree ("entry_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_lines_party" ON "journal_lines" USING btree ("party_type","party_id","account_code");--> statement-breakpoint
CREATE INDEX "idx_orders_merchant" ON "orders" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_captain" ON "orders" USING btree ("captain_id","operational_status");--> statement-breakpoint
CREATE INDEX "idx_orders_tracking" ON "orders" USING btree ("tracking_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_merchant_pricing_rule" ON "pricing_rules" USING btree ("merchant_id","pickup_zone_id","delivery_zone_id","service_type_id") WHERE "pricing_rules"."is_active" = true AND "pricing_rules"."merchant_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_general_pricing_rule" ON "pricing_rules" USING btree ("pickup_zone_id","delivery_zone_id","service_type_id") WHERE "pricing_rules"."is_active" = true AND "pricing_rules"."merchant_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pricing_lookup" ON "pricing_rules" USING btree ("pickup_zone_id","delivery_zone_id","service_type_id","merchant_id","is_active");