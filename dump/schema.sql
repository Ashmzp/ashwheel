


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_and_update_expired_access"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record RECORD;
    module_key TEXT;
    updated_access JSONB;
BEGIN
    FOR user_record IN
        SELECT id, access
        FROM public.users
        WHERE app_valid_till < CURRENT_DATE
          AND role = 'user'
    LOOP
        updated_access := user_record.access;
        
        -- Iterate over all keys in the access JSONB object
        FOR module_key IN
            SELECT k FROM jsonb_object_keys(user_record.access) k
        LOOP
            -- Set the permission to 'read'
            updated_access := jsonb_set(updated_access, ARRAY[module_key], '"read"');
        END LOOP;

        -- Update the user's access if it has changed
        IF updated_access <> user_record.access THEN
            UPDATE public.users
            SET access = updated_access
            WHERE id = user_record.id;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_and_update_expired_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_and_increment_invoice_no"("p_user_id" "uuid", "p_invoice_type" "text", "p_invoice_date" "date") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_fy text;
    v_short_fy text;
    v_prefix text;
    v_invoice_no text;
    v_settings record;
BEGIN
    -- If it's a job card, use the new dedicated function
    IF p_invoice_type = 'job_card' THEN
        RETURN public.get_next_job_card_invoice_no_v2(p_user_id, p_invoice_date);
    END IF;

    v_fy := public.get_financial_year(p_invoice_date);
    v_short_fy := SUBSTRING(v_fy FROM 3 FOR 2) || SUBSTRING(v_fy FROM 8 FOR 2);

    SELECT * INTO v_settings FROM public.settings WHERE user_id = p_user_id;

    CASE p_invoice_type
        WHEN 'registered' THEN
            v_prefix := COALESCE(v_settings.registered_invoice_prefix, 'RINV-');
        WHEN 'non_registered' THEN
            v_prefix := COALESCE(v_settings.non_registered_invoice_prefix, 'NRINV-');
        WHEN 'wp_return' THEN
            v_prefix := 'WPR-';
        WHEN 'ws_return' THEN
            v_prefix := 'WSR-';
        ELSE 
            v_prefix := 'INV-';
    END CASE;

    v_invoice_no := public.get_next_invoice_number_v2(p_user_id, v_prefix, v_short_fy);

    RETURN v_invoice_no;
END;
$$;


