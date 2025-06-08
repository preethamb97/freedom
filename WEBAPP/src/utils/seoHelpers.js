// SEO Helper Functions for Freedom - Encrypted Data Storage
import { trackPageView, trackEvent, analytics } from '../services/firebase';

export const updateMetaTags = (page, data = {}) => {
  const baseUrl = 'https://encryptedui.trackitall.in';
  
  const seoData = {
    home: {
      title: 'Freedom - Secure AES-256 Encrypted Data Storage | Private Cloud Storage',
      description: 'Freedom provides military-grade AES-256 encryption for secure data storage. Store, encrypt, and manage your private data with 64-character keys and zero-knowledge architecture.',
      keywords: 'encrypted data storage, AES-256 encryption, secure cloud storage, private data storage, end-to-end encryption, zero-knowledge storage, military grade encryption',
      canonicalUrl: baseUrl,
      ogImage: `${baseUrl}/og-image-home.png`
    },
    dashboard: {
      title: 'Dashboard - Freedom Encrypted Storage | Secure Data Management',
      description: 'Access your encrypted data dashboard. Manage, store, and secure your files with Freedom\'s AES-256 encryption technology. Complete privacy guaranteed.',
      keywords: 'encrypted dashboard, secure file management, AES-256 dashboard, private data management, encrypted file storage',
      canonicalUrl: `${baseUrl}/home`,
      ogImage: `${baseUrl}/og-image-dashboard.png`
    },
    view: {
      title: 'View Data - Freedom Encrypted Storage | Access Encrypted Files',
      description: 'View and access your encrypted data securely. Freedom ensures your files remain protected with end-to-end encryption and zero-knowledge architecture.',
      keywords: 'view encrypted data, access secure files, encrypted file viewer, secure data access, AES-256 file access',
      canonicalUrl: `${baseUrl}/view`,
      ogImage: `${baseUrl}/og-image-view.png`
    }
  };

  const pageData = seoData[page] || seoData.home;
  
  // Update document title
  document.title = pageData.title;
  
  // Update meta description
  updateMetaTag('name', 'description', pageData.description);
  updateMetaTag('name', 'keywords', pageData.keywords);
  
  // Update Open Graph tags
  updateMetaTag('property', 'og:title', pageData.title);
  updateMetaTag('property', 'og:description', pageData.description);
  updateMetaTag('property', 'og:url', pageData.canonicalUrl);
  updateMetaTag('property', 'og:image', pageData.ogImage);
  
  // Update Twitter Card tags
  updateMetaTag('name', 'twitter:title', pageData.title);
  updateMetaTag('name', 'twitter:description', pageData.description);
  updateMetaTag('name', 'twitter:image', pageData.ogImage);
  
  // Update canonical URL
  updateOrCreateLink('canonical', pageData.canonicalUrl);
  
  // Add structured data for the page
  updateStructuredData(page, pageData);
  
  // Track page view with Firebase Analytics
  trackPageView(page, pageData.title, data.userId);
  
  // Track page-specific events
  trackPageEvents(page, data);
};

const updateMetaTag = (attribute, name, content) => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    element.setAttribute('content', content);
    document.getElementsByTagName('head')[0].appendChild(element);
  }
};

const updateOrCreateLink = (rel, href) => {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (element) {
    element.setAttribute('href', href);
  } else {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    element.setAttribute('href', href);
    document.getElementsByTagName('head')[0].appendChild(element);
  }
};

