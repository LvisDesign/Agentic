import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ChevronRight, X, Building2, Sparkles, AlertCircle } from 'lucide-react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { triggerDeviceVibration, playNotificationSound } from '../../utils/realtimeNotifications';

export type NotificationType = 'inspection_request' | 'inspection_confirmed' | 'new_listing' | 'listing_updated' | 'general';

export interface PushNotificationData {
  title: string;
  body: string;
  type?: NotificationType;
  listing?: PropertyListing;
  booking?: BookingRecord;
  actionText?: string;
  onAction?: () => void;
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
      
      // Play audio chime and device vibration
      const soundType = notification.type === 'inspection_confirmed' ? 'success' : 'alert';
      playNotificationSound(soundType);
      triggerDeviceVibration([150, 75, 150]);

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

  const notifType = notification.type || 'inspection_confirmed';

  // Determine badge styling and default action copy
  let badgeLabel = 'DeltaRent Real-Time Alert';
  let badgeColor = 'text-emerald-400';
  let actionLabel = notification.actionText || 'Tap to view details';

  if (notifType === 'inspection_request') {
    badgeLabel = 'New Inspection Request';
    badgeColor = 'text-amber-400';
    if (!notification.actionText) actionLabel = 'Tap to review in Agent Portal';
  } else if (notifType === 'inspection_confirmed') {
    badgeLabel = 'Inspection Confirmed';
    badgeColor = 'text-emerald-400';
    if (!notification.actionText) actionLabel = 'Tap to view unlocked contact details';
  } else if (notifType === 'new_listing') {
    badgeLabel = 'New Verified Property';
    badgeColor = 'text-sky-400';
    if (!notification.actionText) actionLabel = 'Tap to inspect in Explore feed';
  }

  const handleBannerClick = () => {
    if (notification.onAction) {
      notification.onAction();
    }
    onClickNotification(notification);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[94vw] sm:w-[440px] animate-slide-down">
      <div 
        onClick={handleBannerClick}
        className="w-full bg-[#000004]/95 text-white backdrop-blur-md rounded-[18px] p-3.5 sm:p-4 shadow-2xl border border-white/20 flex items-start gap-3.5 cursor-pointer hover:bg-[#000004] transition-all hover:scale-[1.01] active:scale-[0.99] ring-1 ring-white/10"
      >
        {/* Dynamic App Logo / Notification Icon Badge */}
        <div className="w-10 h-10 rounded-[12px] bg-[#342A21] border border-white/20 text-white flex items-center justify-center shrink-0 shadow-md">
          {notifType === 'inspection_request' ? (
            <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
          ) : notifType === 'new_listing' ? (
            <Building2 className="w-5 h-5 text-sky-400" />
          ) : notifType === 'inspection_confirmed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${badgeColor} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
              {badgeLabel}
            </span>
            <span className="text-[10px] text-white/50">• Just now</span>
          </div>

          <h5 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
            <span className="truncate">{notification.title}</span>
            {notifType === 'inspection_confirmed' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
          </h5>

          <p className="text-[11px] sm:text-xs text-white/85 line-clamp-2 mt-0.5 leading-snug">
            {notification.body}
          </p>

          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
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
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