ALTER FUNCTION "public"."generate_and_increment_invoice_no"("p_user_id" "uuid", "p_invoice_type" "text", "p_invoice_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_and_increment_job_card_no"("p_user_id" "uuid", "p_invoice_date" "date", "p_customer_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invoice_type text;
    v_use_separate_numbering boolean;
    v_is_registered boolean;
    v_settings record;
BEGIN
    -- 1. Get user settings
    SELECT * INTO v_settings FROM public.settings WHERE user_id = p_user_id;

    -- 2. Check if separate numbering is enabled for job cards
    v_use_separate_numbering := COALESCE((v_settings.workshop_settings ->> 'use_separate_job_card_numbering')::boolean, false);

    IF v_use_separate_numbering THEN
        -- 3. Determine if customer is registered (has GST)
        SELECT gst IS NOT NULL AND gst <> '' INTO v_is_registered FROM public.customers WHERE id = p_customer_id;
        
        IF v_is_registered IS NULL THEN -- handle case where customer might not be found
          v_is_registered := false;
        END IF;
        
        -- Set invoice type based on registration status
        IF v_is_registered THEN
            v_invoice_type := 'job_card_registered';
        ELSE
            v_invoice_type := 'job_card_non_registered';
        END IF;
    ELSE
        -- Use single invoice type for all job cards
        v_invoice_type := 'job_card';
    END IF;

    -- 4. Call the main invoice generation function
    RETURN public.generate_and_increment_invoice_no(p_user_id, v_invoice_type, p_invoice_date);
END;
$$;


ALTER FUNCTION "public"."generate_and_increment_job_card_no"("p_user_id" "uuid", "p_invoice_date" "date", "p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_no"("customer_type" "text", "inv_date" "date") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    fy TEXT;
    seq INT;
    prefix TEXT;
BEGIN
    -- Financial Year calculate karna
    IF EXTRACT(MONTH FROM inv_date) >= 4 THEN
        fy := TO_CHAR(inv_date, 'YY') || TO_CHAR(inv_date + interval '1 year', 'YY');
    ELSE
        fy := TO_CHAR(inv_date - interval '1 year', 'YY') || TO_CHAR(inv_date, 'YY');
    END IF;

    -- Prefix decide karna
    IF customer_type = 'Registered' THEN
        prefix := 'RINV-';
        SELECT COUNT(*) + 1 INTO seq
        FROM vehicle_invoices
        WHERE invoice_no LIKE prefix || fy || '%';
    ELSE
        prefix := 'NRINV-';
        SELECT COUNT(*) + 1 INTO seq
        FROM vehicle_invoices
        WHERE invoice_no LIKE prefix || fy || '%';
    END IF;

    -- Final invoice number return karna
    RETURN prefix || fy || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION "public"."generate_invoice_no"("customer_type" "text", "inv_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_users_with_session_count"() RETURNS TABLE("id" "uuid", "email" "text", "role" "text", "access" "jsonb", "created_at" timestamp with time zone, "app_valid_till" "date", "max_devices" integer, "active_session_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        au.email,
        u.role,
        u.access,
        u.created_at,
        u.app_valid_till,
        u.max_devices,
        COALESCE(s.session_count, 0) as active_session_count
    FROM
        public.users u
    JOIN 
        auth.users au ON u.id = au.id
    LEFT JOIN (
        SELECT
            user_id,
            COUNT(id) as session_count
        FROM
            public.active_sessions
        GROUP BY
            user_id
    ) s ON u.id = s.user_id
    ORDER BY
        u.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_users_with_session_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booking_summary"("p_start_date" "date", "p_end_date" "date") RETURNS TABLE("open_count" bigint, "postpone_count" bigint, "sold_count" bigint, "cancelled_count" bigint, "sales_person_summary" "jsonb", "model_colour_summary" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT auth.uid() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, '[]'::jsonb, '[]'::jsonb;
        RETURN;
    END IF;

    RETURN QUERY
    WITH all_bookings AS (
        SELECT 
            *,
            UPPER(status) as upper_status
        FROM bookings
        WHERE user_id = v_user_id
          AND (p_start_date IS NULL OR booking_date >= p_start_date)
          AND (p_end_date IS NULL OR booking_date <= p_end_date)
    ),
    open_bookings AS (
        SELECT * FROM all_bookings WHERE upper_status = 'OPEN'
    ),
    stock_summary AS (
        SELECT
            model_name,
            count(*) as stock_qty
        FROM public.stock
        WHERE user_id = v_user_id
        GROUP BY model_name
    )
    SELECT
        (SELECT count(*) FROM all_bookings WHERE upper_status = 'OPEN'),
        (SELECT count(*) FROM all_bookings WHERE upper_status = 'POSTPONE'),
        (SELECT count(*) FROM all_bookings WHERE upper_status = 'SOLD'),
        (SELECT count(*) FROM all_bookings WHERE upper_status = 'CANCELLED'),
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (SELECT COALESCE(custom_fields->>'salesPerson', 'N/A') as sales_person, count(*) FROM all_bookings GROUP BY 1 ORDER BY count DESC) t),
        (
            SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
            FROM (
                SELECT 
                    COALESCE(ob.model_name, 'Unknown') as model_name, 
                    COALESCE(ob.colour, 'No Colour') as colour, 
                    count(*) as booking_qty,
                    COALESCE(ss.stock_qty, 0) as stock_qty
                FROM open_bookings ob
                LEFT JOIN stock_summary ss 
                    ON COALESCE(ob.model_name, 'Unknown') = ss.model_name
                GROUP BY 1, 2, ss.stock_qty
                ORDER BY booking_qty DESC
            ) t
        );
END;
$$;


ALTER FUNCTION "public"."get_booking_summary"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_party_names" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("totalpurchaseqty" bigint, "registeredsaleqty" bigint, "nonregisteredsaleqty" bigint, "totalsaleqty" bigint, "totalcustomers" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    purchase_count bigint := 0;
    reg_sales_count bigint := 0;
    non_reg_sales_count bigint := 0;
    total_sales_count bigint := 0;
    customer_count bigint := 0;
BEGIN
    -- Debug: Print parameters
    RAISE NOTICE 'Dashboard Stats Parameters:';
    RAISE NOTICE 'User ID: %', p_user_id;
    RAISE NOTICE 'Date Range: % to %', p_start_date, p_end_date;
    RAISE NOTICE 'Party Names: %', p_party_names;

    -- 1. Purchase Quantity - Multiple approaches to count
    -- First try: Count by items array (if chassis_no exists)
    SELECT COALESCE(COUNT(DISTINCT item->>'chassis_no'), 0)
    INTO purchase_count
    FROM public.purchases p,
         jsonb_array_elements(p.items) as item
    WHERE p.user_id = p_user_id
      AND p.invoice_date BETWEEN p_start_date AND p_end_date
      AND (p_party_names IS NULL OR array_length(p_party_names, 1) IS NULL OR p.party_name = ANY(p_party_names))
      AND item->>'chassis_no' IS NOT NULL
      AND trim(item->>'chassis_no') <> '';

    -- If no chassis_no found, count by items array length
    IF purchase_count = 0 THEN
        SELECT COALESCE(SUM(jsonb_array_length(p.items)), 0)
        INTO purchase_count
        FROM public.purchases p
        WHERE p.user_id = p_user_id
          AND p.invoice_date BETWEEN p_start_date AND p_end_date
          AND (p_party_names IS NULL OR array_length(p_party_names, 1) IS NULL OR p.party_name = ANY(p_party_names))
          AND p.items IS NOT NULL
          AND jsonb_array_length(p.items) > 0;
    END IF;

    -- If still 0, count purchase records themselves
    IF purchase_count = 0 THEN
        SELECT COUNT(*)
        INTO purchase_count
        FROM public.purchases p
        WHERE p.user_id = p_user_id
          AND p.invoice_date BETWEEN p_start_date AND p_end_date
          AND (p_party_names IS NULL OR array_length(p_party_names, 1) IS NULL OR p.party_name = ANY(p_party_names));
    END IF;

    RAISE NOTICE 'Purchase count: %', purchase_count;

    -- 2. Sales Quantities - Simplified approach
    -- First try: Get from vehicle_invoice_items directly
    WITH sales_data AS (
        SELECT 
            vii.id,
            vi.customer_details,
            vii.chassis_no
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = p_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
    ),
    filtered_sales AS (
        SELECT 
            s.*
        FROM sales_data s
        LEFT JOIN public.purchases p ON EXISTS (
            SELECT 1 FROM jsonb_array_elements(p.items) as item 
            WHERE item->>'chassis_no' = s.chassis_no
              AND p.user_id = p_user_id
        )
        WHERE (p_party_names IS NULL 
               OR array_length(p_party_names, 1) IS NULL 
               OR p.party_name = ANY(p_party_names)
               OR p.party_name IS NULL) -- Include sales without party filter if no purchases match
    )
    SELECT
        COUNT(*) FILTER (WHERE customer_details->>'gst' IS NOT NULL 
                           AND trim(customer_details->>'gst') <> ''),
        COUNT(*) FILTER (WHERE customer_details->>'gst' IS NULL 
                           OR trim(customer_details->>'gst') = ''),
        COUNT(*)
    INTO
        reg_sales_count,
        non_reg_sales_count,
        total_sales_count
    FROM filtered_sales;

    -- If no sales found with party filter, try without party filter
    IF total_sales_count = 0 THEN
        SELECT
            COUNT(*) FILTER (WHERE customer_details->>'gst' IS NOT NULL 
                               AND trim(customer_details->>'gst') <> ''),
            COUNT(*) FILTER (WHERE customer_details->>'gst' IS NULL 
                               OR trim(customer_details->>'gst') = ''),
            COUNT(*)
        INTO
            reg_sales_count,
            non_reg_sales_count,
            total_sales_count
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = p_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date;
    END IF;

    RAISE NOTICE 'Sales - Registered: %, Non-registered: %, Total: %', 
        reg_sales_count, non_reg_sales_count, total_sales_count;

    -- 3. Total Customers - Simplified
    SELECT COUNT(DISTINCT vi.customer_id)
    INTO customer_count
    FROM public.vehicle_invoices vi
    WHERE vi.user_id = p_user_id
      AND vi.invoice_date BETWEEN p_start_date AND p_end_date
      AND vi.customer_id IS NOT NULL;

    RAISE NOTICE 'Customer count: %', customer_count;

    -- Final debug
    RAISE NOTICE 'Final Results - Purchases: %, Reg Sales: %, Non-reg Sales: %, Total Sales: %, Customers: %', 
        purchase_count, reg_sales_count, non_reg_sales_count, total_sales_count, customer_count;

    -- Return results
    RETURN QUERY SELECT 
        purchase_count as totalpurchaseqty,
        reg_sales_count as registeredsaleqty,
        non_reg_sales_count as nonregisteredsaleqty,
        total_sales_count as totalsaleqty,
        customer_count as totalcustomers;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_party_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_financial_year"("p_date" "date") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_year integer;
    v_month integer;
BEGIN
    v_year := EXTRACT(YEAR FROM p_date);
    v_month := EXTRACT(MONTH FROM p_date);

    IF v_month >= 4 THEN
        RETURN v_year || '-' || (v_year + 1);
    ELSE
        RETURN (v_year - 1) || '-' || v_year;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_financial_year"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follow_ups_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT NULL::"text") RETURNS TABLE("source_id" "uuid", "source_type" "text", "due_date" "date", "customer_name" "text", "customer_mobile" "text", "model_name" "text", "frame_no" "text", "follow_up_id" "uuid", "next_follow_up_date" "date", "remark" "text", "appointment_datetime" timestamp with time zone, "followed_up_by" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_follow_up_days integer;
BEGIN
    -- Get the setting for vehicle invoice follow-up days
    SELECT (s.workshop_settings->>'vehicle_invoice_follow_up_days')::integer 
    INTO v_follow_up_days 
    FROM public.settings s WHERE s.user_id = auth.uid();
    
    -- Default to 30 if not set
    v_follow_up_days := COALESCE(v_follow_up_days, 30);

    RETURN QUERY
    WITH latest_follow_ups AS (
        SELECT
            wfu.job_card_id,
            wfu.vehicle_invoice_id,
            MAX(wfu.created_at) as last_follow_up_time
        FROM
            public.workshop_follow_ups wfu
        WHERE wfu.user_id = auth.uid()
        GROUP BY
            wfu.job_card_id, wfu.vehicle_invoice_id
    ),
    all_sources AS (
        -- Source 1: Job Cards
        SELECT
            jc.id AS source_id,
            'job_card'::text AS source_type,
            jc.next_due_date AS due_date,
            jc.customer_name,
            jc.customer_mobile,
            jc.model AS model_name,
            jc.frame_no
        FROM public.job_cards jc
        WHERE jc.user_id = auth.uid()
        
        UNION ALL
        
        -- Source 2: Non-registered Vehicle Invoices
        SELECT
            vi.id AS source_id,
            'vehicle_invoice'::text AS source_type,
            (vi.invoice_date + MAKE_INTERVAL(days => v_follow_up_days))::date AS due_date,
            vi.customer_name,
            vi.customer_details->>'mobile1' as customer_mobile,
            (SELECT vii.model_name FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id LIMIT 1) AS model_name,
            (SELECT vii.chassis_no FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id LIMIT 1) AS frame_no
        FROM public.vehicle_invoices vi
        WHERE vi.user_id = auth.uid()
        AND (vi.customer_details->>'gst' IS NULL OR vi.customer_details->>'gst' = '')
    )
    SELECT
        s.source_id,
        s.source_type,
        s.due_date,
        s.customer_name,
        s.customer_mobile,
        s.model_name,
        s.frame_no,
        wfu.id as follow_up_id,
        wfu.next_follow_up_date,
        wfu.remark,
        wfu.appointment_datetime,
        wfu.followed_up_by
    FROM
        all_sources s
    LEFT JOIN
        latest_follow_ups lfu ON 
            (s.source_type = 'job_card' AND s.source_id = lfu.job_card_id) OR
            (s.source_type = 'vehicle_invoice' AND s.source_id = lfu.vehicle_invoice_id)
    LEFT JOIN
        public.workshop_follow_ups wfu ON 
            (s.source_type = 'job_card' AND wfu.job_card_id = lfu.job_card_id AND wfu.created_at = lfu.last_follow_up_time) OR
            (s.source_type = 'vehicle_invoice' AND wfu.vehicle_invoice_id = lfu.vehicle_invoice_id AND wfu.created_at = lfu.last_follow_up_time)
    WHERE
        (
            (COALESCE(wfu.next_follow_up_date, s.due_date) BETWEEN p_start_date AND p_end_date)
        )
    AND
        (p_search_term IS NULL OR p_search_term = '' OR
         s.customer_name ILIKE '%' || p_search_term || '%' OR
         s.customer_mobile ILIKE '%' || p_search_term || '%' OR
         s.frame_no ILIKE '%' || p_search_term || '%'
        )
    ORDER BY
        COALESCE(wfu.next_follow_up_date, s.due_date) ASC;
END;
$$;


ALTER FUNCTION "public"."get_follow_ups_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follow_ups_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT NULL::"text") RETURNS TABLE("source_id" "uuid", "source_type" "text", "source_date" "date", "customer_name" "text", "mobile1" "text", "mobile2" "text", "model_name" "text", "chassis_no" "text", "reg_no" "text", "kms_reading" "text", "job_type" "text", "mechanic_name" "text", "next_due_date" "date", "follow_up_id" "uuid", "next_follow_up_date" "date", "remark" "text", "appointment_datetime" timestamp with time zone, "followed_up_by" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_follow_up_days integer;
    v_user_id uuid := auth.uid();
BEGIN
    SELECT (s.workshop_settings->>'vehicle_invoice_follow_up_days')::integer 
    INTO v_follow_up_days 
    FROM public.settings s WHERE s.user_id = v_user_id;
    
    v_follow_up_days := COALESCE(v_follow_up_days, 30);

    RETURN QUERY
    WITH follow_up_base AS (
        -- Source 1: Job Cards
        SELECT 
            jc.id AS source_id,
            'Job Card'::text AS source_type,
            jc.invoice_date AS source_date,
            jc.customer_name,
            jc.customer_mobile AS mobile1,
            jc.customer_mobile2 AS mobile2,
            jc.model AS model_name,
            jc.frame_no AS chassis_no,
            jc.reg_no,
            jc.kms AS kms_reading,
            jc.job_type,
            jc.mechanic AS mechanic_name,
            jc.next_due_date,
            jc.id as job_card_id,
            NULL::uuid as vehicle_invoice_id
        FROM public.job_cards jc
        WHERE jc.user_id = v_user_id

        UNION ALL

        -- Source 2: Non-registered Vehicle Invoices
        SELECT 
            vi.id AS source_id,
            'Vehicle Invoice'::text AS source_type,
            vi.invoice_date AS source_date,
            vi.customer_name,
            vi.customer_details->>'mobile1' AS mobile1,
            vi.customer_details->>'mobile2' AS mobile2,
            (SELECT vii.model_name FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id LIMIT 1) AS model_name,
            (SELECT vii.chassis_no FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id LIMIT 1) AS chassis_no,
            NULL::text as reg_no,
            NULL::text as kms_reading,
            NULL::text as job_type,
            NULL::text as mechanic_name,
            (vi.invoice_date + make_interval(days => v_follow_up_days))::date AS next_due_date,
            NULL::uuid as job_card_id,
            vi.id as vehicle_invoice_id
        FROM public.vehicle_invoices vi
        WHERE vi.user_id = v_user_id
          AND (vi.customer_details->>'gst' IS NULL OR vi.customer_details->>'gst' = '')
    ),
    latest_follow_ups AS (
        SELECT 
            wfu.job_card_id, 
            wfu.vehicle_invoice_id,
            (array_agg(wfu.id ORDER BY wfu.created_at DESC))[1] as latest_id
        FROM public.workshop_follow_ups wfu
        WHERE wfu.user_id = v_user_id
        GROUP BY wfu.job_card_id, wfu.vehicle_invoice_id
    )
    SELECT
        fb.source_id,
        fb.source_type,
        fb.source_date,
        fb.customer_name,
        fb.mobile1,
        fb.mobile2,
        fb.model_name,
        fb.chassis_no,
        fb.reg_no,
        fb.kms_reading,
        fb.job_type,
        fb.mechanic_name,
        fb.next_due_date,
        wfu.id AS follow_up_id,
        wfu.next_follow_up_date,
        wfu.remark,
        wfu.appointment_datetime,
        wfu.followed_up_by
    FROM follow_up_base fb
    LEFT JOIN latest_follow_ups lfu ON (fb.job_card_id = lfu.job_card_id AND fb.job_card_id IS NOT NULL) OR (fb.vehicle_invoice_id = lfu.vehicle_invoice_id AND fb.vehicle_invoice_id IS NOT NULL)
    LEFT JOIN public.workshop_follow_ups wfu ON lfu.latest_id = wfu.id
    WHERE 
        (COALESCE(wfu.next_follow_up_date, fb.next_due_date) BETWEEN p_start_date AND p_end_date)
    AND (
        p_search_term IS NULL OR p_search_term = '' OR
        fb.customer_name ILIKE '%' || p_search_term || '%' OR
        fb.mobile1 ILIKE '%' || p_search_term || '%' OR
        COALESCE(fb.mobile2, '') ILIKE '%' || p_search_term || '%' OR
        fb.chassis_no ILIKE '%' || p_search_term || '%' OR
        COALESCE(fb.reg_no, '') ILIKE '%' || p_search_term || '%'
    )
    ORDER BY COALESCE(wfu.next_follow_up_date, fb.next_due_date) ASC;
END;
$$;


ALTER FUNCTION "public"."get_follow_ups_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invoice_summary"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("registered_qty" bigint, "non_registered_qty" bigint, "total_qty" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH invoice_items_in_range AS (
    SELECT 
      vii.id,
      vi.customer_id
    FROM vehicle_invoice_items AS vii
    JOIN vehicle_invoices AS vi ON vii.invoice_id = vi.id
    WHERE vi.user_id = p_user_id
      AND vi.invoice_date >= p_start_date
      AND vi.invoice_date <= p_end_date
  )
  SELECT
    COALESCE(COUNT(iir.id) FILTER (WHERE c.gst IS NOT NULL AND c.gst <> ''), 0) AS registered_qty,
    COALESCE(COUNT(iir.id) FILTER (WHERE c.gst IS NULL OR c.gst = ''), 0) AS non_registered_qty,
    COALESCE(COUNT(iir.id), 0) AS total_qty
  FROM invoice_items_in_range AS iir
  LEFT JOIN customers AS c ON iir.customer_id = c.id;
END;
$$;


ALTER FUNCTION "public"."get_invoice_summary"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invoice_summary_v2"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("registered_qty" bigint, "non_registered_qty" bigint, "total_qty" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(DISTINCT vii.id) FILTER (WHERE vi.customer_details->>'gst' IS NOT NULL AND vi.customer_details->>'gst' <> ''), 0)::bigint AS registered_qty,
    COALESCE(COUNT(DISTINCT vii.id) FILTER (WHERE vi.customer_details->>'gst' IS NULL OR vi.customer_details->>'gst' = ''), 0)::bigint AS non_registered_qty,
    COALESCE(COUNT(DISTINCT vii.id), 0)::bigint AS total_qty
  FROM vehicle_invoices AS vi
  JOIN vehicle_invoice_items AS vii ON vi.id = vii.invoice_id
  WHERE vi.user_id = p_user_id
    AND vi.invoice_date >= p_start_date
    AND vi.invoice_date <= p_end_date;
END;
$$;


ALTER FUNCTION "public"."get_invoice_summary_v2"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_invoice_number_v2"("p_user_id" "uuid", "p_prefix" "text", "p_fy_short" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_last_counter integer;
    v_new_counter integer;
    v_full_prefix text;
BEGIN
    v_full_prefix := p_prefix || p_fy_short || '-';

    -- Find the highest existing counter for this user, prefix, and FY directly from the table.
    -- This is safer than relying on a separate sequence table that might get out of sync.
    SELECT COALESCE(MAX(SUBSTRING(invoice_no from (LENGTH(v_full_prefix) + 1))::integer), 0)
    INTO v_last_counter
    FROM public.vehicle_invoices
    WHERE user_id = p_user_id AND invoice_no LIKE v_full_prefix || '%';

    v_new_counter := v_last_counter + 1;

    RETURN v_full_prefix || LPAD(v_new_counter::text, 4, '0');
END;
$$;


ALTER FUNCTION "public"."get_next_invoice_number_v2"("p_user_id" "uuid", "p_prefix" "text", "p_fy_short" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_job_card_invoice_no_v2"("p_user_id" "uuid", "p_invoice_date" "date") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_fy text;
    v_short_fy text;
    v_prefix text;
    v_last_counter integer;
    v_new_counter integer;
    v_full_prefix text;
BEGIN
    v_fy := public.get_financial_year(p_invoice_date);
    v_short_fy := SUBSTRING(v_fy FROM 3 FOR 2) || SUBSTRING(v_fy FROM 8 FOR 2);

    SELECT s.workshop_settings->>'job_card_prefix' 
    INTO v_prefix 
    FROM public.settings s WHERE s.user_id = p_user_id;

    v_prefix := COALESCE(v_prefix, 'JC-');
    v_full_prefix := v_prefix || v_short_fy || '-';

    -- Find the highest existing counter for this user, prefix, and FY directly from the job_cards table.
    SELECT COALESCE(MAX(SUBSTRING(invoice_no from (LENGTH(v_full_prefix) + 1))::integer), 0)
    INTO v_last_counter
    FROM public.job_cards
    WHERE user_id = p_user_id AND invoice_no LIKE v_full_prefix || '%';

    v_new_counter := v_last_counter + 1;

    RETURN v_full_prefix || LPAD(v_new_counter::text, 4, '0');
END;
$$;


ALTER FUNCTION "public"."get_next_job_card_invoice_no_v2"("p_user_id" "uuid", "p_invoice_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_ledger"("p_customer_id" "uuid") RETURNS TABLE("transaction_date" "date", "particulars" "text", "transaction_type" "text", "debit" numeric, "credit" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        entry_date AS transaction_date,
        particulars,
        'Journal Entry' AS transaction_type,
        CASE WHEN entry_type = 'Debit' THEN price ELSE 0 END AS debit,
        CASE WHEN entry_type = 'Credit' THEN price ELSE 0 END AS credit
    FROM public.journal_entries
    WHERE user_id = v_user_id AND party_id = p_customer_id

    UNION ALL

    SELECT
        receipt_date AS transaction_date,
        'Payment Received (' || payment_mode || ')' AS particulars,
        'Receipt' AS transaction_type,
        0 AS debit,
        amount AS credit
    FROM public.receipts
    WHERE user_id = v_user_id AND customer_id = p_customer_id
    
    ORDER BY transaction_date;
END;
$$;


ALTER FUNCTION "public"."get_party_ledger"("p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_ledger_v2"("p_customer_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("transaction_date" "date", "particulars" "text", "transaction_type" "text", "debit" numeric, "credit" numeric, "model_name" "text", "chassis_no" "text", "invoice_no" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        je.entry_date AS transaction_date,
        je.particulars,
        'Journal Entry' AS transaction_type,
        CASE WHEN je.entry_type = 'Debit' THEN je.price ELSE 0 END AS debit,
        CASE WHEN je.entry_type = 'Credit' THEN je.price ELSE 0 END AS credit,
        je.model_name,
        je.chassis_no,
        je.invoice_no
    FROM public.journal_entries je
    WHERE je.user_id = v_user_id 
      AND je.party_id = p_customer_id
      AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
      AND (p_end_date IS NULL OR je.entry_date <= p_end_date)

    UNION ALL

    SELECT
        r.receipt_date AS transaction_date,
        'Payment Received (' || r.payment_mode || ')' AS particulars,
        'Receipt' AS transaction_type,
        0 AS debit,
        r.amount AS credit,
        je.model_name,
        je.chassis_no,
        je.invoice_no
    FROM public.receipts r
    LEFT JOIN public.journal_entries je ON r.journal_entry_id = je.id
    WHERE r.user_id = v_user_id 
      AND r.customer_id = p_customer_id
      AND (p_start_date IS NULL OR r.receipt_date >= p_start_date)
      AND (p_end_date IS NULL OR r.receipt_date <= p_end_date)
    
    ORDER BY transaction_date;
END;
$$;


ALTER FUNCTION "public"."get_party_ledger_v2"("p_customer_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_sale_summary"("p_start_date" "date", "p_end_date" "date") RETURNS TABLE("party_name" "text", "customer_type" "text", "sale_count" bigint, "sale_month" "text", "model_name" "text", "category" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT
            (SELECT p.party_name 
             FROM public.purchases p, jsonb_array_elements(p.items) as item
             WHERE p.user_id = v_user_id AND item->>'chassisNo' = vii.chassis_no
             LIMIT 1) as resolved_party_name,
            (SELECT s.category 
             FROM public.stock s
             WHERE s.user_id = v_user_id AND s.chassis_no = vii.chassis_no
             LIMIT 1) as resolved_category,
            vi.invoice_date,
            vii.model_name,
            CASE 
                WHEN vi.customer_details->>'gst' IS NOT NULL AND LTRIM(RTRIM(vi.customer_details->>'gst')) <> '' THEN 'Registered'
                ELSE 'Non-Registered'
            END as resolved_customer_type
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = v_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        COALESCE(
            sd.resolved_party_name, 
            'Non-Registered'
        ) as party_name,
        sd.resolved_customer_type as customer_type,
        COUNT(*) as sale_count,
        to_char(sd.invoice_date, 'YYYY-MM') as sale_month,
        sd.model_name,
        sd.resolved_category as category
    FROM sales_data sd
    GROUP BY
        COALESCE(
            sd.resolved_party_name, 
            'Non-Registered'
        ),
        sd.resolved_customer_type,
        to_char(sd.invoice_date, 'YYYY-MM'),
        sd.model_name,
        sd.resolved_category;
END;
$$;


ALTER FUNCTION "public"."get_party_sale_summary"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_vehicle_invoice_summary"("p_start_date" "date", "p_end_date" "date", "p_customer_type" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH sales_data AS (
        SELECT
            vi.customer_name,
            vii.model_name,
            CASE 
                WHEN vi.customer_details->>'gst' IS NOT NULL AND vi.customer_details->>'gst' <> '' THEN 'Registered'
                ELSE 'Non-Registered'
            END as customer_type
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = v_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
          AND (p_customer_type IS NULL OR 
               p_customer_type = 'All' OR
               CASE 
                   WHEN vi.customer_details->>'gst' IS NOT NULL AND vi.customer_details->>'gst' <> '' THEN 'Registered'
                   ELSE 'Non-Registered'
               END = p_customer_type
              )
    )
    SELECT jsonb_build_object(
        'report_data', COALESCE(
            (
                SELECT jsonb_agg(t)
                FROM (
                    SELECT 
                        COALESCE(customer_name, 'Non-Registered Customer') as party_name,
                        customer_type,
                        model_name,
                        COUNT(*) as sale_count
                    FROM sales_data
                    GROUP BY 
                        COALESCE(customer_name, 'Non-Registered Customer'), 
                        customer_type, 
                        model_name
                ) t
            ), '[]'::jsonb
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_party_vehicle_invoice_summary"("p_start_date" "date", "p_end_date" "date", "p_customer_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_wise_sale_report"("p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH sales_data AS (
        SELECT
            -- Try to get party name from the purchase record associated with the chassis number
            (SELECT p.party_name 
             FROM public.purchases p, jsonb_array_elements(p.items) as item
             WHERE p.user_id = v_user_id AND item->>'chassis_no' = vii.chassis_no
             LIMIT 1) as party_name,
            vii.model_name,
            CASE 
                WHEN vi.customer_details->>'gst' IS NOT NULL AND vi.customer_details->>'gst' <> '' THEN 'Registered'
                ELSE 'Non-Registered'
            END as customer_type
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = v_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
    )
    SELECT jsonb_build_object(
        'report_data', (
            SELECT jsonb_agg(t)
            FROM (
                SELECT 
                    COALESCE(party_name, 
                        CASE 
                            WHEN customer_type = 'Registered' THEN 'Unknown Registered Party'
                            ELSE 'Non-Registered Customer'
                        END
                    ) as party_name,
                    customer_type,
                    model_name,
                    COUNT(*) as sale_count
                FROM sales_data
                GROUP BY COALESCE(party_name, 
                        CASE 
                            WHEN customer_type = 'Registered' THEN 'Unknown Registered Party'
                            ELSE 'Non-Registered Customer'
                        END
                    ), customer_type, model_name
            ) t
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_party_wise_sale_report"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_party_wise_sale_report_v2"("p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH sales_data AS (
        SELECT
            vi.customer_name,
            vii.model_name,
            CASE 
                WHEN vi.customer_details->>'gst' IS NOT NULL AND vi.customer_details->>'gst' <> '' THEN 'Registered'
                ELSE 'Non-Registered'
            END as customer_type
        FROM public.vehicle_invoice_items vii
        JOIN public.vehicle_invoices vi ON vii.invoice_id = vi.id
        WHERE vi.user_id = v_user_id
          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
    )
    SELECT jsonb_build_object(
        'report_data', COALESCE(
            (
                SELECT jsonb_agg(t)
                FROM (
                    SELECT 
                        COALESCE(customer_name, 'Non-Registered Customer') as party_name,
                        customer_type,
                        model_name,
                        COUNT(*) as sale_count
                    FROM sales_data
                    GROUP BY 
                        COALESCE(customer_name, 'Non-Registered Customer'), 
                        customer_type, 
                        model_name
                ) t
            ), '[]'::jsonb
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_party_wise_sale_report_v2"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sales_by_salesperson"("p_start_date" "date", "p_end_date" "date") RETURNS TABLE("sales_person_name" "text", "sales_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
                  BEGIN
                      RETURN QUERY
                          SELECT
                                  UPPER(TRIM(vi.customer_details->>'salesPerson')) AS sales_person_name,
                                          COUNT(vi.id)::bigint AS sales_count
                                              FROM
                                                      public.vehicle_invoices vi
                                                          WHERE
                                                                  vi.user_id = auth.uid()
                                                                          AND vi.invoice_date BETWEEN p_start_date AND p_end_date
                                                                                  AND vi.customer_details->>'salesPerson' IS NOT NULL
                                                                                          AND vi.customer_details->>'salesPerson' <> ''
                                                                                              GROUP BY
                                                                                                      UPPER(TRIM(vi.customer_details->>'salesPerson'))
                                                                                                          ORDER BY
                                                                                                                  sales_count DESC;
                                                                                                                  END;
                                                                                                                  $$;


ALTER FUNCTION "public"."get_sales_by_salesperson"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date") RETURNS TABLE("invoice_no" "text", "invoice_date" "date", "customer_name" "text", "gst_no" "text", "registration_amount" numeric, "insurance_amount" numeric, "accessories_amount" numeric, "grand_total" numeric, "model_name" "text", "chassis_no" "text", "engine_no" "text", "price" numeric, "gst_percentage" "text", "taxable_value" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        vi.invoice_no,
        vi.invoice_date,
        vi.customer_name,
        vi.customer_details->>'gst' AS gst_no,
        vi.extra_charges->>'Registration' AS registration_amount,
        vi.extra_charges->>'Insurance' AS insurance_amount,
        vi.extra_charges->>'Accessories' AS accessories_amount,
        vi.total_amount AS grand_total,
        item.model_name,
        item.chassis_no,
        item.engine_no,
        item.price AS "price_inc_tax",
        item.gst AS gst_percentage,
        item.taxable_value
    FROM 
        public.vehicle_invoices vi
    JOIN 
        public.vehicle_invoice_items item ON vi.id = item.invoice_id
    WHERE 
        vi.user_id = v_user_id
        AND vi.invoice_date BETWEEN p_start_date AND p_end_date
    ORDER BY
        vi.invoice_date DESC, vi.invoice_no DESC;
END;
$$;


ALTER FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT ''::"text") RETURNS TABLE("invoice_no" "text", "invoice_date" "date", "customer_name" "text", "gst_no" "text", "registration_amount" numeric, "insurance_amount" numeric, "accessories_amount" numeric, "grand_total" numeric, "model_name" "text", "chassis_no" "text", "engine_no" "text", "price" numeric, "gst_percentage" "text", "taxable_value" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        vi.invoice_no,
        vi.invoice_date,
        vi.customer_name,
        vi.customer_details->>'gst' AS gst_no,
        (vi.extra_charges->>'Registration')::numeric AS registration_amount,
        (vi.extra_charges->>'Insurance')::numeric AS insurance_amount,
        (vi.extra_charges->>'Accessories')::numeric AS accessories_amount,
        vi.total_amount AS grand_total,
        item.model_name,
        item.chassis_no,
        item.engine_no,
        item.price AS "price_inc_tax",
        item.gst AS gst_percentage,
        item.taxable_value
    FROM 
        public.vehicle_invoices vi
    JOIN 
        public.vehicle_invoice_items item ON vi.id = item.invoice_id
    WHERE 
        vi.user_id = v_user_id
        AND vi.invoice_date BETWEEN p_start_date AND p_end_date
        AND (
            p_search_term = '' OR
            vi.invoice_no ILIKE '%' || p_search_term || '%' OR
            vi.customer_name ILIKE '%' || p_search_term || '%' OR
            item.chassis_no ILIKE '%' || p_search_term || '%' OR
            item.engine_no ILIKE '%' || p_search_term || '%'
        )
    ORDER BY
        vi.invoice_date DESC, vi.invoice_no DESC;
END;
$$;


ALTER FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT ''::"text") RETURNS TABLE("invoice_id" "uuid", "invoice_no" "text", "invoice_date" "date", "customer_name" "text", "gst_no" "text", "registration_amount" numeric, "insurance_amount" numeric, "accessories_amount" numeric, "grand_total" numeric, "model_name" "text", "chassis_no" "text", "engine_no" "text", "price" numeric, "gst_percentage" "text", "taxable_value" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    charge_settings JSONB;
BEGIN
    SELECT s.workshop_settings->'extra_charges'
    INTO charge_settings
    FROM public.settings s
    WHERE s.user_id = v_user_id;

    IF charge_settings IS NULL THEN
        charge_settings := '[{"id": "temp1", "name": "Registration"}, {"id": "temp2", "name": "Insurance"}, {"id": "temp3", "name": "Accessories"}]'::jsonb;
    END IF;

    RETURN QUERY
    WITH charge_names AS (
        SELECT
            (SELECT value->>'name' FROM jsonb_array_elements(charge_settings) WHERE value->>'name' ILIKE 'Registration' LIMIT 1) AS reg_name,
            (SELECT value->>'name' FROM jsonb_array_elements(charge_settings) WHERE value->>'name' ILIKE 'Insurance' LIMIT 1) AS ins_name,
            (SELECT value->>'name' FROM jsonb_array_elements(charge_settings) WHERE value->>'name' ILIKE 'Accessories' LIMIT 1) AS acc_name
    )
    SELECT 
        vi.id AS invoice_id,
        vi.invoice_no,
        vi.invoice_date,
        vi.customer_name,
        vi.customer_details->>'gst' AS gst_no,
        (vi.extra_charges->>cn.reg_name)::numeric AS registration_amount,
        (vi.extra_charges->>cn.ins_name)::numeric AS insurance_amount,
        (vi.extra_charges->>cn.acc_name)::numeric AS accessories_amount,
        vi.total_amount AS grand_total,
        item.model_name,
        item.chassis_no,
        item.engine_no,
        item.price AS "price_inc_tax",
        item.gst AS gst_percentage,
        item.taxable_value
    FROM 
        public.vehicle_invoices vi
    CROSS JOIN charge_names cn
    JOIN 
        public.vehicle_invoice_items item ON vi.id = item.invoice_id
    WHERE 
        vi.user_id = v_user_id
        AND vi.invoice_date BETWEEN p_start_date AND p_end_date
        AND (
            p_search_term = '' OR
            vi.invoice_no ILIKE '%' || p_search_term || '%' OR
            vi.customer_name ILIKE '%' || p_search_term || '%' OR
            item.chassis_no ILIKE '%' || p_search_term || '%' OR
            item.engine_no ILIKE '%' || p_search_term || '%'
        )
    ORDER BY
        vi.invoice_date DESC, vi.invoice_no DESC;
END;
$$;


ALTER FUNCTION "public"."get_vehicle_invoices_report_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT ''::"text") RETURNS TABLE("invoice_id" "uuid", "invoice_no" "text", "invoice_date" "date", "customer_name" "text", "guardian_name" "text", "mobile1" "text", "mobile2" "text", "dob" "date", "gst_no" "text", "full_address" "text", "state" "text", "district" "text", "pincode" "text", "model_name" "text", "chassis_no" "text", "engine_no" "text", "colour" "text", "price" numeric, "discount" numeric, "gst_percentage" "text", "taxable_value" numeric, "registration_amount" numeric, "insurance_amount" numeric, "accessories_amount" numeric, "grand_total" numeric, "customer_details_json" "jsonb", "extra_charges_json" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        vi.id AS invoice_id,
        vi.invoice_no,
        vi.invoice_date,
        vi.customer_name,
        c.guardian_name,
        c.mobile1,
        c.mobile2,
        c.dob,
        COALESCE(c.gst, vi.customer_details->>'gst') AS gst_no,
        c.address as full_address,
        c.state,
        c.district,
        c.pincode,
        item.model_name,
        item.chassis_no,
        item.engine_no,
        item.colour,
        item.price AS price,
        item.discount,
        item.gst AS gst_percentage,
        item.taxable_value,
        (vi.extra_charges->>'Registration')::numeric AS registration_amount,
        (vi.extra_charges->>'Insurance')::numeric AS insurance_amount,
        (vi.extra_charges->>'Accessories')::numeric AS accessories_amount,
        vi.total_amount AS grand_total,
        vi.customer_details AS customer_details_json,
        vi.extra_charges as extra_charges_json
    FROM 
        public.vehicle_invoices vi
    JOIN 
        public.vehicle_invoice_items item ON vi.id = item.invoice_id
    LEFT JOIN
        public.customers c ON vi.customer_id = c.id
    WHERE 
        vi.user_id = v_user_id
        AND vi.invoice_date BETWEEN p_start_date AND p_end_date
        AND (
            p_search_term = '' OR
            vi.invoice_no ILIKE '%' || p_search_term || '%' OR
            vi.customer_name ILIKE '%' || p_search_term || '%' OR
            COALESCE(c.gst, vi.customer_details->>'gst') ILIKE '%' || p_search_term || '%' OR
            item.chassis_no ILIKE '%' || p_search_term || '%' OR
            item.engine_no ILIKE '%' || p_search_term || '%'
        )
    ORDER BY
        vi.invoice_date DESC, vi.invoice_no DESC;
END;
$$;


ALTER FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT ''::"text", "p_page_size" integer DEFAULT 50, "p_page_number" integer DEFAULT 1) RETURNS TABLE("invoices_data" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    v_user_id UUID := auth.uid();
    v_offset integer := (p_page_number - 1) * p_page_size;
    v_id_search UUID;
BEGIN
    -- Check if search term is a valid UUID for direct ID search
    IF p_search_term ~* '^id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_id_search := (substring(p_search_term from 5))::uuid;
    END IF;

    RETURN QUERY
    WITH filtered_invoices AS (
        SELECT vi.id
        FROM public.vehicle_invoices vi
        LEFT JOIN public.vehicle_invoice_items vii ON vi.id = vii.invoice_id
        LEFT JOIN public.customers c ON vi.customer_id = c.id
        WHERE
            vi.user_id = v_user_id
            AND vi.invoice_date BETWEEN p_start_date AND p_end_date
            AND (
                v_id_search IS NOT NULL AND vi.id = v_id_search
                OR
                v_id_search IS NULL AND (
                    p_search_term IS NULL OR p_search_term = '' OR
                    vi.invoice_no ILIKE '%' || p_search_term || '%' OR
                    vi.customer_name ILIKE '%' || p_search_term || '%' OR
                    COALESCE(c.gst, vi.customer_details->>'gst') ILIKE '%' || p_search_term || '%' OR
                    vii.chassis_no ILIKE '%' || p_search_term || '%' OR
                    vii.engine_no ILIKE '%' || p_search_term || '%'
                )
            )
        GROUP BY vi.id
    ),
    paginated_invoices AS (
        SELECT id
        FROM filtered_invoices
        ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
        LIMIT p_page_size OFFSET v_offset
    )
    SELECT
        (
            SELECT json_agg(rows)
            FROM (
                SELECT 
                    vi.id AS invoice_id,
                    vi.invoice_no,
                    vi.invoice_date,
                    vi.customer_name,
                    c.guardian_name,
                    c.mobile1,
                    c.mobile2,
                    c.dob,
                    COALESCE(c.gst, vi.customer_details->>'gst') AS gst_no,
                    c.address as full_address,
                    c.state,
                    c.district,
                    c.pincode,
                    (SELECT string_agg(item.model_name, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as model_name,
                    (SELECT string_agg(item.chassis_no, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as chassis_no,
                    (SELECT string_agg(item.engine_no, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as engine_no,
                    (SELECT string_agg(item.colour, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as colour,
                    (SELECT sum(item.price) FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as price,
                    (SELECT sum(item.discount) FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as discount,
                    (SELECT avg((item.gst)::numeric) FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as gst_percentage,
                    (SELECT sum(item.taxable_value) FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as taxable_value,
                    vi.total_amount AS grand_total,
                    (SELECT jsonb_agg(item) FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as items,
                    vi.customer_details AS customer_details_json,
                    vi.extra_charges as extra_charges_json
                FROM 
                    public.vehicle_invoices vi
                LEFT JOIN
                    public.customers c ON vi.customer_id = c.id
                WHERE vi.id IN (SELECT id FROM paginated_invoices)
                ORDER BY
                    vi.invoice_date DESC, vi.created_at DESC
            ) as rows
        ) as invoices_data,
        (SELECT COUNT(*) FROM filtered_invoices) as total_count;
END;
$_$;


ALTER FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_invoices_report_v4"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text" DEFAULT ''::"text", "p_page_size" integer DEFAULT 50, "p_page_number" integer DEFAULT 1) RETURNS TABLE("invoices_data" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    v_user_id UUID := auth.uid();
    v_offset integer := (p_page_number - 1) * p_page_size;
    v_id_search UUID;
BEGIN
    -- Check if search term is a valid UUID for direct ID search
    IF p_search_term ~* '^id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_id_search := (substring(p_search_term from 4))::uuid;
    END IF;

    RETURN QUERY
    WITH filtered_invoices AS (
        SELECT vi.id
        FROM public.vehicle_invoices vi
        WHERE
            vi.user_id = v_user_id
            AND vi.invoice_date BETWEEN p_start_date AND p_end_date
            AND (
                v_id_search IS NOT NULL AND vi.id = v_id_search
                OR
                v_id_search IS NULL AND (
                    p_search_term IS NULL OR p_search_term = '' OR
                    vi.invoice_no ILIKE '%' || p_search_term || '%' OR
                    vi.customer_name ILIKE '%' || p_search_term || '%' OR
                    EXISTS (
                        SELECT 1 FROM public.vehicle_invoice_items vii
                        WHERE vii.invoice_id = vi.id
                        AND (
                            vii.chassis_no ILIKE '%' || p_search_term || '%' OR
                            vii.engine_no ILIKE '%' || p_search_term || '%'
                        )
                    )
                )
            )
    ),
    paginated_invoices AS (
        SELECT id
        FROM filtered_invoices
        ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
        LIMIT p_page_size OFFSET v_offset
    )
    SELECT
        (
            SELECT json_agg(rows)
            FROM (
                SELECT 
                    vi.id AS invoice_id,
                    vi.invoice_no,
                    vi.invoice_date,
                    vi.customer_name,
                    vi.total_amount AS grand_total,
                    (SELECT to_jsonb(c) FROM public.customers c WHERE c.id = vi.customer_id) as customer,
                    (SELECT jsonb_agg(vii) FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id) as items,
                    vi.customer_details AS customer_details_json,
                    vi.extra_charges as extra_charges_json,
                    (SELECT string_agg(item.model_name, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as model_name,
                    (SELECT string_agg(item.chassis_no, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as chassis_no,
                    (SELECT string_agg(item.engine_no, ', ') FROM public.vehicle_invoice_items item WHERE item.invoice_id = vi.id) as engine_no
                FROM 
                    public.vehicle_invoices vi
                WHERE vi.id IN (SELECT id FROM paginated_invoices)
                ORDER BY
                    vi.invoice_date DESC, vi.created_at DESC
            ) as rows
        ) as invoices_data,
        (SELECT COUNT(*) FROM filtered_invoices) as total_count;
END;
$_$;


ALTER FUNCTION "public"."get_vehicle_invoices_report_v4"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_default_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, role, access)
  VALUES (
    new.id, 
    new.email, 
    'user', 
    jsonb_build_object(
        'customers', 'none',
        'purchases', 'none',
        'purchase_returns', 'none',
        'stock', 'none',
        'reports', 'none',
        'vehicle_invoices', 'none',
        'sales_returns', 'none',
        'bookings', 'none',
        'workshop_purchases', 'none',
        'wp_return', 'none',
        'workshop_inventory', 'none',
        'job_cards', 'none',
        'ws_return', 'none',
        'workshop_follow_up', 'none',
        'mis_report', 'none',
        'journal_entry', 'none',
        'party_ledger', 'none',
        'receipts', 'none'
    )
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_default_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stock_deletion_on_sale"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete the corresponding chassis number from the stock table.
  DELETE FROM public.stock
  WHERE user_id = NEW.user_id AND chassis_no = NEW.chassis_no;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_stock_deletion_on_sale"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_premium_tools_admin"("user_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN user_email = 'ash.mzp143@gmail.com';
END;
$$;


ALTER FUNCTION "public"."is_premium_tools_admin"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_wp_return"("p_action" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
    v_return_id UUID;
    v_old_return JSONB;
    v_new_return JSONB;
    v_return_data JSONB;
    item_change RECORD;
    v_return_invoice_no TEXT;
BEGIN
    v_user_id := auth.uid();
    v_return_id := (p_payload->>'id')::UUID;

    IF p_action = 'CREATE' OR p_action = 'UPDATE' THEN
        IF p_payload->>'return_invoice_no' IS NULL OR p_payload->>'return_invoice_no' = '' THEN
            SELECT public.generate_and_increment_invoice_no(v_user_id, 'wp_return', (p_payload->>'return_date')::date)
            INTO v_return_invoice_no;
            p_payload := jsonb_set(p_payload, '{return_invoice_no}', to_jsonb(v_return_invoice_no));
        END IF;
    END IF;

    IF p_action = 'CREATE' THEN
        -- Insert new return
        INSERT INTO public.workshop_purchase_returns (user_id, return_invoice_no, return_date, original_purchase_id, party_name, items, reason, total_amount)
        VALUES (
            v_user_id,
            p_payload->>'return_invoice_no',
            (p_payload->>'return_date')::date,
            (p_payload->>'original_purchase_id')::UUID,
            p_payload->>'party_name',
            (p_payload->'items')::JSONB,
            p_payload->>'reason',
            (p_payload->>'total_amount')::numeric
        ) RETURNING to_jsonb(workshop_purchase_returns) INTO v_return_data;

        -- Decrease stock
        FOR item_change IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, -item_change.qty, v_user_id);
        END LOOP;
        
        RETURN v_return_data;

    ELSIF p_action = 'UPDATE' THEN
        -- Get old return
        SELECT to_jsonb(r) INTO v_old_return FROM public.workshop_purchase_returns r WHERE id = v_return_id AND user_id = v_user_id;
        IF v_old_return IS NULL THEN RAISE EXCEPTION 'Return not found'; END IF;

        -- Revert old stock change (add back)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(v_old_return->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, item_change.qty, v_user_id);
        END LOOP;

        -- Update return
        UPDATE public.workshop_purchase_returns
        SET
            return_date = (p_payload->>'return_date')::date,
            items = (p_payload->'items')::JSONB,
            reason = p_payload->>'reason',
            total_amount = (p_payload->>'total_amount')::numeric
        WHERE id = v_return_id
        RETURNING to_jsonb(workshop_purchase_returns) INTO v_return_data;

        -- Apply new stock change (subtract)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, -item_change.qty, v_user_id);
        END LOOP;
        
        RETURN v_return_data;

    ELSIF p_action = 'DELETE' THEN
        -- Get old return and delete it
        DELETE FROM public.workshop_purchase_returns WHERE id = v_return_id AND user_id = v_user_id
        RETURNING to_jsonb(workshop_purchase_returns) INTO v_old_return;
        IF v_old_return IS NULL THEN RAISE EXCEPTION 'Return not found'; END IF;

        -- Revert stock change (add back)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(v_old_return->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, item_change.qty, v_user_id);
        END LOOP;

        RETURN jsonb_build_object('message', 'Delete successful');
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."manage_wp_return"("p_action" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_ws_return"("p_action" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
    v_return_id UUID;
    v_old_return JSONB;
    v_new_return JSONB;
    v_return_data JSONB;
    item_change RECORD;
    v_return_invoice_no TEXT;
BEGIN
    v_user_id := auth.uid();
    v_return_id := (p_payload->>'id')::UUID;

    IF p_action = 'CREATE' OR p_action = 'UPDATE' THEN
        IF p_payload->>'return_invoice_no' IS NULL OR p_payload->>'return_invoice_no' = '' THEN
            SELECT public.generate_and_increment_invoice_no(v_user_id, 'ws_return', (p_payload->>'return_date')::date)
            INTO v_return_invoice_no;
            p_payload := jsonb_set(p_payload, '{return_invoice_no}', to_jsonb(v_return_invoice_no));
        END IF;
    END IF;

    IF p_action = 'CREATE' THEN
        -- Insert new return
        INSERT INTO public.workshop_sales_returns (user_id, return_invoice_no, return_date, original_job_card_id, customer_name, customer_id, items, reason, total_refund_amount)
        VALUES (
            v_user_id,
            p_payload->>'return_invoice_no',
            (p_payload->>'return_date')::date,
            (p_payload->>'original_job_card_id')::UUID,
            p_payload->>'customer_name',
            (p_payload->>'customer_id')::UUID,
            (p_payload->'items')::JSONB,
            p_payload->>'reason',
            (p_payload->>'total_refund_amount')::numeric
        ) RETURNING to_jsonb(workshop_sales_returns) INTO v_return_data;

        -- Increase stock
        FOR item_change IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, item_change.qty, v_user_id);
        END LOOP;
        
        RETURN v_return_data;

    ELSIF p_action = 'UPDATE' THEN
        -- Get old return
        SELECT to_jsonb(r) INTO v_old_return FROM public.workshop_sales_returns r WHERE id = v_return_id AND user_id = v_user_id;
        IF v_old_return IS NULL THEN RAISE EXCEPTION 'Return not found'; END IF;

        -- Revert old stock change (subtract back)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(v_old_return->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, -item_change.qty, v_user_id);
        END LOOP;

        -- Update return
        UPDATE public.workshop_sales_returns
        SET
            return_date = (p_payload->>'return_date')::date,
            items = (p_payload->'items')::JSONB,
            reason = p_payload->>'reason',
            total_refund_amount = (p_payload->>'total_refund_amount')::numeric
        WHERE id = v_return_id
        RETURNING to_jsonb(workshop_sales_returns) INTO v_return_data;

        -- Apply new stock change (add)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, item_change.qty, v_user_id);
        END LOOP;
        
        RETURN v_return_data;

    ELSIF p_action = 'DELETE' THEN
        -- Get old return and delete it
        DELETE FROM public.workshop_sales_returns WHERE id = v_return_id AND user_id = v_user_id
        RETURNING to_jsonb(workshop_sales_returns) INTO v_old_return;
        IF v_old_return IS NULL THEN RAISE EXCEPTION 'Return not found'; END IF;

        -- Revert stock change (subtract back)
        FOR item_change IN SELECT * FROM jsonb_to_recordset(v_old_return->'items') AS x(part_no TEXT, qty NUMERIC) LOOP
            PERFORM public.update_inventory_item_quantity(item_change.part_no, -item_change.qty, v_user_id);
        END LOOP;

        RETURN jsonb_build_object('message', 'Delete successful');
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."manage_ws_return"("p_action" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_access_keys"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  normalized jsonb;
  required_modules text[] := ARRAY[
    'customers',
    'purchases',
    'purchase_returns',
    'stock',
    'reports',
    'vehicle_invoices',
    'sales_returns',
    'bookings',
    'workshop_purchases',
    'wp_return',
    'workshop_inventory',
    'job_cards',
    'ws_return',
    'workshop_follow_up',
    'mis_report',
    'journal_entry',
    'party_ledger',
    'receipts'
  ];
  module_key text;
BEGIN
  IF NEW.access IS NULL THEN
    NEW.access := '{}'::jsonb;
  END IF;

  normalized := ('{}')::jsonb;
  
  IF jsonb_typeof(NEW.access) = 'object' THEN
    normalized := (
      SELECT jsonb_object_agg(
        CASE
          WHEN je.key LIKE 'workshop/%' THEN replace(je.key, '/', '_')
          ELSE je.key
        END,
        je.value
      )
      FROM jsonb_each(NEW.access) AS je
    );
  END IF;

  IF normalized IS NULL THEN
    normalized := '{}'::jsonb;
  END IF;

  FOREACH module_key IN ARRAY required_modules LOOP
    IF NOT (normalized ? module_key) THEN
      normalized := jsonb_set(normalized, ARRAY[module_key], to_jsonb('none'::text));
    END IF;
  END LOOP;

  NEW.access := normalized;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."normalize_access_keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_invoice_gap"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_fy TEXT;
    v_is_registered BOOLEAN;
    v_invoice_type TEXT;
    v_counter INTEGER;
    v_invoice_prefix TEXT;
    v_short_fy TEXT;
BEGIN
    v_fy := get_financial_year(OLD.invoice_date);
    v_short_fy := SUBSTRING(v_fy FROM 3 FOR 2) || SUBSTRING(v_fy FROM 8 FOR 2);

    IF TG_TABLE_NAME = 'vehicle_invoices' THEN
        v_is_registered := OLD.customer_details->>'gst' IS NOT NULL AND OLD.customer_details->>'gst' <> '';
        v_invoice_type := CASE WHEN v_is_registered THEN 'registered' ELSE 'non_registered' END;
        
        SELECT 
            CASE WHEN v_is_registered THEN s.registered_invoice_prefix ELSE s.non_registered_invoice_prefix END 
        INTO v_invoice_prefix 
        FROM settings s WHERE s.user_id = OLD.user_id;

    ELSIF TG_TABLE_NAME = 'job_cards' THEN
        v_invoice_type := 'job_card';
        SELECT s.workshop_settings->>'job_card_prefix' INTO v_invoice_prefix FROM settings s WHERE s.user_id = OLD.user_id;
    END IF;
    
    v_invoice_prefix := COALESCE(v_invoice_prefix, 'INV-');

    -- Extract counter from old invoice number
    v_counter := substring(OLD.invoice_no from E'\\-(\\d{4,})$')::integer;
    
    IF v_counter IS NOT NULL AND OLD.invoice_no = (v_invoice_prefix || v_short_fy || '-' || LPAD(v_counter::text, 4, '0')) THEN
        INSERT INTO public.gaps (user_id, invoice_type, fy, invoice_no, counter)
        VALUES (OLD.user_id, v_invoice_type, v_fy, OLD.invoice_no, v_counter);
    END IF;
    
    RETURN OLD;
END;
$_$;


ALTER FUNCTION "public"."record_invoice_gap"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."job_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_no" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "customer_id" "uuid",
    "customer_name" "text",
    "customer_address" "text",
    "customer_mobile" "text",
    "jc_no" "text",
    "kms" "text",
    "reg_no" "text",
    "frame_no" "text",
    "model" "text",
    "job_type" "text",
    "mechanic" "text",
    "next_due_date" "date",
    "parts_items" "jsonb",
    "labour_items" "jsonb",
    "denied_items" "text"[],
    "total_amount" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "customer_state" "text",
    "customer_district" "text",
    "customer_pincode" "text",
    "dob" "date",
    "part_no" "text",
    "manual_jc_no" "text",
    "customer_mobile2" "text"
);

ALTER TABLE ONLY "public"."job_cards" REPLICA IDENTITY FULL;


ALTER TABLE "public"."job_cards" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_job_card_and_update_inventory"("p_job_card_data" "jsonb", "p_is_new" boolean, "p_original_job_card" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."job_cards"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_job_card job_cards;
    v_user_id uuid := (p_job_card_data->>'user_id')::uuid;
    v_invoice_no text;
    v_new_parts jsonb;
    v_old_parts jsonb;
    v_labour_items jsonb;
    v_denied_items jsonb;
    part_rec record;
BEGIN
    -- Generate invoice if new
    IF p_is_new THEN
        v_invoice_no := public.generate_and_increment_invoice_no(
            v_user_id,
            'job_card',
            (p_job_card_data->>'invoice_date')::date
        );
        p_job_card_data := jsonb_set(p_job_card_data, '{invoice_no}', to_jsonb(v_invoice_no));
    END IF;

    -- Ensure parts_items always array
    v_new_parts := COALESCE(p_job_card_data->'parts_items', '[]'::jsonb);
    IF jsonb_typeof(v_new_parts) <> 'array' THEN 
        v_new_parts := jsonb_build_array(v_new_parts); 
    END IF;

    v_old_parts := COALESCE(p_original_job_card->'parts_items', '[]'::jsonb);
    IF jsonb_typeof(v_old_parts) <> 'array' THEN 
        v_old_parts := jsonb_build_array(v_old_parts); 
    END IF;

    -- Ensure labour_items always array
    v_labour_items := COALESCE(p_job_card_data->'labour_items', '[]'::jsonb);
    IF jsonb_typeof(v_labour_items) <> 'array' THEN 
        v_labour_items := jsonb_build_array(v_labour_items); 
    END IF;

    -- Ensure denied_items always array
    v_denied_items := COALESCE(p_job_card_data->'denied_items', '[]'::jsonb);
    IF jsonb_typeof(v_denied_items) <> 'array' THEN 
        v_denied_items := jsonb_build_array(v_denied_items); 
    END IF;

    -- Insert or Update Job Card
    INSERT INTO job_cards
    (id, user_id, invoice_no, invoice_date, customer_id, customer_name, customer_address, customer_mobile, customer_state, manual_jc_no, jc_no, kms, reg_no, frame_no, model, job_type, mechanic, next_due_date, parts_items, labour_items, denied_items, total_amount)
    VALUES (
        (p_job_card_data->>'id')::uuid,
        v_user_id,
        p_job_card_data->>'invoice_no',
        (p_job_card_data->>'invoice_date')::date,
        (p_job_card_data->>'customer_id')::uuid,
        p_job_card_data->>'customer_name',
        p_job_card_data->>'customer_address',
        p_job_card_data->>'customer_mobile',
        p_job_card_data->>'customer_state',
        p_job_card_data->>'manual_jc_no',
        p_job_card_data->>'jc_no',
        p_job_card_data->>'kms',
        p_job_card_data->>'reg_no',
        p_job_card_data->>'frame_no',
        p_job_card_data->>'model',
        p_job_card_data->>'job_type',
        p_job_card_data->>'mechanic',
        (p_job_card_data->>'next_due_date')::date,
        v_new_parts,
        v_labour_items,
        (SELECT array_agg(value) FROM jsonb_array_elements_text(v_denied_items)),
        (p_job_card_data->>'total_amount')::numeric
    )
    ON CONFLICT (id) DO UPDATE SET
        invoice_date = (p_job_card_data->>'invoice_date')::date,
        customer_id = (p_job_card_data->>'customer_id')::uuid,
        customer_name = p_job_card_data->>'customer_name',
        customer_address = p_job_card_data->>'customer_address',
        customer_mobile = p_job_card_data->>'customer_mobile',
        customer_state = p_job_card_data->>'customer_state',
        manual_jc_no = p_job_card_data->>'manual_jc_no',
        jc_no = p_job_card_data->>'jc_no',
        kms = p_job_card_data->>'kms',
        reg_no = p_job_card_data->>'reg_no',
        frame_no = p_job_card_data->>'frame_no',
        model = p_job_card_data->>'model',
        job_type = p_job_card_data->>'job_type',
        mechanic = p_job_card_data->>'mechanic',
        next_due_date = (p_job_card_data->>'next_due_date')::date,
        parts_items = v_new_parts,
        labour_items = v_labour_items,
        denied_items = (SELECT array_agg(value) FROM jsonb_array_elements_text(v_denied_items)),
        total_amount = (p_job_card_data->>'total_amount')::numeric
    RETURNING * INTO v_job_card;

    -- Track Part Changes
    CREATE TEMP TABLE part_changes (part_no text PRIMARY KEY, qty_change numeric);

    FOR part_rec IN SELECT * FROM jsonb_to_recordset(v_new_parts) AS x(part_no text, qty numeric) LOOP
      IF part_rec.part_no IS NOT NULL AND part_rec.qty > 0 THEN
        INSERT INTO part_changes (part_no, qty_change) VALUES (part_rec.part_no, -part_rec.qty)
        ON CONFLICT (part_no) DO UPDATE SET qty_change = part_changes.qty_change - part_rec.qty;
      END IF;
    END LOOP;

    FOR part_rec IN SELECT * FROM jsonb_to_recordset(v_old_parts) AS x(part_no text, qty numeric) LOOP
      IF part_rec.part_no IS NOT NULL AND part_rec.qty > 0 THEN
        INSERT INTO part_changes (part_no, qty_change) VALUES (part_rec.part_no, part_rec.qty)
        ON CONFLICT (part_no) DO UPDATE SET qty_change = part_changes.qty_change + part_rec.qty;
      END IF;
    END LOOP;

    -- Update Inventory
    FOR part_rec IN SELECT * FROM part_changes WHERE qty_change != 0 LOOP
        PERFORM public.update_inventory_item_quantity(part_rec.part_no, part_rec.qty_change, v_user_id);
    END LOOP;

    DROP TABLE part_changes;

    RETURN v_job_card;
END;
$$;


ALTER FUNCTION "public"."save_job_card_and_update_inventory"("p_job_card_data" "jsonb", "p_is_new" boolean, "p_original_job_card" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicle_invoices"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) RETURNS TABLE("invoices" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  search_query text;
  v_offset integer;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  -- Build the dynamic search query
  IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
    search_query := 'AND (
      vi.invoice_no ILIKE ''%' || p_search_term || '%''
      OR vi.customer_name ILIKE ''%' || p_search_term || '%''
      OR c.mobile1 ILIKE ''%' || p_search_term || '%''
      OR EXISTS (
        SELECT 1 FROM vehicle_invoice_items vii
        WHERE vii.invoice_id = vi.id
        AND (
          vii.chassis_no ILIKE ''%' || p_search_term || '%''
          OR vii.engine_no ILIKE ''%' || p_search_term || '%''
        )
      )
    )';
  ELSE
    search_query := '';
  END IF;

  RETURN QUERY
  EXECUTE format('
    WITH filtered_invoices AS (
      SELECT DISTINCT vi.id
      FROM vehicle_invoices vi
      LEFT JOIN customers c ON vi.customer_id = c.id
      WHERE vi.user_id = %1$L
      AND (vi.invoice_date >= %2$L OR %2$L IS NULL)
      AND (vi.invoice_date <= %3$L OR %3$L IS NULL)
      %4$s
    )
    SELECT
      (
        SELECT json_agg(inv)
        FROM (
          SELECT
            vi.*,
            (SELECT json_agg(sub) FROM (
              SELECT vii.chassis_no
              FROM vehicle_invoice_items vii
              WHERE vii.invoice_id = vi.id
            ) sub) as vehicle_invoice_items
          FROM vehicle_invoices vi
          WHERE vi.id IN (SELECT id FROM filtered_invoices)
          ORDER BY vi.invoice_date DESC, vi.created_at DESC
          LIMIT %5$L OFFSET %6$L
        ) inv
      ) as invoices,
      (
        SELECT COUNT(*) FROM filtered_invoices
      ) as total_count
  ', p_user_id, p_start_date, p_end_date, search_query, p_page_size, v_offset);
END;
$_$;


ALTER FUNCTION "public"."search_vehicle_invoices"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicle_invoices_v2"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) RETURNS TABLE("invoices" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  search_query text;
  v_offset integer;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
    search_query := 'AND (
      vi.invoice_no ILIKE ''%' || p_search_term || '%''
      OR vi.customer_name ILIKE ''%' || p_search_term || '%''
      OR c.mobile1 ILIKE ''%' || p_search_term || '%''
      OR EXISTS (
        SELECT 1 FROM vehicle_invoice_items vii
        WHERE vii.invoice_id = vi.id
        AND (
          vii.chassis_no ILIKE ''%' || p_search_term || '%''
          OR vii.engine_no ILIKE ''%' || p_search_term || '%''
        )
      )
    )';
  ELSE
    search_query := '';
  END IF;

  RETURN QUERY
  EXECUTE format('
    WITH filtered_invoices AS (
      SELECT DISTINCT vi.id
      FROM vehicle_invoices vi
      LEFT JOIN customers c ON vi.customer_id = c.id
      WHERE vi.user_id = %1$L
      AND (vi.invoice_date >= %2$L OR %2$L IS NULL)
      AND (vi.invoice_date <= %3$L OR %3$L IS NULL)
      %4$s
    ),
    paginated_invoices AS (
        SELECT id
        FROM filtered_invoices
        ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
        LIMIT %5$L OFFSET %6$L
    )
    SELECT
      (
        SELECT json_agg(inv)
        FROM (
          SELECT
            vi.*,
            (SELECT json_agg(c) FROM customers c WHERE c.id = vi.customer_id) -> 0 as customers,
            (SELECT json_agg(vii) FROM vehicle_invoice_items vii WHERE vii.invoice_id = vi.id) as vehicle_invoice_items
          FROM vehicle_invoices vi
          WHERE vi.id IN (SELECT id FROM paginated_invoices)
          ORDER BY vi.invoice_date DESC, vi.created_at DESC
        ) inv
      ) as invoices,
      (
        SELECT COUNT(*) FROM filtered_invoices
      ) as total_count
  ', p_user_id, p_start_date, p_end_date, search_query, p_page_size, v_offset);
END;
$_$;


ALTER FUNCTION "public"."search_vehicle_invoices_v2"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicle_invoices_v3"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) RETURNS TABLE("invoices" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  RETURN QUERY
  WITH filtered_invoices AS (
    SELECT DISTINCT
      vi.id
    FROM
      public.vehicle_invoices vi
    LEFT JOIN
      public.vehicle_invoice_items vii ON vi.id = vii.invoice_id
    WHERE
      vi.user_id = p_user_id
      AND (p_start_date IS NULL OR vi.invoice_date >= p_start_date)
      AND (p_end_date IS NULL OR vi.invoice_date <= p_end_date)
      AND (
        p_search_term IS NULL OR p_search_term = '' OR
        vi.invoice_no ILIKE '%' || p_search_term || '%' OR
        vi.customer_name ILIKE '%' || p_search_term || '%' OR
        (vi.customer_details->>'mobile1') ILIKE '%' || p_search_term || '%' OR
        vii.chassis_no ILIKE '%' || p_search_term || '%' OR
        vii.engine_no ILIKE '%' || p_search_term || '%'
      )
  ),
  paginated_invoices AS (
      SELECT id
      FROM filtered_invoices
      ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
      LIMIT p_page_size OFFSET v_offset
  )
  SELECT
    (
      SELECT json_agg(inv)
      FROM (
        SELECT
          vi.*,
          (SELECT json_agg(c) FROM customers c WHERE c.id = vi.customer_id) -> 0 as customers,
          (SELECT json_agg(vii_items) FROM vehicle_invoice_items vii_items WHERE vii_items.invoice_id = vi.id) as vehicle_invoice_items
        FROM vehicle_invoices vi
        WHERE vi.id IN (SELECT id FROM paginated_invoices)
        ORDER BY vi.invoice_date DESC, vi.created_at DESC
      ) inv
    ) as invoices,
    (
      SELECT COUNT(*) FROM filtered_invoices
    ) as total_count;
END;
$$;


ALTER FUNCTION "public"."search_vehicle_invoices_v3"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicle_invoices_v4"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) RETURNS TABLE("invoices" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  RETURN QUERY
  WITH filtered_invoices AS (
    SELECT DISTINCT
      vi.id
    FROM
      public.vehicle_invoices vi
    LEFT JOIN
      public.vehicle_invoice_items vii ON vi.id = vii.invoice_id
    WHERE
      vi.user_id = p_user_id
      AND (p_start_date IS NULL OR vi.invoice_date >= p_start_date)
      AND (p_end_date IS NULL OR vi.invoice_date <= p_end_date)
      AND (
        p_search_term IS NULL OR p_search_term = '' OR
        vi.invoice_no ILIKE '%' || p_search_term || '%' OR
        vi.customer_name ILIKE '%' || p_search_term || '%' OR
        (vi.customer_details->>'mobile1') ILIKE '%' || p_search_term || '%' OR
        vii.chassis_no ILIKE '%' || p_search_term || '%' OR
        vii.engine_no ILIKE '%' || p_search_term || '%'
      )
  ),
  paginated_invoices AS (
      SELECT id
      FROM filtered_invoices
      ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
      LIMIT p_page_size OFFSET v_offset
  )
  SELECT
    (
      SELECT json_agg(inv)
      FROM (
        SELECT
          vi.*,
          (SELECT json_agg(c) FROM customers c WHERE c.id = vi.customer_id) -> 0 as customers,
          (SELECT json_agg(vii_items) FROM vehicle_invoice_items vii_items WHERE vii_items.invoice_id = vi.id) as vehicle_invoice_items
        FROM vehicle_invoices vi
        WHERE vi.id IN (SELECT id FROM paginated_invoices)
        ORDER BY vi.invoice_date DESC, vi.created_at DESC
      ) inv
    ) as invoices,
    (
      SELECT COUNT(*) FROM filtered_invoices
    ) as total_count;
END;
$$;


ALTER FUNCTION "public"."search_vehicle_invoices_v4"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicle_invoices_v5"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) RETURNS TABLE("invoices" json, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := (p_page_number - 1) * p_page_size;

  RETURN QUERY
  WITH filtered_invoices AS (
    SELECT DISTINCT
      vi.id
    FROM
      public.vehicle_invoices vi
    LEFT JOIN
      public.vehicle_invoice_items vii ON vi.id = vii.invoice_id
    WHERE
      vi.user_id = p_user_id
      AND (p_start_date IS NULL OR vi.invoice_date >= p_start_date)
      AND (p_end_date IS NULL OR vi.invoice_date <= p_end_date)
      AND (
        p_search_term IS NULL OR p_search_term = '' OR
        vi.invoice_no ILIKE '%' || p_search_term || '%' OR
        vi.customer_name ILIKE '%' || p_search_term || '%' OR
        (vi.customer_details->>'mobile1') ILIKE '%' || p_search_term || '%' OR
        vii.chassis_no ILIKE '%' || p_search_term || '%' OR
        vii.engine_no ILIKE '%' || p_search_term || '%'
      )
  ),
  paginated_invoices AS (
      SELECT id
      FROM filtered_invoices
      ORDER BY (SELECT invoice_date FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC, (SELECT created_at FROM vehicle_invoices WHERE id = filtered_invoices.id) DESC
      LIMIT p_page_size OFFSET v_offset
  )
  SELECT
    (
      SELECT json_agg(inv)
      FROM (
        SELECT
          vi.*,
          (SELECT to_jsonb(c) FROM customers c WHERE c.id = vi.customer_id) as customer,
          (SELECT json_agg(vii_items) FROM vehicle_invoice_items vii_items WHERE vii_items.invoice_id = vi.id) as vehicle_invoice_items
        FROM vehicle_invoices vi
        WHERE vi.id IN (SELECT id FROM paginated_invoices)
        ORDER BY vi.invoice_date DESC, vi.created_at DESC
      ) inv
    ) as invoices,
    (
      SELECT COUNT(*) FROM filtered_invoices
    ) as total_count;
END;
$$;


ALTER FUNCTION "public"."search_vehicle_invoices_v5"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_sold_stock"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    sold_chassis_numbers TEXT[];
    deleted_count INTEGER;
    v_user_id UUID := auth.uid();
BEGIN
    -- 1. Get all chassis numbers that have been sold (are in vehicle_invoice_items)
    SELECT array_agg(DISTINCT chassis_no)
    INTO sold_chassis_numbers
    FROM public.vehicle_invoice_items
    WHERE user_id = v_user_id;

    -- 2. If there are any sold chassis numbers, delete them from the stock table
    IF array_length(sold_chassis_numbers, 1) > 0 THEN
        WITH deleted_rows AS (
            DELETE FROM public.stock
            WHERE user_id = v_user_id AND chassis_no = ANY(sold_chassis_numbers)
            RETURNING *
        )
        SELECT count(*) INTO deleted_count FROM deleted_rows;

        RETURN 'Sync complete. Removed ' || COALESCE(deleted_count, 0) || ' sold items from stock.';
    ELSE
        RETURN 'No sold items found to sync. Stock is up to date.';
    END IF;
END;
$$;


ALTER FUNCTION "public"."sync_sold_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_job_card_history"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH job_card_base AS (
        SELECT DISTINCT id, frame_no, reg_no
        FROM job_cards
        WHERE user_id = v_user_id AND (
            customer_name ILIKE '%' || p_search_term || '%' OR
            frame_no ILIKE '%' || p_search_term || '%' OR
            COALESCE(reg_no, '') ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%' OR
            (parts_items::text ILIKE '%' || p_search_term || '%') -- Search in parts items json
        )
    )
    SELECT jsonb_agg(jsonb_build_object(
        'job_card_id', jcb.id,
        'frame_no', jcb.frame_no,
        'reg_no', jcb.reg_no,
        'job_cards', (SELECT jsonb_agg(jc.*) FROM job_cards jc WHERE jc.user_id = v_user_id AND jc.id = jcb.id),
        'workshop_purchases', (
             SELECT jsonb_agg(wp.*)
             FROM workshop_purchases wp
             WHERE wp.user_id = v_user_id
             AND EXISTS (
                 SELECT 1
                 FROM jsonb_to_recordset(wp.items) AS i("partNo" text)
                 WHERE i."partNo" IN (
                     SELECT (jci->>'part_no')::text
                     FROM job_cards jc_inner, jsonb_array_elements(jc_inner.parts_items) AS jci
                     WHERE jc_inner.id = jcb.id
                 )
             )
        ),
        'wp_returns', (
            SELECT jsonb_agg(wpr.*)
            FROM workshop_purchase_returns wpr
            WHERE wpr.user_id = v_user_id
            AND EXISTS (
                SELECT 1
                FROM jsonb_to_recordset(wpr.items) AS i(part_no text)
                WHERE i.part_no IN (
                    SELECT (jci->>'part_no')::text
                    FROM job_cards jc_inner, jsonb_array_elements(jc_inner.parts_items) AS jci
                    WHERE jc_inner.id = jcb.id
                )
            )
        ),
        'ws_returns', (SELECT jsonb_agg(wsr.*) FROM workshop_sales_returns wsr WHERE wsr.user_id = v_user_id AND wsr.original_job_card_id = jcb.id)
    ))
    INTO v_result
    FROM job_card_base jcb;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_job_card_history"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH vehicle_base AS (
        SELECT 
            i.chassis_no, 
            i.engine_no, 
            i."modelName" as model_name,
            p.party_name AS customer_name, 
            p.invoice_no
        FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text, engine_no text, "modelName" text)
        WHERE p.user_id = v_user_id
        
        UNION ALL

        SELECT 
            vii.chassis_no, 
            vii.engine_no, 
            vii.model_name, 
            vi.customer_name,
            vi.invoice_no
        FROM vehicle_invoices vi 
        JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id
    ),
    distinct_vehicles AS (
        SELECT DISTINCT chassis_no, engine_no, model_name
        FROM vehicle_base
        WHERE 
            chassis_no ILIKE '%' || p_search_term || '%' OR
            engine_no ILIKE '%' || p_search_term || '%' OR
            customer_name ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%'
    )
    SELECT jsonb_agg(jsonb_build_object(
        'chassis_no', dv.chassis_no,
        'engine_no', dv.engine_no,
        'model_name', dv.model_name,
        'purchases', (SELECT jsonb_agg(p.*) FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text) WHERE p.user_id = v_user_id AND i.chassis_no = dv.chassis_no),
        'purchase_returns', (SELECT jsonb_agg(pr.*) FROM purchase_returns pr, jsonb_to_recordset(pr.items) AS i("chassisNo" text) WHERE pr.user_id = v_user_id AND i."chassisNo" = dv.chassis_no),
        'invoices', (SELECT jsonb_agg(vi.*) FROM vehicle_invoices vi JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id WHERE vi.user_id = v_user_id AND vii.chassis_no = dv.chassis_no),
        'sales_returns', (SELECT jsonb_agg(sr.*) FROM sales_returns sr, jsonb_to_recordset(sr.items) AS i(chassis_no text) WHERE sr.user_id = v_user_id AND i.chassis_no = dv.chassis_no)
    ))
    INTO v_result
    FROM distinct_vehicles dv;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v10"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_search_term TEXT := LOWER(TRIM(p_search_term));
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'purchases', (
                SELECT COALESCE(jsonb_agg(p_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        p.id,
                        p.invoice_date,
                        p.invoice_no,
                        p.party_name,
                        p.items
                    FROM public.purchases p
                    WHERE p.user_id = v_user_id AND (
                        LOWER(p.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(p.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(p.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) p_res
            ),
            'purchase_returns', (
                SELECT COALESCE(jsonb_agg(pr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        pr.id,
                        pr.return_date,
                        pr.return_invoice_no,
                        pr.party_name,
                        pr.items,
                        pr.reason
                    FROM public.purchase_returns pr
                    WHERE pr.user_id = v_user_id AND (
                        LOWER(pr.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(pr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(pr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) pr_res
            ),
            'vehicle_sales', (
                SELECT COALESCE(jsonb_agg(vs_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        vi.id,
                        vi.invoice_date,
                        vi.invoice_no,
                        vi.customer_name,
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'id', vii.id,
                                'model_name', vii.model_name,
                                'chassis_no', vii.chassis_no,
                                'engine_no', vii.engine_no,
                                'price', vii.price,
                                'colour', vii.colour,
                                'gst', vii.gst,
                                'hsn', vii.hsn,
                                'taxable_value', vii.taxable_value,
                                'cgst_rate', vii.cgst_rate,
                                'sgst_rate', vii.sgst_rate,
                                'igst_rate', vii.igst_rate,
                                'cgst_amount', vii.cgst_amount,
                                'sgst_amount', vii.sgst_amount,
                                'igst_amount', vii.igst_amount,
                                'discount', vii.discount
                            ))
                            FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id
                        ) AS items
                    FROM public.vehicle_invoices vi
                    WHERE vi.user_id = v_user_id AND (
                        LOWER(vi.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(vi.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id AND (
                                LOWER(TRIM(vii.chassis_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.engine_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.model_name)) LIKE '%' || v_clean_search_term || '%'
                            )
                        )
                    )
                ) vs_res
            ),
            'sales_returns', (
                SELECT COALESCE(jsonb_agg(sr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        sr.id,
                        sr.return_date,
                        sr.return_invoice_no,
                        sr.customer_name,
                        sr.items,
                        sr.reason
                    FROM public.sales_returns sr
                    WHERE sr.user_id = v_user_id AND (
                        LOWER(sr.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(sr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(sr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) sr_res
            )
        )
    );
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v10"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v11"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_search_term TEXT := LOWER(TRIM(p_search_term));
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'purchases', (
                SELECT COALESCE(jsonb_agg(p_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        p.id,
                        p.invoice_date,
                        p.invoice_no,
                        p.party_name,
                        p.items
                    FROM public.purchases p
                    WHERE p.user_id = v_user_id AND (
                        LOWER(p.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(p.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(p.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) p_res
            ),
            'purchase_returns', (
                SELECT COALESCE(jsonb_agg(pr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        pr.id,
                        pr.return_date,
                        pr.return_invoice_no,
                        pr.party_name,
                        pr.items,
                        pr.reason
                    FROM public.purchase_returns pr
                    WHERE pr.user_id = v_user_id AND (
                        LOWER(pr.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(pr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(pr.items) it
                            WHERE LOWER(TRIM(it->>'chassisNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engineNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) pr_res
            ),
            'vehicle_sales', (
                SELECT COALESCE(jsonb_agg(vs_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        vi.id,
                        vi.invoice_date,
                        vi.invoice_no,
                        vi.customer_name,
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'id', vii.id,
                                'model_name', vii.model_name,
                                'chassis_no', vii.chassis_no,
                                'engine_no', vii.engine_no,
                                'price', vii.price,
                                'colour', vii.colour,
                                'gst', vii.gst,
                                'hsn', vii.hsn,
                                'taxable_value', vii.taxable_value,
                                'cgst_rate', vii.cgst_rate,
                                'sgst_rate', vii.sgst_rate,
                                'igst_rate', vii.igst_rate,
                                'cgst_amount', vii.cgst_amount,
                                'sgst_amount', vii.sgst_amount,
                                'igst_amount', vii.igst_amount,
                                'discount', vii.discount
                            ))
                            FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id
                        ) AS items
                    FROM public.vehicle_invoices vi
                    WHERE vi.user_id = v_user_id AND (
                        LOWER(vi.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(vi.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id AND (
                                LOWER(TRIM(vii.chassis_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.engine_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.model_name)) LIKE '%' || v_clean_search_term || '%'
                            )
                        )
                    )
                ) vs_res
            ),
            'sales_returns', (
                SELECT COALESCE(jsonb_agg(sr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        sr.id,
                        sr.return_date,
                        sr.return_invoice_no,
                        sr.customer_name,
                        sr.items,
                        sr.reason
                    FROM public.sales_returns sr
                    WHERE sr.user_id = v_user_id AND (
                        LOWER(sr.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(sr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(sr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'model_name')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) sr_res
            )
        )
    );
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v11"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v12"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_search_term TEXT := LOWER(TRIM(p_search_term));
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'purchases', (
                SELECT COALESCE(jsonb_agg(p_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        p.id,
                        p.invoice_date,
                        p.invoice_no,
                        p.party_name,
                        p.items
                    FROM public.purchases p
                    WHERE p.user_id = v_user_id AND (
                        LOWER(p.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(p.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(p.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) p_res
            ),
            'purchase_returns', (
                SELECT COALESCE(jsonb_agg(pr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        pr.id,
                        pr.return_date,
                        pr.return_invoice_no,
                        pr.party_name,
                        pr.items,
                        pr.reason
                    FROM public.purchase_returns pr
                    WHERE pr.user_id = v_user_id AND (
                        LOWER(pr.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(pr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(pr.items) it
                            WHERE LOWER(TRIM(it->>'chassisNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engineNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) pr_res
            ),
            'vehicle_sales', (
                SELECT COALESCE(jsonb_agg(vs_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        vi.id,
                        vi.invoice_date,
                        vi.invoice_no,
                        vi.customer_name,
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'id', vii.id,
                                'model_name', vii.model_name,
                                'chassis_no', vii.chassis_no,
                                'engine_no', vii.engine_no,
                                'price', vii.price,
                                'colour', vii.colour,
                                'gst', vii.gst,
                                'hsn', vii.hsn,
                                'taxable_value', vii.taxable_value,
                                'cgst_rate', vii.cgst_rate,
                                'sgst_rate', vii.sgst_rate,
                                'igst_rate', vii.igst_rate,
                                'cgst_amount', vii.cgst_amount,
                                'sgst_amount', vii.sgst_amount,
                                'igst_amount', vii.igst_amount,
                                'discount', vii.discount
                            ))
                            FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id
                        ) AS items
                    FROM public.vehicle_invoices vi
                    WHERE vi.user_id = v_user_id AND (
                        LOWER(vi.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(vi.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id AND (
                                LOWER(TRIM(vii.chassis_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.engine_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.model_name)) LIKE '%' || v_clean_search_term || '%'
                            )
                        )
                    )
                ) vs_res
            ),
            'sales_returns', (
                SELECT COALESCE(jsonb_agg(sr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        sr.id,
                        sr.return_date,
                        sr.return_invoice_no,
                        sr.customer_name,
                        sr.items,
                        sr.reason
                    FROM public.sales_returns sr
                    WHERE sr.user_id = v_user_id AND (
                        LOWER(sr.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(sr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(sr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'model_name')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) sr_res
            )
        )
    );
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v12"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v13"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_search_term TEXT := LOWER(TRIM(p_search_term));
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'purchases', (
                SELECT COALESCE(jsonb_agg(p_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        p.id,
                        p.invoice_date,
                        p.invoice_no,
                        p.party_name,
                        p.items
                    FROM public.purchases p
                    WHERE p.user_id = v_user_id AND (
                        LOWER(p.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(p.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(p.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) p_res
            ),
            'purchase_returns', (
                SELECT COALESCE(jsonb_agg(pr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        pr.id,
                        pr.return_date,
                        pr.return_invoice_no,
                        pr.party_name,
                        pr.items,
                        pr.reason
                    FROM public.purchase_returns pr
                    WHERE pr.user_id = v_user_id AND (
                        LOWER(pr.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(pr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(pr.items) it
                            WHERE LOWER(TRIM(it->>'chassisNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engineNo')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'modelName')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) pr_res
            ),
            'vehicle_sales', (
                SELECT COALESCE(jsonb_agg(vs_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        vi.id,
                        vi.invoice_date,
                        vi.invoice_no,
                        vi.customer_name,
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'id', vii.id,
                                'model_name', vii.model_name,
                                'chassis_no', vii.chassis_no,
                                'engine_no', vii.engine_no,
                                'price', vii.price,
                                'colour', vii.colour,
                                'gst', vii.gst,
                                'hsn', vii.hsn,
                                'taxable_value', vii.taxable_value,
                                'cgst_rate', vii.cgst_rate,
                                'sgst_rate', vii.sgst_rate,
                                'igst_rate', vii.igst_rate,
                                'cgst_amount', vii.cgst_amount,
                                'sgst_amount', vii.sgst_amount,
                                'igst_amount', vii.igst_amount,
                                'discount', vii.discount
                            ))
                            FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id
                        ) AS items
                    FROM public.vehicle_invoices vi
                    WHERE vi.user_id = v_user_id AND (
                        LOWER(vi.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(vi.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id AND (
                                LOWER(TRIM(vii.chassis_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.engine_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.model_name)) LIKE '%' || v_clean_search_term || '%'
                            )
                        )
                    )
                ) vs_res
            ),
            'sales_returns', (
                SELECT COALESCE(jsonb_agg(sr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        sr.id,
                        sr.return_date,
                        sr.return_invoice_no,
                        sr.customer_name,
                        sr.items,
                        sr.reason
                    FROM public.sales_returns sr
                    WHERE sr.user_id = v_user_id AND (
                        LOWER(sr.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(sr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(sr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'model_name')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) sr_res
            )
        )
    );
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v13"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v2"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH all_events AS (
        -- Vehicle Purchases
        SELECT 
            i.chassis_no,
            i.engine_no,
            i."modelName" as model_name,
            p.id,
            p.invoice_no,
            p.invoice_date as event_date,
            'Vehicle Purchase' as event_type,
            jsonb_build_object(
                'id', p.id,
                'invoice_no', p.invoice_no,
                'invoice_date', p.invoice_date,
                'party_name', p.party_name
            ) as event_data
        FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text, engine_no text, "modelName" text)
        WHERE p.user_id = v_user_id

        UNION ALL

        -- Purchase Returns
        SELECT 
            i."chassisNo" as chassis_no,
            i."engineNo" as engine_no,
            i."modelName" as model_name,
            pr.id,
            pr.return_invoice_no as invoice_no,
            pr.return_date as event_date,
            'Purchase Return' as event_type,
            jsonb_build_object(
                'id', pr.id,
                'return_invoice_no', pr.return_invoice_no,
                'return_date', pr.return_date,
                'party_name', pr.party_name
            ) as event_data
        FROM purchase_returns pr, jsonb_to_recordset(pr.items) AS i("chassisNo" text, "engineNo" text, "modelName" text)
        WHERE pr.user_id = v_user_id

        UNION ALL

        -- Vehicle Invoices
        SELECT 
            vii.chassis_no,
            vii.engine_no,
            vii.model_name,
            vi.id,
            vi.invoice_no,
            vi.invoice_date as event_date,
            'Vehicle Invoice' as event_type,
            jsonb_build_object(
                'id', vi.id,
                'invoice_no', vi.invoice_no,
                'invoice_date', vi.invoice_date,
                'customer_name', vi.customer_name
            ) as event_data
        FROM vehicle_invoices vi JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id

        UNION ALL

        -- Sales Returns
        SELECT 
            i.chassis_no,
            i.engine_no,
            i.model_name,
            sr.id,
            sr.return_invoice_no as invoice_no,
            sr.return_date as event_date,
            'Sales Return' as event_type,
            jsonb_build_object(
                'id', sr.id,
                'return_invoice_no', sr.return_invoice_no,
                'return_date', sr.return_date,
                'customer_name', sr.customer_name
            ) as event_data
        FROM sales_returns sr, jsonb_to_recordset(sr.items) AS i(chassis_no text, engine_no text, model_name text)
        WHERE sr.user_id = v_user_id
    ),
    distinct_vehicles AS (
        SELECT DISTINCT chassis_no, engine_no, model_name
        FROM all_events
        WHERE 
            chassis_no ILIKE '%' || p_search_term || '%' OR
            engine_no ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%' OR
            (event_data->>'party_name') ILIKE '%' || p_search_term || '%' OR
            (event_data->>'customer_name') ILIKE '%' || p_search_term || '%'
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'chassis_no', dv.chassis_no,
            'engine_no', dv.engine_no,
            'model_name', dv.model_name,
            'history', (
                SELECT jsonb_agg(ae.event_data || jsonb_build_object('event_type', ae.event_type) ORDER BY ae.event_date ASC)
                FROM all_events ae
                WHERE ae.chassis_no = dv.chassis_no AND ae.engine_no = dv.engine_no
            )
        )
    )
    INTO v_result
    FROM distinct_vehicles dv;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v2"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v3"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH all_events AS (
        -- Vehicle Purchases
        SELECT 
            i.chassis_no,
            i.engine_no,
            i."modelName" as model_name,
            p.id,
            p.invoice_no,
            p.invoice_date as event_date,
            p.party_name as party_customer_name,
            'Vehicle Purchase' as event_type,
            jsonb_build_object(
                'id', p.id,
                'invoice_no', p.invoice_no,
                'invoice_date', p.invoice_date,
                'party_name', p.party_name
            ) as event_data
        FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text, engine_no text, "modelName" text)
        WHERE p.user_id = v_user_id

        UNION ALL

        -- Purchase Returns
        SELECT 
            i."chassisNo" as chassis_no,
            i."engineNo" as engine_no,
            i."modelName" as model_name,
            pr.id,
            pr.return_invoice_no as invoice_no,
            pr.return_date as event_date,
            pr.party_name as party_customer_name,
            'Purchase Return' as event_type,
            jsonb_build_object(
                'id', pr.id,
                'return_invoice_no', pr.return_invoice_no,
                'return_date', pr.return_date,
                'party_name', pr.party_name
            ) as event_data
        FROM purchase_returns pr, jsonb_to_recordset(pr.items) AS i("chassisNo" text, "engineNo" text, "modelName" text)
        WHERE pr.user_id = v_user_id

        UNION ALL

        -- Vehicle Invoices
        SELECT 
            vii.chassis_no,
            vii.engine_no,
            vii.model_name,
            vi.id,
            vi.invoice_no,
            vi.invoice_date as event_date,
            vi.customer_name as party_customer_name,
            'Vehicle Invoice' as event_type,
            jsonb_build_object(
                'id', vi.id,
                'invoice_no', vi.invoice_no,
                'invoice_date', vi.invoice_date,
                'customer_name', vi.customer_name
            ) as event_data
        FROM vehicle_invoices vi JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id

        UNION ALL

        -- Sales Returns
        SELECT 
            i.chassis_no,
            i.engine_no,
            i.model_name,
            sr.id,
            sr.return_invoice_no as invoice_no,
            sr.return_date as event_date,
            sr.customer_name as party_customer_name,
            'Sales Return' as event_type,
            jsonb_build_object(
                'id', sr.id,
                'return_invoice_no', sr.return_invoice_no,
                'return_date', sr.return_date,
                'customer_name', sr.customer_name
            ) as event_data
        FROM sales_returns sr, jsonb_to_recordset(sr.items) AS i(chassis_no text, engine_no text, model_name text)
        WHERE sr.user_id = v_user_id
    ),
    distinct_vehicles AS (
        SELECT DISTINCT chassis_no, engine_no, model_name
        FROM all_events
        WHERE 
            chassis_no ILIKE '%' || p_search_term || '%' OR
            engine_no ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%' OR
            party_customer_name ILIKE '%' || p_search_term || '%'
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'chassis_no', dv.chassis_no,
            'engine_no', dv.engine_no,
            'model_name', dv.model_name,
            'history', (
                SELECT jsonb_agg(ae.event_data || jsonb_build_object('event_type', ae.event_type) ORDER BY ae.event_date ASC)
                FROM all_events ae
                WHERE ae.chassis_no = dv.chassis_no AND ae.engine_no = dv.engine_no
            )
        )
    )
    INTO v_result
    FROM distinct_vehicles dv;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v3"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v4"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH all_events AS (
        -- Vehicle Purchases
        SELECT 
            i.chassis_no,
            i.engine_no,
            i."modelName" as model_name,
            p.id as event_id,
            p.invoice_no,
            p.invoice_date as event_date,
            p.party_name as party_customer_name,
            'Vehicle Purchase' as event_type
        FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text, engine_no text, "modelName" text)
        WHERE p.user_id = v_user_id

        UNION ALL

        -- Purchase Returns
        SELECT 
            i."chassisNo" as chassis_no,
            i."engineNo" as engine_no,
            i."modelName" as model_name,
            pr.id as event_id,
            pr.return_invoice_no as invoice_no,
            pr.return_date as event_date,
            pr.party_name as party_customer_name,
            'Purchase Return' as event_type
        FROM purchase_returns pr, jsonb_to_recordset(pr.items) AS i("chassisNo" text, "engineNo" text, "modelName" text)
        WHERE pr.user_id = v_user_id

        UNION ALL

        -- Vehicle Invoices
        SELECT 
            vii.chassis_no,
            vii.engine_no,
            vii.model_name,
            vi.id as event_id,
            vi.invoice_no,
            vi.invoice_date as event_date,
            vi.customer_name as party_customer_name,
            'Vehicle Invoice' as event_type
        FROM vehicle_invoices vi JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id

        UNION ALL

        -- Sales Returns
        SELECT 
            i.chassis_no,
            i.engine_no,
            i.model_name,
            sr.id as event_id,
            sr.return_invoice_no as invoice_no,
            sr.return_date as event_date,
            sr.customer_name as party_customer_name,
            'Sales Return' as event_type
        FROM sales_returns sr, jsonb_to_recordset(sr.items) AS i(chassis_no text, engine_no text, model_name text)
        WHERE sr.user_id = v_user_id
    ),
    distinct_vehicles AS (
        SELECT DISTINCT chassis_no, engine_no
        FROM all_events
        WHERE 
            chassis_no ILIKE '%' || p_search_term || '%' OR
            engine_no ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%' OR
            party_customer_name ILIKE '%' || p_search_term || '%'
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'chassis_no', dv.chassis_no,
            'engine_no', dv.engine_no,
            'model_name', (SELECT model_name FROM all_events WHERE chassis_no = dv.chassis_no AND engine_no = dv.engine_no AND model_name IS NOT NULL LIMIT 1),
            'history', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ae.event_id,
                        'event_type', ae.event_type,
                        'event_date', ae.event_date,
                        'invoice_no', ae.invoice_no,
                        'party_customer_name', ae.party_customer_name
                    ) ORDER BY ae.event_date ASC
                )
                FROM all_events ae
                WHERE ae.chassis_no = dv.chassis_no AND ae.engine_no = dv.engine_no
            )
        )
    )
    INTO v_result
    FROM distinct_vehicles dv;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v4"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v5"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    WITH all_events AS (
        -- Vehicle Purchases
        SELECT 
            i.chassis_no,
            i.engine_no,
            i."modelName" as model_name,
            p.id as event_id,
            p.invoice_no,
            p.invoice_date as event_date,
            p.party_name as party_customer_name,
            'Vehicle Purchase' as event_type
        FROM purchases p, jsonb_to_recordset(p.items) AS i(chassis_no text, engine_no text, "modelName" text)
        WHERE p.user_id = v_user_id

        UNION ALL

        -- Purchase Returns
        SELECT 
            i."chassisNo" as chassis_no,
            i."engineNo" as engine_no,
            i."modelName" as model_name,
            pr.id as event_id,
            pr.return_invoice_no as invoice_no,
            pr.return_date as event_date,
            pr.party_name as party_customer_name,
            'Purchase Return' as event_type
        FROM purchase_returns pr, jsonb_to_recordset(pr.items) AS i("chassisNo" text, "engineNo" text, "modelName" text)
        WHERE pr.user_id = v_user_id

        UNION ALL

        -- Vehicle Invoices
        SELECT 
            vii.chassis_no,
            vii.engine_no,
            vii.model_name,
            vi.id as event_id,
            vi.invoice_no,
            vi.invoice_date as event_date,
            vi.customer_name as party_customer_name,
            'Vehicle Invoice' as event_type
        FROM vehicle_invoices vi JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id

        UNION ALL

        -- Sales Returns
        SELECT 
            i.chassis_no,
            i.engine_no,
            i.model_name,
            sr.id as event_id,
            sr.return_invoice_no as invoice_no,
            sr.return_date as event_date,
            sr.customer_name as party_customer_name,
            'Sales Return' as event_type
        FROM sales_returns sr, jsonb_to_recordset(sr.items) AS i(chassis_no text, engine_no text, model_name text)
        WHERE sr.user_id = v_user_id
    ),
    distinct_vehicles AS (
        SELECT DISTINCT chassis_no, engine_no
        FROM all_events
        WHERE 
            chassis_no ILIKE '%' || p_search_term || '%' OR
            engine_no ILIKE '%' || p_search_term || '%' OR
            invoice_no ILIKE '%' || p_search_term || '%' OR
            party_customer_name ILIKE '%' || p_search_term || '%'
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'chassis_no', dv.chassis_no,
            'engine_no', dv.engine_no,
            'model_name', (SELECT model_name FROM all_events WHERE chassis_no = dv.chassis_no AND engine_no = dv.engine_no AND model_name IS NOT NULL LIMIT 1),
            'history', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ae.event_id,
                        'event_type', ae.event_type,
                        'event_date', ae.event_date,
                        'invoice_no', ae.invoice_no,
                        'party_customer_name', ae.party_customer_name
                    ) ORDER BY ae.event_date ASC
                )
                FROM all_events ae
                WHERE ae.chassis_no = dv.chassis_no AND ae.engine_no = dv.engine_no
            )
        )
    )
    INTO v_result
    FROM distinct_vehicles dv;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v5"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v6"("p_search_term" "text") RETURNS TABLE("id" "uuid", "module" "text", "action_date" "date", "invoice_no" "text", "party_or_customer" "text", "chassis_no" "text", "engine_no" "text", "model_name" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH all_events AS (
        -- 1. Purchases
        SELECT 
            p.id,
            'Vehicle Purchase'::text AS module,
            p.invoice_date AS action_date,
            p.invoice_no,
            p.party_name AS party_or_customer,
            item->>'chassis_no' AS chassis_no,
            item->>'engine_no' AS engine_no,
            item->>'modelName' AS model_name
        FROM purchases p, jsonb_array_elements(p.items) AS item
        WHERE p.user_id = v_user_id

        UNION ALL

        -- 2. Purchase Returns
        SELECT 
            pr.id,
            'Purchase Return'::text AS module,
            pr.return_date AS action_date,
            pr.return_invoice_no AS invoice_no,
            pr.party_name AS party_or_customer,
            item->>'chassisNo' AS chassis_no,
            item->>'engineNo' AS engine_no,
            item->>'modelName' AS model_name
        FROM purchase_returns pr, jsonb_array_elements(pr.items) AS item
        WHERE pr.user_id = v_user_id

        UNION ALL

        -- 3. Vehicle Invoices (Sales)
        SELECT 
            vi.id,
            'Vehicle Invoice'::text AS module,
            vi.invoice_date AS action_date,
            vi.invoice_no,
            vi.customer_name AS party_or_customer,
            vii.chassis_no,
            vii.engine_no,
            vii.model_name
        FROM vehicle_invoices vi
        JOIN vehicle_invoice_items vii ON vi.id = vii.invoice_id
        WHERE vi.user_id = v_user_id

        UNION ALL

        -- 4. Sales Returns
        SELECT 
            sr.id,
            'Sales Return'::text AS module,
            sr.return_date AS action_date,
            sr.return_invoice_no AS invoice_no,
            sr.customer_name AS party_or_customer,
            item->>'chassis_no' AS chassis_no,
            item->>'engine_no' AS engine_no,
            item->>'model_name' AS model_name
        FROM sales_returns sr, jsonb_array_elements(sr.items) AS item
        WHERE sr.user_id = v_user_id
    )
    SELECT 
        ae.id,
        ae.module,
        ae.action_date,
        ae.invoice_no,
        ae.party_or_customer,
        ae.chassis_no,
        ae.engine_no,
        ae.model_name
    FROM all_events ae
    WHERE 
        ae.party_or_customer ILIKE '%' || p_search_term || '%'
        OR ae.invoice_no ILIKE '%' || p_search_term || '%'
        OR ae.chassis_no ILIKE '%' || p_search_term || '%'
        OR ae.engine_no ILIKE '%' || p_search_term || '%'
    ORDER BY ae.action_date DESC;
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v6"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v7"("p_search_term" "text") RETURNS TABLE("module" "text", "action_date" "date", "invoice_no" "text", "party_or_customer" "text", "details" "jsonb", "record_id" "uuid")
    LANGUAGE "plpgsql" STABLE
    AS $$
                        BEGIN
                            RETURN QUERY

                                -- 1️⃣ Purchases
                                    SELECT 
                                            'Vehicle Purchase'::text AS module,
                                                    p.invoice_date AS action_date,
                                                            p.invoice_no,
                                                                    p.party_name AS party_or_customer,
                                                                            p.items AS details,
                                                                                    p.id AS record_id
                                                                                        FROM purchases p
                                                                                            WHERE p.party_name ILIKE '%' || p_search_term || '%'
                                                                                                   OR p.invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                          OR EXISTS (
                                                                                                                      SELECT 1 FROM jsonb_array_elements(p.items) it
                                                                                                                                  WHERE it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                 OR it->>'engine_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                         )

                                                                                                                                                             UNION ALL

                                                                                                                                                                 -- 2️⃣ Purchase Returns
                                                                                                                                                                     SELECT 
                                                                                                                                                                             'Purchase Return'::text AS module,
                                                                                                                                                                                     pr.return_date AS action_date,
                                                                                                                                                                                             pr.return_invoice_no AS invoice_no,
                                                                                                                                                                                                     pr.party_name AS party_or_customer,
                                                                                                                                                                                                             pr.items AS details,
                                                                                                                                                                                                                     pr.id AS record_id
                                                                                                                                                                                                                         FROM purchase_returns pr
                                                                                                                                                                                                                             WHERE pr.party_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                    OR pr.return_invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                           OR EXISTS (
                                                                                                                                                                                                                                                       SELECT 1 FROM jsonb_array_elements(pr.items) it
                                                                                                                                                                                                                                                                   WHERE it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                  OR it->>'engine_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                          )

                                                                                                                                                                                                                                                                                              UNION ALL

                                                                                                                                                                                                                                                                                                  -- 3️⃣ Vehicle Invoices
                                                                                                                                                                                                                                                                                                      SELECT 
                                                                                                                                                                                                                                                                                                              'Vehicle Invoice'::text AS module,
                                                                                                                                                                                                                                                                                                                      vi.invoice_date AS action_date,
                                                                                                                                                                                                                                                                                                                              vi.invoice_no,
                                                                                                                                                                                                                                                                                                                                      vi.customer_name AS party_or_customer,
                                                                                                                                                                                                                                                                                                                                              vi.items AS details,
                                                                                                                                                                                                                                                                                                                                                      vi.id AS record_id
                                                                                                                                                                                                                                                                                                                                                          FROM vehicle_invoices vi
                                                                                                                                                                                                                                                                                                                                                              WHERE vi.customer_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                     OR vi.invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                            OR EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM jsonb_array_elements(vi.items) it
                                                                                                                                                                                                                                                                                                                                                                                                    WHERE it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                   OR it->>'engine_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                           )

                                                                                                                                                                                                                                                                                                                                                                                                                               UNION ALL

                                                                                                                                                                                                                                                                                                                                                                                                                                   -- 4️⃣ Sales Returns
                                                                                                                                                                                                                                                                                                                                                                                                                                       SELECT 
                                                                                                                                                                                                                                                                                                                                                                                                                                               'Sales Return'::text AS module,
                                                                                                                                                                                                                                                                                                                                                                                                                                                       sr.return_date AS action_date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                               sr.return_invoice_no AS invoice_no,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                       sr.customer_name AS party_or_customer,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               sr.items AS details,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       sr.id AS record_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           FROM sales_returns sr
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               WHERE sr.customer_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      OR sr.return_invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             OR EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         SELECT 1 FROM jsonb_array_elements(sr.items) it
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     WHERE it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    OR it->>'engine_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            )

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ORDER BY action_date;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                $$;


ALTER FUNCTION "public"."track_vehicle_history_v7"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v8"("p_search_term" "text") RETURNS TABLE("module" "text", "action_date" "date", "invoice_no" "text", "party_or_customer" "text", "chassis_no" "text", "engine_no" "text", "model" "text", "color" "text", "price" numeric, "reason" "text", "record_id" bigint)
    LANGUAGE "plpgsql"
    AS $$
                                            BEGIN
                                                RETURN QUERY

                                                    -- 1️⃣ Purchases
                                                        SELECT 
                                                                'Vehicle Purchase'::TEXT AS module,
                                                                        p.invoice_date AS action_date,
                                                                                p.invoice_no,
                                                                                        p.party_name AS party_or_customer,
                                                                                                it->>'chassis_no' AS chassis_no,
                                                                                                        it->>'engine_no' AS engine_no,
                                                                                                                it->>'model' AS model,
                                                                                                                        it->>'color' AS color,
                                                                                                                                (it->>'price')::NUMERIC(12,2) AS price,
                                                                                                                                        NULL::TEXT AS reason,
                                                                                                                                                p.id AS record_id
                                                                                                                                                    FROM purchases p,
                                                                                                                                                             LATERAL jsonb_array_elements(p.items) it
                                                                                                                                                                 WHERE p.party_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                        OR p.invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                               OR it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                      OR it->>'engine_no' ILIKE '%' || p_search_term || '%'

                                                                                                                                                                                          UNION ALL

                                                                                                                                                                                              -- 2️⃣ Purchase Returns
                                                                                                                                                                                                  SELECT 
                                                                                                                                                                                                          'Purchase Return'::TEXT AS module,
                                                                                                                                                                                                                  pr.return_date AS action_date,
                                                                                                                                                                                                                          pr.return_invoice_no AS invoice_no,
                                                                                                                                                                                                                                  pr.party_name AS party_or_customer,
                                                                                                                                                                                                                                          it->>'chassis_no' AS chassis_no,
                                                                                                                                                                                                                                                  it->>'engine_no' AS engine_no,
                                                                                                                                                                                                                                                          it->>'model' AS model,
                                                                                                                                                                                                                                                                  it->>'color' AS color,
                                                                                                                                                                                                                                                                          (it->>'price')::NUMERIC(12,2) AS price,
                                                                                                                                                                                                                                                                                  pr.reason,
                                                                                                                                                                                                                                                                                          pr.id AS record_id
                                                                                                                                                                                                                                                                                              FROM purchase_returns pr,
                                                                                                                                                                                                                                                                                                       LATERAL jsonb_array_elements(pr.items) it
                                                                                                                                                                                                                                                                                                           WHERE pr.party_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                  OR pr.return_invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                         OR it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                OR it->>'engine_no' ILIKE '%' || p_search_term || '%'

                                                                                                                                                                                                                                                                                                                                    UNION ALL

                                                                                                                                                                                                                                                                                                                                        -- 3️⃣ Vehicle Invoices (JOIN with items table ✅)
                                                                                                                                                                                                                                                                                                                                            SELECT 
                                                                                                                                                                                                                                                                                                                                                    'Vehicle Sale'::TEXT AS module,
                                                                                                                                                                                                                                                                                                                                                            vi.invoice_date AS action_date,
                                                                                                                                                                                                                                                                                                                                                                    vi.invoice_no,
                                                                                                                                                                                                                                                                                                                                                                            vi.customer_name AS party_or_customer,
                                                                                                                                                                                                                                                                                                                                                                                    vii.chassis_no,
                                                                                                                                                                                                                                                                                                                                                                                            vii.engine_no,
                                                                                                                                                                                                                                                                                                                                                                                                    vii.model,
                                                                                                                                                                                                                                                                                                                                                                                                            vii.color,
                                                                                                                                                                                                                                                                                                                                                                                                                    vii.price,
                                                                                                                                                                                                                                                                                                                                                                                                                            NULL::TEXT AS reason,
                                                                                                                                                                                                                                                                                                                                                                                                                                    vi.id AS record_id
                                                                                                                                                                                                                                                                                                                                                                                                                                        FROM vehicle_invoices vi
                                                                                                                                                                                                                                                                                                                                                                                                                                            JOIN vehicle_invoice_items vii ON vii.invoice_id = vi.id
                                                                                                                                                                                                                                                                                                                                                                                                                                                WHERE vi.customer_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                       OR vi.invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                              OR vii.chassis_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     OR vii.engine_no ILIKE '%' || p_search_term || '%'

                                                                                                                                                                                                                                                                                                                                                                                                                                                                         UNION ALL

                                                                                                                                                                                                                                                                                                                                                                                                                                                                             -- 4️⃣ Sales Returns
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 SELECT 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         'Sales Return'::TEXT AS module,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 sr.return_date AS action_date,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         sr.return_invoice_no AS invoice_no,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 sr.customer_name AS party_or_customer,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         it->>'chassis_no' AS chassis_no,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 it->>'engine_no' AS engine_no,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         it->>'model' AS model,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 it->>'color' AS color,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         (it->>'price')::NUMERIC(12,2) AS price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 sr.reason,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         sr.id AS record_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             FROM sales_returns sr,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      LATERAL jsonb_array_elements(sr.items) it
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          WHERE sr.customer_name ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 OR sr.return_invoice_no ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        OR it->>'chassis_no' ILIKE '%' || p_search_term || '%'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               OR it->>'engine_no' ILIKE '%' || p_search_term || '%'

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ORDER BY action_date;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   $$;


ALTER FUNCTION "public"."track_vehicle_history_v8"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_vehicle_history_v9"("p_search_term" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_search_term TEXT := LOWER(TRIM(p_search_term));
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'purchases', (
                SELECT COALESCE(jsonb_agg(p_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        p.id,
                        p.invoice_date,
                        p.invoice_no,
                        p.party_name,
                        p.items
                    FROM public.purchases p
                    WHERE p.user_id = v_user_id AND (
                        LOWER(p.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(p.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(p.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) p_res
            ),
            'purchase_returns', (
                SELECT COALESCE(jsonb_agg(pr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        pr.id,
                        pr.return_date,
                        pr.return_invoice_no,
                        pr.party_name,
                        pr.items,
                        pr.reason
                    FROM public.purchase_returns pr
                    WHERE pr.user_id = v_user_id AND (
                        LOWER(pr.party_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(pr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(pr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) pr_res
            ),
            'vehicle_sales', (
                SELECT COALESCE(jsonb_agg(vs_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        vi.id,
                        vi.invoice_date,
                        vi.invoice_no,
                        vi.customer_name,
                        (SELECT jsonb_agg(vii) FROM public.vehicle_invoice_items vii WHERE vii.invoice_id = vi.id) as items
                    FROM public.vehicle_invoices vi
                    WHERE vi.user_id = v_user_id AND (
                        LOWER(vi.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(vi.invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM public.vehicle_invoice_items vii
                            WHERE vii.invoice_id = vi.id AND (
                                LOWER(TRIM(vii.chassis_no)) LIKE '%' || v_clean_search_term || '%'
                                OR LOWER(TRIM(vii.engine_no)) LIKE '%' || v_clean_search_term || '%'
                            )
                        )
                    )
                ) vs_res
            ),
            'sales_returns', (
                SELECT COALESCE(jsonb_agg(sr_res), '[]'::jsonb)
                FROM (
                    SELECT 
                        sr.id,
                        sr.return_date,
                        sr.return_invoice_no,
                        sr.customer_name,
                        sr.items,
                        sr.reason
                    FROM public.sales_returns sr
                    WHERE sr.user_id = v_user_id AND (
                        LOWER(sr.customer_name) LIKE '%' || v_clean_search_term || '%'
                        OR LOWER(sr.return_invoice_no) LIKE '%' || v_clean_search_term || '%'
                        OR EXISTS (
                            SELECT 1 FROM jsonb_array_elements(sr.items) it
                            WHERE LOWER(TRIM(it->>'chassis_no')) LIKE '%' || v_clean_search_term || '%'
                               OR LOWER(TRIM(it->>'engine_no')) LIKE '%' || v_clean_search_term || '%'
                        )
                    )
                ) sr_res
            )
        )
    );
END;
$$;


ALTER FUNCTION "public"."track_vehicle_history_v9"("p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_from_purchases"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    item JSONB;
    part_id TEXT;
    qty INT;
BEGIN
    -- On DELETE, subtract quantities of old items
    IF TG_OP = 'DELETE' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
        LOOP
            part_id := item->>'partNo';
            qty := (item->>'qty')::INT;

            IF part_id IS NOT NULL AND qty IS NOT NULL THEN
                PERFORM public.update_inventory_item_quantity(part_id, -qty, OLD.user_id, NULL);
            END IF;
        END LOOP;
        RETURN OLD;
    END IF;

    -- On INSERT, add quantities of new items with full details
    IF TG_OP = 'INSERT' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            part_id := item->>'partNo';
            qty := (item->>'qty')::INT;

            IF part_id IS NOT NULL AND qty IS NOT NULL THEN
                PERFORM public.update_inventory_item_quantity(part_id, qty, NEW.user_id, item);
            END IF;
        END LOOP;
        RETURN NEW;
    END IF;

    -- On UPDATE, calculate the difference and apply it
    IF TG_OP = 'UPDATE' THEN
        -- Temporary table to store changes
        CREATE TEMP TABLE part_changes (part_no TEXT PRIMARY KEY, qty_change INT, item_data JSONB);

        -- Subtract old quantities
        FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
        LOOP
            part_id := item->>'partNo';
            qty := (item->>'qty')::INT;
            IF part_id IS NOT NULL AND qty IS NOT NULL THEN
                INSERT INTO part_changes (part_no, qty_change)
                VALUES (part_id, -qty)
                ON CONFLICT (part_no) DO UPDATE
                SET qty_change = part_changes.qty_change - qty;
            END IF;
        END LOOP;

        -- Add new quantities and store item data for potential inserts/updates
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            part_id := item->>'partNo';
            qty := (item->>'qty')::INT;
            IF part_id IS NOT NULL AND qty IS NOT NULL THEN
                INSERT INTO part_changes (part_no, qty_change, item_data)
                VALUES (part_id, qty, item)
                ON CONFLICT (part_no) DO UPDATE
                SET qty_change = part_changes.qty_change + qty,
                    item_data = EXCLUDED.item_data;
            END IF;
        END LOOP;

        -- Apply the net changes to the inventory
        FOR part_id, qty, item IN SELECT part_no, qty_change, item_data FROM part_changes
        LOOP
            IF qty != 0 THEN
                PERFORM public.update_inventory_item_quantity(part_id, qty, NEW.user_id, item);
            END IF;
        END LOOP;

        DROP TABLE part_changes;
        RETURN NEW;
    END IF;

    RETURN NULL; -- Should not happen
END;
$$;


ALTER FUNCTION "public"."update_inventory_from_purchases"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_item_quantity"("p_part_no" "text", "p_quantity_change" numeric, "p_user_id" "uuid", "p_item_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_quantity integer;
    v_settings record;
    v_prevent_negative_stock boolean;
BEGIN
    -- Get user settings
    SELECT workshop_settings INTO v_settings FROM public.settings WHERE user_id = p_user_id;
    v_prevent_negative_stock := COALESCE((v_settings.workshop_settings ->> 'prevent_negative_stock')::boolean, false);

    -- Lock the row to prevent race conditions
    LOCK TABLE public.workshop_inventory IN ROW EXCLUSIVE MODE;

    -- Check current quantity
    SELECT quantity INTO v_current_quantity
    FROM public.workshop_inventory
    WHERE part_no = p_part_no AND user_id = p_user_id;

    -- If item does not exist in inventory, create it
    IF NOT FOUND THEN
        IF p_quantity_change < 0 AND v_prevent_negative_stock THEN
            RAISE EXCEPTION 'Stock for part no: % does not exist. Cannot decrease stock.', p_part_no;
        END IF;
        
        INSERT INTO public.workshop_inventory (
            part_no, user_id, quantity, part_name, hsn_code, purchase_rate, sale_rate, gst, category, uom, last_updated
        ) VALUES (
            p_part_no, 
            p_user_id, 
            p_quantity_change,
            p_item_data->>'partName',
            p_item_data->>'hsn',
            (p_item_data->>'purchaseRate')::numeric,
            (p_item_data->>'saleRate')::numeric,
            (p_item_data->>'gst')::numeric,
            p_item_data->>'category',
            p_item_data->>'uom',
            now()
        );
        RETURN;
    END IF;

    -- If item exists, update its quantity
    IF v_prevent_negative_stock AND (v_current_quantity + p_quantity_change < 0) THEN
        RAISE EXCEPTION 'Stock for part no: % cannot be negative. Current stock: %, Change: %',
        p_part_no, v_current_quantity, p_quantity_change;
    END IF;

    UPDATE public.workshop_inventory
    SET 
        quantity = quantity + p_quantity_change,
        -- Also update other details if provided, ensuring we don't nullify existing data
        part_name = COALESCE(p_item_data->>'partName', part_name),
        hsn_code = COALESCE(p_item_data->>'hsn', hsn_code),
        purchase_rate = COALESCE((p_item_data->>'purchaseRate')::numeric, purchase_rate),
        sale_rate = COALESCE((p_item_data->>'saleRate')::numeric, sale_rate),
        gst = COALESCE((p_item_data->>'gst')::numeric, gst),
        category = COALESCE(p_item_data->>'category', category),
        uom = COALESCE(p_item_data->>'uom', uom),
        last_updated = now()
    WHERE 
        part_no = p_part_no AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_inventory_item_quantity"("p_part_no" "text", "p_quantity_change" numeric, "p_user_id" "uuid", "p_item_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_and_update_inventory"("p_items" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    item_record record;
BEGIN
    FOR item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "partNo" text, "partName" text, "hsn" text, "purchaseRate" numeric, 
        "saleRate" numeric, "gst" numeric, "category" text, "uom" text
    )
    LOOP
        INSERT INTO public.workshop_inventory (
            part_no, part_name, hsn_code, purchase_rate, sale_rate, gst, category, uom, user_id, quantity, last_updated
        )
        VALUES (
            item_record."partNo",
            COALESCE(item_record."partName", 'N/A'),
            COALESCE(item_record.hsn, ''),
            COALESCE(item_record."purchaseRate", 0),
            COALESCE(item_record."saleRate", 0),
            COALESCE(item_record.gst, 0),
            COALESCE(item_record.category, ''),
            COALESCE(item_record.uom, ''),
            p_user_id,
            0, -- Initial quantity is set to 0, it will be updated by quantity_change
            now()
        )
        ON CONFLICT (part_no, user_id) DO UPDATE SET
            part_name = EXCLUDED.part_name,
            hsn_code = EXCLUDED.hsn_code,
            purchase_rate = EXCLUDED.purchase_rate,
            sale_rate = EXCLUDED.sale_rate,
            gst = EXCLUDED.gst,
            category = EXCLUDED.category,
            uom = EXCLUDED.uom,
            last_updated = now();
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."upsert_and_update_inventory"("p_items" "jsonb", "p_user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "device_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."active_sessions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_sessions_view" AS
 SELECT "user_id",
    "count"(*) AS "session_count",
    "jsonb_agg"("device_info") AS "device_infos"
   FROM "public"."active_sessions"
  GROUP BY "user_id";


ALTER VIEW "public"."active_sessions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "booking_date" "date" NOT NULL,
    "receipt_no" "text",
    "customer_name" "text" NOT NULL,
    "mobile_no" "text",
    "booking_amount" numeric,
    "payment_mode" "text",
    "delivery_date" "date",
    "remark" "text",
    "status" "text" DEFAULT 'Open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "custom_fields" "jsonb",
    "model_name" "text",
    "colour" "text"
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" "text" NOT NULL,
    "guardian_name" "text",
    "guardian_type" "text",
    "mobile1" "text" NOT NULL,
    "mobile2" "text",
    "dob" "date",
    "address" "text",
    "state" "text",
    "district" "text",
    "pincode" "text",
    "gst" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);

ALTER TABLE ONLY "public"."customers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_report_settings" (
    "user_id" "uuid" NOT NULL,
    "chassis_sync_enabled" boolean DEFAULT false,
    "chassis_linking_mandatory" boolean DEFAULT false,
    "restore_on_delete" boolean DEFAULT false,
    "field_visibility" "jsonb" DEFAULT '{"expenses": true, "paytmLog": true, "currencyLog": true}'::"jsonb"
);


ALTER TABLE "public"."daily_report_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "report_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "challan_no" "text",
    "party_type" "text",
    "party_name" "text",
    "mobile_no" "text",
    "chassis_no" "text",
    "on_road_price" numeric,
    "cash_amount" numeric,
    "online_amount" numeric,
    "dues_amount" numeric,
    "booking_receipt_no" "text",
    "booking_amount" numeric,
    "remark" "text",
    "expenses" "jsonb",
    "currency_log" "jsonb",
    "paytm_log" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."data_entries" REPLICA IDENTITY FULL;


ALTER TABLE "public"."data_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" "text",
    "rating" integer,
    "experience" "text" NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gaps" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "invoice_type" "text" NOT NULL,
    "fy" "text" NOT NULL,
    "invoice_no" "text" NOT NULL,
    "counter" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gaps" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."gaps_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."gaps_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."gaps_id_seq" OWNED BY "public"."gaps"."id";



CREATE TABLE IF NOT EXISTS "public"."invoice_sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "invoice_type" "text" NOT NULL,
    "fiscal_year" "text" NOT NULL,
    "last_number" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_no" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "customer_id" "uuid",
    "customer_name" "text" NOT NULL,
    "customer_type" "text",
    "items" "jsonb",
    "total_amount" numeric,
    "custom_field_values" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);

ALTER TABLE ONLY "public"."invoices" REPLICA IDENTITY FULL;


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entry_type" "text" NOT NULL,
    "entry_date" "date" NOT NULL,
    "party_id" "uuid",
    "party_name" "text" NOT NULL,
    "chassis_no" "text",
    "price" numeric,
    "particulars" "text",
    "narration" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "model_name" "text",
    "invoice_no" "text",
    "remark" "text"
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."premium_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "file_url" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."premium_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_list" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "model_name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "gst" numeric,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "validity_days" integer NOT NULL,
    "used_by" "uuid",
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "status" "text" DEFAULT 'active'::"text"
);

ALTER TABLE ONLY "public"."product_keys" REPLICA IDENTITY FULL;


ALTER TABLE "public"."product_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "return_invoice_no" "text" NOT NULL,
    "return_date" "date" NOT NULL,
    "original_purchase_id" "uuid",
    "party_name" "text" NOT NULL,
    "items" "jsonb" NOT NULL,
    "reason" "text",
    "total_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."purchase_returns" REPLICA IDENTITY FULL;


ALTER TABLE "public"."purchase_returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "serial_no" integer NOT NULL,
    "invoice_date" "date" NOT NULL,
    "invoice_no" "text" NOT NULL,
    "party_name" "text" NOT NULL,
    "items" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "category" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."purchases" REPLICA IDENTITY FULL;


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."purchases_serial_no_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchases_serial_no_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."purchases_serial_no_seq" OWNED BY "public"."purchases"."serial_no";



CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "receipt_date" "date" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "payment_mode" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "narration" "text",
    "journal_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "return_invoice_no" "text" NOT NULL,
    "return_date" "date" NOT NULL,
    "original_invoice_id" "uuid",
    "customer_id" "uuid",
    "items" "jsonb" NOT NULL,
    "reason" "text",
    "total_refund_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "customer_name" "text"
);

ALTER TABLE ONLY "public"."sales_returns" REPLICA IDENTITY FULL;


ALTER TABLE "public"."sales_returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "company_name" "text",
    "gst_no" "text",
    "pan" "text",
    "mobile" "text",
    "address" "text",
    "state" "text",
    "district" "text",
    "pin_code" "text",
    "registered_invoice_prefix" "text",
    "non_registered_invoice_prefix" "text",
    "registered_invoice_counter" integer,
    "non_registered_invoice_counter" integer,
    "non_reg_fields" "jsonb",
    "custom_fields" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "enable_extra_charges" boolean DEFAULT false,
    "extra_charges_mandatory_for_unregistered" boolean DEFAULT false,
    "fy_counters" "jsonb",
    "workshop_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "business_type" "text" DEFAULT 'workshop'::"text",
    "bank_details" "jsonb",
    "company_logo_url" "text",
    "upi_qr_code_url" "text",
    "terms_and_conditions" "text",
    "booking_settings" "jsonb"
);

ALTER TABLE ONLY "public"."settings" REPLICA IDENTITY FULL;


ALTER TABLE "public"."settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."settings"."fy_counters" IS 'Stores invoice counters for each financial year, e.g., {"24-25": {"registered": 10, "unregistered": 25, "job_card": 15}}';



CREATE TABLE IF NOT EXISTS "public"."stock" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid",
    "model_name" "text" NOT NULL,
    "chassis_no" "text" NOT NULL,
    "engine_no" "text" NOT NULL,
    "colour" "text" NOT NULL,
    "hsn" "text" DEFAULT '8711'::"text",
    "gst" "text" DEFAULT '28'::"text",
    "price" numeric DEFAULT 0,
    "purchase_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "category" "text"
);

ALTER TABLE ONLY "public"."stock" REPLICA IDENTITY FULL;


ALTER TABLE "public"."stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tool_name" "text" NOT NULL,
    "tool_description" "text",
    "email" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."tool_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "access" "jsonb" DEFAULT '{"showroom": "none", "workshop": "none"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "app_valid_till" "date",
    "max_devices" integer DEFAULT 1
);

ALTER TABLE ONLY "public"."users" REPLICA IDENTITY FULL;


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid",
    "user_id" "uuid",
    "model_name" "text" NOT NULL,
    "chassis_no" "text" NOT NULL,
    "engine_no" "text" NOT NULL,
    "price" numeric NOT NULL,
    "colour" "text",
    "gst" "text",
    "hsn" "text",
    "taxable_value" numeric,
    "cgst_rate" numeric,
    "sgst_rate" numeric,
    "igst_rate" numeric,
    "cgst_amount" numeric,
    "sgst_amount" numeric,
    "igst_amount" numeric,
    "discount" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."vehicle_invoice_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."vehicle_invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "invoice_no" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "customer_name" "text" NOT NULL,
    "total_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid",
    "customer_details" "jsonb",
    "registration_amount" numeric DEFAULT 0,
    "insurance_amount" numeric DEFAULT 0,
    "accessories_amount" numeric DEFAULT 0,
    "extra_charges" "jsonb"
);

ALTER TABLE ONLY "public"."vehicle_invoices" REPLICA IDENTITY FULL;


ALTER TABLE "public"."vehicle_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_card_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "remark" "text",
    "next_follow_up_date" "date",
    "appointment_datetime" timestamp with time zone,
    "followed_up_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vehicle_invoice_id" "uuid",
    CONSTRAINT "check_source_id" CHECK ((("job_card_id" IS NOT NULL) OR ("vehicle_invoice_id" IS NOT NULL)))
);


ALTER TABLE "public"."workshop_follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "part_no" "text" NOT NULL,
    "part_name" "text" NOT NULL,
    "hsn_code" "text",
    "purchase_rate" numeric,
    "sale_rate" numeric,
    "quantity" integer DEFAULT 0,
    "gst" numeric,
    "category" "text",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "uom" "text"
);

ALTER TABLE ONLY "public"."workshop_inventory" REPLICA IDENTITY FULL;


ALTER TABLE "public"."workshop_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_labour_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "hsn_code" "text",
    "rate" numeric NOT NULL,
    "discount" numeric DEFAULT 0,
    "gst_rate" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workshop_labour_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_purchase_returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "return_invoice_no" "text" NOT NULL,
    "return_date" "date" NOT NULL,
    "original_purchase_id" "uuid",
    "party_name" "text" NOT NULL,
    "items" "jsonb" NOT NULL,
    "reason" "text",
    "total_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."workshop_purchase_returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "serial_no" integer NOT NULL,
    "invoice_no" "text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "party_name" "text" NOT NULL,
    "items" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);

ALTER TABLE ONLY "public"."workshop_purchases" REPLICA IDENTITY FULL;


ALTER TABLE "public"."workshop_purchases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."workshop_purchases_serial_no_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."workshop_purchases_serial_no_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."workshop_purchases_serial_no_seq" OWNED BY "public"."workshop_purchases"."serial_no";



CREATE TABLE IF NOT EXISTS "public"."workshop_sales_returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "return_invoice_no" "text" NOT NULL,
    "return_date" "date" NOT NULL,
    "original_job_card_id" "uuid",
    "customer_name" "text" NOT NULL,
    "customer_id" "uuid",
    "items" "jsonb" NOT NULL,
    "reason" "text",
    "total_refund_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."workshop_sales_returns" OWNER TO "postgres";


ALTER TABLE ONLY "public"."gaps" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."gaps_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."purchases" ALTER COLUMN "serial_no" SET DEFAULT "nextval"('"public"."purchases_serial_no_seq"'::"regclass");



ALTER TABLE ONLY "public"."workshop_purchases" ALTER COLUMN "serial_no" SET DEFAULT "nextval"('"public"."workshop_purchases_serial_no_seq"'::"regclass");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_session_id_key" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_report_settings"
    ADD CONSTRAINT "daily_report_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_entries"
    ADD CONSTRAINT "data_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gaps"
    ADD CONSTRAINT "gaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_sequences"
    ADD CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_sequences"
    ADD CONSTRAINT "invoice_sequences_user_id_invoice_type_fiscal_year_key" UNIQUE ("user_id", "invoice_type", "fiscal_year");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_no_user_id_key" UNIQUE ("invoice_no", "user_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_invoice_no_key" UNIQUE ("user_id", "invoice_no");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_user_id_invoice_no_key" UNIQUE ("user_id", "invoice_no");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."premium_products"
    ADD CONSTRAINT "premium_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_list"
    ADD CONSTRAINT "price_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_list"
    ADD CONSTRAINT "price_list_user_id_model_name_key" UNIQUE ("user_id", "model_name");



ALTER TABLE ONLY "public"."product_keys"
    ADD CONSTRAINT "product_keys_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."product_keys"
    ADD CONSTRAINT "product_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_returns"
    ADD CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_invoice_no_key" UNIQUE ("user_id", "invoice_no");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_invoice_no_unique" UNIQUE ("user_id", "invoice_no");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_serial_no_key" UNIQUE ("user_id", "serial_no");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_returns"
    ADD CONSTRAINT "sales_returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_chassis_no_user_id_key" UNIQUE ("chassis_no", "user_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_chassis_no_user_id_unique" UNIQUE ("chassis_no", "user_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_user_id_chassis_no_key" UNIQUE ("user_id", "chassis_no");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_user_id_engine_no_key" UNIQUE ("user_id", "engine_no");



ALTER TABLE ONLY "public"."tool_requests"
    ADD CONSTRAINT "tool_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_invoice_items"
    ADD CONSTRAINT "vehicle_invoice_items_invoice_id_chassis_no_key" UNIQUE ("invoice_id", "chassis_no");



ALTER TABLE ONLY "public"."vehicle_invoice_items"
    ADD CONSTRAINT "vehicle_invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_invoices"
    ADD CONSTRAINT "vehicle_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_invoices"
    ADD CONSTRAINT "vehicle_invoices_user_id_invoice_no_key" UNIQUE ("user_id", "invoice_no");



ALTER TABLE ONLY "public"."workshop_follow_ups"
    ADD CONSTRAINT "workshop_follow_ups_job_card_id_key" UNIQUE ("job_card_id");



ALTER TABLE ONLY "public"."workshop_follow_ups"
    ADD CONSTRAINT "workshop_follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_inventory"
    ADD CONSTRAINT "workshop_inventory_part_no_key" UNIQUE ("part_no");



ALTER TABLE ONLY "public"."workshop_inventory"
    ADD CONSTRAINT "workshop_inventory_part_no_user_id_key" UNIQUE ("part_no", "user_id");



ALTER TABLE ONLY "public"."workshop_inventory"
    ADD CONSTRAINT "workshop_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_inventory"
    ADD CONSTRAINT "workshop_inventory_user_id_part_no_key" UNIQUE ("user_id", "part_no");



ALTER TABLE ONLY "public"."workshop_labour_items"
    ADD CONSTRAINT "workshop_labour_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_labour_items"
    ADD CONSTRAINT "workshop_labour_items_user_id_item_name_key" UNIQUE ("user_id", "item_name");



ALTER TABLE ONLY "public"."workshop_purchase_returns"
    ADD CONSTRAINT "workshop_purchase_returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_purchases"
    ADD CONSTRAINT "workshop_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_sales_returns"
    ADD CONSTRAINT "workshop_sales_returns_pkey" PRIMARY KEY ("id");



CREATE INDEX "active_sessions_user_id_idx" ON "public"."active_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_customers_user_id" ON "public"."customers" USING "btree" ("user_id");



CREATE INDEX "idx_daily_report_settings_user_id" ON "public"."daily_report_settings" USING "btree" ("user_id");



CREATE INDEX "idx_daily_reports_user_id" ON "public"."daily_reports" USING "btree" ("user_id");



CREATE INDEX "idx_data_entries_user_id" ON "public"."data_entries" USING "btree" ("user_id");



CREATE INDEX "idx_gaps_user_id" ON "public"."gaps" USING "btree" ("user_id");



CREATE INDEX "idx_job_cards_next_due_date" ON "public"."job_cards" USING "btree" ("next_due_date");



CREATE INDEX "idx_job_cards_search" ON "public"."job_cards" USING "gin" ("customer_name" "public"."gin_trgm_ops", "customer_mobile" "public"."gin_trgm_ops", "frame_no" "public"."gin_trgm_ops");



CREATE INDEX "idx_job_cards_user_id" ON "public"."job_cards" USING "btree" ("user_id");



CREATE INDEX "idx_job_cards_user_next_due_date" ON "public"."job_cards" USING "btree" ("user_id", "next_due_date");



CREATE UNIQUE INDEX "idx_job_cards_user_unique" ON "public"."job_cards" USING "btree" ("user_id", "invoice_no");



CREATE INDEX "idx_journal_entries_user_id" ON "public"."journal_entries" USING "btree" ("user_id");



CREATE INDEX "idx_price_list_user_id" ON "public"."price_list" USING "btree" ("user_id");



CREATE INDEX "idx_purchase_returns_user_id" ON "public"."purchase_returns" USING "btree" ("user_id");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_receipts_user_id" ON "public"."receipts" USING "btree" ("user_id");



CREATE INDEX "idx_sales_returns_user_id" ON "public"."sales_returns" USING "btree" ("user_id");



CREATE INDEX "idx_stock_user_id" ON "public"."stock" USING "btree" ("user_id");



CREATE INDEX "idx_vehicle_invoice_items_chassis_no" ON "public"."vehicle_invoice_items" USING "gin" ("chassis_no" "public"."gin_trgm_ops");



CREATE INDEX "idx_vehicle_invoice_items_chassis_no_trgm" ON "public"."vehicle_invoice_items" USING "gin" ("chassis_no" "public"."gin_trgm_ops");



CREATE INDEX "idx_vehicle_invoice_items_engine_no" ON "public"."vehicle_invoice_items" USING "gin" ("engine_no" "public"."gin_trgm_ops");



CREATE INDEX "idx_vehicle_invoice_items_engine_no_trgm" ON "public"."vehicle_invoice_items" USING "gin" ("engine_no" "public"."gin_trgm_ops");



CREATE INDEX "idx_vehicle_invoice_items_invoice_id" ON "public"."vehicle_invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_vehicle_invoice_items_user_id" ON "public"."vehicle_invoice_items" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_vehicle_invoice_user_unique" ON "public"."vehicle_invoices" USING "btree" ("user_id", "invoice_no");



CREATE INDEX "idx_vehicle_invoices_customer_id" ON "public"."vehicle_invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_vehicle_invoices_customer_name" ON "public"."vehicle_invoices" USING "gin" ("customer_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_vehicle_invoices_invoice_date" ON "public"."vehicle_invoices" USING "btree" ("invoice_date");



CREATE INDEX "idx_vehicle_invoices_user_id" ON "public"."vehicle_invoices" USING "btree" ("user_id");



CREATE INDEX "idx_vehicle_invoices_user_id_invoice_date" ON "public"."vehicle_invoices" USING "btree" ("user_id", "invoice_date" DESC);



CREATE INDEX "idx_vehicle_invoices_user_invoice_date_gst" ON "public"."vehicle_invoices" USING "btree" ("user_id", "invoice_date", (("customer_details" ->> 'gst'::"text")));



CREATE INDEX "idx_workshop_follow_ups_job_card_id" ON "public"."workshop_follow_ups" USING "btree" ("job_card_id");



CREATE INDEX "idx_workshop_follow_ups_next_follow_up_date" ON "public"."workshop_follow_ups" USING "btree" ("next_follow_up_date");



CREATE INDEX "idx_workshop_follow_ups_user_id" ON "public"."workshop_follow_ups" USING "btree" ("user_id");



CREATE INDEX "idx_workshop_inventory_user_id" ON "public"."workshop_inventory" USING "btree" ("user_id");



CREATE INDEX "idx_workshop_labour_items_user_id" ON "public"."workshop_labour_items" USING "btree" ("user_id");



CREATE INDEX "idx_workshop_purchase_returns_user_id" ON "public"."workshop_purchase_returns" USING "btree" ("user_id");



CREATE INDEX "idx_workshop_purchases_user_id" ON "public"."workshop_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_workshop_sales_returns_user_id" ON "public"."workshop_sales_returns" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "delete_from_stock_on_sale" AFTER INSERT ON "public"."vehicle_invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_stock_deletion_on_sale"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_booking_update" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_job_card_delete" AFTER DELETE ON "public"."job_cards" FOR EACH ROW EXECUTE FUNCTION "public"."record_invoice_gap"();



CREATE OR REPLACE TRIGGER "on_vehicle_invoice_delete" AFTER DELETE ON "public"."vehicle_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."record_invoice_gap"();



CREATE OR REPLACE TRIGGER "trg_normalize_access" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_access_keys"();



CREATE OR REPLACE TRIGGER "trg_update_inventory" AFTER INSERT OR DELETE OR UPDATE ON "public"."workshop_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_from_purchases"();



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daily_report_settings"
    ADD CONSTRAINT "daily_report_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_entries"
    ADD CONSTRAINT "data_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_keys"
    ADD CONSTRAINT "fk_created_by_user" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_returns"
    ADD CONSTRAINT "fk_purchase_returns_original_purchase" FOREIGN KEY ("original_purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_returns"
    ADD CONSTRAINT "fk_sales_returns_customer" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_returns"
    ADD CONSTRAINT "fk_sales_returns_original_invoice" FOREIGN KEY ("original_invoice_id") REFERENCES "public"."vehicle_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_keys"
    ADD CONSTRAINT "fk_used_by_user" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gaps"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_follow_ups"
    ADD CONSTRAINT "fk_vehicle_invoice" FOREIGN KEY ("vehicle_invoice_id") REFERENCES "public"."vehicle_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."premium_products"
    ADD CONSTRAINT "premium_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_list"
    ADD CONSTRAINT "price_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_returns"
    ADD CONSTRAINT "purchase_returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sales_returns"
    ADD CONSTRAINT "sales_returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_invoice_items"
    ADD CONSTRAINT "vehicle_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."vehicle_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_invoice_items"
    ADD CONSTRAINT "vehicle_invoice_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."vehicle_invoices"
    ADD CONSTRAINT "vehicle_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."vehicle_invoices"
    ADD CONSTRAINT "vehicle_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workshop_follow_ups"
    ADD CONSTRAINT "workshop_follow_ups_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_follow_ups"
    ADD CONSTRAINT "workshop_follow_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_inventory"
    ADD CONSTRAINT "workshop_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workshop_labour_items"
    ADD CONSTRAINT "workshop_labour_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_purchase_returns"
    ADD CONSTRAINT "workshop_purchase_returns_original_purchase_id_fkey" FOREIGN KEY ("original_purchase_id") REFERENCES "public"."workshop_purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workshop_purchase_returns"
    ADD CONSTRAINT "workshop_purchase_returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_purchases"
    ADD CONSTRAINT "workshop_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workshop_sales_returns"
    ADD CONSTRAINT "workshop_sales_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workshop_sales_returns"
    ADD CONSTRAINT "workshop_sales_returns_original_job_card_id_fkey" FOREIGN KEY ("original_job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workshop_sales_returns"
    ADD CONSTRAINT "workshop_sales_returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage product keys" ON "public"."product_keys" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admin has full access to invoices" ON "public"."invoices" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admins can delete any session" ON "public"."active_sessions" FOR DELETE TO "authenticated" USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage all users" ON "public"."users" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admins can see all tool requests" ON "public"."tool_requests" FOR SELECT USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admins can view all active sessions" ON "public"."active_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow full access to own data" ON "public"."data_entries" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow premium admin to manage all products" ON "public"."premium_products" USING ("public"."is_premium_tools_admin"((( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text")) WITH CHECK ("public"."is_premium_tools_admin"((( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text"));



CREATE POLICY "Allow public read access to premium products" ON "public"."premium_products" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read product keys" ON "public"."product_keys" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Everyone can read feedback" ON "public"."feedback" FOR SELECT USING (true);



CREATE POLICY "Public can insert feedback" ON "public"."feedback" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can insert tool requests" ON "public"."tool_requests" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can fully manage their own settings" ON "public"."settings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own active sessions" ON "public"."active_sessions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own bookings" ON "public"."bookings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."customers" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."daily_report_settings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."daily_reports" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."data_entries" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."gaps" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."job_cards" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."journal_entries" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."price_list" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."purchase_returns" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."purchases" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."receipts" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."sales_returns" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."stock" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."vehicle_invoice_items" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."vehicle_invoices" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_follow_ups" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_inventory" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_labour_items" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_purchase_returns" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_purchases" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own data" ON "public"."workshop_sales_returns" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own invoices" ON "public"."invoices" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own journal entries" ON "public"."journal_entries" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own price list" ON "public"."price_list" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own receipts" ON "public"."receipts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view and update their own data" ON "public"."users" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own active sessions" ON "public"."active_sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."active_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_report_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."premium_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_returns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_returns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_follow_ups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_labour_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_purchase_returns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_sales_returns" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."data_entries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_cards";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."product_keys";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."purchase_returns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."purchases";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sales_returns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."stock";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."vehicle_invoice_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."vehicle_invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workshop_inventory";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workshop_purchases";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_and_update_expired_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_update_expired_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_update_expired_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_and_increment_invoice_no"("p_user_id" "uuid", "p_invoice_type" "text", "p_invoice_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_and_increment_invoice_no"("p_user_id" "uuid", "p_invoice_type" "text", "p_invoice_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_and_increment_invoice_no"("p_user_id" "uuid", "p_invoice_type" "text", "p_invoice_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_and_increment_job_card_no"("p_user_id" "uuid", "p_invoice_date" "date", "p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_and_increment_job_card_no"("p_user_id" "uuid", "p_invoice_date" "date", "p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_and_increment_job_card_no"("p_user_id" "uuid", "p_invoice_date" "date", "p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_no"("customer_type" "text", "inv_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_no"("customer_type" "text", "inv_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_no"("customer_type" "text", "inv_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_users_with_session_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_users_with_session_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_users_with_session_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_booking_summary"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_booking_summary"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booking_summary"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_party_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_party_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_party_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_financial_year"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_financial_year"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_financial_year"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follow_ups_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follow_ups_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follow_ups_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follow_ups_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follow_ups_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follow_ups_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invoice_summary"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invoice_summary"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invoice_summary"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invoice_summary_v2"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invoice_summary_v2"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invoice_summary_v2"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_invoice_number_v2"("p_user_id" "uuid", "p_prefix" "text", "p_fy_short" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_invoice_number_v2"("p_user_id" "uuid", "p_prefix" "text", "p_fy_short" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_invoice_number_v2"("p_user_id" "uuid", "p_prefix" "text", "p_fy_short" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_job_card_invoice_no_v2"("p_user_id" "uuid", "p_invoice_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_job_card_invoice_no_v2"("p_user_id" "uuid", "p_invoice_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_job_card_invoice_no_v2"("p_user_id" "uuid", "p_invoice_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_ledger"("p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_ledger"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_ledger"("p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_ledger_v2"("p_customer_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_ledger_v2"("p_customer_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_ledger_v2"("p_customer_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_sale_summary"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_sale_summary"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_sale_summary"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_vehicle_invoice_summary"("p_start_date" "date", "p_end_date" "date", "p_customer_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_vehicle_invoice_summary"("p_start_date" "date", "p_end_date" "date", "p_customer_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_vehicle_invoice_summary"("p_start_date" "date", "p_end_date" "date", "p_customer_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report_v2"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report_v2"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_party_wise_sale_report_v2"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sales_by_salesperson"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sales_by_salesperson"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_by_salesperson"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v2"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v3"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v4"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v4"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_invoices_report_v4"("p_start_date" "date", "p_end_date" "date", "p_search_term" "text", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_default_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_default_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_default_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stock_deletion_on_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stock_deletion_on_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stock_deletion_on_sale"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_premium_tools_admin"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_premium_tools_admin"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_premium_tools_admin"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_wp_return"("p_action" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."manage_wp_return"("p_action" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_wp_return"("p_action" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_ws_return"("p_action" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."manage_ws_return"("p_action" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_ws_return"("p_action" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_access_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_access_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_access_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_invoice_gap"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_invoice_gap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_invoice_gap"() TO "service_role";



GRANT ALL ON TABLE "public"."job_cards" TO "anon";
GRANT ALL ON TABLE "public"."job_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."job_cards" TO "service_role";



GRANT ALL ON FUNCTION "public"."save_job_card_and_update_inventory"("p_job_card_data" "jsonb", "p_is_new" boolean, "p_original_job_card" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_job_card_and_update_inventory"("p_job_card_data" "jsonb", "p_is_new" boolean, "p_original_job_card" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_job_card_and_update_inventory"("p_job_card_data" "jsonb", "p_is_new" boolean, "p_original_job_card" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_vehicle_invoices"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v2"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v2"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v2"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v3"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v3"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v3"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v4"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v4"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v4"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v5"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v5"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicle_invoices_v5"("p_user_id" "uuid", "p_search_term" "text", "p_start_date" "date", "p_end_date" "date", "p_page_size" integer, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_sold_stock"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_sold_stock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_sold_stock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_job_card_history"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_job_card_history"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_job_card_history"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v10"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v10"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v10"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v11"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v11"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v11"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v12"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v12"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v12"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v13"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v13"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v13"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v2"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v2"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v2"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v3"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v3"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v3"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v4"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v4"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v4"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v5"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v5"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v5"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v6"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v6"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v6"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v7"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v7"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v7"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v8"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v8"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v8"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_vehicle_history_v9"("p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v9"("p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_vehicle_history_v9"("p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_from_purchases"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_from_purchases"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_from_purchases"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_item_quantity"("p_part_no" "text", "p_quantity_change" numeric, "p_user_id" "uuid", "p_item_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_item_quantity"("p_part_no" "text", "p_quantity_change" numeric, "p_user_id" "uuid", "p_item_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_item_quantity"("p_part_no" "text", "p_quantity_change" numeric, "p_user_id" "uuid", "p_item_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_and_update_inventory"("p_items" "jsonb", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_and_update_inventory"("p_items" "jsonb", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_and_update_inventory"("p_items" "jsonb", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."active_sessions_view" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions_view" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."daily_report_settings" TO "anon";
GRANT ALL ON TABLE "public"."daily_report_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_report_settings" TO "service_role";



GRANT ALL ON TABLE "public"."daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_reports" TO "service_role";



GRANT ALL ON TABLE "public"."data_entries" TO "anon";
GRANT ALL ON TABLE "public"."data_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."data_entries" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."gaps" TO "anon";
GRANT ALL ON TABLE "public"."gaps" TO "authenticated";
GRANT ALL ON TABLE "public"."gaps" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gaps_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gaps_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gaps_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_sequences" TO "anon";
GRANT ALL ON TABLE "public"."invoice_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."premium_products" TO "anon";
GRANT ALL ON TABLE "public"."premium_products" TO "authenticated";
GRANT ALL ON TABLE "public"."premium_products" TO "service_role";



GRANT ALL ON TABLE "public"."price_list" TO "anon";
GRANT ALL ON TABLE "public"."price_list" TO "authenticated";
GRANT ALL ON TABLE "public"."price_list" TO "service_role";



GRANT ALL ON TABLE "public"."product_keys" TO "anon";
GRANT ALL ON TABLE "public"."product_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."product_keys" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_returns" TO "anon";
GRANT ALL ON TABLE "public"."purchase_returns" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_returns" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_serial_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_serial_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_serial_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."sales_returns" TO "anon";
GRANT ALL ON TABLE "public"."sales_returns" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_returns" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."stock" TO "anon";
GRANT ALL ON TABLE "public"."stock" TO "authenticated";
GRANT ALL ON TABLE "public"."stock" TO "service_role";



GRANT ALL ON TABLE "public"."tool_requests" TO "anon";
GRANT ALL ON TABLE "public"."tool_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_requests" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_invoices" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."workshop_follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_follow_ups" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_inventory" TO "anon";
GRANT ALL ON TABLE "public"."workshop_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_labour_items" TO "anon";
GRANT ALL ON TABLE "public"."workshop_labour_items" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_labour_items" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_purchase_returns" TO "anon";
GRANT ALL ON TABLE "public"."workshop_purchase_returns" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_purchase_returns" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_purchases" TO "anon";
GRANT ALL ON TABLE "public"."workshop_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."workshop_purchases_serial_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."workshop_purchases_serial_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."workshop_purchases_serial_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_sales_returns" TO "anon";
GRANT ALL ON TABLE "public"."workshop_sales_returns" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_sales_returns" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































