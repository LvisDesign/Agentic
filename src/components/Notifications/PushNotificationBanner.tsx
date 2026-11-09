import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, X, Building2, AlertCircle, UserX, Briefcase, Clock, Megaphone, Check } from 'lucide-react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { triggerDeviceVibration, playNotificationSound } from '../../utils/realtimeNotifications';
import { SetllaNotificationCategory, getNotificationPreferences } from '../../services/notificationService';

export type NotificationType = SetllaNotificationCategory;

export interface PushNotificationData {
  id?: string;
  eventKey?: string;
  title: string;
  body: string;
  type?: NotificationType;
  listing?: PropertyListing;
  booking?: BookingRecord;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

interface PushNotificationBannerProps {
  notification: PushNotificationData | null;
  queuedCount?: number;
  onDismiss: () => void;
  onClickNotification: (notification: PushNotificationData) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  notification,
  queuedCount = 0,
  onDismiss,
  onClickNotification,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    if (notification) {
      if (!getNotificationPreferences().pushBannerEnabled) {
        onDismiss();
        return;
      }

      setIsVisible(true);
      setIconError(false);

      // Play audio chime and device vibration
      const soundType =
        notification.type === 'inspection_confirmed' ||
        notification.type === 'listing_published' ||
        notification.type === 'job_published'
          ? 'success'
          : 'alert';
      playNotificationSound(soundType);
      triggerDeviceVibration([150, 75, 150]);

      // Auto dismiss after 9 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 9000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  const notifType = notification.type || 'general';
  const cleanTitle = notification.title.replace(/^[🔔🎉✅⚠️🚀💼🏢]+\s*/, '').trim();

  // Determine badge styling and default action copy aligned with Setlla design system
  let badgeLabel = 'Setlla Update';
  let badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
  let dotColor = 'bg-[#FFAD05]';
  let actionLabel = notification.actionText || 'Tap to view details';

  if (notifType === 'account_deleted') {
    badgeLabel = 'Account Notice';
    badgeColor = 'text-rose-800 bg-rose-50 border-rose-200';
    dotColor = 'bg-rose-500';
    if (!notification.actionText) actionLabel = 'Contact Support: support@setlla.com';
  } else if (notifType === 'listing_published') {
    badgeLabel = 'Listing Live';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-emerald-500';
    if (!notification.actionText) actionLabel = 'View on Explore Feed';
  } else if (notifType === 'inspection_request') {
    badgeLabel = 'Inspection Request';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-[#FFAD05]';
    if (!notification.actionText) actionLabel = 'Review in Agent Portal';
  } else if (notifType === 'inspection_confirmed') {
    badgeLabel = 'Inspection Confirmed';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-emerald-500';
    if (!notification.actionText) actionLabel = 'View Contact Details';
  } else if (notifType === 'inspection_declined') {
    badgeLabel = 'Inspection Declined';
    badgeColor = 'text-rose-800 bg-rose-50 border-rose-200';
    dotColor = 'bg-rose-500';
    if (!notification.actionText) actionLabel = 'Explore Other Properties';
  } else if (notifType === 'new_listing') {
    badgeLabel = 'New Listing';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-[#FFAD05]';
    if (!notification.actionText) actionLabel = 'Inspect in Feed';
  } else if (notifType === 'job_published') {
    badgeLabel = 'Job Vacancy Live';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-emerald-500';
    if (!notification.actionText) actionLabel = 'View in Setlla Jobs';
  } else if (notifType === 'job_application_received') {
    badgeLabel = 'New Applicant';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-[#FFAD05]';
    if (!notification.actionText) actionLabel = 'Review Candidate CV';
  } else if (notifType === 'job_status_updated') {
    badgeLabel = 'Application Update';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-emerald-500';
    if (!notification.actionText) actionLabel = 'View Application Status';
  } else if (notifType === 'freshness_reminder') {
    badgeLabel = '48h Freshness Check';
    badgeColor = 'text-[#8A5A00] bg-[#FFF3D1] border-[#E8CC88]';
    dotColor = 'bg-[#FFAD05]';
    if (!notification.actionText) actionLabel = 'Confirm Still Vacant';
  } else if (notifType === 'advert_status') {
    badgeLabel = 'Sponsored Campaign';
    badgeColor = 'text-[#342A21] bg-[#FFF8E6] border-[#EDD595]';
    dotColor = 'bg-[#FFAD05]';
    if (!notification.actionText) actionLabel = 'View Campaign';
  }

  const handleBannerClick = () => {
    onClickNotification(notification);
  };

  return (
    <div className="fixed top-3.5 sm:top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[94vw] sm:w-[440px] animate-slide-down">
      <div
        onClick={handleBannerClick}
        className="w-full bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF7E2] text-[#000004] rounded-2xl sm:rounded-[22px] p-3.5 sm:p-4 shadow-[0_16px_40px_-10px_rgba(52,42,33,0.22)] border border-[#EDDAA6] flex items-start gap-3.5 cursor-pointer hover:shadow-[0_20px_44px_-10px_rgba(52,42,33,0.28)] transition-all hover:scale-[1.005] active:scale-[0.995] relative overflow-hidden"
      >
        {/* Subtle top Setlla yellow accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#342A21] via-[#FFAD05] to-[#342A21]" />

        {/* Setlla Brand App Icon Badge (Replaces Bell Icon) */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-11 h-11 rounded-2xl bg-[#000004] border border-[#FFAD05]/45 flex items-center justify-center overflow-hidden shadow-xs p-1.5">
            {!iconError ? (
              <img
                src="/icons/icon-192x192.png"
                alt="Setlla"
                onError={() => setIconError(true)}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <span className="font-display font-black text-[11px] tracking-tight text-white select-none">
                setlla
              </span>
            )}
          </div>
          {/* Small contextual status badge on corner of Setlla icon */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFFDF9] border border-[#EDDAA6] flex items-center justify-center shadow-2xs">
            {notifType === 'account_deleted' ? (
              <UserX className="w-3 h-3 text-rose-600" />
            ) : notifType === 'inspection_declined' ? (
              <AlertCircle className="w-3 h-3 text-rose-600" />
            ) : notifType === 'listing_published' || notifType === 'inspection_confirmed' || notifType === 'job_published' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : notifType === 'job_application_received' || notifType === 'job_status_updated' ? (
              <Briefcase className="w-3 h-3 text-[#C68400]" />
            ) : notifType === 'freshness_reminder' ? (
              <Clock className="w-3 h-3 text-[#C68400]" />
            ) : notifType === 'advert_status' ? (
              <Megaphone className="w-3 h-3 text-[#C68400]" />
            ) : notifType === 'new_listing' ? (
              <Building2 className="w-3 h-3 text-[#C68400]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#FFAD05]" />
            )}
          </span>
        </div>

        {/* Notification Copy & CTA */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${badgeColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span>{badgeLabel}</span>
            </span>
            <span className="text-[10px] font-medium text-[#70798C]">• Just now</span>
            {queuedCount > 0 && (
              <span className="text-[10px] font-extrabold text-[#342A21] bg-[#FFEFCA] border border-[#E8CC88] px-1.5 py-0.2 rounded-full">
                +{queuedCount} more
              </span>
            )}
          </div>

          <h5 className="font-display font-bold text-xs sm:text-sm text-[#000004] leading-snug flex items-center gap-1.5">
            <span className="truncate">{cleanTitle}</span>
          </h5>

          <p className="text-[11px] sm:text-xs text-[#5C5346] line-clamp-2 mt-0.5 leading-relaxed font-medium">
            {notification.body}
          </p>

          {/* Setlla Design System Action Pills (Supports 1-Tap Quick Approve + Primary Action) */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {notification.secondaryActionText && notification.onSecondaryAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  notification.onSecondaryAction?.();
                  onDismiss();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFAD05] hover:bg-[#F2A200] text-[#000004] border border-[#D99100]/40 text-[11px] font-extrabold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer select-none"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{notification.secondaryActionText}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FFF9EB] border border-[#FFAD05]/35 text-[11px] font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer select-none"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#FFAD05]" />
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
          className="w-6 h-6 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] text-[#342A21] flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-[#EDD595]"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
