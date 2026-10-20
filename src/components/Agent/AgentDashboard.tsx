import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Users, 
  Wallet, 
  Calendar, 
  CalendarCheck,
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  Building,
  Phone,
  MessageSquare,
  Film,
  Database,
  UploadCloud
} from 'lucide-react';
import { PropertyListing, BookingRecord, AgentProfile, UserProfile, ListingAvailability } from '../../types/marketplace';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { CreateListingModal } from './CreateListingModal';
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';
import { syncLocalListingsToCloud } from '../../services/listingService';
import { isSupabaseConfigured } from '../../utils/supabaseClient';

interface AgentDashboardProps {
  currentUser?: UserProfile;
  listings: PropertyListing[];
  bookings: BookingRecord[];
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onListingCreated: (listing: PropertyListing) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  onConfirmFreshness?: (listingId: string) => void;
  onSwitchToSeeker?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  currentUser,
  listings,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onListingCreated,
  onUpdateAvailability,
  onConfirmFreshness,
  onSwitchToSeeker,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings'>('requests');
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  // Automatically sync local listings to cloud database on mount
  useEffect(() => {
    syncLocalListingsToCloud().catch(console.warn);
  }, []);

  // Check if current user is an admin / platform manager
  const isDemoAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.isDemoAdmin ||
    currentUser?.email === 'admin@deltarent.ng' ||
    (currentUser?.id === 'DT-AGT-9012' && currentUser?.fullName === 'Victor Ossai')
  );

  // Active Agent Profile
  const defaultAgent = listings[0]?.agent || {
    id: 'agent-chief-oghene',
    fullName: 'Chief Oghenetega Macaulay',
    agencyName: 'Delta Heritage Realty Ltd',
    isVerified: true,
    cacNumber: 'RC-1849204',
    rating: 4.9,
    reviewCount: 42,
    completedInspections: 138,
    responseTime: 'Responds within 10 mins',
    phone: '08034928172',
    whatsapp: '2348034928172',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  };

  const agentProfile: AgentProfile = (currentUser?.isAgent && currentUser.fullName) ? {
    id: currentUser.id || 'agent-active',
    fullName: currentUser.fullName,
    agencyName: currentUser.agencyName || 'Independent Real Estate Partner',
    isVerified: true,
    cacNumber: currentUser.cacNumber || 'VERIFIED-REG',
    rating: isDemoAdmin ? 4.9 : 5.0,
    reviewCount: isDemoAdmin ? 42 : 0,
    completedInspections: isDemoAdmin ? 138 : 0,
    responseTime: 'Responds within 10 mins',
    phone: currentUser.phone || (isDemoAdmin ? '0803 555 1234' : ''),
    whatsapp: currentUser.whatsapp || currentUser.phone || (isDemoAdmin ? '2348035551234' : ''),
    avatarUrl: currentUser.avatarUrl || defaultAgent.avatarUrl,
  } : {
    ...defaultAgent,
    avatarUrl: currentUser?.avatarUrl || defaultAgent.avatarUrl,
  };

  // Filter listings and bookings for this specific agent (or show all if demo admin)
  const agentListings = isDemoAdmin
    ? listings
    : listings.filter((l) => {
        if (!currentUser) return false;
        if (l.agent?.id && currentUser.id && l.agent.id === currentUser.id) return true;
        if (currentUser.phone && l.agent?.phone && l.agent.phone.replace(/\s+/g, '') === currentUser.phone.replace(/\s+/g, '')) return true;
        if (currentUser.fullName && l.agent?.fullName && l.agent.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
        return false;
      });

  const agentBookings = isDemoAdmin
    ? bookings
    : bookings.filter((b) => agentListings.some((l) => l.id === b.propertyId));

  // Compute metrics
  const totalRevenue = agentBookings
    .filter((b) => b.status === 'CONFIRMED_UNLOCKED')
    .reduce((acc, curr) => acc + curr.inspectionFeeAmount, isDemoAdmin ? 85000 : 0);

  const pendingRequests = agentBookings.filter(
    (b) => b.status === 'REQUEST_SUBMITTED'
  );

  const queuedRequests = agentBookings.filter(
    (b) => b.status === 'QUEUED'
  );

  const acceptedOrPaid = agentBookings.filter(
    (b) => b.status === 'ACCEPTED_PENDING_PAYMENT' || b.status === 'CONFIRMED_UNLOCKED'
  );

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-16 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Banner / Agent Identity */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={agentProfile.avatarUrl}
            alt={agentProfile.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#342A21]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#000004]">
                {agentProfile.fullName}
              </h1>
            </div>
            <p className="text-xs text-[#70798C] mt-0.5">
              {agentProfile.agencyName} • CAC: {agentProfile.cacNumber} •{' '}
              {agentProfile.reviewCount > 0 ? (
                <span>Rating {agentProfile.rating}★ ({agentProfile.reviewCount} reviews)</span>
              ) : (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">New Verified Partner</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#70798C]">
              <span className="font-mono text-[#000004] font-semibold">{formatNigerianPhone(agentProfile.phone)}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Online & Available</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Booked Inspections</span>
            <CalendarCheck className="w-4 h-4 text-[#342A21]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {agentProfile.completedInspections + acceptedOrPaid.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {agentProfile.completedInspections === 0 && acceptedOrPaid.length === 0
              ? 'No inspections yet'
              : 'Total inspections scheduled'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C]">
            {pendingRequests.length === 0 ? 'All caught up' : 'Waiting for your reply'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Waiting List</span>
            <Users className="w-4 h-4 text-[#F0544F]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#F0544F] mt-1">
            {queuedRequests.length}
          </div>
          <span className="text-[10px] text-[#F0544F]">Max 5 people per time slot</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>My Listed Houses</span>
            <Building className="w-4 h-4 text-[#342A21]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {agentListings.length}
          </div>
          <span className="text-[10px] text-[#70798C]">
            {agentListings.length === 0 ? 'No listings yet' : 'Live on platform'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>Inspection Requests</span>
          {(pendingRequests.length > 0 || queuedRequests.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#000004] text-white">
              {pendingRequests.length + queuedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'listings'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>My Properties ({agentListings.length})</span>
        </button>
      </div>

      {/* TAB 1: INSPECTION QUEUE & REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {agentListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-12 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#342A21] flex items-center justify-center mx-auto shadow-xs">
                <Building className="w-8 h-8 text-[#342A21]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display text-lg font-bold text-[#000004]">
                  No Inspection Requests Yet
                </h3>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Welcome, <strong>{agentProfile.fullName}</strong>! You haven't added any properties yet. Once you publish your available apartments or houses in Delta State, house seekers will book verified inspection slots and requests will appear here.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Property</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Section: Pending Direct Booking Requests */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004]">
                  New Inspection Requests
                </h3>
                <p className="text-xs text-[#70798C]">
                  Each time slot takes a maximum of 5 people so you don't get crowded or stressed.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21]">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
                <Clock className="w-8 h-8 text-[#70798C]/60 mx-auto mb-2" />
                <p className="text-[11px] text-[#70798C] mt-1">
                  When house seekers book an inspection, their requests will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((b) => {
                  const property = listings.find((p) => p.id === b.propertyId) || listings[0];
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#000004]">
                            {b.applicantName}
                          </span>
                          <span className="text-xs text-[#70798C]">({b.applicantPhone})</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#342A21]/15 text-[#342A21]">
                            Booking ID: {b.id}
                          </span>
                        </div>
                        <div className="text-xs text-[#70798C]">
                          Property: <strong className="text-[#000004]">{property.title}</strong>
                        </div>
                        <div className="text-xs text-[#342A21] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Date & Time: {b.slotDate}, {b.slotTimeWindow}
                        </div>
                      </div>

                      {/* Check slot capacity (< 5 bookings) */}
                      {(() => {
                        const targetSlot = property.inspectionSlots.find((s) => s.id === b.slotId);
                        const isSlotFull = targetSlot ? targetSlot.bookedCount >= 5 : false;

                        return (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {isSlotFull ? (
                              <div className="text-right">
                                <span className="px-2.5 py-1 rounded-[6px] bg-[#F0544F]/10 text-[#F0544F] border border-[#F0544F]/30 text-xs font-bold block mb-0.5">
                                  5/5 Capped
                                </span>
                                <span className="text-[10px] text-[#70798C] block">Concurrency cap reached</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => onAcceptBooking(b.id)}
                                className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Accept Request
                              </button>
                            )}
                            <button
                              onClick={() => onRejectBooking(b.id)}
                              className="py-2 px-3 rounded-lg border border-[#E5E7EB] hover:bg-slate-100 text-xs font-medium text-[#70798C] transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Standby Waitlist Queue (5/5 Limit Reached) */}
          <div className="bg-white rounded-2xl border border-[#F0544F]/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004]">
                  Waiting List (Time Slot Full: 5/5)
                </h3>
                <p className="text-xs text-[#70798C]">
                  People waiting for an open space if someone cancels. They get added automatically in line.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F0544F]/10 text-[#F0544F]">
                {queuedRequests.length} on Waiting List
              </span>
            </div>

            {queuedRequests.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
                <p className="text-xs text-[#70798C]">
                  Nobody is on the waiting list right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedRequests.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-[#F0544F]/20 bg-[#F0544F]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#F0544F] text-white text-[11px] font-bold">
                          Waiting List #{b.queuePosition || 1}
                        </span>
                        <span className="font-bold text-sm text-[#000004]">
                          {b.applicantName}
                        </span>
                      </div>
                      <div className="text-xs text-[#70798C] mt-1">
                        Requested Time: {b.slotDate}, {b.slotTimeWindow}
                      </div>
                    </div>

                    <button
                      onClick={() => onAcceptBooking(b.id)}
                      className="w-full sm:w-auto py-2 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      Accept Early
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Confirmed Inspection Passes */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <h3 className="font-display text-base font-bold text-[#000004] mb-1">
              Confirmed Inspections
            </h3>
            <p className="text-xs text-[#70798C] mb-4">
              These house seekers have booked their inspection. They have your phone number to call you.
            </p>

            {acceptedOrPaid.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB] text-xs text-[#70798C]">
                No confirmed inspections yet. Once you accept a request, it will show here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {acceptedOrPaid.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#000004]">{b.applicantName}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                          CONFIRMED
                        </span>
                      </div>
                      <div className="text-[#70798C] mt-0.5">
                        Booking ID: <span className="font-mono text-[#000004] font-medium">{b.id}</span> • {b.slotDate}, {b.slotTimeWindow}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-sm font-bold text-emerald-600">
                        CONFIRMED
                      </div>
                      <div className="text-[10px] text-[#70798C]">House Seeker</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {agentListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EB] p-10 sm:p-14 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-[#70798C] flex items-center justify-center mx-auto">
                <Building className="w-8 h-8 text-[#000004]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display text-lg font-bold text-[#000004]">
                  You Haven't Listed Any Properties Yet
                </h3>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Start listing your flats, self-contains, or houses across Delta State. Verified listings appear live on the video feed and search immediately.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Property</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentListings.map((prop) => {
              const isRentedOut = prop.availabilityStatus === 'Rented Out';
                const isStale = (() => {
                  if (!prop.lastConfirmedAt) return true;
                  const diff = (new Date('2026-10-19T23:24:27+01:00').getTime() - new Date(prop.lastConfirmedAt).getTime()) / (1000 * 60 * 60);
                  return diff > 48;
                })();

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col"
                  >
                    <div className="h-44 relative bg-slate-900 overflow-hidden">
                      {prop.media[0]?.type === 'video' ? (
                        <div className="w-full h-full relative">
                          <img
                            src={prop.media[0]?.poster || prop.media[0]?.url || DEFAULT_FALLBACK_IMAGE}
                            alt={prop.title}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                            <span className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20">
                              <Film className="w-4 h-4 text-amber-300" />
                            </span>
                          </div>
                          <span className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 z-10">
                            <Film className="w-3 h-3 text-amber-300" />
                            Walkthrough
                          </span>
                        </div>
                      ) : (
                        <img
                          src={prop.media[0]?.url || DEFAULT_FALLBACK_IMAGE}
                          alt={prop.title}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[11px] font-medium">
                        {prop.city}, Delta
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-display text-sm font-bold">
                        {formatNaira(prop.fees.baseRent)}/{prop.fees.rentPeriod}
                      </div>

                      {/* Rented Out Backdrop Overlay */}
                      {isRentedOut && (
                        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-3 text-center">
                          <span className="px-3 py-1 rounded-[6px] bg-[#F0544F] text-white text-xs font-extrabold tracking-wider shadow-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            RENTED OUT
                          </span>
                          <span className="text-white/80 text-[10px] mt-1">
                            Auto-archiving from feed in 3s...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-sm text-[#000004] line-clamp-1">
                            {prop.title}
                          </h4>
                          {isRentedOut ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#F0544F] text-white shrink-0">
                              RENTED OUT
                            </span>
                          ) : prop.availabilityStatus === 'Under Inspection' ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white shrink-0">
                              Under Inspection
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#70798C] line-clamp-1">
                          {prop.neighborhood} • {prop.propertyType}
                        </p>
                        {prop.addons && prop.addons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {prop.addons.map((addon) => (
                              <span
                                key={addon}
                                className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200/70 text-[10px] font-semibold"
                              >
                                {addon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Status Selector */}
                      <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                          <span className="font-bold text-[#70798C] text-[11px] uppercase tracking-wider">
                            Status:
                          </span>
                          <div className="flex items-center gap-1">
                            {(['Available', 'Under Inspection', 'Rented Out'] as ListingAvailability[]).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  if (onUpdateAvailability) {
                                    onUpdateAvailability(prop.id, st);
                                    if (st === 'Rented Out') {
                                      setDashboardToast('Listing marked as Rented Out. Hiding from public feed in 3s...');
                                      setTimeout(() => setDashboardToast(null), 3500);
                                    }
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer ${
                                  prop.availabilityStatus === st || (!prop.availabilityStatus && st === 'Available')
                                    ? st === 'Rented Out'
                                      ? 'bg-[#F0544F] text-white shadow-2xs'
                                      : st === 'Under Inspection'
                                      ? 'bg-amber-500 text-white shadow-2xs'
                                      : 'bg-[#000004] text-white shadow-2xs'
                                    : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:bg-slate-50'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 48-Hour Proof-of-Life Status & Refresh Button */}
                        <div className="flex items-center justify-between text-[11px] p-2 rounded-[8px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.22)]">
                          {isStale ? (
                            <span className="text-amber-800 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Unconfirmed (&gt;48 hrs)
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              Freshness verified (&lt;48h)
                            </span>
                          )}

                          {onConfirmFreshness && (
                            <button
                              type="button"
                              onClick={() => {
                                onConfirmFreshness(prop.id);
                                setDashboardToast('Listing vacancy confirmed! Ranking restored to top.');
                                setTimeout(() => setDashboardToast(null), 3000);
                              }}
                              className="px-2 py-0.5 rounded-[6px] bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                            >
                              Confirm Still Vacant
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                        <span className="text-[#70798C]">
                          {prop.inspectionSlots.length} Time Slots
                        </span>
                        <button
                          onClick={onSwitchToSeeker}
                          className="text-[#342A21] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>View in Feed</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={showCreateModal}
        currentUser={currentUser}
        onClose={() => setShowCreateModal(false)}
        onListingCreated={(newListing) => {
          onListingCreated(newListing);
          setDashboardToast(`Property "${newListing.title}" added to your listings!`);
          setTimeout(() => setDashboardToast(null), 3000);
        }}
      />

      {/* Floating Status Toast */}
      {dashboardToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-[12px] bg-[#000004] text-white shadow-2xl text-xs sm:text-sm font-medium animate-slide-up border border-white/10 max-w-[90vw]">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dashboardToast}</span>
        </div>
      )}
    </div>
  );
};
