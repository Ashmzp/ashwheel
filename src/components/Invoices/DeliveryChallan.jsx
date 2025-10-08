import React from 'react';
import { formatDate } from '@/utils/dateUtils';

const DeliveryChallan = React.forwardRef(({ invoice, customer, items, settings }, ref) => {
  if (!invoice || !items || !settings || !customer) {
    return <div ref={ref} className="p-8 text-red-500">Printing data is missing or invalid. Please try again.</div>;
  }
  
  const totalQty = items.reduce((sum, item) => sum + 1, 0);

  const customerDetails = {
    ...customer,
    ...(invoice.customer_details_json || {}),
  };

  const getContactNumbers = () => {
    const numbers = [customer.mobile1, customer.mobile2].filter(Boolean);
    return numbers.join(', ');
  };

  const customFields = (settings.customFields || []).filter(field => field.name && customerDetails[field.name]);

  return (
    <div ref={ref} className="font-sans text-xs bg-white text-black leading-tight">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm;
            height: 297mm;
          }
          .printable-area {
            padding: 1cm;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
        }
        .main-content-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .items-table { 
          border-collapse: collapse;
          width: 100%;
        }
        .items-table td, .items-table th {
          padding: 4px 6px;
          border-right: 1px solid black;
        }
        .items-table th:first-child, .items-table td:first-child {
          border-left: 1px solid black;
        }
        .items-table thead th {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
        }
        .items-table tfoot td {
            font-weight: bold;
            border-top: 1px solid black;
        }
        .table-body-container {
            display: flex;
            flex-direction: column;
        }
        .signatory {
            display: inline-block;
            border-bottom: 1px solid black;
            padding-bottom: 2px;
        }
      `}</style>
      <div className="printable-area">
        <header className="mb-2">
          <div className="flex justify-between items-start mb-2">
            <div className="text-left">
              <p className="font-bold">Original For Recipient</p>
            </div>
            <div className="text-right">
              <p className="font-bold">GSTIN: {settings?.gst_no}</p>
            </div>
          </div>
          <div className="text-center">
            {settings.company_logo_url && <img src={settings.company_logo_url} alt="Company Logo" className="h-16 w-auto mx-auto mb-2" />}
            <h1 className="text-xl font-bold mb-1">{settings.company_name}</h1>
            <p className="text-[10px]">{settings.address}, {settings.district}, {settings.state} - {settings.pin_code}</p>
            <p className="text-[10px]">Phone No: {settings.mobile} | Email: {settings.email || 'N/A'}</p>
            <p className="text-[10px]">State Code: 09</p>
          </div>
        </header>

        <div className="border border-black main-content-wrapper">
          <div className="text-center my-1 border-y border-black">
            <h2 className="text-base font-bold py-1">DELIVERY CHALLAN</h2>
          </div>

          <div className="grid grid-cols-2 gap-x-2 border-b border-black pb-2 px-2">
            <div className="border-r border-black pr-2">
              <div className="grid grid-cols-[auto,1fr] gap-x-2">
                <span className="font-bold">Name</span><span>: {customerDetails.customer_name}</span>
                <span className="font-bold">S/o</span><span>: {customerDetails.guardian_name}</span>
                <span className="whitespace-pre-wrap font-bold">Address</span><span className="whitespace-pre-wrap">: {customerDetails.address}, {customerDetails.district}, {customerDetails.state} - {customerDetails.pincode}</span>
                <span className="font-bold">GSTIN</span><span>: {customerDetails.gst || 'Unregistered'}</span>
                <span className="font-bold">Contact No.</span><span>: {getContactNumbers()}</span>
                <span className="font-bold">Email</span><span>: {customerDetails.emailId || ''}</span>
                <span className="font-bold">ADHAAR</span><span>: {customerDetails.adharNo || ''}</span>
                <span className="font-bold">HYP</span><span>: {customerDetails.hypothecation || 'CASH'}</span>
                <span className="font-bold">DOB</span><span>: {customerDetails.dob ? formatDate(customerDetails.dob) : ''}</span>
                <span className="font-bold">RTO</span><span>: {customerDetails.rto || ''}</span>
                <span className="font-bold">Nomini</span><span>: {customerDetails.nomineeName || ''}</span>
                {customFields.map(field => (
                  <React.Fragment key={field.id}>
                    <span className="font-bold">{field.name}</span><span>: {customerDetails[field.name]}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-[auto,1fr] gap-x-2">
                <span className="font-bold">Invoice No.</span><span>: {invoice.invoice_no}</span>
                <span className="font-bold">Invoice Date</span><span>: {formatDate(invoice.invoice_date)}</span>
              </div>
            </div>
          </div>

          <div className="table-body-container">
            <table className="items-table w-full">
              <thead>
                <tr>
                  <th className="w-[5%] text-center">S No</th>
                  <th className="w-[55%] text-left">Description</th>
                  <th className="w-[15%] text-center">HSN / SAC</th>
                  <th className="w-[10%] text-center">Qty</th>
                  <th className="w-[15%] text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                  {items.map((item, index) => (
                  <tr key={item.chassis_no}>
                      <td className="text-center align-top">{index + 1}</td>
                      <td className="align-top">
                      {item.model_name} | {item.colour}
                      <br />
                      <span className="ml-4">Chassis No. : {item.chassis_no}</span>
                      <br />
                      <span className="ml-4">Engine No. : {item.engine_no}</span>
                      </td>
                      <td className="text-center align-top">{item.hsn || settings.defaultHSN || ''}</td>
                      <td className="text-center align-top">1.00</td>
                      <td className="align-top"></td>
                  </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 16 - items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <table className="items-table w-full">
              <tfoot>
                <tr>
                    <td colSpan="3" className="text-right pr-4 w-[75%]">Total</td>
                    <td className="text-center w-[10%]">{totalQty.toFixed(2)}</td>
                    <td className="w-[15%]"></td>
                </tr>
              </tfoot>
          </table>
          
          <footer className="pt-2 text-xs mt-auto px-2 pb-2">
              <div className="border-t border-black pt-2">
                <p className="font-bold">Terms & Conditions:</p>
                <p className="whitespace-pre-wrap">{settings.terms_and_conditions || 'E & O.E.'}</p>
              </div>
              <div className="flex justify-between mt-4">
                <p>Receiver's Signature</p>
                <p>For {settings.company_name}</p>
              </div>
              <div className="text-right mt-12">
                <p className="signatory">Authorised Signatory</p>
              </div>
          </footer>
        </div>
      </div>
    </div>
  );
});

export default DeliveryChallan;