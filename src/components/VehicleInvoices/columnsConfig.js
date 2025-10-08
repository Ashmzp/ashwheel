import { formatDate } from '@/utils/dateUtils';

const getNestedValue = (obj, path, defaultValue = '') => {
  if (!obj) return defaultValue;
  const value = path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
  return value ?? defaultValue;
};

export const EXPORT_COLUMNS_CONFIG = {
  // Invoice Details
  'Invoice No': { key: 'invoice_no', default: true, sortable: true, export: true },
  'Invoice Date': { key: 'invoice_date', format: formatDate, default: true, sortable: true, export: true },
  
  // Customer Details
  'Customer Name': { key: 'customer_name', default: true, sortable: true, export: true },
  'Guardian Name': { key: 'guardian_name', default: false, sortable: true, getter: (invoice) => getNestedValue(invoice, 'customer.guardian_name'), export: true },
  'Mobile Number': { key: 'mobile1', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.mobile1'), export: true },
  'Optional Mobile No.': { key: 'mobile2', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.mobile2'), export: true },
  'Date of Birth': { key: 'dob', format: formatDate, default: false, sortable: true, getter: (invoice) => getNestedValue(invoice, 'customer.dob'), export: true },
  'GST Number': { key: 'gst_no', default: true, sortable: true, getter: (invoice) => getNestedValue(invoice, 'customer.gst'), export: true },
  
  // Address Information
  'Address': { key: 'full_address', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.address'), export: true },
  'State': { key: 'state', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.state'), export: true },
  'District': { key: 'district', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.district'), export: true },
  'PIN Code': { key: 'pincode', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer.pincode'), export: true },

  // Item Details - For UI Display (comma-separated)
  'Model Name': { key: 'model_name', default: true, sortable: true, getter: (invoice) => (invoice.items || []).map(item => item.model_name).join(', ') },
  'Chassis No': { key: 'chassis_no', default: true, sortable: true, getter: (invoice) => (invoice.items || []).map(item => item.chassis_no).join(', ') },
  'Engine No': { key: 'engine_no', default: true, sortable: true, getter: (invoice) => (invoice.items || []).map(item => item.engine_no).join(', ') },
  'Colour': { key: 'colour', default: false, sortable: false, getter: (invoice) => (invoice.items || []).map(item => item.colour).join(', ') },
  
  // Item Details - For Export (single value per row)
  'Item Model Name': { key: 'model_name', export: true, source: 'item' },
  'Item Chassis No': { key: 'chassis_no', export: true, source: 'item' },
  'Item Engine No': { key: 'engine_no', export: true, source: 'item' },
  'Item Colour': { key: 'colour', export: true, source: 'item' },
  'Item Price': { key: 'price', export: true, source: 'item' },

  'Grand Total': { key: 'grand_total', default: true, sortable: true, export: true },

  // Additional Details (Non-Registered)
  'Aadhar No': { key: 'customer_details_json.adharNo', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.adharNo'), export: true },
  'Nominee Name': { key: 'customer_details_json.nomineeName', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.nomineeName'), export: true },
  'Hypothecation': { key: 'customer_details_json.hypothecation', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.hypothecation'), export: true },
  'RTO': { key: 'customer_details_json.rto', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.rto'), export: true },
  'Email ID': { key: 'customer_details_json.emailId', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.emailId'), export: true },
  'Sales Person': { key: 'customer_details_json.salesPerson', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'customer_details_json.salesPerson'), export: true },
  
  // Extra Charges
  'Registration': { key: 'extra_charges_json.Registration', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'extra_charges_json.Registration'), export: true },
  'Insurance': { key: 'extra_charges_json.Insurance', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'extra_charges_json.Insurance'), export: true },
  'Accessories': { key: 'extra_charges_json.Accessories', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'extra_charges_json.Accessories'), export: true },
  'Scheme': { key: 'extra_charges_json.Scheme', default: false, sortable: false, getter: (invoice) => getNestedValue(invoice, 'extra_charges_json.Scheme'), export: true },
};