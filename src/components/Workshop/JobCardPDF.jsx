import React, { useEffect, useState } from 'react';
import { getSettings } from '@/utils/storage';
import { numberToWords } from '@/utils/numberToWords';

const JobCardPDF = ({ jobCard }) => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!jobCard || typeof jobCard !== "object") {
    return (
      <div className="p-4 text-red-600 font-bold">
        Job Card could not be loaded.
      </div>
    );
  }

  const normalizeArray = (arr) => {
    if (!arr) return [];
    if (Array.isArray(arr)) return arr;
    try {
      const parsed = JSON.parse(arr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const partsItems = normalizeArray(jobCard.parts_items);
  const labourItems = normalizeArray(jobCard.labour_items);
  const deniedItems = normalizeArray(jobCard.denied_items);

  const isInterState =
    jobCard.customer_state &&
    settings.state &&
    jobCard.customer_state !== settings.state;

  const calculateTotals = (items) => {
    return items.reduce(
      (acc, item) => {
        const rate = parseFloat(item.rate) || 0;
        const qty = parseFloat(item.qty) || 0;
        const discount = parseFloat(item.discount) || 0;
        const gstRate = parseFloat(item.gst_rate) || 0;

        const taxable = rate * qty - discount;
        const gstAmount = taxable * (gstRate / 100);

        acc.taxable += taxable;
        if (isInterState) {
          acc.igst += gstAmount;
        } else {
          acc.cgst += gstAmount / 2;
          acc.sgst += gstAmount / 2;
        }
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
    );
  };

  const partsTotals = calculateTotals(partsItems);
  const labourTotals = calculateTotals(labourItems);
  const subTotal = partsTotals.taxable + labourTotals.taxable;
  const totalCgst = partsTotals.cgst + labourTotals.cgst;
  const totalSgst = partsTotals.sgst + labourTotals.sgst;
  const totalIgst = partsTotals.igst + labourTotals.igst;
  const grandTotal = subTotal + totalCgst + totalSgst + totalIgst;
  const roundedTotal = Math.round(grandTotal);
  const roundOff = (roundedTotal - grandTotal).toFixed(2);

  const hsnSummary = [...partsItems, ...labourItems].reduce((acc, item) => {
    if (!item.hsn_code) return acc;
    if (!acc[item.hsn_code]) {
      acc[item.hsn_code] = {
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        rate: parseFloat(item.gst_rate) || 0,
      };
    }
    const rate = parseFloat(item.rate) || 0;
    const qty = parseFloat(item.qty) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxable = rate * qty - discount;
    const gstRate = parseFloat(item.gst_rate) || 0;
    const gstAmount = taxable * (gstRate / 100);

    acc[item.hsn_code].taxable += taxable;
    if (isInterState) {
      acc[item.hsn_code].igst += gstAmount;
    } else {
      acc[item.hsn_code].cgst += gstAmount / 2;
      acc[item.hsn_code].sgst += gstAmount / 2;
    }
    return acc;
  }, {});

  const hsnSummaryTotals = Object.values(hsnSummary).reduce(
    (acc, data) => {
      acc.taxable += data.taxable;
      acc.cgst += data.cgst;
      acc.sgst += data.sgst;
      acc.igst += data.igst;
      acc.totalTax += data.cgst + data.sgst + data.igst;
      return acc;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 }
  );

  const showTitle = settings.workshop_settings?.show_service_labour_invoice_title !== false;

  return (
    <div id="pdf-content" className="p-6 bg-white text-black font-sans leading-normal">
      <header className="text-center mb-4">
        <p className="font-bold text-sm">TAX INVOICE</p>
        {showTitle && <h1 className="text-xl font-bold">Service Labour Invoice</h1>}
      </header>

      <div className="grid grid-cols-2 gap-4 border-y border-black py-2 text-[10px]">
        <div>
          {settings.company_logo_url && <img src={settings.company_logo_url} alt="Company Logo" className="h-12 w-auto mb-2" />}
          <p className="font-bold text-base">{settings.companyName}</p>
          <p>{settings.address}</p>
          <p>Ph: {settings.mobile}</p>
          <p>GSTIN: {settings.gstNo}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-base">{jobCard.customer_name}</p>
          <p>{jobCard.customer_address}</p>
          <p>Mob: {jobCard.customer_mobile}</p>
          {jobCard.customer_state && <p>State: {jobCard.customer_state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-b border-black py-2 text-[10px]">
        <div>
          <p><strong>Invoice No:</strong> {jobCard.invoice_no}</p>
          <p><strong>Invoice Date:</strong> {new Date(jobCard.invoice_date).toLocaleDateString('en-IN')}</p>
          <p><strong>Job Card No.:</strong> {jobCard.manual_jc_no || jobCard.jc_no}</p>
        </div>
        <div>
          <p><strong>Regn No.:</strong> {jobCard.reg_no}</p>
          <p><strong>KMs:</strong> {jobCard.kms}</p>
          <p><strong>Job Type:</strong> {jobCard.job_type}</p>
        </div>
        <div>
          <p><strong>Frame No.:</strong> {jobCard.frame_no}</p>
          <p><strong>Model:</strong> {jobCard.model}</p>
          <p><strong>Mechanic:</strong> {jobCard.mechanic}</p>
        </div>
      </div>

      <table className="w-full my-4 text-[10px]">
        <thead>
          <tr className="border-b-2 border-t-2 border-black">
            <th className="py-1 px-1 text-left">Item No</th>
            <th className="py-1 px-1 text-left">Particulars</th>
            <th className="py-1 px-1 text-center">Qty</th>
            <th className="py-1 px-1 text-right">Rate</th>
            <th className="py-1 px-1 text-right">Disc.</th>
            <th className="py-1 px-1 text-right">Taxable</th>
            <th className="py-1 px-1 text-center">HSN</th>
            {isInterState ? (
              <>
                <th className="py-1 px-1 text-center">IGST%</th>
                <th className="py-1 px-1 text-right">IGST Amt</th>
              </>
            ) : (
              <>
                <th className="py-1 px-1 text-center">SGST%</th>
                <th className="py-1 px-1 text-right">SGST Amt</th>
                <th className="py-1 px-1 text-center">CGST%</th>
                <th className="py-1 px-1 text-right">CGST Amt</th>
              </>
            )}
            <th className="py-1 px-1 text-right">MRP</th>
          </tr>
        </thead>
        <tbody>
          {partsItems.map((item, index) => {
            const rate = parseFloat(item.rate) || 0;
            const qty = parseFloat(item.qty) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxable = rate * qty - discount;
            const gstRate = parseFloat(item.gst_rate) || 0;
            const gstAmt = taxable * gstRate / 100;
            return (
              <tr key={`part-${index}`} className="border-b">
                <td className="py-1 px-1">{index + 1}</td>
                <td className="py-1 px-1">{item.item_name}</td>
                <td className="py-1 px-1 text-center">{qty}</td>
                <td className="py-1 px-1 text-right">{rate.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">{discount.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">{taxable.toFixed(2)}</td>
                <td className="py-1 px-1 text-center">{item.hsn_code}</td>
                {isInterState ? (
                  <>
                    <td className="py-1 px-1 text-center">{gstRate}</td>
                    <td className="py-1 px-1 text-right">{gstAmt.toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1 px-1 text-center">{gstRate / 2}</td>
                    <td className="py-1 px-1 text-right">{(gstAmt / 2).toFixed(2)}</td>
                    <td className="py-1 px-1 text-center">{gstRate / 2}</td>
                    <td className="py-1 px-1 text-right">{(gstAmt / 2).toFixed(2)}</td>
                  </>
                )}
                <td className="py-1 px-1 text-right">{(taxable + gstAmt).toFixed(2)}</td>
              </tr>
            );
          })}

          <tr className="border-t border-dashed border-black">
            <td colSpan="12" className="font-bold py-1 px-1">Labour Charges</td>
          </tr>
          {labourItems.map((item, index) => {
            const rate = parseFloat(item.rate) || 0;
            const qty = parseFloat(item.qty) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxable = rate * qty - discount;
            const gstRate = parseFloat(item.gst_rate) || 0;
            const gstAmt = taxable * gstRate / 100;
            return (
              <tr key={`labour-${index}`} className="border-b">
                <td className="py-1 px-1">{index + 1}</td>
                <td className="py-1 px-1">{item.item_name}</td>
                <td className="py-1 px-1 text-center">{qty}</td>
                <td className="py-1 px-1 text-right">{rate.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">{discount.toFixed(2)}</td>
                <td className="py-1 px-1 text-right">{taxable.toFixed(2)}</td>
                <td className="py-1 px-1 text-center">{item.hsn_code}</td>
                {isInterState ? (
                  <>
                    <td className="py-1 px-1 text-center">{gstRate}</td>
                    <td className="py-1 px-1 text-right">{gstAmt.toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1 px-1 text-center">{gstRate / 2}</td>
                    <td className="py-1 px-1 text-right">{(gstAmt / 2).toFixed(2)}</td>
                    <td className="py-1 px-1 text-center">{gstRate / 2}</td>
                    <td className="py-1 px-1 text-right">{(gstAmt / 2).toFixed(2)}</td>
                  </>
                )}
                <td className="py-1 px-1 text-right">{(taxable + gstAmt).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-2 text-[10px]">
        <div>
          <p className="font-bold">HSN Wise Summary:</p>
          <table className="w-full mt-1">
            <thead>
              <tr className="border-b border-black text-center">
                <th>HSN</th><th>Taxable</th>
                {isInterState ? (<><th>IGST%</th><th>IGST Amt</th></>) : (<><th>CGST%</th><th>CGST Amt</th><th>SGST%</th><th>SGST Amt</th></>)}
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hsnSummary).map(([hsn, data]) => (
                <tr key={hsn} className="text-center">
                  <td className="py-0.5 px-1">{hsn}</td><td className="py-0.5 px-1 text-right">{data.taxable.toFixed(2)}</td>
                  {isInterState ? (<><td className="py-0.5 px-1">{data.rate}</td><td className="py-0.5 px-1 text-right">{data.igst.toFixed(2)}</td></>) : (<><td className="py-0.5 px-1">{data.rate / 2}</td><td className="py-0.5 px-1 text-right">{data.cgst.toFixed(2)}</td><td className="py-0.5 px-1">{data.rate / 2}</td><td className="py-0.5 px-1 text-right">{data.sgst.toFixed(2)}</td></>)}
                  <td className="py-0.5 px-1 text-right">{(data.cgst + data.sgst + data.igst).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold text-center">
                <td className="py-0.5 px-1 text-left">Total</td><td className="py-0.5 px-1 text-right">{hsnSummaryTotals.taxable.toFixed(2)}</td>
                {isInterState ? (<><td colSpan="1"></td><td className="py-0.5 px-1 text-right">{hsnSummaryTotals.igst.toFixed(2)}</td></>) : (<><td colSpan="1"></td><td className="py-0.5 px-1 text-right">{hsnSummaryTotals.cgst.toFixed(2)}</td><td colSpan="1"></td><td className="py-0.5 px-1 text-right">{hsnSummaryTotals.sgst.toFixed(2)}</td></>)}
                <td className="py-0.5 px-1 text-right">{hsnSummaryTotals.totalTax.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="font-bold mt-2">Next Due Date: {jobCard.next_due_date ? new Date(jobCard.next_due_date).toLocaleDateString('en-IN') : 'N/A'}</p>
        </div>

        <div className="text-right space-y-1">
          <p>Parts Total: <span className="font-semibold">{partsTotals.taxable.toFixed(2)}</span></p>
          <p>Labour Total: <span className="font-semibold">{labourTotals.taxable.toFixed(2)}</span></p>
          <p>Sub Total: <span className="font-semibold">{subTotal.toFixed(2)}</span></p>
          {isInterState ? (<p>IGST: <span className="font-semibold">{totalIgst.toFixed(2)}</span></p>) : (<><p>CGST: <span className="font-semibold">{totalCgst.toFixed(2)}</span></p><p>SGST: <span className="font-semibold">{totalSgst.toFixed(2)}</span></p></>)}
          <p className="font-bold">Grand Total: <span className="font-semibold">{grandTotal.toFixed(2)}</span></p>
          <p>Round Off: <span className="font-semibold">{roundOff}</span></p>
          <p className="font-bold border-t border-black mt-1 pt-1">Net Total: <span className="font-semibold">₹ {roundedTotal.toFixed(2)}</span></p>
        </div>
      </div>

      <p className="capitalize my-2 font-bold text-[10px]">(In Rupees: {numberToWords(roundedTotal)})</p>

      {deniedItems && deniedItems.length > 0 && (
        <>
          <p className="font-bold mt-4 text-[10px]">Denied Jobs / Customer Remarks:</p>
          <ul className="list-disc list-inside text-[10px]">
            {deniedItems.map((item, index) => (
              <li key={`denied-${index}`}>{item}</li>
            ))}
          </ul>
        </>
      )}

      <div className="grid grid-cols-3 gap-4 mt-4 text-[10px]">
        <div className="col-span-2">
          <p className="font-bold">Terms & Conditions:</p>
          <p className="whitespace-pre-wrap">{settings.terms_and_conditions || 'E & O.E.'}</p>
        </div>
        {settings.upi_qr_code_url && (
          <div className="text-center">
            <p className="font-bold">Scan to Pay</p>
            <img src={settings.upi_qr_code_url} alt="UPI QR Code" className="h-20 w-20 mx-auto mt-1" />
          </div>
        )}
      </div>

      {settings.bank_details?.account_number && (
        <div className="mt-4 text-[10px] border-t border-black pt-2">
          <p className="font-bold">Bank Details:</p>
          <p>A/C Name: {settings.bank_details.account_holder_name}</p>
          <p>A/C No: {settings.bank_details.account_number}</p>
          <p>Bank: {settings.bank_details.bank_name}</p>
          <p>IFSC: {settings.bank_details.ifsc_code}</p>
        </div>
      )}

      <footer className="mt-16 pt-8 text-right text-sm">
        <p>For {settings.companyName}</p>
        <div className="mt-8">
          <p>Authorised Signatory</p>
        </div>
      </footer>
    </div>
  );
};

export default JobCardPDF;