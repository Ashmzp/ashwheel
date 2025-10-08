import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export const saveJournalEntry = async (entryData) => {
    const userId = await getCurrentUserId();
    const payload = {
        ...entryData,
        user_id: userId,
        id: entryData.id || uuidv4(),
    };
    const { data, error } = await supabase.from('journal_entries').upsert(payload).select().single();
    if (error) {
        console.error('Error saving journal entry:', error);
        throw error;
    }
    return data;
};

export const getJournalEntries = async ({ page = 1, pageSize = 100, searchTerm = '', startDate, endDate }) => {
    const userId = await getCurrentUserId();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('journal_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (startDate) {
        query = query.gte('entry_date', format(new Date(startDate), 'yyyy-MM-dd'));
    }
    if (endDate) {
        query = query.lte('entry_date', format(new Date(endDate), 'yyyy-MM-dd'));
    }

    if (searchTerm) {
        query = query.or(`party_name.ilike.%${searchTerm}%,particulars.ilike.%${searchTerm}%,chassis_no.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
    }
    return { data, count };
};

export const getJournalEntriesForCustomer = async (customerId) => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('party_id', customerId)
        .order('entry_date', { ascending: false });
    
    if (error) {
        console.error('Error fetching journal entries for customer:', error);
        throw error;
    }
    return data;
};

export const deleteJournalEntry = async (id) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
    }
    return { error: null };
};

export const searchChassisForJournal = async (searchTerm) => {
    const userId = await getCurrentUserId();
    
    const { data: invoiceData, error: invoiceError } = await supabase
        .from('vehicle_invoices')
        .select('invoice_no, vehicle_invoice_items(chassis_no, engine_no, model_name, colour, price)')
        .eq('user_id', userId)
        .or(`invoice_no.ilike.%${searchTerm}%,vehicle_invoice_items.chassis_no.ilike.%${searchTerm}%,vehicle_invoice_items.engine_no.ilike.%${searchTerm}%`)
        .limit(5);

    if (invoiceError) console.error("Error searching invoice items:", invoiceError);

    const formattedInvoiceData = (invoiceData || []).flatMap(inv => 
        inv.vehicle_invoice_items.map(item => ({
            ...item,
            invoice_no: inv.invoice_no,
        }))
    );

    const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('chassis_no, engine_no, model_name, colour, price')
        .eq('user_id', userId)
        .or(`chassis_no.ilike.%${searchTerm}%,engine_no.ilike.%${searchTerm}%`)
        .limit(5);

    if (stockError) console.error("Error searching stock:", stockError);

    const combined = [...formattedInvoiceData, ...(stockData || [])];
    
    const uniqueResults = Array.from(new Map(combined.map(item => [item.chassis_no, item])).values());
    
    return uniqueResults;
};

export const getPartyLedger = async (customerId, startDate, endDate) => {
    const { data, error } = await supabase.rpc('get_party_ledger_v2', { 
        p_customer_id: customerId,
        p_start_date: startDate ? format(new Date(startDate), 'yyyy-MM-dd') : null,
        p_end_date: endDate ? format(new Date(endDate), 'yyyy-MM-dd') : null,
    });
    if (error) {
        console.error('Error fetching party ledger:', error);
        throw error;
    }
    return data;
};

export const getLedgerSummary = async (customerType) => {
    const userId = await getCurrentUserId();
    let query = supabase
        .from('customers')
        .select('id, customer_name, gst');

    if (customerType === 'registered') {
        query = query.not('gst', 'is', null).neq('gst', '');
    } else if (customerType === 'non-registered') {
        query = query.or('gst.is.null,gst.eq.');
    }
    
    const { data: customers, error: customersError } = await query.eq('user_id', userId);

    if (customersError) {
        console.error('Error fetching customers for summary:', customersError);
        throw customersError;
    }

    const customerIds = customers.map(c => c.id);

    if (customerIds.length === 0) {
        return [];
    }

    const { data: ledgerData, error: ledgerError } = await supabase
        .from('journal_entries')
        .select('party_id, entry_type, price')
        .in('party_id', customerIds);

    if (ledgerError) {
        console.error('Error fetching journal entries for summary:', ledgerError);
        throw ledgerError;
    }

    const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .select('customer_id, amount')
        .in('customer_id', customerIds);

    if (receiptError) {
        console.error('Error fetching receipts for summary:', receiptError);
        throw receiptError;
    }

    const summaryMap = new Map();

    customers.forEach(c => {
        summaryMap.set(c.id, {
            customer_id: c.id,
            customer_name: c.customer_name,
            receivable_amount: 0, // Debit
            payable_amount: 0, // Credit
        });
    });

    ledgerData.forEach(entry => {
        const summary = summaryMap.get(entry.party_id);
        if (summary) {
            if (entry.entry_type === 'Debit') {
                summary.receivable_amount += entry.price || 0;
            } else {
                summary.payable_amount += entry.price || 0;
            }
        }
    });

    receiptData.forEach(receipt => {
        const summary = summaryMap.get(receipt.customer_id);
        if (summary) {
            summary.payable_amount += receipt.amount || 0;
        }
    });

    const finalSummary = Array.from(summaryMap.values()).map(s => ({
        ...s,
        net_balance: s.receivable_amount - s.payable_amount,
    })).filter(s => s.receivable_amount > 0 || s.payable_amount > 0);

    return finalSummary;
};