import { supabase } from '@/lib/customSupabaseClient';
import {
    getCustomers,
    saveCustomer,
    deleteCustomer
} from './db/customers';
import {
    getPurchases,
    savePurchase,
    deletePurchase
} from './db/purchases';
import {
    getStock,
    addStock,
    deleteStockByChassis
} from './db/stock';
import {
    getVehicleInvoices,
    getVehicleInvoiceItems,
    saveVehicleInvoice,
    deleteVehicleInvoice
} from './db/vehicleInvoices';
import {
    getInvoices,
    saveInvoice,
    deleteInvoice
} from './db/invoices';
import {
    getSettings,
    saveSettings,
    getNextInvoiceNo,
    incrementInvoiceCounter
} from './db/settings';
import {
    getWorkshopPurchases,
    saveWorkshopPurchase,
    deleteWorkshopPurchase
} from './db/workshopPurchases';
import {
    getWorkshopInventory,
    upsertWorkshopInventory
} from './db/workshopInventory';
import {
    getJobCards,
    getJobCardById,
    saveJobCard,
    deleteJobCard,
    getNextJobCardInvoiceNo
} from './db/jobCards';
import {
    getAllUsers,
    updateUserRoleAndAccess
} from './db/admin';
import { getSalesReturns, saveSalesReturn, deleteSalesReturn } from './db/salesReturns';
import { getPurchaseReturns, savePurchaseReturn, deletePurchaseReturn } from './db/purchaseReturns';


const getCurrentUserId = async () => {
    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");
    return user.id;
};

export {
    getCurrentUserId,
    getCustomers,
    saveCustomer,
    deleteCustomer,
    getPurchases,
    savePurchase,
    deletePurchase,
    getStock,
    addStock,
    deleteStockByChassis,
    getVehicleInvoices,
    getVehicleInvoiceItems,
    saveVehicleInvoice,
    deleteVehicleInvoice,
    getInvoices,
    saveInvoice,
    deleteInvoice,
    getSettings,
    saveSettings,
    getNextInvoiceNo,
    incrementInvoiceCounter,
    getWorkshopPurchases,
    saveWorkshopPurchase,
    deleteWorkshopPurchase,
    getWorkshopInventory,
    upsertWorkshopInventory,
    getJobCards,
    getJobCardById,
    saveJobCard,
    deleteJobCard,
    getNextJobCardInvoiceNo,
    getAllUsers,
    updateUserRoleAndAccess,
    getSalesReturns,
    saveSalesReturn,
    deleteSalesReturn,
    getPurchaseReturns,
    savePurchaseReturn,
    deletePurchaseReturn
};