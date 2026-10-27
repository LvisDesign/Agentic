import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ChevronRight, X, Building2, AlertCircle } from 'lucide-react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { triggerDeviceVibration, playNotificationSound } from '../../utils/realtimeNotifications';

export type NotificationType = 'inspection_request' | 'inspection_confirmed' | 'inspection_declined' | 'new_listing' | 'listing_updated' | 'general';

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
  let badgeLabel = 'Setlla Real-Time Alert';
  let badgeColor = 'text-[#342A21] bg-[#F6F3EF] border-[#E5E7EB]';
  let actionLabel = notification.actionText || 'Tap to view details';

  if (notifType === 'inspection_request') {
    badgeLabel = 'New Inspection Request';
    badgeColor = 'text-[#342A21] bg-[#F6F3EF] border-[#E5E7EB]';
    if (!notification.actionText) actionLabel = 'Review in Agent Portal';
  } else if (notifType === 'inspection_confirmed') {
    badgeLabel = 'Inspection Confirmed';
    badgeColor = 'text-[#342A21] bg-[#F6F3EF] border-[#E5E7EB]';
    if (!notification.actionText) actionLabel = 'View Contact Details';
  } else if (notifType === 'inspection_declined') {
    badgeLabel = 'Inspection Declined';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    if (!notification.actionText) actionLabel = 'Explore Other Properties';
  } else if (notifType === 'new_listing') {
    badgeLabel = 'New Property';
    badgeColor = 'text-[#342A21] bg-[#F6F3EF] border-[#E5E7EB]';
    if (!notification.actionText) actionLabel = 'Inspect in Feed';
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
        className="w-full bg-[#FCF9F5] text-[#342A21] rounded-[20px] p-3.5 sm:p-4 shadow-xl border border-[#E5E7EB] flex items-start gap-3.5 cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] ring-1 ring-[#342A21]/5"
      >
        {/* Dynamic App Logo / Notification Icon Badge */}
        <div className="w-10 h-10 rounded-[12px] bg-[#342A21] border border-[#342A21] text-white flex items-center justify-center shrink-0 shadow-sm">
          {notifType === 'inspection_request' ? (
            <BellRing className="w-5 h-5 text-amber-300 animate-bounce" />
          ) : notifType === 'new_listing' ? (
            <Building2 className="w-5 h-5 text-amber-200" />
          ) : notifType === 'inspection_confirmed' ? (
            <CheckCircle2 className="w-5 h-5 text-amber-300 animate-pulse" />
          ) : notifType === 'inspection_declined' ? (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          ) : (
            <BellRing className="w-5 h-5 text-amber-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {badgeLabel}
            </span>
            <span className="text-[10px] text-[#70798C]">• Just now</span>
          </div>

          <h5 className="font-bold text-xs sm:text-sm text-[#342A21] flex items-center gap-1.5">
            <span className="truncate">{notification.title}</span>
            {notifType === 'inspection_confirmed' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
            )}
          </h5>

          <p className="text-[11px] sm:text-xs text-[#70798C] line-clamp-2 mt-0.5 leading-snug">
            {notification.body}
          </p>

          {/* Action Button: Dark Brown Button */}
          <div className="mt-2.5 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#342A21] hover:bg-[#231C16] text-white text-[11px] font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer select-none"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
          className="w-6 h-6 rounded-full bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-[#E5E7EB]"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
