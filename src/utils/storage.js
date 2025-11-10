import { supabase } from '@/lib/customSupabaseClient';
import {
    getCustomers,
    saveCustomer,
    deleteCustomer
} from '@/utils/db/customers';
import {
    getPurchases,
    savePurchase,
    deletePurchase
} from '@/utils/db/purchases';
import {
    getStock,
    addStock,
    deleteStockByChassis
} from '@/utils/db/stock';
import {
    getVehicleInvoices,
    getVehicleInvoiceItems,
    saveVehicleInvoice,
    deleteVehicleInvoice
} from '@/utils/db/vehicleInvoices';
import {
    getInvoices,
    saveInvoice,
    deleteInvoice
} from '@/utils/db/invoices';
import {
    getSettings,
    saveSettings,
    getNextInvoiceNo,
    incrementInvoiceCounter
} from '@/utils/db/settings';
import {
    getWorkshopPurchases,
    saveWorkshopPurchase,
    deleteWorkshopPurchase
} from '@/utils/db/workshopPurchases';
import {
    getWorkshopInventory,
    upsertWorkshopInventory
} from '@/utils/db/workshopInventory';
import {
    getJobCards,
    getJobCardById,
    saveJobCard,
    deleteJobCard,
    getNextJobCardInvoiceNo
} from '@/utils/db/jobCards';
import {
    getAllUsers,
    updateUserRoleAndAccess
} from '@/utils/db/admin';
import { getSalesReturns, saveSalesReturn, deleteSalesReturn } from '@/utils/db/salesReturns';
import { getPurchaseReturns, savePurchaseReturn, deletePurchaseReturn } from '@/utils/db/purchaseReturns';


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