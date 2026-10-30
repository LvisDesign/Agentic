import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  CalendarCheck, 
  Briefcase, 
  Megaphone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  FileText,
  Building2
} from 'lucide-react';
import { BookingRecord, PropertyListing, UserProfile, ListingAvailability } from '../../types/marketplace';
import { getSavedApplications } from '../../services/jobService';
import { JobApplication } from '../../types/jobs';
import { formatNigerianPhone, getWhatsAppUrl } from '../../utils/formatters';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { InspectionPassCard } from '../Pass/InspectionPassCard';
import { ModalPortal } from '../UI/ModalPortal';
import { getListingLifecycleInfo } from '../../utils/listingLifecycle';
import { normalizePhoneNumber, normalizeEmail } from '../../utils/userRegistry';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  listings: PropertyListing[];
  currentUser?: UserProfile;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onSelectJob?: (jobId: string) => void;
  onConfirmListingFreshness?: (listingId: string) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  initialTab?: 'all' | 'inspections' | 'jobs' | 'adverts';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  listings,
  currentUser,
  onOpenBookingModal,
  onSelectJob,
  onConfirmListingFreshness,
  onUpdateAvailability,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'inspections' | 'jobs' | 'adverts'>(initialTab);
  const [selectedPassBooking, setSelectedPassBooking] = useState<{ booking: BookingRecord; listing: PropertyListing } | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Retrieve saved job applications
  const jobApplications = useMemo(() => {
    try {
      const apps = getSavedApplications();
      if (!currentUser?.id && !currentUser?.email) return apps;
      return apps.filter((a) => {
        if (currentUser.id && a.applicantId === currentUser.id) return true;
        if (currentUser.email && a.applicantEmail && a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
        return true;
      });
    } catch (_) {
      return [];
    }
  }, [currentUser]);

  // Check if current user is an agent, employer, or property lister
  const isLister = Boolean(
    currentUser?.isAgent || 
    currentUser?.persona === 'lister' || 
    currentUser?.persona === 'employer' ||
    (currentUser?.phone && listings.some((l) => l.agent?.phone && normalizePhoneNumber(l.agent.phone) === normalizePhoneNumber(currentUser.phone)))
  );

  // Filter listings belonging to this lister that require 48h check or are 72h-expired
  const myActionRequiredListings = useMemo(() => {
    if (!currentUser) return [];
    const phoneNorm = currentUser.phone ? normalizePhoneNumber(currentUser.phone) : '';
    const emailNorm = currentUser.email ? normalizeEmail(currentUser.email) : '';

    return listings
      .filter((l) => {
        if (l.agent?.id && currentUser.id && l.agent.id === currentUser.id) return true;
        if (phoneNorm && l.agent?.phone && normalizePhoneNumber(l.agent.phone) === phoneNorm) return true;
        if (emailNorm && l.agent?.email && normalizeEmail(l.agent.email) === emailNorm) return true;
        return false;
      })
      .map((l) => ({ listing: l, lifecycle: getListingLifecycleInfo(l) }))
      .filter((item) => item.lifecycle.needsListerCheck || item.lifecycle.stage === 'expired');
  }, [listings, currentUser]);

  // Aggregate counts
  const inspectionsCount = bookings.length;
  const jobsCount = jobApplications.length;
  const listerChecksCount = myActionRequiredListings.length;
  const totalCount = inspectionsCount + jobsCount + listerChecksCount;

  if (!isOpen) return null;

  const handleCopyPhone = (bookingId: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(bookingId);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#342A21] text-white flex items-center justify-center shadow-xs shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#342A21]">
                  Notifications & Activity
                </h3>
                {totalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#342A21] text-white text-[10px] font-bold">
                    {totalCount} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#70798C] mt-0.5">
                Real-time updates on your rental inspections, job applications & listings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-white border-b border-[#E5E7EB] overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#342A21] text-white shadow-2xs'
                : 'bg-[#F4F5F7] text-[#70798C] hover:text-[#342A21]'
            }`}
          >
            All Activity ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspections')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inspections'
                ? 'bg-[#342A21] text-white shadow-2xs'
                : 'bg-[#F4F5F7] text-[#70798C] hover:text-[#342A21]'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Inspections ({inspectionsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'bg-[#342A21] text-white shadow-2xs'
                : 'bg-[#F4F5F7] text-[#70798C] hover:text-[#342A21]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jobs ({jobsCount})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Temporary Feedback Notification Toast */}
          {feedbackToast && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* GENERAL POLICY ANNOUNCEMENT FOR ALL LISTERS & AGENTS */}
          {isLister && (
            <aside 
              aria-label="Setlla Freshness Policy"
              className="p-4 rounded-2xl bg-gradient-to-br from-[#342A21] to-[#201914] text-white shadow-md border border-amber-500/30 space-y-2 animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Platform Update: 72-Hour Freshness Guarantee
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-white">
                Zero Ghost Listings & Automated 48-Hour Availability Checks
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                To guarantee 100% active vacancies and maximize tenant trust across Delta State, all properties and jobs now operate on a 72-hour lifecycle:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <span className="font-bold text-amber-300 block">1. 48h Check Alert</span>
                  <span className="text-slate-300 text-[10px] block leading-snug">
                    Receive a quick prompt to confirm your property is still available with 1 tap.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <span className="font-bold text-rose-300 block">2. 72h Auto-Delist</span>
                  <span className="text-slate-300 text-[10px] block leading-snug">
                    Unconfirmed listings are safely hidden from public feeds. Your photos and data are never lost—relist anytime in 1 tap!
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <span className="font-bold text-emerald-300 block">3. 24h Taken Cleanup</span>
                  <span className="text-slate-300 text-[10px] block leading-snug">
                    Listings marked "Rented Out" remain for 24 hours as social proof, then are purged.
                  </span>
                </div>
              </div>
            </aside>
          )}

          {/* ACTIVE 48H AVAILABILITY CHECKS & 72H EXPIRATION ALERTS FOR CURRENT LISTER */}
          {myActionRequiredListings.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 px-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isDelisted
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {isDelisted ? 'Delisted from Feed (72h)' : `Needs 48h Confirmation (${Math.ceil(lifecycle.hoursUntilDelist)}h left)`}
                            </span>
                          </div>

                          <p className="text-xs text-[#70798C] mt-0.5">
                            {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city} &bull; ₦{listing.fees.baseRent.toLocaleString()} {listing.fees.rentPeriod}
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
                            setFeedbackToast(`"${listing.title}" marked as Rented Out! Will display for 24h as deal proof.`);
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

          {/* Empty State */}
          {!selectedPassBooking && totalCount === 0 && (
            <div className="p-10 text-center bg-[#FCF9F5] rounded-3xl border border-dashed border-[#E5E7EB] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#70798C] shadow-2xs">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#000004]">You are all caught up!</h4>
              <p className="text-xs text-[#70798C] max-w-sm mx-auto leading-relaxed">
                When you request property inspections or apply for open vacancies on Setlla, your notifications and status passes will appear here.
              </p>
            </div>
          )}

          {/* 1. INSPECTIONS SECTION */}
          {!selectedPassBooking && (activeTab === 'all' || activeTab === 'inspections') && bookings.length > 0 && (
            <div className="space-y-3">
              {activeTab === 'all' && (
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
                    Rental Inspections ({bookings.length})
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
                    className={`p-4 rounded-2xl border transition-all ${
                      isRejected
                        ? 'bg-rose-50/30 border-rose-200'
                        : 'bg-[#FCF9F5] border-[#E5E7EB] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isRejected 
                            ? 'bg-rose-700 text-white' 
                            : 'bg-[#342A21] text-white'
                        }`}>
                          <CalendarCheck className="w-4.5 h-4.5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-[#342A21] truncate">
                              {listing?.title || 'Property Inspection'}
                            </h4>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isConfirmed
                                ? 'bg-[#EFE9E1] text-[#342A21] border border-[#E5E7EB]'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isConfirmed ? 'Confirmed & Unlocked' : isRejected ? 'Declined' : 'Pending Confirmation'}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#70798C] mt-0.5">
                            {listing ? `${listing.neighborhood ? `${listing.neighborhood}, ` : ''}${listing.city}` : 'Scheduled Inspection'} • {booking.slotTimeWindow}
                          </p>

                          {/* Agent Unlocked Details if Confirmed */}
                          {isConfirmed && listing && (
                            <div className="mt-2.5 pt-2.5 border-t border-[#E5E7EB] flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-bold text-[#342A21]">Agent: {listing.agent.fullName}</span>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <a
                                  href={`tel:${listing.agent.phone}`}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#342A21] hover:bg-[#231C16] text-white text-[11px] font-bold transition-colors shadow-2xs"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>

                                {listing.agent.whatsapp && (
                                  <a
                                    href={getWhatsAppUrl(listing.agent.whatsapp, listing.title, booking.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebd5a] text-white text-[11px] font-bold transition-colors shadow-2xs"
                                  >
                                    <WhatsAppIcon className="w-3 h-3 fill-current" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedPassBooking({ booking, listing })}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#342A21] hover:bg-[#F6F3EF] text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  View Pass
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* 2. JOBS SECTION */}
          {!selectedPassBooking && (activeTab === 'all' || activeTab === 'jobs') && jobApplications.length > 0 && (
            <div className="space-y-3">
              {activeTab === 'all' && (
                <div className="flex items-center gap-1.5 px-1 pt-2">
                  <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
                    Job Applications ({jobApplications.length})
                  </span>
                </div>
              )}

              {jobApplications.map((app) => {
                return (
                  <article 
                    key={`notif-job-${app.id}`}
                    className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] shadow-xs hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#342A21] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          <Briefcase className="w-4.5 h-4.5 text-white" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-[#342A21] truncate">
                              {app.jobTitle}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#EFE9E1] text-[#342A21] border border-[#E5E7EB]">
                              {app.status === 'shortlisted' 
                                ? 'Shortlisted' 
                                : app.status === 'reviewed' 
                                ? 'Viewed by Employer' 
                                : 'Application Sent'}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#70798C] mt-0.5">
                            {app.companyName} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-[11px] text-[#342A21] bg-white p-2 rounded-xl border border-[#E5E7EB]">
                            <FileText className="w-3.5 h-3.5 text-[#70798C] shrink-0" />
                            <span className="truncate font-medium">{app.cvFileName}</span>
                            <span className="text-[10px] font-bold text-[#342A21] bg-[#EFE9E1] px-1.5 py-0.5 rounded ml-auto shrink-0 border border-[#E5E7EB]">
                              Attached
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FCF9F5] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#70798C]">
          <span className="text-[11px]">
            Showing all notifications for Delta State
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
