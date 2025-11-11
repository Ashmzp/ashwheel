# 📊 Database Functions List - Ashwheel

## Total Functions: 50+

All functions are in `dump/schema.sql` and will be imported to PostgreSQL.

---

## 🔢 Invoice & Numbering Functions

### 1. `generate_and_increment_invoice_no`
**Purpose:** Invoice number generate karta hai (auto-increment)
**Used For:** Vehicle invoices, job cards
**Example:** `RINV-2425-0001`, `JC-2425-0001`

### 2. `generate_and_increment_job_card_no`
**Purpose:** Job card number generate karta hai
**Used For:** Workshop job cards

### 3. `get_next_invoice_number_v2`
**Purpose:** Next invoice number calculate karta hai
**Used For:** Sequential numbering

### 4. `get_next_job_card_invoice_no_v2`
**Purpose:** Job card ka next number
**Used For:** Workshop module

### 5. `get_financial_year`
**Purpose:** Financial year calculate karta hai (Apr-Mar)
**Example:** `2024-2025`

---

## 📈 Dashboard & Reports Functions

### 6. `get_dashboard_stats`
**Purpose:** Dashboard ke liye statistics
**Returns:** 
- Total purchases
- Registered sales
- Non-registered sales
- Total customers

### 7. `get_booking_summary`
**Purpose:** Booking summary (Open, Sold, Cancelled)
**Used For:** Bookings page

### 8. `get_invoice_summary_v2`
**Purpose:** Invoice summary by type
**Returns:** Registered/Non-registered counts

### 9. `get_sales_by_salesperson`
**Purpose:** Salesperson-wise sales report
**Used For:** MIS reports

---

## 🚗 Vehicle Tracking Functions

### 10. `track_vehicle_history_v13`
**Purpose:** Vehicle ka complete history track karta hai
**Shows:**
- Purchases
- Purchase returns
- Sales
- Sales returns

### 11. `track_job_card_history`
**Purpose:** Job card history track karta hai
**Used For:** Workshop follow-ups

### 12. `search_vehicle_invoices_v5`
**Purpose:** Vehicle invoices search karta hai
**Features:** Pagination, filtering

---

## 💰 Party Ledger Functions

### 13. `get_party_ledger_v2`
**Purpose:** Party ka ledger dikhata hai
**Shows:**
- Debit entries
- Credit entries
- Journal entries
- Receipts

### 14. `get_party_sale_summary`
**Purpose:** Party-wise sale summary
**Used For:** Reports

### 15. `get_party_vehicle_invoice_summary`
**Purpose:** Party-wise vehicle invoice summary
**Used For:** MIS reports

---

## 🔧 Workshop Functions

### 16. `save_job_card_and_update_inventory`
**Purpose:** Job card save + inventory update (atomic)
**Features:**
- Job card create/update
- Parts inventory auto-update
- Labour items tracking

### 17. `get_follow_ups_v3`
**Purpose:** Follow-up list generate karta hai
**Shows:**
- Job cards due for follow-up
- Vehicle invoices due
- Next follow-up dates

### 18. `manage_wp_return`
**Purpose:** Workshop purchase return manage karta hai
**Actions:** CREATE, UPDATE, DELETE

### 19. `manage_ws_return`
**Purpose:** Workshop sales return manage karta hai
**Actions:** CREATE, UPDATE, DELETE

### 20. `update_inventory_item_quantity`
**Purpose:** Workshop inventory update karta hai
**Used For:** Parts stock management

---

## 📊 Report Functions

### 21. `get_vehicle_invoices_report_v4`
**Purpose:** Vehicle invoices detailed report
**Features:**
- Pagination
- Search
- All invoice details

### 22. `get_party_wise_sale_report_v2`
**Purpose:** Party-wise sales report
**Used For:** Analysis

### 23. `sync_sold_stock`
**Purpose:** Sold vehicles ko stock se remove karta hai
**Used For:** Stock cleanup

---

## 🔐 User & Auth Functions

### 24. `handle_new_user_default_role`
**Purpose:** New user ke liye default role set karta hai
**Trigger:** Auto-runs on signup

### 25. `get_user_role`
**Purpose:** User ka role return karta hai
**Used For:** Permissions

