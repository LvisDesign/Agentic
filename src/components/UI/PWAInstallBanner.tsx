import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, BellRing, Check } from 'lucide-react';
import { isStandalone, isIOS } from '../../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'pwa_prompt_dismissed_until';
const SNOOZE_DAYS = 14;

/**
 * Checks if the prompt is currently snoozed in localStorage (14-day rule)
 */
const isSnoozed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);
    if (!dismissedUntil) return false;
    return new Date().getTime() < Number(dismissedUntil);
  } catch {
    return false;
  }
};

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Dismiss handler for "Not Now" and "X" buttons (14-day snooze)
  const handleDismiss = () => {
    try {
      const expiryTime = new Date().getTime() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, expiryTime.toString());
    } catch (e) {
      console.warn('[PWA] Storage access warning:', e);
    }
    setIsVisible(false);
    setShowIOSModal(false);
  };

  // Hide permanently (1 year) on successful installation
  const handleInstallSuccess = () => {
    try {
      const expiryTime = new Date().getTime() + 365 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, expiryTime.toString());
    } catch (e) {
      console.warn('[PWA] Storage access warning:', e);
    }
    setIsVisible(false);
    setShowIOSModal(false);
  };

  useEffect(() => {
    // 1. If already installed / running standalone, do not render
    if (isStandalone()) {
      return;
    }

    // 2. Check 14-day snooze persistence
    if (isSnoozed()) {
      return;
    }

    const ios = isIOS();
    setIsIOSDevice(ios);

    // 3. For iOS devices, wait 3 seconds after page load before showing optional unobtrusive card
    if (ios) {
      const timer = setTimeout(() => {
        if (!isSnoozed()) {
          setIsVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Edge native beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isSnoozed()) {
        setIsVisible(true);
      }
    };

    // 5. Global app installed listener
    const handleAppInstalled = () => {
      handleInstallSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        handleInstallSuccess();
      } else {
        handleDismiss();
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error launching install prompt:', err);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Card Banner - Completely optional and non-intrusive */}
      <aside
        aria-label="PWA Installation Prompt"
        className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 animate-slide-up"
      >
        <div className="bg-white rounded-2xl p-4 shadow-xl border border-[#E5E7EB] flex items-start gap-3.5 relative ring-1 ring-black/5">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-[#275DAD] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Smartphone className="w-5 h-5 text-white" />
          </div>

          {/* Copy & Actions */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-[#000004]">
                Install Platform App
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#275DAD]/10 text-[#275DAD]">
                Official App
              </span>
            </div>

            <p className="text-xs text-[#70798C] mt-1 leading-relaxed">
              Install our app to receive instant booking alerts and direct Lister updates on your phone.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="py-2 px-3.5 rounded-xl bg-[#275DAD] hover:bg-[#1f4b8c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOSDevice ? 'How to Install' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Close Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer transition-colors"
            title="Dismiss for 14 days"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* iOS Safari Installation Guide Modal Popover */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#E5E7EB] text-[#000004] space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#275DAD] text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-[#000004]">
                    Add to iPhone Home Screen
                  </h4>
                  <p className="text-[11px] text-[#70798C]">Quick 2-step setup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-slate-100 text-[#70798C] hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#000004]">
              <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#275DAD] flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Step 1: Tap Share</p>
                  <p className="text-[11px] text-[#70798C]">Tap the Share icon at the bottom of your Safari browser bar.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#275DAD] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Step 2: Add to Home Screen</p>
                  <p className="text-[11px] text-[#70798C]">Scroll down and select <span className="font-semibold text-[#000004]">'Add to Home Screen'</span>.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-950 flex items-center gap-2">
                <BellRing className="w-3.5 h-3.5 text-[#275DAD] shrink-0" />
                <span>Enables native mobile alerts and instant inspection updates on your home screen.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-[#275DAD] text-white text-xs font-bold hover:bg-[#1f4b8c] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Got It</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
