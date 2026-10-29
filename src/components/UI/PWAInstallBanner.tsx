import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  BellRing, 
  Check, 
  RotateCw,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { isIOS, isStandalone, usePWA, subscribePrompt, BeforeInstallPromptEvent } from '../../utils/pwa';
import { ModalPortal } from './ModalPortal';
import { UserProfile } from '../../types/marketplace';

const STORAGE_KEY = 'setlla_pwa_dismissed_until';
const SNOOZE_HOURS = 24;

interface PWAInstallBannerProps {
  currentUser?: UserProfile | null;
}

/**
 * Checks if the prompt is currently snoozed in localStorage (24-hour rule)
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

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ currentUser }) => {
  const { isStandalone: hookStandalone, updateAvailable, applyUpdate } = usePWA();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Dismiss handler for "Not Now" and "X" buttons (24-hour snooze)
  const handleDismiss = () => {
    try {
      const expiryTime = new Date().getTime() + SNOOZE_HOURS * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, expiryTime.toString());
    } catch (e) {
      console.warn('[PWA] Storage access warning:', e);
    }
    setIsVisible(false);
    setShowIOSModal(false);
    setShowAndroidModal(false);
  };

  // Hide permanently on successful installation
  const handleInstallSuccess = () => {
    try {
      const expiryTime = new Date().getTime() + 365 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, expiryTime.toString());
      localStorage.setItem('setlla_pwa_installed', 'true');
    } catch (e) {
      console.warn('[PWA] Storage access warning:', e);
    }
    setIsVisible(false);
    setShowIOSModal(false);
    setShowAndroidModal(false);
  };

  useEffect(() => {
    // 1. If currently running inside standalone PWA mode, never show install prompt
    if (isStandalone() || hookStandalone) {
      setIsVisible(false);
      return;
    }

    const ios = isIOS();
    setIsIOSDevice(ios);

    // 2. Listen to deferred native beforeinstallprompt event
    const unsubPrompt = subscribePrompt((prompt) => {
      if (prompt) {
        setDeferredPrompt(prompt);
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      handleInstallSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. Trigger prompt popup:
    // - Immediately on landing for new users (explore page)
    // - Also for all users who already signed up (currentUser present)
    const timer = setTimeout(() => {
      // Don't show if already in standalone app
      if (isStandalone()) return;

      // If snoozed within last 24h, check if this is an active signed-up user
      // Signed-up users always get priority to have the app installed
      const snoozed = isSnoozed();
      if (!snoozed || Boolean(currentUser)) {
        setIsVisible(true);
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      unsubPrompt();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [hookStandalone, currentUser]);

  const handleInstallClick = async () => {
    // 1. iOS Safari device -> Open iOS 2-step setup guide
    if (isIOSDevice) {
      setShowIOSModal(true);
      return;
    }

    // 2. Android / Desktop with native prompt ready -> Trigger 1-tap browser dialogue
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          handleInstallSuccess();
        } else {
          handleDismiss();
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.error('[PWA] Error launching native install prompt:', err);
      }
    }

    // 3. Android / Other browser where beforeinstallprompt was not captured -> Open Android/Chrome guide
    setShowAndroidModal(true);
  };

  // If running standalone and no update, render nothing
  if (isStandalone() || hookStandalone) {
    if (!updateAvailable) return null;
  }

  return (
    <>
      {/* Floating App Update Prompt when a new version is ready */}
      {updateAvailable && (
        <aside
          aria-label="Setlla Update Available"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-[100] animate-slide-up"
        >
          <div className="bg-[#000004] text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <RotateCw className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Update Available</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black uppercase">New</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 truncate">
                  A fresh version of Setlla is ready.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={applyUpdate}
              className="py-2 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
            >
              Update Now
            </button>
          </div>
        </aside>
      )}

      {/* Primary Floating PWA Install Notification Card */}
      {isVisible && !isStandalone() && !hookStandalone && (
        <aside
          aria-label="PWA Installation Prompt"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-[99] animate-slide-up"
        >
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-[#E5E7EB] flex items-start gap-3.5 relative ring-1 ring-black/5">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#000004] overflow-hidden flex items-center justify-center shrink-0 shadow-sm mt-0.5 p-1 border border-black/10">
              <img 
                src="/icons/icon-192x192.png" 
                alt="Setlla App Icon" 
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  // Fallback to text if icon fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Copy & Actions */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm text-[#000004]">
                  Install Setlla App
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#000004] text-white">
                  Official
                </span>
              </div>

              <p className="text-xs text-[#70798C] mt-1 leading-relaxed">
                Add Setlla to your home screen for instant booking alerts, faster browsing, and 1-tap access.
              </p>

              <div className="flex items-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F95700]" />
                  <span>{isIOSDevice ? 'Add to Home Screen' : 'Install App'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2.5 px-3 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
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
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari Installation Guide Modal Popover */}
      {showIOSModal && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setShowIOSModal(false)}
          >
            <div 
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#E5E7EB] text-[#000004] space-y-4 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#000004] overflow-hidden flex items-center justify-center shadow-xs p-1">
                    <img src="/icons/icon-192x192.png" alt="Setlla" className="w-full h-full object-contain rounded-md" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-[#000004]">
                      Add Setlla to iPhone
                    </h4>
                    <p className="text-[11px] text-[#70798C]">Quick 2-step setup</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-[#70798C] hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[#000004]">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center shrink-0 border border-slate-200">
                    <Share2 className="w-4 h-4 text-[#F95700]" />
                  </div>
                  <div>
                    <p className="font-bold">Step 1: Tap the Share Button</p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Tap the Share icon at the bottom of your Safari browser bar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center shrink-0 border border-slate-200">
                    <PlusSquare className="w-4 h-4 text-[#F95700]" />
                  </div>
                  <div>
                    <p className="font-bold">Step 2: Add to Home Screen</p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Scroll down and tap <strong className="text-[#000004]">'Add to Home Screen'</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#70798C] flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-[#F95700] shrink-0" />
                  <span>Enables native push alerts and instant inspection updates on your phone.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Got It</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Android / Chrome Manual Installation Guide Modal (Fallback when native prompt not supported) */}
      {showAndroidModal && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setShowAndroidModal(false)}
          >
            <div 
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#E5E7EB] text-[#000004] space-y-4 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#000004] overflow-hidden flex items-center justify-center shadow-xs p-1">
                    <img src="/icons/icon-192x192.png" alt="Setlla" className="w-full h-full object-contain rounded-md" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-[#000004]">
                      Install Setlla on Phone
                    </h4>
                    <p className="text-[11px] text-[#70798C]">Quick 2-step setup</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAndroidModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-[#70798C] hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[#000004]">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center shrink-0 border border-slate-200">
                    <MoreVertical className="w-4 h-4 text-[#F95700]" />
                  </div>
                  <div>
                    <p className="font-bold">Step 1: Tap Browser Menu (⋮)</p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Tap the three dots (⋮) in the top-right corner of your browser.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center shrink-0 border border-slate-200">
                    <Download className="w-4 h-4 text-[#F95700]" />
                  </div>
                  <div>
                    <p className="font-bold">Step 2: Tap 'Install App'</p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Select <strong className="text-[#000004]">'Install App'</strong> or <strong className="text-[#000004]">'Add to Home screen'</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#70798C] flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-[#F95700] shrink-0" />
                  <span>Enables native home screen icon and real-time inspection notifications.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAndroidModal(false)}
                className="w-full py-3 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Got It</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};
