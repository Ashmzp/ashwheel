/**
 * Device Fingerprinting
 * More secure alternative to localStorage device ID
 */

/**
 * Generate device fingerprint based on browser characteristics
 * @returns {string} - Unique device fingerprint
 */
export const getDeviceFingerprint = () => {
  try {
    // Canvas fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Ashwheel', 2, 2);
    
    const canvasFingerprint = canvas.toDataURL().slice(-50);

    // Collect browser characteristics
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      canvasFingerprint: canvasFingerprint,
      touchSupport: 'ontouchstart' in window,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      // Add more unique identifiers
      maxTouchPoints: navigator.maxTouchPoints || 0,
      vendor: navigator.vendor || '',
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
    };

    // Create hash from fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    const hash = simpleHash(fingerprintString);
    
    return hash;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to random ID
    return generateFallbackId();
  }
};

/**
 * Simple hash function
 * @param {string} str - String to hash
 * @returns {string} - Hash string
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
};

/**
 * Generate fallback ID if fingerprinting fails
 * @returns {string} - Random ID
 */
const generateFallbackId = () => {
  return 'fallback_' + Math.random().toString(36).substring(2, 15);
};

/**
 * Get or create device ID with fingerprinting
 * @returns {string} - Device ID
 */
export const getOrCreateDeviceId = () => {
  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      // Generate new fingerprint-based device ID
      deviceId = getDeviceFingerprint();
      localStorage.setItem('device_id', deviceId);
      console.log('✅ New device fingerprint created');
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateFallbackId();
  }
};

/**
 * Validate device fingerprint
 * @returns {boolean} - Is valid
 */
export const validateDeviceFingerprint = () => {
  try {
    const storedId = localStorage.getItem('device_id');
    const currentFingerprint = getDeviceFingerprint();
    
    // Allow some tolerance for minor changes
    return storedId === currentFingerprint;
  } catch (error) {
    console.error('Error validating fingerprint:', error);
    return true; // Allow access on error
  }
};

export default {
  getDeviceFingerprint,
  getOrCreateDeviceId,
  validateDeviceFingerprint
};
