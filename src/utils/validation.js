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