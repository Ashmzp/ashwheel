import React from "react";

export const validateGST = (gst) => {
  if (!gst) return true; // Optional
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const validateMobile = (mobile) => {
  if (!mobile) return false;
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

export const validateRequired = (value) => {
  return value && value.trim() !== '';
};

export const validatePinCode = (pin) => {
  if (!pin) return true; // Optional
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pin);
};

export const validatePan = (pan) => {
  if (!pan) return true; // Optional
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  return panRegex.test(pan);
};

export const validateChassisNo = (chassisNo) => {
  if (!chassisNo) return false;
  // Example: Basic alphanumeric validation, adjust regex as needed for specific formats
  const chassisRegex = /^[A-HJ-NPR-Z0-9]{17}$/; // Standard 17-character VIN (excluding I, O, Q)
  return chassisRegex.test(chassisNo.toUpperCase());
};

export const validateEngineNo = (engineNo) => {
  if (!engineNo) return false;
  // Example: Basic alphanumeric validation, adjust regex as needed
  const engineRegex = /^[A-Z0-9]{5,20}$/; // Typically 5-20 alphanumeric characters
  return engineRegex.test(engineNo.toUpperCase());
};

export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCompanyDetails = (settings) => {
  const errors = {};
  if (!validateRequired(settings.company_name)) {
    errors.company_name = 'Company Name is required.';
  }
  if (settings.gst_no && !validateGST(settings.gst_no)) {
    errors.gst_no = 'Invalid GST Number.';
  }
  if (settings.pan && !validatePan(settings.pan)) {
    errors.pan = 'Invalid PAN Number.';
  }
  if (!validateRequired(settings.mobile) || !validateMobile(settings.mobile)) {
    errors.mobile = 'Valid Mobile Number is required.';
  }
  if (!validateRequired(settings.address)) {
    errors.address = 'Address is required.';
  }
  if (!validateRequired(settings.state)) {
    errors.state = 'State is required.';
  }
  if (!validateRequired(settings.district)) {
    errors.district = 'District is required.';
  }
  if (settings.pin_code && !validatePinCode(settings.pin_code)) {
    errors.pin_code = 'Invalid Pin Code.';
  }
  return errors;
};