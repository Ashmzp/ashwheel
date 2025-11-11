-- Drop actual duplicate constraints found in output
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_no_user_id_key;
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_chassis_no_user_id_key;
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_chassis_no_user_id_unique;
ALTER TABLE workshop_inventory DROP CONSTRAINT IF EXISTS workshop_inventory_part_no_key;
ALTER TABLE workshop_inventory DROP CONSTRAINT IF EXISTS workshop_inventory_user_id_part_no_key;

-- Check for other duplicate constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname LIKE '%unique%' OR conname LIKE '%key%'
ORDER BY conname;