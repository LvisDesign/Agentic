// Paystack Inline SDK Integration for Setlla
// Enables real Naira payments for Ad Campaigns (Card, Bank Transfer, USSD, OPay)

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in Kobo (amount in NGN * 100)
        currency?: string;
        ref?: string;
        channels?: string[];
        metadata?: Record<string, any>;
        callback: (response: {
          reference: string;
          status?: string;
          trans?: string;
          transaction?: string;
          message?: string;
          [key: string]: any;
        }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackPaymentOptions {
  email: string;
  amountNaira: number;
  applicantName?: string;
  applicantPhone?: string;
  purposeTitle?: string;
  merchantName?: string;
  metadata?: Record<string, any>;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  onSuccess: (paymentReference: string, paymentMethod: 'Card' | 'Bank Transfer' | 'USSD') => void;
  onClose?: () => void;
  onError?: (error: Error | string) => void;
}

/**
 * Check if a valid Paystack Public Key is configured in environment variables
 */
export const isPaystackConfigured = (): boolean => {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  return Boolean(key && typeof key === 'string' && key.trim().startsWith('pk_'));
};

/**
 * Get the configured Paystack Public Key
 */
export const getPaystackPublicKey = (): string => {
  return (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();
};

/**
 * Dynamically loads Paystack Inline JS script (v1) if not already loaded
 */
export const loadPaystackScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.PaystackPop) {
      resolve(true);
      return;
    }

    // Check if script element is already in DOM
    const existing = document.querySelector('script[src*="paystack.co"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Paystack inline.js could not be loaded from CDN.');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * Generates a unique transaction reference for tracking
 */
export const generatePaystackReference = (prefix = 'STL_AD'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Launch the official Paystack popup checkout modal
 */
export const launchPaystackCheckout = async (options: PaystackPaymentOptions): Promise<boolean> => {
  const publicKey = getPaystackPublicKey();
  if (!publicKey) {
    if (options.onError) {
      options.onError(new Error('Paystack public key is not configured.'));
    }
    return false;
  }

  const loaded = await loadPaystackScript();
  if (!loaded || !window.PaystackPop) {
    if (options.onError) {
      options.onError(new Error('Failed to load Paystack payment gateway. Please check your internet connection.'));
    }
    return false;
  }

  const amountInKobo = Math.round(Math.max(1, options.amountNaira) * 100);
  const transactionRef = generatePaystackReference('STL_AD');

  try {
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: options.email || 'customer@setlla.com',
      amount: amountInKobo,
      currency: 'NGN',
      ref: transactionRef,
      channels: options.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: options.applicantName || 'Setlla Customer',
          },
          {
            display_name: 'Phone Number',
            variable_name: 'phone_number',
            value: options.applicantPhone || '',
          },
          {
            display_name: 'Purpose',
            variable_name: 'payment_purpose',
            value: options.purposeTitle || 'Ad Campaign Placement',
          },
          {
            display_name: 'Platform',
            variable_name: 'platform',
            value: 'Setlla Web App',
          },
        ],
        ...(options.metadata || {}),
      },
      callback: (response) => {
        const reference = response.reference || transactionRef;
        // Determine method if available, default to 'Card'
        const method: 'Card' | 'Bank Transfer' | 'USSD' = 
          response.message?.toLowerCase().includes('bank') ? 'Bank Transfer' :
          response.message?.toLowerCase().includes('ussd') ? 'USSD' : 'Card';

        options.onSuccess(reference, method);
      },
      onClose: () => {
        if (options.onClose) {
          options.onClose();
        }
      },
    });

    handler.openIframe();
    return true;
  } catch (err: any) {
    console.error('Paystack popup error:', err);
    if (options.onError) {
      options.onError(err);
    }
    return false;
  }
};