### 26. `get_all_users_with_session_count`
**Purpose:** All users + active sessions
**Used For:** Admin dashboard

### 27. `is_premium_tools_admin`
**Purpose:** Check if user is premium admin
**Used For:** Premium features

---

## 🔄 Trigger Functions

### 28. `handle_stock_deletion_on_sale`
**Purpose:** Sale hone par stock se auto-delete
**Trigger:** On vehicle_invoice_items INSERT/DELETE

### 29. `handle_updated_at`
**Purpose:** updated_at timestamp auto-update
**Trigger:** On UPDATE

### 30. `record_invoice_gap`
**Purpose:** Deleted invoice numbers track karta hai
**Used For:** Gap filling

### 31. `normalize_access_keys`
**Purpose:** User access permissions normalize karta hai
**Trigger:** On users INSERT/UPDATE

### 32. `update_inventory_from_purchases`
**Purpose:** Purchase hone par inventory auto-update
**Trigger:** On workshop_purchases INSERT/UPDATE/DELETE

---

## 🧮 Utility Functions

### 33. `check_and_update_expired_access`
**Purpose:** Expired users ka access update karta hai
**Used For:** Subscription management

---

## 📋 Function Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| Invoice Numbering | 5 | Auto-increment invoice numbers |
| Dashboard/Stats | 4 | Dashboard data |
| Vehicle Tracking | 3 | Vehicle history |
| Party Ledger | 3 | Customer accounts |
| Workshop | 5 | Job cards, inventory |
| Reports | 3 | Various reports |
| User/Auth | 4 | User management |
| Triggers | 5 | Auto-updates |
| Utilities | 1 | Misc functions |
| **Total** | **33+** | **Main functions** |

---

## 🎯 Most Important Functions

### For Business Operations:
1. `generate_and_increment_invoice_no` - Invoice numbering
2. `save_job_card_and_update_inventory` - Workshop operations
3. `get_dashboard_stats` - Dashboard
4. `track_vehicle_history_v13` - Vehicle tracking
5. `get_party_ledger_v2` - Customer accounts

### For Reports:
1. `get_vehicle_invoices_report_v4` - Sales report
2. `get_party_wise_sale_report_v2` - Party analysis
3. `get_sales_by_salesperson` - Salesperson performance

### For Automation:
1. `handle_stock_deletion_on_sale` - Auto stock update
2. `update_inventory_from_purchases` - Auto inventory
3. `handle_new_user_default_role` - Auto user setup

---

## 💡 How They Work

### Example: Invoice Generation
```sql
-- User creates invoice
INSERT INTO vehicle_invoices (...)

-- Function automatically generates invoice number
SELECT generate_and_increment_invoice_no(
  user_id, 
  'registered', 
  '2025-01-15'
)

-- Returns: RINV-2425-0001
```

### Example: Job Card + Inventory
```sql
-- User saves job card with parts
SELECT save_job_card_and_update_inventory(
  job_card_data,
  is_new,
  original_job_card
)

-- Function automatically:
-- 1. Saves job card
-- 2. Updates parts inventory
-- 3. Tracks changes
```

### Example: Vehicle History
```sql
-- User searches vehicle
SELECT * FROM track_vehicle_history_v13('MH12AB1234')

-- Returns complete history:
-- - When purchased
-- - From which party
-- - When sold
-- - To which customer
-- - Any returns
```

---

## 🔧 Function Location

**All functions are in:** `dump/schema.sql`

**Import during deployment:**
```sql
-- In Supabase Studio SQL Editor
-- Paste entire schema.sql content
-- Click "Run"
-- All functions will be created
```

---

## ✅ Benefits

1. **Automation:** Auto-numbering, auto-updates
2. **Data Integrity:** Atomic operations
3. **Performance:** Database-level processing
4. **Business Logic:** Centralized in database
5. **Reusability:** Called from anywhere

---

## 📝 Notes

- All functions are **PostgreSQL PL/pgSQL**
- Run on **database server** (not frontend)
- Called via **Supabase client** from React
- **Automatically imported** with schema.sql
- **No manual setup** needed

---

**🎉 Sab functions automatic import ho jayenge jab aap schema.sql run karoge!**
