import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  Building2,
  Check,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  CheckCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { BookingRecord, PropertyListing, UserProfile, ListingAvailability } from '../../types/marketplace';
import { getSavedApplications, fetchAllJobApplications, downloadOrOpenCandidateCV, updateApplicationReviewStatus } from '../../services/jobService';
import { JobApplication } from '../../types/jobs';
import { getWhatsAppUrl } from '../../utils/formatters';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { InspectionPassCard } from '../Pass/InspectionPassCard';
import { ModalPortal } from '../UI/ModalPortal';
import { getListingLifecycleInfo } from '../../utils/listingLifecycle';
import { normalizePhoneNumber, normalizeEmail } from '../../utils/userRegistry';
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllUserNotificationsRead,
  removeNotificationItem,
  formatNotificationRelativeTime,
  getNotificationPreferences,
  saveNotificationPreferences,
  SetllaNotificationItem,
} from '../../services/notificationService';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  allBookings?: BookingRecord[];
  listings: PropertyListing[];
  currentUser?: UserProfile;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onAcceptBooking?: (bookingId: string) => void;
  onRejectBooking?: (bookingId: string) => void;
  onSelectJob?: (jobId: string) => void;
  onConfirmListingFreshness?: (listingId: string) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  initialTab?: 'all' | 'inspections' | 'jobs' | 'adverts';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  allBookings = [],
  listings,
  currentUser,
  onAcceptBooking,
  onRejectBooking,
  onConfirmListingFreshness,
  onUpdateAvailability,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'inspections' | 'jobs' | 'adverts'>(initialTab);
  const [selectedPassBooking, setSelectedPassBooking] = useState<{ booking: BookingRecord; listing: PropertyListing } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [inboxItems, setInboxItems] = useState<SetllaNotificationItem[]>([]);
  const [prefs, setPrefs] = useState(() => getNotificationPreferences());

  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('setlla_freshness_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [cloudJobApps, setCloudJobApps] = useState<JobApplication[]>(() => {
    try {
      return getSavedApplications();
    } catch {
      return [];
    }
  });

  // Sync persistent notifications, preferences & cloud job applications when modal opens or storage updates
  useEffect(() => {
    const refreshInbox = () => {
      setInboxItems(getNotificationsForUser(currentUser));
      setPrefs(getNotificationPreferences());
    };
    const refreshJobs = () => {
      fetchAllJobApplications()
        .then((apps) => setCloudJobApps(apps))
        .catch(() => {});
    };
    refreshInbox();
    if (isOpen) {
      refreshJobs();
    }
    window.addEventListener('setlla:notifications-updated', refreshInbox);
    window.addEventListener('setlla:job-applications-updated', refreshJobs);
    return () => {
      window.removeEventListener('setlla:notifications-updated', refreshInbox);
      window.removeEventListener('setlla:job-applications-updated', refreshJobs);
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.phone, isOpen]);

  const handleDismissAnnouncement = () => {
    setIsAnnouncementDismissed(true);
    try {
      localStorage.setItem('setlla_freshness_banner_dismissed', 'true');
    } catch (_) {}
  };

  // Retrieve saved job applications for current user (as applicant or as employer)
  const jobApplications = useMemo(() => {
    try {
      if (!currentUser?.id && !currentUser?.email && !currentUser?.phone) return [];
      const userEmail = currentUser.email ? normalizeEmail(currentUser.email) : '';
      const userPhone = currentUser.phone ? normalizePhoneNumber(currentUser.phone) : '';
      return cloudJobApps.filter((a) => {
        if (currentUser.id && (a.applicantId === currentUser.id || a.posterId === currentUser.id)) return true;
        if (
          userEmail &&
          ((a.applicantEmail && normalizeEmail(a.applicantEmail) === userEmail) ||
            (a.posterEmail && normalizeEmail(a.posterEmail) === userEmail))
        ) {
          return true;
        }
        if (
          userPhone &&
          ((a.applicantPhone && normalizePhoneNumber(a.applicantPhone) === userPhone) ||
            (a.posterPhone && normalizePhoneNumber(a.posterPhone) === userPhone))
        ) {
          return true;
        }
        return false;
      });
    } catch (_) {
      return [];
    }
  }, [cloudJobApps, currentUser]);

  // Check if current user is an agent, employer, or property lister
  const isLister = Boolean(
    currentUser?.isAgent ||
      currentUser?.persona === 'lister' ||
      currentUser?.persona === 'employer' ||
      (currentUser?.phone &&
        listings.some(
          (l) => l.agent?.phone && normalizePhoneNumber(l.agent.phone) === normalizePhoneNumber(currentUser.phone)
        ))
  );

  // Filter listings belonging to this lister
  const myAgentListings = useMemo(() => {
    if (!currentUser) return [];
    const phoneNorm = currentUser.phone ? normalizePhoneNumber(currentUser.phone) : '';
    const emailNorm = currentUser.email ? normalizeEmail(currentUser.email) : '';

    return listings.filter((l) => {
      if (l.agent?.id && currentUser.id && l.agent.id === currentUser.id) return true;
      if (phoneNorm && l.agent?.phone && normalizePhoneNumber(l.agent.phone) === phoneNorm) return true;
      if (emailNorm && l.agent?.email && normalizeEmail(l.agent.email) === emailNorm) return true;
      return false;
    });
  }, [listings, currentUser]);

  // Filter listings belonging to this lister that require 48h check or are 72h-expired
  const myActionRequiredListings = useMemo(() => {
    return myAgentListings
      .map((l) => ({ listing: l, lifecycle: getListingLifecycleInfo(l) }))
      .filter((item) => item.lifecycle.needsListerCheck || item.lifecycle.stage === 'expired');
  }, [myAgentListings]);

  // Incoming booking requests for this agent's properties (for 1-tap inline approve/decline)
  const incomingAgentBookings = useMemo(() => {
    if (!isLister || myAgentListings.length === 0) return [];
    const myPropIds = new Set(myAgentListings.map((l) => l.id));
    const sourceBookings = allBookings.length > 0 ? allBookings : bookings;
    return sourceBookings.filter((b) => myPropIds.has(b.propertyId));
  }, [isLister, myAgentListings, allBookings, bookings]);

  const unreadInboxCount = useMemo(() => inboxItems.filter((i) => !i.isRead).length, [inboxItems]);

  // Aggregate counts
  const inspectionsCount = bookings.length + incomingAgentBookings.filter((b) => !bookings.some((ub) => ub.id === b.id)).length;
  const jobsCount = jobApplications.length + inboxItems.filter((i) => i.type.startsWith('job_')).length;
  const listerChecksCount = myActionRequiredListings.length;
  const totalCount = inspectionsCount + jobApplications.length + listerChecksCount + inboxItems.length;

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const updated = saveNotificationPreferences({ soundEnabled: !prefs.soundEnabled });
    setPrefs(updated);
  };

  const handleToggleVibration = () => {
    const updated = saveNotificationPreferences({ vibrationEnabled: !prefs.vibrationEnabled });
    setPrefs(updated);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EFE3C6] overflow-hidden flex flex-col max-h-[88vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Bar with Setlla Brand Icon & Mark All Read */}
          <div className="px-4 sm:px-5 py-4 border-b border-[#EFE3C6] flex items-center justify-between gap-3 bg-gradient-to-r from-white via-[#FFFDF8] to-[#FFF7E2]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#000004] border border-[#FFAD05]/45 flex items-center justify-center shadow-xs shrink-0 p-1.5 overflow-hidden">
                {!iconError ? (
                  <img
                    src="/icons/icon-192x192.png"
                    alt="Setlla"
                    onError={() => setIconError(true)}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <span className="font-display font-black text-[10px] tracking-tight text-white">setlla</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#000004] truncate">
                    Notifications & Activity
                  </h3>
                  {unreadInboxCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFAD05] text-[#000004] text-[10px] font-extrabold shrink-0">
                      {unreadInboxCount} new
                    </span>
                  ) : totalCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF8E6] border border-[#EDDAA6] text-[#342A21] text-[10px] font-extrabold shrink-0">
                      {totalCount}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[#70798C] truncate mt-0.5">
                  Real-time updates on inspections, listings & jobs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {unreadInboxCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllUserNotificationsRead(currentUser);
                    setFeedbackToast('All notifications marked as read.');
                    setTimeout(() => setFeedbackToast(null), 2500);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FFF8E6] hover:bg-[#FFEFCA] border border-[#EDDAA6] text-[#342A21] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#C68400]" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] border border-[#EDDAA6] text-[#342A21] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Symmetrical Segmented Tab Filters */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#FCF9F5] border-b border-[#EFE3C6] shrink-0">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#F4EFE4] border border-[#E6D7B2]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                  activeTab === 'all'
                    ? 'bg-[#342A21] text-[#FAF8F5] shadow-2xs'
                    : 'text-[#6B6257] hover:text-[#000004]'
                }`}
              >
                All ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inspections')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                  activeTab === 'inspections'
                    ? 'bg-[#342A21] text-[#FAF8F5] shadow-2xs'
                    : 'text-[#6B6257] hover:text-[#000004]'
                }`}
              >
                <CalendarCheck
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeTab === 'inspections' ? 'text-[#FFAD05]' : 'text-[#8C7A5B]'
                  }`}
                />
                <span className="truncate">Inspections ({inspectionsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                  activeTab === 'jobs'
                    ? 'bg-[#342A21] text-[#FAF8F5] shadow-2xs'
                    : 'text-[#6B6257] hover:text-[#000004]'
                }`}
              >
                <Briefcase
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeTab === 'jobs' ? 'text-[#FFAD05]' : 'text-[#8C7A5B]'
                  }`}
                />
                <span className="truncate">Jobs ({jobsCount})</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-white">
            {/* Temporary Feedback Notification Toast */}
            {feedbackToast && (
              <div className="p-3 rounded-2xl bg-[#FFF9EB] border border-[#EDDAA6] text-[#342A21] text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackToast}</span>
              </div>
            )}

            {/* STRUCTURED POLICY ANNOUNCEMENT FOR LISTERS & AGENTS */}
            {isLister && !isAnnouncementDismissed && (
              <aside
                aria-label="Setlla Freshness Policy"
                className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF8] via-[#FFF9EB] to-[#FFF5DC] border border-[#EDDAA6] text-[#342A21] shadow-2xs animate-fade-in space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#342A21] text-[#FFAD05] flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF3D1] border border-[#E8CC88] text-[#8A5A00] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                      Platform Policy
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#000004] truncate">
                      72h Freshness Guarantee
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismissAnnouncement}
                    className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-[#EDDAA6] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    title="Dismiss announcement"
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#5B5349] leading-relaxed">
                  Listings require a 1-tap availability check every 48 hours to prevent ghost posts. Unconfirmed listings automatically delist after 72 hours.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <div className="px-2.5 py-2 rounded-xl bg-white/90 border border-[#EDDAA6] text-center">
                    <div className="text-[11px] font-extrabold text-[#342A21]">48 Hours</div>
                    <div className="text-[10px] font-medium text-[#70798C] truncate">Check Alert</div>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/90 border border-[#EDDAA6] text-center">
                    <div className="text-[11px] font-extrabold text-[#342A21]">72 Hours</div>
                    <div className="text-[10px] font-medium text-[#70798C] truncate">Auto-Delist</div>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/90 border border-[#EDDAA6] text-center">
                    <div className="text-[11px] font-extrabold text-[#342A21]">24 Hours</div>
                    <div className="text-[10px] font-medium text-[#70798C] truncate">Taken Cleanup</div>
                  </div>
                </div>
              </aside>
            )}

            {/* ACTIVE 48H AVAILABILITY CHECKS & 72H EXPIRATION ALERTS FOR CURRENT LISTER */}
            {myActionRequiredListings.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold text-[#342A21] uppercase tracking-wider">
                    Action Required: Availability Checks ({myActionRequiredListings.length})
                  </span>
                </div>

                {myActionRequiredListings.map(({ listing, lifecycle }) => {
                  const isDelisted = lifecycle.stage === 'expired';

                  return (
                    <article
                      key={`lister-action-${listing.id}`}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isDelisted
                          ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                          : 'bg-amber-50/50 border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {listing.media[0]?.url ? (
                            <img
                              src={listing.media[0].poster || listing.media[0].url}
                              alt={listing.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#342A21] text-amber-400 flex items-center justify-center shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                                {listing.title}
                              </h4>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  isDelisted
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isDelisted
                                  ? 'Delisted from Feed (72h)'
                                  : `Needs 48h Confirmation (${Math.ceil(lifecycle.hoursUntilDelist)}h left)`}
                              </span>
                            </div>

                            <p className="text-xs text-[#70798C] mt-0.5">
                              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                              {listing.city} &bull; ₦{listing.fees.baseRent.toLocaleString()} {listing.fees.rentPeriod}
                            </p>

                            <p className="text-[11px] text-[#342A21] mt-1">
                              {isDelisted
                                ? 'This listing was safely hidden from the public feed after 72 hours. All photos and fee breakdowns are preserved. Tap below to relist immediately.'
                                : 'Is this property still vacant and available for inspections? Please confirm now to keep it active at the top of the feed.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 1-Tap Action Buttons */}
                      <div className="pt-2 border-t border-black/5 flex items-center justify-end gap-2 flex-wrap">
                        {!isDelisted && onUpdateAvailability && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateAvailability(listing.id, 'Rented Out');
                              setFeedbackToast(
                                `"${listing.title}" marked as Rented Out! Will display for 24h as deal proof.`
                              );
                              setTimeout(() => setFeedbackToast(null), 4000);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[#70798C] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            Mark as Taken
                          </button>
                        )}

                        {onConfirmListingFreshness && (
                          <button
                            type="button"
                            onClick={() => {
                              onConfirmListingFreshness(listing.id);
                              setFeedbackToast(
                                isDelisted
                                  ? `"${listing.title}" restored and live on Explore feed!`
                                  : `"${listing.title}" confirmed available! Freshness clock renewed for 48 hours.`
                              );
                              setTimeout(() => setFeedbackToast(null), 4000);
                            }}
                            className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                              isDelisted
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-[#342A21] hover:bg-[#201914]'
                            }`}
                          >
                            {isDelisted ? 'Relist & Renew (1-Tap)' : '✓ Yes, Still Available'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Detailed Inspection Pass View Modal Overlay */}
            {selectedPassBooking && (
              <div className="mb-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                  <span className="text-xs font-bold text-[#000004]">Pass Details</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPassBooking(null)}
                    className="text-xs font-bold text-[#70798C] hover:text-[#000004] cursor-pointer"
                  >
                    ← Back to All Notifications
                  </button>
                </div>
                <InspectionPassCard
                  booking={selectedPassBooking.booking}
                  listing={selectedPassBooking.listing}
                  onClose={() => setSelectedPassBooking(null)}
                />
              </div>
            )}

            {/* Empty State with Setlla Brand Icon */}
            {!selectedPassBooking && totalCount === 0 && (
              <div className="py-7 px-5 text-center bg-gradient-to-b from-[#FFFDF9] to-[#FCF9F5] rounded-2xl border border-[#EFE3C6] space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-[#000004] border border-[#FFAD05]/45 flex items-center justify-center mx-auto shadow-2xs p-1.5">
                  {!iconError ? (
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Setlla"
                      onError={() => setIconError(true)}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="font-display font-black text-[10px] text-white">setlla</span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#000004]">You are all caught up!</h4>
                  <p className="text-xs text-[#70798C] max-w-xs mx-auto leading-relaxed">
                    Property inspection passes, published listing alerts, and job application updates will appear here.
                  </p>
                </div>
              </div>
            )}

            {/* 0. REAL-TIME PERSISTENT NOTIFICATION STREAM (Listing Published, Job Alerts, System Events) */}
            {!selectedPassBooking &&
              inboxItems.filter((item) => {
                if (activeTab === 'inspections') {
                  return item.type.startsWith('inspection_') || item.type === 'listing_published' || item.type === 'new_listing';
                }
                if (activeTab === 'jobs') {
                  return item.type.startsWith('job_');
                }
                return true;
              }).length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#C68400]" />
                      <span>Recent Alerts</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#342A21]">
                      {inboxItems.length}
                    </span>
                  </div>

                  {inboxItems
                    .filter((item) => {
                      if (activeTab === 'inspections') {
                        return item.type.startsWith('inspection_') || item.type === 'listing_published' || item.type === 'new_listing';
                      }
                      if (activeTab === 'jobs') {
                        return item.type.startsWith('job_');
                      }
                      return true;
                    })
                    .slice(0, 15)
                    .map((item) => {
                      const isPositive =
                        item.type === 'listing_published' ||
                        item.type === 'inspection_confirmed' ||
                        item.type === 'job_published';
                      const isDeclined = item.type === 'inspection_declined' || item.type === 'account_deleted';

                      return (
                        <article
                          key={item.id}
                          onClick={() => markNotificationRead(item.id)}
                          className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            !item.isRead
                              ? 'bg-gradient-to-r from-[#FFFDF7] to-[#FFF6DE] border-[#E8CC88] shadow-xs'
                              : 'bg-[#FFFDF9] border-[#EFE3C6]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isDeclined
                                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                                  : isPositive
                                  ? 'bg-[#342A21] border-[#FFAD05]/40 text-[#FFAD05]'
                                  : 'bg-[#FFF8E6] border-[#EDDAA6] text-[#342A21]'
                              }`}
                            >
                              {item.type.startsWith('job_') ? (
                                <Briefcase className="w-4 h-4" />
                              ) : item.type === 'listing_published' || item.type === 'new_listing' ? (
                                <Building2 className="w-4 h-4" />
                              ) : (
                                <CalendarCheck className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {!item.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#FFAD05] shrink-0" title="Unread" />
                                )}
                                <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10px] font-medium text-[#70798C]">
                                  • {formatNotificationRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-[#5B5349] mt-0.5 leading-relaxed">
                                {item.body}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotificationItem(item.id);
                            }}
                            className="w-6 h-6 rounded-full hover:bg-[#FFF3D1] text-[#8C7A5B] hover:text-[#342A21] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title="Remove notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </article>
                      );
                    })}
                </div>
              )}

            {/* 1A. INCOMING AGENT INSPECTION REQUESTS (With 1-Tap Approve & Decline) */}
            {!selectedPassBooking &&
              (activeTab === 'all' || activeTab === 'inspections') &&
              incomingAgentBookings.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="text-[11px] font-bold text-[#342A21] uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#C68400]" />
                      <span>Incoming Applicant Inspections (Agent)</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#342A21]">
                      {incomingAgentBookings.length}
                    </span>
                  </div>

                  {incomingAgentBookings.map((booking) => {
                    const listing = listings.find((l) => l.id === booking.propertyId);
                    const isConfirmed = booking.status === 'CONFIRMED_UNLOCKED';
                    const isRejected = booking.status === 'REJECTED_BY_AGENT';
                    const isPending = !isConfirmed && !isRejected;

                    return (
                      <article
                        key={`agent-incoming-${booking.id}`}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                          isPending
                            ? 'bg-gradient-to-br from-[#FFFDF9] to-[#FFF7E2] border-[#EDDAA6] shadow-xs'
                            : 'bg-[#FFFDF9] border-[#EFE3C6]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#342A21] text-[#FFAD05] flex items-center justify-center shrink-0">
                              <CalendarCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                                {booking.applicantName} • {listing?.title || 'Listed Property'}
                              </h4>
                              <p className="text-[11px] text-[#70798C] truncate mt-0.5">
                                Slot: {booking.slotTimeWindow} • {booking.applicantPhone}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-[#FFAD05] text-[#000004] border border-[#D99100]/30'
                            }`}
                          >
                            {isConfirmed ? 'Approved' : isRejected ? 'Declined' : 'Needs Review'}
                          </span>
                        </div>

                        {isPending && (onAcceptBooking || onRejectBooking) && (
                          <div className="pt-2.5 border-t border-[#EFE3C6] flex items-center justify-end gap-2">
                            {onRejectBooking && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRejectBooking(booking.id);
                                  setFeedbackToast(`Declined inspection slot for ${booking.applicantName}.`);
                                  setTimeout(() => setFeedbackToast(null), 3500);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            )}

                            {onAcceptBooking && (
                              <button
                                type="button"
                                onClick={() => {
                                  onAcceptBooking(booking.id);
                                  setFeedbackToast(
                                    `Approved ${booking.applicantName}'s inspection! Direct contact unlocked.`
                                  );
                                  setTimeout(() => setFeedbackToast(null), 3500);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FFF9EB] border border-[#FFAD05]/40 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 text-[#FFAD05]" />
                                <span>Approve & Unlock Contact</span>
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

            {/* 1B. TENANT / SEEKER INSPECTIONS SECTION */}
            {!selectedPassBooking && (activeTab === 'all' || activeTab === 'inspections') && bookings.length > 0 && (
              <div className="space-y-2.5">
                {activeTab === 'all' && (
                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
                      My Inspection Passes
                    </span>
                    <span className="text-[11px] font-bold text-[#342A21]">
                      {bookings.length}
                    </span>
                  </div>
                )}

                {bookings.map((booking) => {
                  const listing = listings.find((l) => l.id === booking.propertyId);
                  const isConfirmed = booking.status === 'CONFIRMED_UNLOCKED';
                  const isRejected = booking.status === 'REJECTED_BY_AGENT';

                  return (
                    <article
                      key={`notif-booking-${booking.id}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                        isRejected
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-[#FFFDF9] border-[#EFE3C6] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isRejected
                                ? 'bg-rose-700 text-white'
                                : 'bg-[#342A21] text-[#FFAD05]'
                            }`}
                          >
                            <CalendarCheck className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                              {listing?.title || 'Property Inspection'}
                            </h4>
                            <p className="text-[11px] text-[#70798C] truncate mt-0.5">
                              {listing
                                ? `${listing.neighborhood ? `${listing.neighborhood}, ` : ''}${listing.city}`
                                : 'Scheduled Inspection'}{' '}
                              • {booking.slotTimeWindow}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-[#FFF8E6] text-[#8A5A00] border border-[#EDDAA6]'
                          }`}
                        >
                          {isConfirmed ? 'Unlocked' : isRejected ? 'Declined' : 'Pending'}
                        </span>
                      </div>

                      {/* Agent Unlocked Details if Confirmed */}
                      {isConfirmed && listing && (
                        <div className="pt-2.5 border-t border-[#EFE3C6] flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className="font-bold text-[#342A21] truncate">
                            Agent: {listing.agent.fullName}
                          </span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <a
                              href={`tel:${listing.agent.phone}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#342A21] hover:bg-[#231C16] text-white text-[11px] font-bold transition-colors shadow-2xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>

                            {listing.agent.whatsapp && (
                              <a
                                href={getWhatsAppUrl(listing.agent.whatsapp, listing.title, booking.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebd5a] text-white text-[11px] font-bold transition-colors shadow-2xs"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-current" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedPassBooking({ booking, listing })}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FFF8E6] border border-[#EDDAA6] text-[#342A21] hover:bg-[#FFEFCA] text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              View Pass
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* 2. JOBS SECTION */}
            {!selectedPassBooking && (activeTab === 'all' || activeTab === 'jobs') && jobApplications.length > 0 && (
              <div className="space-y-2.5">
                {activeTab === 'all' && (
                  <div className="flex items-center justify-between px-1 pt-2">
                    <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
                      Job Applications
                    </span>
                    <span className="text-[11px] font-bold text-[#342A21]">
                      {jobApplications.length}
                    </span>
                  </div>
                )}

                {jobApplications.map((app) => {
                  const isEmployerView =
                    Boolean(
                      (currentUser?.id && app.posterId === currentUser.id) ||
                        (currentUser?.email && app.posterEmail && normalizeEmail(app.posterEmail) === normalizeEmail(currentUser.email)) ||
                        (currentUser?.phone && app.posterPhone && normalizePhoneNumber(app.posterPhone) === normalizePhoneNumber(currentUser.phone))
                    ) && app.applicantId !== currentUser?.id;

                  return (
                    <article
                      key={`notif-job-${app.id}`}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE3C6] shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#342A21] text-[#FFAD05] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <Briefcase className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                              {isEmployerView ? `${app.applicantName} → ${app.jobTitle}` : app.jobTitle}
                            </h4>
                            <p className="text-[11px] text-[#70798C] truncate mt-0.5">
                              {isEmployerView
                                ? `${app.applicantPhone} • Applied ${new Date(app.appliedAt).toLocaleDateString()}`
                                : `${app.companyName} • Applied ${new Date(app.appliedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#8A5A00] border border-[#EDDAA6] shrink-0">
                          {app.status === 'shortlisted'
                            ? 'Shortlisted'
                            : app.status === 'reviewed'
                            ? 'Viewed'
                            : isEmployerView
                            ? 'New Applicant'
                            : 'Sent'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#342A21] bg-white px-3 py-2 rounded-xl border border-[#EFE3C6]">
                        <FileText className="w-3.5 h-3.5 text-[#C68400] shrink-0" />
                        <span className="truncate font-medium">{app.cvFileName}</span>
                        {app.cvUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isEmployerView && app.status === 'submitted') {
                                updateApplicationReviewStatus(app.id, 'reviewed');
                              }
                              downloadOrOpenCandidateCV(app.cvUrl, app.cvFileName);
                            }}
                            className="text-[10px] font-bold text-white bg-[#342A21] hover:bg-[#231C16] px-2.5 py-1 rounded-md ml-auto shrink-0 transition-colors cursor-pointer"
                          >
                            View CV
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-[#342A21] bg-[#FFF8E6] px-2 py-0.5 rounded-md ml-auto shrink-0 border border-[#EDDAA6]">
                            CV Attached
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Alert Preferences (Sound & Haptic Toggles) */}
          <div className="px-4 sm:px-5 py-3 bg-[#FCF9F5] border-t border-[#EFE3C6] flex items-center justify-between gap-2 text-xs text-[#70798C]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  prefs.soundEnabled
                    ? 'bg-[#FFF8E6] border-[#EDDAA6] text-[#342A21]'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
                title="Toggle notification chime sound"
              >
                {prefs.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#C68400]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Sound {prefs.soundEnabled ? 'On' : 'Off'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVibration}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  prefs.vibrationEnabled
                    ? 'bg-[#FFF8E6] border-[#EDDAA6] text-[#342A21]'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
                title="Toggle haptic vibration feedback"
              >
                <Smartphone className={`w-3.5 h-3.5 ${prefs.vibrationEnabled ? 'text-[#C68400]' : ''}`} />
                <span className="hidden xs:inline">Haptics {prefs.vibrationEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FAF8F5] text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
