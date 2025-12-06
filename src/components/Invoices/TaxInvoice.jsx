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
  
  const extraCharges = invoice.extra_charges || invoice.extra_charges_json || {};
  const extraChargesTotal = Object.values(extraCharges).reduce((sum, charge) => sum + parseFloat(charge || 0), 0);
  
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
    <div ref={ref} className="p-2 bg-white text-black text-[12px] font-sans leading-tight">
      <style>{`
        @page {
          size: 210mm 297mm;
          margin: 10mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        .invoice-container {
          width: 190mm;
          min-height: 277mm;
          margin: 0 auto;
        }
        .invoice-box {
          border: 2px solid #000;
          display: flex;
          flex-direction: column;
          min-height: 277mm;
        }
        .invoice-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-box table td, .invoice-box table th {
          border-left: 1px solid #333;
          border-right: 1px solid #333;
          padding: 4px 6px;
          vertical-align: top;
        }
        .invoice-box table td:first-child {
          border-left: none;
        }
        .invoice-box table td:last-child {
          border-right: none;
        }
        .invoice-box table .no-border td {
          border: none;
        }
        .header-item {
          display: flex;
          margin-bottom: 2px;
        }
        .header-item > span:first-child {
          font-weight: 600;
          width: 120px;
          display: inline-block;
        }
        .header-item > span:nth-child(2) {
          margin: 0 4px;
        }
        .section-header {
          background: #f5f5f5;
          font-weight: bold;
          padding: 6px 8px !important;
          border-top: 1px solid #333 !important;
          border-bottom: 1px solid #333 !important;
        }
        .total-row {
          border-top: 1px solid #333 !important;
        }
        .amount-cell {
          font-family: 'Courier New', monospace;
          text-align: right;
        }
        .invoice-footer {
          margin-top: auto;
          padding: 12px 8px;
          border-top: 2px solid #333;
        }
        @media print {
          .invoice-footer {
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="invoice-container">
      <div className="invoice-box">
        <header className="p-3 border-b-2 border-black">
          <div className="flex justify-between items-start mb-2">
            <p className="font-bold text-[9px]">GSTIN: {settings?.gst_no}</p>
            <p className="font-bold text-center text-base tracking-wide">TAX INVOICE</p>
            <p className="font-bold text-right text-[9px]">Original For Recipient</p>
          </div>
          <div className="text-center">
            {settings.company_logo_url && <img src={settings.company_logo_url} alt="Company Logo" className="h-14 w-auto mx-auto mb-1" />}
            <h1 className="text-2xl font-bold tracking-wide mb-1">{settings.company_name}</h1>
            <p className="text-[9px]">{settings.address}, {settings.district}, {settings.state} - {settings.pin_code}</p>
            <p className="text-[9px]">Phone: {settings.mobile} | Email: {settings.email || 'N/A'} | PAN: {settings.pan || 'N/A'}</p>
            <p className="font-semibold text-[9px] mt-1">State Code: 09</p>
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
                <div className="header-item"><span>Bill Type</span><span>:</span><span></span></div>
              </td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr className="text-center font-bold section-header">
              <td className="w-[5%]">S.No</td>
              <td className="w-[35%]">Description of Goods</td>
              <td className="w-[10%]">HSN/SAC</td>
              <td className="w-[5%]">Qty</td>
              <td className="w-[5%]">UOM</td>
              <td className="w-[10%]">Rate</td>
              <td className="w-[10%]">Disc%</td>
              <td className="w-[15%]">Amount (₹)</td>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.chassis_no}>
                <td className="text-center align-top">{index + 1}</td>
                <td className="leading-relaxed align-top">
                  <span className="font-semibold">{item.model_name}</span> - <span className="italic">{item.colour}</span>
                  <br />
                  <span className="text-[10px]">Chassis: {item.chassis_no}</span>
                  <br />
                  <span className="text-[10px]">Engine: {item.engine_no}</span>
                </td>
                <td className="text-center align-top">{item.hsn}</td>
                <td className="text-center align-top">1.00</td>
                <td className="text-center align-top">PCS</td>
                <td className="amount-cell align-top">{parseFloat(item.price || 0).toFixed(2)}</td>
                <td className="text-center align-top">0.00</td>
                <td className="amount-cell align-top font-semibold">{parseFloat(item.price || 0).toFixed(2)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold total-row">
              <td colSpan="3" className="text-right section-header">Total</td>
              <td className="text-center section-header">{totalQty.toFixed(2)}</td>
              <td colSpan="3" className="section-header"></td>
              <td className="amount-cell section-header">₹ {subTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <table>
          <tbody>
            <tr>
              <td className="w-2/3" style={{borderTop: 0}}>
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
                    <tr className="font-bold text-center section-header text-[9px]">
                      <td>Tax Rate</td>
                      <td>Taxable Value</td>
                      <td>CGST</td>
                      <td>SGST</td>
                      <td>IGST</td>
                      <td>Total Tax</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[9px]">
                      <td className="text-center font-semibold">{items[0]?.gst || 0}%</td>
                      <td className="amount-cell">{totalTaxableValue.toFixed(2)}</td>
                      <td className="amount-cell">{totalCgst.toFixed(2)}</td>
                      <td className="amount-cell">{totalSgst.toFixed(2)}</td>
                      <td className="amount-cell">{totalIgst.toFixed(2)}</td>
                      <td className="amount-cell font-semibold">{totalGst.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <p><span className="font-bold">Tax Amount:</span> INR {numberToWords(totalGst)}</p>
                <p><span className="font-bold">Bill Amount:</span> INR {numberToWords(billTotal)}</p>
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
              <td className="w-1/3" style={{borderTop: 0}}>
                <div className="flex justify-between py-1 border-b"><span className="font-semibold">Sub Total</span><span className="amount-cell">₹ {subTotal.toFixed(2)}</span></div>
                {Object.entries(extraCharges).map(([name, value]) => {
                  const amount = parseFloat(value || 0);
                  return amount > 0 ? (
                    <div key={name} className="flex justify-between py-1"><span>{name}</span><span className="amount-cell">₹ {amount.toFixed(2)}</span></div>
                  ) : null;
                })}
                <div className="flex justify-between py-1 border-t"><span className="text-[9px]">Round Off</span><span className="amount-cell text-[9px]">{roundOff.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base border-y-2 border-black my-1 py-2 bg-gray-100"><span>Grand Total</span><span className="amount-cell">₹ {billTotal.toFixed(2)}</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="invoice-footer">
          <div className="flex justify-between">
            <div>
              <p className="text-[9px] mb-1">Receiver's Signature</p>
              <div className="border-t border-black w-32 mt-10"></div>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">For {settings.company_name}</p>
              <div className="mt-8">
                <div className="border-t border-black w-32 mx-auto mb-1"></div>
                <p className="text-[9px]">Authorised Signatory</p>
              </div>
            </div>
          </div>
          <p className="text-right text-[9px] mt-2">Page: 1/1</p>
        </div>
      </div>
      </div>
    </div>
  );
});

export default TaxInvoice;