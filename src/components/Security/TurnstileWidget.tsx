import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          action?: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export interface TurnstileRef {
  reset: () => void;
  getResponse: () => string | undefined;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  showBadgeNotice?: boolean;
}

const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAF0F0Re_rp67oVmz';

export const TurnstileWidget = forwardRef<TurnstileRef, TurnstileWidgetProps>(({
  onVerify,
  onError,
  onExpire,
  action = 'signup',
  theme = 'light',
  className = '',
  showBadgeNotice = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Keep fresh callback references without triggering widget re-renders
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  const siteKey = (
    import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || 
    DEFAULT_TURNSTILE_SITE_KEY
  ).trim();

  // Expose reset and getResponse to parent forms
  useImperativeHandle(ref, () => ({
    reset: () => {
      setIsVerified(false);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
    getResponse: () => {
      if (window.turnstile && widgetIdRef.current) {
        return window.turnstile.getResponse(widgetIdRef.current);
      }
      return undefined;
    },
  }));

  // Ensure Cloudflare Turnstile script is loaded in head
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.turnstile) {
      setIsReady(true);
      return;
    }

    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkReady = setInterval(() => {
      if (window.turnstile) {
        setIsReady(true);
        clearInterval(checkReady);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkReady);
    }, 10000);

    return () => {
      clearInterval(checkReady);
      clearTimeout(timeout);
    };
  }, []);

  // Render Turnstile widget once script and DOM container are ready
  // CRITICAL: Stable render - NEVER destroy widget on parent re-renders
  useEffect(() => {
    if (!isReady || !containerRef.current || !window.turnstile || !siteKey) return;

    // If already rendered in this container, do not re-render
    if (widgetIdRef.current) return;

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme,
        size: 'flexible',
        callback: (token: string) => {
          setIsVerified(true);
          onVerifyRef.current?.(token);
        },
        'error-callback': (code: string) => {
          setIsVerified(false);
          console.warn('[Turnstile] Verification error code:', code);
          onErrorRef.current?.(code);
        },
        'expired-callback': () => {
          setIsVerified(false);
          onExpireRef.current?.();
        },
      });

      widgetIdRef.current = widgetId;
    } catch (err) {
      console.warn('[Turnstile] Failed to render widget:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
      }
    };
  }, [isReady, siteKey, action, theme]);

  return (
    <div className={`turnstile-wrapper my-2 flex flex-col items-center justify-center ${className}`}>
      {/* Cloudflare Turnstile Render Mount Target */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[46px] flex justify-center items-center" 
      />

      {showBadgeNotice && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
          <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>
            {isVerified ? 'Cloudflare Bot Protection: Verified' : 'Protected by Cloudflare Turnstile'}
          </span>
        </div>
      )}
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