const updateStructuredData = (page, pageData) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"][data-page]');
  if (existingScript) {
    existingScript.remove();
  }
  
  let structuredData = {};
  
  switch (page) {
    case 'home':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pageData.title,
        "description": pageData.description,
        "url": pageData.canonicalUrl,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Freedom",
          "url": "https://encryptedui.trackitall.in"
        },
        "about": {
          "@type": "SoftwareApplication",
          "name": "Freedom",
          "applicationCategory": "SecurityApplication",
          "description": "Secure encrypted data storage with AES-256 encryption"
        }
      };
      break;
      
    case 'dashboard':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pageData.title,
        "description": pageData.description,
        "url": pageData.canonicalUrl,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Freedom",
          "url": "https://encryptedui.trackitall.in"
        }
      };
      break;
      
    case 'view':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pageData.title,
        "description": pageData.description,
        "url": pageData.canonicalUrl,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Freedom",
          "url": "https://encryptedui.trackitall.in"
        }
      };
      break;
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page', page);
  script.textContent = JSON.stringify(structuredData, null, 2);
  document.getElementsByTagName('head')[0].appendChild(script);
};

const trackPageEvents = (page, data) => {
  // Track specific page events for analytics
  switch (page) {
    case 'home':
      trackEvent('landing_page_view', {
        user_authenticated: !!data.userId,
        source: data.source || 'direct'
      });
      break;
      
    case 'dashboard':
      trackEvent('dashboard_access', {
        user_id: data.userId,
        session_start: true
      });
      break;
      
    case 'view':
      trackEvent('data_view_page', {
        user_id: data.userId,
        has_data: !!data.hasData
      });
      break;
  }
};

// Performance monitoring for Core Web Vitals
export const trackWebVitals = () => {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getLCP, getFID, getCLS, getFCP, getTTFB }) => {
      getLCP((metric) => {
        trackEvent('web_vitals', {
          metric_name: 'LCP',
          value: Math.round(metric.value),
          rating: metric.rating
        });
      });
      
      getFID((metric) => {
        trackEvent('web_vitals', {
          metric_name: 'FID',
          value: Math.round(metric.value),
          rating: metric.rating
        });
      });
      
      getCLS((metric) => {
        trackEvent('web_vitals', {
          metric_name: 'CLS',
          value: Math.round(metric.value * 1000) / 1000,
          rating: metric.rating
        });
      });
      
      getFCP((metric) => {
        trackEvent('web_vitals', {
          metric_name: 'FCP',
          value: Math.round(metric.value),
          rating: metric.rating
        });
      });
      
      getTTFB((metric) => {
        trackEvent('web_vitals', {
          metric_name: 'TTFB',
          value: Math.round(metric.value),
          rating: metric.rating
        });
      });
    }).catch((error) => {
      console.warn('Web Vitals import failed:', error);
    });
  }
};

// Enhanced Analytics tracking
export const initializeAnalytics = (userId = null) => {
  try {
    // Track app initialization
    trackEvent('app_initialize', {
      user_authenticated: !!userId,
      app_version: '1.0.0',
      platform: 'web'
    });
    
    // Set user properties if available
    if (userId) {
      import('../services/firebase').then(({ setAnalyticsUserId, setAnalyticsUserProperties }) => {
        setAnalyticsUserId(userId);
        setAnalyticsUserProperties({
          security_focused: true,
          encryption_user: true,
          app_version: '1.0.0'
        });
      });
    }
    
    // Track performance metrics
    trackWebVitals();
    
    console.log('Freedom Analytics: Initialized successfully');
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
};

// Track user engagement events
export const trackEngagement = (action, details = {}) => {
  trackEvent('user_engagement', {
    engagement_type: action,
    ...details
  });
};

// Track security-related events
export const trackSecurity = (action, details = {}) => {
  trackEvent('security_event', {
    security_action: action,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Track conversion events (for business metrics)
export const trackConversion = (eventType, value = null) => {
  trackEvent('conversion', {
    conversion_type: eventType,
    value: value,
    timestamp: new Date().toISOString()
  });
};

// Track error events for debugging
export const trackError = (errorType, errorMessage, context = {}) => {
  trackEvent('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    error_context: JSON.stringify(context),
    timestamp: new Date().toISOString()
  });
};

export default {
  updateMetaTags,
  trackWebVitals,
  initializeAnalytics,
  trackEngagement,
  trackSecurity,
  trackConversion,
  trackError
}; 