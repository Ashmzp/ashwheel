-- Update get_follow_ups_v3 function to include leakage column
-- This ensures leakage data is returned when fetching follow-ups

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_follow_ups_v3(text, text, text);

-- Recreate function with leakage column
CREATE OR REPLACE FUNCTION public.get_follow_ups_v3(
    p_start_date text,
    p_end_date text,
    p_search_term text DEFAULT ''::text
)
RETURNS TABLE (
    source_id uuid,
    source_type text,
    source_date date,
    customer_name text,
    mobile1 text,
    mobile2 text,
    model_name text,
    chassis_no text,
    reg_no text,
    kms_reading text,
    job_type text,
    mechanic_name text,
    next_due_date date,
    follow_up_id uuid,
    remark text,
    appointment_datetime timestamp with time zone,
    followed_up_by text,
    leakage text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(jc.id, vi.id) as source_id,
        CASE WHEN jc.id IS NOT NULL THEN 'Job Card'::text ELSE 'Vehicle Invoice'::text END as source_type,
        COALESCE(jc.invoice_date, vi.invoice_date) as source_date,
        COALESCE(jc.customer_name, vi.customer_name) as customer_name,
        COALESCE(c.mobile1, '') as mobile1,
        COALESCE(c.mobile2, '') as mobile2,
        COALESCE(jc.model, vi.model_name) as model_name,
        COALESCE(jc.frame_no, vi.chassis_no) as chassis_no,
        COALESCE(jc.reg_no, vi.reg_no) as reg_no,
        COALESCE(jc.kms, '') as kms_reading,
        COALESCE(jc.job_type, '') as job_type,
        COALESCE(jc.mechanic, '') as mechanic_name,
        COALESCE(wf.next_follow_up_date, jc.next_due_date, vi.next_due_date) as next_due_date,
        wf.id as follow_up_id,
        wf.remark,
        wf.appointment_datetime,
        wf.followed_up_by,
        wf.leakage
    FROM workshop_follow_ups wf
    LEFT JOIN job_cards jc ON wf.job_card_id = jc.id
    LEFT JOIN vehicle_invoices vi ON wf.vehicle_invoice_id = vi.id
    LEFT JOIN customers c ON COALESCE(jc.customer_id, vi.customer_id) = c.id
    WHERE wf.user_id = auth.uid()
        AND COALESCE(jc.invoice_date, vi.invoice_date) BETWEEN p_start_date::date AND p_end_date::date
        AND (
            p_search_term = '' OR
            COALESCE(jc.customer_name, vi.customer_name, '') ILIKE '%' || p_search_term || '%' OR
            COALESCE(c.mobile1, '') ILIKE '%' || p_search_term || '%' OR
            COALESCE(jc.frame_no, vi.chassis_no, '') ILIKE '%' || p_search_term || '%' OR
            COALESCE(jc.reg_no, vi.reg_no, '') ILIKE '%' || p_search_term || '%'
        )
    ORDER BY COALESCE(wf.next_follow_up_date, jc.next_due_date, vi.next_due_date) ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_follow_ups_v3(text, text, text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_follow_ups_v3(text, text, text) IS 
'Fetches follow-ups with leakage column for unified follow-up list';
