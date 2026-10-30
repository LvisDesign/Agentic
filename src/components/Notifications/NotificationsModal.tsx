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
import { getListingLifecycleState, SETLLA_FRESHNESS_POLICY, getRemainingHoursUntilExpire } from '../../utils/listingLifecycle';

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  listings: PropertyListing[];
  currentUser?: UserProfile;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onSelectJob?: (jobId: string) => void;
  onConfirmFreshness?: (listingId: string) => void;
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
  onConfirmFreshness,
  onUpdateAvailability,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'inspections' | 'jobs' | 'adverts'>(initialTab);
  const [selectedPassBooking, setSelectedPassBooking] = useState<{ booking: BookingRecord; listing: PropertyListing } | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

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

  const [dismissedPolicy, setDismissedPolicy] = useState(false);

  // Listings belonging to current user that need availability confirmation or relist
  const listerCheckAlerts = useMemo(() => {
    if (!currentUser) return [];
    const now = Date.now();
    return listings.filter((l) => {
      const isOwner = (currentUser.id && l.agent?.id === currentUser.id) ||
                      (currentUser.phone && l.agent?.phone === currentUser.phone) ||
                      (currentUser.isAgent);
      if (!isOwner) return false;
      const state = getListingLifecycleState(l, now);
      return state === 'due_for_check' || state === 'expired';
    });
  }, [listings, currentUser]);

  // Aggregate counts
  const inspectionsCount = bookings.length;
  const jobsCount = jobApplications.length;
  const listerAlertsCount = listerCheckAlerts.length;
  const totalCount = inspectionsCount + jobsCount + listerAlertsCount;

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

          {/* Pinned 72-Hour Freshness Policy Notice */}
          {!selectedPassBooking && !dismissedPolicy && (
            <div className="bg-gradient-to-r from-[#FCF9F5] via-amber-50/50 to-[#FCF9F5] border border-amber-200/90 rounded-2xl p-4 shadow-2xs relative">
              <button
                type="button"
                onClick={() => setDismissedPolicy(true)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className="w-8 h-8 rounded-xl bg-[#342A21] text-amber-300 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-[#000004]">
                      {SETLLA_FRESHNESS_POLICY.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      Platform Policy
                    </span>
                  </div>
                  <p className="text-[11px] text-[#70798C] leading-relaxed">
                    {SETLLA_FRESHNESS_POLICY.shortSummary}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 text-[10px]">
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70">
                      <span className="font-bold text-[#000004] block">48h Check</span>
                      <span className="text-[#70798C]">1-tap confirm keeps it live for 48h more.</span>
                    </div>
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70">
                      <span className="font-bold text-[#000004] block">72h Auto-Delist</span>
                      <span className="text-[#70798C]">Delisted from public feed until relisted.</span>
                    </div>
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70">
                      <span className="font-bold text-[#000004] block">24h Taken Purge</span>
                      <span className="text-[#70798C]">Rented units displayed 24h as proof.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lister Availability Check Alerts */}
          {!selectedPassBooking && listerCheckAlerts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Action Required: Confirm Availability ({listerCheckAlerts.length})
                </span>
              </div>
              {listerCheckAlerts.map((listing) => {
                const now = Date.now();
                const state = getListingLifecycleState(listing, now);
                const remainingHours = getRemainingHoursUntilExpire(listing, now);
                const firstImg = listing.media?.[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80';
                const rentVal = listing.fees?.baseRent ? `₦${listing.fees.baseRent.toLocaleString()}/yr` : '';

                return (
                  <div 
                    key={`lister-alert-${listing.id}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      state === 'expired'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={firstImg} 
                          alt={listing.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/10" 
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-[#000004] truncate">
                            {listing.title}
                          </h5>
                          <p className="text-[11px] text-[#70798C] truncate">
                            {listing.neighborhood || listing.city}, {listing.state} {rentVal ? `• ${rentVal}` : ''}
                          </p>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold ${
                            state === 'expired' ? 'text-rose-700' : 'text-amber-700'
                          }`}>
                            {state === 'expired'
                              ? 'Delisted from feed (inactive > 72h)'
                              : `Needs 48h check (${remainingHours}h left before delist)`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        {onConfirmFreshness && (
                          <button
                            type="button"
                            onClick={() => onConfirmFreshness(listing.id)}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{state === 'expired' ? 'Renew & Relist' : 'Still Available (+48h)'}</span>
                          </button>
                        )}
                        {onUpdateAvailability && state !== 'expired' && (
                          <button
                            type="button"
                            onClick={() => onUpdateAvailability(listing.id, 'Rented Out')}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#70798C] hover:text-[#000004] font-bold text-xs border border-[#E5E7EB] transition-colors cursor-pointer"
                          >
                            Mark Rented
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
