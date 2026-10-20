import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';

export interface PushNotificationData {
  title: string;
  body: string;
  listing: PropertyListing;
  booking: BookingRecord;
}

interface PushNotificationBannerProps {
  notification: PushNotificationData | null;
  onDismiss: () => void;
  onClickNotification: (notification: PushNotificationData) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  notification,
  onDismiss,
  onClickNotification,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Try native vibration if supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch (_) {}
      }

      // Auto dismiss after 8.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 8500);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92vw] sm:w-[420px] animate-slide-down">
      <div 
        onClick={() => onClickNotification(notification)}
        className="w-full bg-[#000004]/95 text-white backdrop-blur-md rounded-[16px] p-3.5 shadow-2xl border border-white/15 flex items-start gap-3 cursor-pointer hover:bg-[#000004] transition-all hover:scale-[1.01] active:scale-[0.99] ring-1 ring-white/10"
      >
        {/* App Logo / Notification Icon Badge */}
        <div className="w-10 h-10 rounded-[12px] bg-[#342A21] border border-white/20 text-white flex items-center justify-center shrink-0 shadow-md">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PWA Push Notification
            </span>
            <span className="text-[10px] text-white/50">• Just now</span>
          </div>

          <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
            <span>{notification.title}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </h5>

          <p className="text-[11px] sm:text-xs text-white/80 line-clamp-2 mt-0.5 leading-snug">
            {notification.body}
          </p>

          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300">
            <span>Tap to view unlocked contact details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(onDismiss, 200);
          }}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
