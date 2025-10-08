import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';

const CompanyDetails = ({ settings, errors, handleCompanyChange, handleSave, isSaving, updateSettings }) => {
  const { toast } = useToast();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingQR, setIsUploadingQR] = useState(false);

  if (!settings) {
    return (
      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent>
          <p>Loading company details...</p>
        </CardContent>
      </Card>
    );
  }

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    const newBankDetails = { ...settings.bank_details, [name]: value };
    updateSettings({ bank_details: newBankDetails });
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    if (type === 'logo') setIsUploadingLogo(true);
    if (type === 'qr') setIsUploadingQR(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
      }
      
      const publicUrl = data.publicUrl;

      if (type === 'logo') {
        updateSettings({ company_logo_url: publicUrl });
        toast({ title: 'Success', description: 'Company logo uploaded.' });
      } else if (type === 'qr') {
        updateSettings({ upi_qr_code_url: publicUrl });
        toast({ title: 'Success', description: 'UPI QR code uploaded.' });
      }
    } catch (error) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      if (type === 'qr') setIsUploadingQR(false);
    }
  };

  const removeImage = (type) => {
    if (type === 'logo') {
      updateSettings({ company_logo_url: null });
    } else if (type === 'qr') {
      updateSettings({ upi_qr_code_url: null });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Company Name</Label>
            <Input name="companyName" value={settings.companyName || ''} onChange={handleCompanyChange} />
            {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName}</p>}
          </div>
          <div>
            <Label>GST No.</Label>
            <Input name="gstNo" value={settings.gstNo || ''} onChange={handleCompanyChange} />
            {errors.gstNo && <p className="text-red-500 text-sm">{errors.gstNo}</p>}
          </div>
          <div>
            <Label>PAN (Optional)</Label>
            <Input name="pan" value={settings.pan || ''} onChange={handleCompanyChange} />
            {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
          </div>
          <div>
            <Label>Mobile No.</Label>
            <Input name="mobile" value={settings.mobile || ''} onChange={handleCompanyChange} />
            {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input name="address" value={settings.address || ''} onChange={handleCompanyChange} />
          </div>
          <div>
            <Label>State</Label>
            <Input name="state" value={settings.state || ''} onChange={handleCompanyChange} />
          </div>
          <div>
            <Label>District</Label>
            <Input name="district" value={settings.district || ''} onChange={handleCompanyChange} />
          </div>
          <div>
            <Label>PIN Code</Label>
            <Input name="pinCode" value={settings.pinCode || ''} onChange={handleCompanyChange} />
            {errors.pinCode && <p className="text-red-500 text-sm">{errors.pinCode}</p>}
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Account Holder Name</Label>
              <Input name="account_holder_name" value={settings.bank_details?.account_holder_name || ''} onChange={handleBankDetailsChange} />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input name="account_number" value={settings.bank_details?.account_number || ''} onChange={handleBankDetailsChange} />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input name="bank_name" value={settings.bank_details?.bank_name || ''} onChange={handleBankDetailsChange} />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input name="ifsc_code" value={settings.bank_details?.ifsc_code || ''} onChange={handleBankDetailsChange} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Company Logo</Label>
              {settings.company_logo_url ? (
                <div className="mt-2 flex items-center gap-4">
                  <img src={settings.company_logo_url} alt="Company Logo" className="h-16 w-auto object-contain border p-1 rounded-md" />
                  <Button variant="destructive" size="icon" onClick={() => removeImage('logo')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], 'logo')} className="hidden" />
                  <Button asChild variant="outline" disabled={isUploadingLogo}>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" /> {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </label>
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>UPI QR Code</Label>
              {settings.upi_qr_code_url ? (
                <div className="mt-2 flex items-center gap-4">
                  <img src={settings.upi_qr_code_url} alt="UPI QR Code" className="h-16 w-16 object-contain border p-1 rounded-md" />
                  <Button variant="destructive" size="icon" onClick={() => removeImage('qr')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Input id="qr-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], 'qr')} className="hidden" />
                  <Button asChild variant="outline" disabled={isUploadingQR}>
                    <label htmlFor="qr-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" /> {isUploadingQR ? 'Uploading...' : 'Upload QR Code'}
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-6">
          <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
          <Textarea
            id="terms_and_conditions"
            name="terms_and_conditions"
            value={settings.terms_and_conditions || ''}
            onChange={handleCompanyChange}
            placeholder="Enter terms and conditions to be displayed on invoices."
            rows={4}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Company Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDetails;