-- Drop duplicate indexes (keep the constraint-based ones)
DROP INDEX IF EXISTS idx_job_cards_user_unique;
DROP INDEX IF EXISTS idx_vehicle_invoice_items_chassis_no;
DROP INDEX IF EXISTS idx_vehicle_invoice_items_engine_no;  
DROP INDEX IF EXISTS idx_vehicle_invoice_user_unique;