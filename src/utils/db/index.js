import { supabase } from '@/lib/customSupabaseClient';
import { getCustomers, saveCustomer, deleteCustomer, getFullCustomerDetails } from './customers';
import { getInvoices, saveInvoice, deleteInvoice } from './invoices';
import { getPurchases, savePurchase, deletePurchase } from './purchases';
import { getSettings, saveSettings } from './settings';
import { getVehicleInvoices, saveVehicleInvoice, deleteVehicleInvoice, getVehicleInvoiceItems, getVehicleInvoicesForExport } from './vehicleInvoices';
import { getStock, addStock, searchStock, deleteStockByChassis, checkStockExistence } from './stock';
import { getSalesReturns, saveSalesReturn, deleteSalesReturn, searchInvoicesForReturn } from './salesReturns';
import { getPurchaseReturns, savePurchaseReturn, deletePurchaseReturn, searchPurchasesForReturn } from './purchaseReturns';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, searchChassisForJournal, getPartyLedger, getJournalEntriesForCustomer } from './journalEntries';
import { getPriceList, savePriceListItem, deletePriceListItem, bulkInsertPriceList } from './priceList';
import { getReceipts, saveReceipt, deleteReceipt } from './receipts';

export const getCurrentUserId = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }
    if (session?.user) {
      return session.user.id;
    }
    
    // Fallback to getUser if session is not available
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      return null;
    }
    return user?.id || null;
  } catch (error) {
    console.error("Unexpected error in getCurrentUserId:", error);
    return null;
  }
};

export {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getFullCustomerDetails,
  getInvoices,
  saveInvoice,
  deleteInvoice,
  getPurchases,
  savePurchase,
  deletePurchase,
  getSettings,
  saveSettings,
  getVehicleInvoices,
  saveVehicleInvoice,
  deleteVehicleInvoice,
  getVehicleInvoiceItems,
  getVehicleInvoicesForExport,
  getStock,
  addStock,
  searchStock,
  deleteStockByChassis,
  checkStockExistence,
  getSalesReturns,
  saveSalesReturn,
  deleteSalesReturn,
  searchInvoicesForReturn,
  getPurchaseReturns,
  savePurchaseReturn,
  deletePurchaseReturn,
  searchPurchasesForReturn,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  searchChassisForJournal,
  getPartyLedger,
  getJournalEntriesForCustomer,
  getPriceList,
  savePriceListItem,
  deletePriceListItem,
  bulkInsertPriceList,
  getReceipts,
  saveReceipt,
  deleteReceipt,
};