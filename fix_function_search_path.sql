-- Fix Function Search Path Security Issues
-- This script adds SET search_path = '' to all functions to prevent SQL injection attacks

-- User management functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_default_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.handle_new_user_default_role() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_update_expired_access' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.check_and_update_expired_access() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_user_role() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_users_with_session_count' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_all_users_with_session_count() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_premium_tools_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.is_premium_tools_admin() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'normalize_access_keys' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.normalize_access_keys() SET search_path = '';
    END IF;
END $$;

-- Financial functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_financial_year' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_financial_year() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_and_increment_invoice_no' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.generate_and_increment_invoice_no() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_invoice_no' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.generate_invoice_no() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_next_invoice_number_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_next_invoice_number_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_invoice_gap' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.record_invoice_gap() SET search_path = '';
    END IF;
END $$;

-- Job card functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_and_increment_job_card_no' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.generate_and_increment_job_card_no() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_next_job_card_invoice_no_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_next_job_card_invoice_no_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'save_job_card_and_update_inventory' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.save_job_card_and_update_inventory() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_job_card_history' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_job_card_history() SET search_path = '';
    END IF;
END $$;

-- Follow-up and dashboard functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_follow_ups_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_follow_ups_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_follow_ups_v3' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_follow_ups_v3() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_booking_summary' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_booking_summary() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_stats' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_dashboard_stats() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_invoice_summary' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_invoice_summary() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_invoice_summary_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_invoice_summary_v2() SET search_path = '';
    END IF;
END $$;

-- Party, ledger and sales functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_ledger' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_ledger() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_ledger_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_ledger_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_sale_summary' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_sale_summary() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_vehicle_invoice_summary' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_vehicle_invoice_summary() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_wise_sale_report' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_wise_sale_report() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_party_wise_sale_report_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_party_wise_sale_report_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_sales_by_salesperson' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_sales_by_salesperson() SET search_path = '';
    END IF;
END $$;

-- Vehicle and invoice functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_vehicle_invoices_report' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_vehicle_invoices_report() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_vehicle_invoices_report_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_vehicle_invoices_report_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_vehicle_invoices_report_v3' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_vehicle_invoices_report_v3() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_vehicle_invoices_report_v4' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_vehicle_invoices_report_v4() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_vehicle_invoices' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.search_vehicle_invoices() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_vehicle_invoices_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.search_vehicle_invoices_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_vehicle_invoices_v3' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.search_vehicle_invoices_v3() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_vehicle_invoices_v4' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.search_vehicle_invoices_v4() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_vehicle_invoices_v5' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.search_vehicle_invoices_v5() SET search_path = '';
    END IF;
END $$;

-- Stock and return management functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_stock_deletion_on_sale' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.handle_stock_deletion_on_sale() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_sold_stock' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.sync_sold_stock() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_inventory_from_purchases' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_inventory_from_purchases() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_inventory_item_quantity' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_inventory_item_quantity() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_and_update_inventory' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.upsert_and_update_inventory() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'manage_wp_return' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.manage_wp_return() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'manage_ws_return' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.manage_ws_return() SET search_path = '';
    END IF;
END $$;

-- Vehicle history tracking functions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v2() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v3' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v3() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v4' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v4() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v5' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v5() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v6' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v6() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v7' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v7() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v8' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v8() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v9' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v9() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v10' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v10() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v11' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v11() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v12' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v12() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_vehicle_history_v13' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.track_vehicle_history_v13() SET search_path = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.handle_updated_at() SET search_path = '';
    END IF;
END $$;

-- Move pg_trgm extension from public schema to extensions schema
-- First create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the extension (this will require superuser privileges)
-- ALTER EXTENSION pg_trgm SET SCHEMA extensions;
-- Note: The above command requires superuser privileges. 
-- If you can't run it, contact your Supabase support or database administrator.

-- Alternative: Drop and recreate in proper schema (if you have the privileges)
-- DROP EXTENSION IF EXISTS pg_trgm;
-- CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;