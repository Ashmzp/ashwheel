// Google Analytics 4 Event Tracking

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

// Initialize GA
export const initGA = () => {
  if (!GA_TRACKING_ID) return;
  
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID);
};

// Track page views
export const trackPageView = (url) => {
  if (!window.gtag) return;
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Track events
export const trackEvent = (action, category, label, value) => {
  if (!window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Predefined event trackers
export const analytics = {
  // Tool usage
  toolUsed: (toolName) => {
    trackEvent('tool_used', 'Tools', toolName);
  },

  // Pro CTA clicks
  proCtaClicked: (location) => {
    trackEvent('pro_cta_click', 'Conversion', location);
  },

  // Newsletter signup
  newsletterSignup: (source) => {
    trackEvent('newsletter_signup', 'Engagement', source);
  },

  // File operations
  fileUploaded: (toolName, fileType) => {
    trackEvent('file_upload', 'Tools', `${toolName}_${fileType}`);
  },

  fileDownloaded: (toolName, fileType) => {
    trackEvent('file_download', 'Tools', `${toolName}_${fileType}`);
  },

  // User actions
  signupStarted: () => {
    trackEvent('signup_started', 'User', 'Signup Flow');
  },

  loginAttempt: () => {
    trackEvent('login_attempt', 'User', 'Login');
  },

  trialStarted: () => {
    trackEvent('trial_started', 'Conversion', 'Free Trial');
  },
};
