import React, { forwardRef } from 'react';
import { numberToWords } from '@/utils/numberToWords';
import { formatDate } from '@/utils/dateUtils';

const TaxInvoice = forwardRef(({ invoice, customer, items, settings }, ref) => {
  if (!invoice || !items || !settings || !customer) {
    return <div ref={ref} className="p-8 text-red-500">Printing data is missing or invalid. Please try again.</div>;
  }

  const calculateItemTax = (item) => {
    const price = parseFloat(item.price || 0);
    const gstRate = parseFloat(item.gst || 0);
    const taxableValue = price / (1 + gstRate / 100);
    const totalTax = price - taxableValue;
    const isInterState = customer.state !== settings.state;
    
    return {
      taxableValue,
      cgst: isInterState ? 0 : totalTax / 2,
      sgst: isInterState ? 0 : totalTax / 2,
      igst: isInterState ? totalTax : 0,
      totalTax
    };
  };

  const itemsWithTax = items.map(item => ({
    ...item,
    ...calculateItemTax(item)
  }));

  const totalTaxableValue = itemsWithTax.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalCgst = itemsWithTax.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = itemsWithTax.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = itemsWithTax.reduce((sum, item) => sum + item.igst, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  
  const regCharge = parseFloat(invoice.extra_charges?.Registration || invoice.registration_amount || 0);
  const insCharge = parseFloat(invoice.extra_charges?.Insurance || invoice.insurance_amount || 0);
  const accCharge = parseFloat(invoice.extra_charges?.Accessories || invoice.accessories_amount || 0);
  
  const extraChargesTotal = Object.values(invoice.extra_charges || {}).reduce((sum, charge) => sum + parseFloat(charge || 0), 0);
  
  const subTotal = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const grandTotal = subTotal + extraChargesTotal;
  const billTotal = Math.round(grandTotal);
  const roundOff = billTotal - grandTotal;

  const totalQty = items.reduce((sum, item) => sum + 1, 0);

  const getContactNumbers = () => {
    const numbers = [customer.mobile1, customer.mobile2].filter(Boolean);
    return numbers.join(', ');
  };
  
  return (
    <div ref={ref} className="p-2 bg-white text-black text-[10px] font-sans leading-tight">
      <style>{`
        @page {
          size: A4;
          margin: 20mm 18mm 20mm 15mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
        .invoice-box {
          border: 1px solid black;
        }
        .invoice-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-box table td, .invoice-box table th {
          border: 1px solid black;
          padding: 2px 4px;
          vertical-align: top;
        }
        .invoice-box table .no-border td {
          border: none;
        }
        .header-item {
          display: flex;
        }
        .header-item > span:first-child {
          font-weight: bold;
          width: 100px;
          display: inline-block;
        }
        .header-item > span:nth-child(2) {
          margin-right: 5px;
        }
      `}</style>
      <div className="invoice-box">
        <header className="p-2">
          <div className="flex justify-between items-start">
            <p className="font-bold">GSTIN: {settings?.gst_no}</p>
            <p className="font-bold text-center text-sm">TAX INVOICE</p>
            <p className="font-bold text-right">Original For Recipient</p>
          </div>
          <div className="text-center my-1">
            {settings.company_logo_url && <img src={settings.company_logo_url} alt="Company Logo" className="h-16 w-auto mx-auto mb-2" />}
            <h1 className="text-xl font-bold">{settings.company_name}</h1>
            <p>{settings.address}, {settings.district}, {settings.state} - {settings.pin_code}</p>
            <p>Phone No: {settings.mobile} | Email: {settings.email || 'N/A'}</p>
            <p>PAN No: {settings.pan || 'N/A'}</p>
            <p className="font-bold mt-1">State Code: 09</p>
          </div>
        </header>

        <table>
          <tbody>
            <tr>
              <td className="w-1/2">
                <div className="header-item"><span>Invoice No.</span><span>:</span><span>{invoice.invoice_no}</span></div>
                <div className="header-item"><span>Invoice Date</span><span>:</span><span>{formatDate(invoice.invoice_date)}</span></div>
                <div className="header-item"><span>Reverse Charge</span><span>:</span><span>No</span></div>
                <div className="header-item"><span>Eway Bill No & Date</span><span>:</span><span></span></div>
                <div className="header-item"><span>Distance</span><span>:</span><span></span></div>
              </td>
              <td className="w-1/2">
                <div className="header-item"><span>Shipping Company</span><span>:</span><span></span></div>
                <div className="header-item"><span>Vehicle No</span><span>:</span><span></span></div>
                <div className="header-item"><span>Place of Supply</span><span>:</span><span>{customer.state}</span></div>
                <div className="header-item"><span>GR./RR.No</span><span>:</span><span></span></div>
                <div className="header-item"><span>Station</span><span>:</span><span>{customer.district}</span></div>
              </td>
            </tr>
            <tr>
              <td className="w-1/2">
                <p className="font-bold">Customer Name & Billing Address</p>
                <p className="font-bold">{customer.customer_name} S/O {customer.guardian_name}</p>
                <p>{customer.address}, {customer.district}, {customer.state} - {customer.pincode}</p>
                <p>India</p>
                <p>GSTIN / UIN : {customer.gst || 'Unregistered'}</p>
                <p>Phone : {getContactNumbers()}</p>
              </td>
              <td className="w-1/2">
                <p className="font-bold">Shipping Address</p>
                <p className="font-bold">{customer.customer_name} S/O {customer.guardian_name}</p>
                <p>{customer.address}, {customer.district}, {customer.state} - {customer.pincode}</p>
                <p>India</p>
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <div className="header-item"><span>Bill Type</span><span>:</span><span>Credit</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="min-h-[24rem]">
          <table>
            <thead>
              <tr className="text-center font-bold">
                <td className="w-[5%]">S No</td>
                <td className="w-[35%]">Description</td>
                <td className="w-[10%]">HSN / SAC</td>
                <td className="w-[5%]">Qty</td>
                <td className="w-[5%]">UOM</td>
                <td className="w-[10%]">Item Rate</td>
                <td className="w-[10%]">Disc%</td>
                <td className="w-[15%]">Amount (INR)</td>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.chassis_no}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    {item.model_name} | {item.colour}
                    <br />
                    <span className="ml-2">Chassis No. : {item.chassis_no}</span>
                    <br />
                    <span className="ml-2">Engine No. : {item.engine_no}</span>
                  </td>
                  <td className="text-center">{item.hsn}</td>
                  <td className="text-center">1.00</td>
                  <td className="text-center">PCS</td>
                  <td className="text-right">{parseFloat(item.price || 0).toFixed(2)}</td>
                  <td className="text-center">0.00%</td>
                  <td className="text-right">{parseFloat(item.price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan="3" className="text-right">Total</td>
                <td className="text-center">{totalQty.toFixed(2)}</td>
                <td colSpan="3"></td>
                <td className="text-right">{subTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <table>
          <tbody>
            <tr>
              <td className="w-2/3">
                <p><span className="font-bold">Narration:</span> Being Goods Sold To {customer.customer_name} S/O {customer.guardian_name}</p>
                <table className="my-1">
                  <tbody>
                    <tr className="no-border">
                      <td className="w-1/2">
                        <p className="font-bold">Logistics Info:</p>
                        <div className="header-item"><span>Charges Paid</span><span>:</span><span>0.00</span></div>
                        <div className="header-item"><span>No of Packets</span><span>:</span><span>0.00</span></div>
                      </td>
                      <td className="w-1/2">
                        <div className="header-item"><span>Mode</span><span>:</span><span>Road</span></div>
                        <div className="header-item"><span>Weight</span><span>:</span><span>0.00</span></div>
                      </td>
                    </tr>
                    <tr className="no-border">
                      <td colSpan="2">
                        <div className="header-item"><span>Document extra info</span><span>:</span><span></span></div>
                        <div className="header-item"><span>RTO</span><span>:</span><span>{invoice.customer_details_json?.rto || ''}</span></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table>
                  <thead>
                    <tr className="font-bold text-center">
                      <td>Tax Rate</td>
                      <td>Taxable Value</td>
                      <td>CGST Amount</td>
                      <td>SGST Amount</td>
                      <td>IGST Amount</td>
                      <td>Total Tax</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center">TAX @ {items[0]?.gst || 0}%</td>
                      <td className="text-right">{totalTaxableValue.toFixed(2)}</td>
                      <td className="text-right">{totalCgst.toFixed(2)}</td>
                      <td className="text-right">{totalSgst.toFixed(2)}</td>
                      <td className="text-right">{totalIgst.toFixed(2)}</td>
                      <td className="text-right">{totalGst.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <p><span className="font-bold">Tax Amount:</span> INR {numberToWords(totalGst)} Only</p>
                <p><span className="font-bold">Bill Amount:</span> INR {numberToWords(billTotal)} Only</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <p className="font-bold">Terms & Conditions:</p>
                    <p className="text-[8px] whitespace-pre-wrap">{settings.terms_and_conditions || 'E & O.E.'}</p>
                    {settings.bank_details?.account_number && (
                      <div className="mt-2">
                        <p className="font-bold">Bank Details:</p>
                        <p>A/C Name: {settings.bank_details.account_holder_name}</p>
                        <p>A/C No: {settings.bank_details.account_number}</p>
                        <p>Bank: {settings.bank_details.bank_name}</p>
                        <p>IFSC: {settings.bank_details.ifsc_code}</p>
                      </div>
                    )}
                  </div>
                  {settings.upi_qr_code_url && (
                    <div className="text-center">
                      <p className="font-bold">Scan to Pay</p>
                      <img src={settings.upi_qr_code_url} alt="UPI QR Code" className="h-20 w-20 mx-auto mt-1" />
                    </div>
                  )}
                </div>
              </td>
              <td className="w-1/3">
                <div className="flex justify-between"><span>Sub Total</span><span>{subTotal.toFixed(2)}</span></div>
                {Object.entries(invoice.extra_charges || {}).map(([name, value]) => {
                  const amount = parseFloat(value || 0);
                  return amount > 0 ? (
                    <div key={name} className="flex justify-between"><span>{name}</span><span>{amount.toFixed(2)}</span></div>
                  ) : null;
                })}
                <div className="flex justify-between"><span>Round Off</span><span>{roundOff.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-sm border-y border-black my-1 py-1"><span>Bill Total</span><span>{billTotal.toFixed(2)}</span></div>
              </td>
            </tr>
            <tr>
              <td className="h-16">
                <p>Receiver's Signature</p>
              </td>
              <td className="text-center">
                <p className="font-bold">For {settings.company_name}</p>
                <div className="mt-12">
                  <p>Authorised Signatory</p>
                </div>
              </td>
            </tr>
            <tr>
                <td colSpan="2" className="text-right">Page: 1/1</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TaxInvoice;