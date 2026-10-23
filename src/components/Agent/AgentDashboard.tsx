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
  UploadCloud,
  Edit3,
  Trash2
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
  onListingUpdated?: (listing: PropertyListing) => void;
  onDeleteListing?: (listingId: string) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  onConfirmFreshness?: (listingId: string) => void;
  onSwitchToSeeker?: () => void;
  onSwitchToTenant?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  currentUser,
  listings,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onListingCreated,
  onListingUpdated,
  onDeleteListing,
  onUpdateAvailability,
  onConfirmFreshness,
  onSwitchToSeeker,
  onSwitchToTenant,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings'>('requests');
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  // Automatically sync local listings to cloud database on mount
  useEffect(() => {
    syncLocalListingsToCloud().catch(console.warn);
  }, []);

  // Check if current user is an admin / platform manager
  const isPlatformAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.isSuperAdmin ||
    currentUser?.email === 'admin@setlla.com' ||
    currentUser?.email === 'admin@deltarent.ng'
  );

  // Active Agent Profile
  const defaultAgent = listings[0]?.agent || {
    id: 'agent-verified',
    fullName: currentUser?.fullName || 'Verified Agent Partner',
    agencyName: currentUser?.agencyName || 'Independent Real Estate Partner',
    isVerified: true,
    cacNumber: 'VERIFIED-REG',
    rating: 5.0,
    reviewCount: 0,
    completedInspections: 0,
    responseTime: 'Responds within 10 mins',
    phone: currentUser?.phone || '',
    whatsapp: currentUser?.whatsapp || currentUser?.phone || '',
    avatarUrl: currentUser?.avatarUrl || '/images/properties/asaba_gra_exterior.jpg',
  };

  // Filter listings and bookings for this specific agent (or show all if platform admin)
  const agentListings = (isPlatformAdmin
    ? listings
    : listings.filter((l) => {
        if (!currentUser) return false;
        if (l.agent?.id && currentUser.id && l.agent.id === currentUser.id) return true;
        if (currentUser.phone && l.agent?.phone && l.agent.phone.replace(/\s+/g, '') === currentUser.phone.replace(/\s+/g, '')) return true;
        if (currentUser.fullName && l.agent?.fullName && l.agent.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
        return false;
      })
  ).filter((l) => l.availabilityStatus !== 'Deleted');

  const agentBookings = isPlatformAdmin
    ? bookings
    : bookings.filter((b) => agentListings.some((l) => l.id === b.propertyId));

  const agentProfile: AgentProfile = (currentUser?.isAgent && currentUser.fullName) ? {
    id: currentUser.id || 'agent-active',
    fullName: currentUser.fullName,
    agencyName: currentUser.agencyName || 'Independent Real Estate Partner',
    isVerified: true,
    cacNumber: currentUser.cacNumber || 'VERIFIED-REG',
    rating: 5.0,
    reviewCount: 0,
    completedInspections: agentBookings.filter((b) => b.status === 'CONFIRMED_UNLOCKED' || b.status === 'APPROVED_CONFIRMED').length,
    responseTime: 'Responds within 10 mins',
    phone: currentUser.phone || '',
    whatsapp: currentUser.whatsapp || currentUser.phone || '',
    avatarUrl: currentUser.avatarUrl || defaultAgent.avatarUrl,
  } : {
    ...defaultAgent,
    avatarUrl: currentUser?.avatarUrl || defaultAgent.avatarUrl,
  };

  // Compute metrics from actual live data
  const totalRevenue = agentBookings
    .filter((b) => b.status === 'CONFIRMED_UNLOCKED' || b.status === 'APPROVED_CONFIRMED')
    .reduce((acc, curr) => acc + (curr.inspectionFeeAmount || 0), 0);

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
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-16 pb-20 px-3.5 sm:px-6 max-w-5xl mx-auto">
      {/* Top Banner / Agent Identity */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E7EB] shadow-xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <img
            src={agentProfile.avatarUrl}
            alt={agentProfile.fullName}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#342A21] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#000004] truncate">
                {agentProfile.fullName}
              </h1>
            </div>
            <p className="text-xs text-[#70798C] mt-0.5 truncate">
              {agentProfile.agencyName} • CAC: {agentProfile.cacNumber} •{' '}
              {agentProfile.reviewCount > 0 ? (
                <span>Rating {agentProfile.rating}★ ({agentProfile.reviewCount} reviews)</span>
              ) : (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">New Verified Partner</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-1.5 sm:mt-2 text-xs text-[#70798C] flex-wrap">
              <span className="font-mono text-[#000004] font-semibold">{formatNigerianPhone(agentProfile.phone)}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Online & Available</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-6">
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Booked Inspections</span>
            <CalendarCheck className="w-4 h-4 text-[#342A21] shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {agentProfile.completedInspections + acceptedOrPaid.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block truncate mt-0.5">
            {agentProfile.completedInspections === 0 && acceptedOrPaid.length === 0
              ? 'No inspections yet'
              : 'Total scheduled'}
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C] block truncate mt-0.5">
            {pendingRequests.length === 0 ? 'All caught up' : 'Waiting for reply'}
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Waiting List</span>
            <Users className="w-4 h-4 text-[#F0544F] shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#F0544F] mt-1">
            {queuedRequests.length}
          </div>
          <span className="text-[10px] text-[#F0544F] block truncate mt-0.5">Max 5 per time slot</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">My Listed Houses</span>
            <Building className="w-4 h-4 text-[#342A21] shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {agentListings.length}
          </div>
          <span className="text-[10px] text-[#70798C] block truncate mt-0.5">
            {agentListings.length === 0 ? 'No listings yet' : 'Live on platform'}
          </span>
        </div>
      </div>

      {/* Tabs (Horizontally scrollable on mobile) */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] mb-6 overflow-x-auto scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
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
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
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
                  Welcome, <strong>{agentProfile.fullName}</strong>! You haven't added any properties yet. Once you publish your available apartments or houses in Delta State, tenants will book verified inspection slots and requests will appear here.
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
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold text-[#000004]">
                      New Inspection Requests
                    </h3>
                    <p className="text-xs text-[#70798C] mt-0.5 leading-relaxed">
                      Each time slot takes a maximum of 5 people so you don't get crowded or stressed.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] shrink-0 self-start sm:self-auto">
                    {pendingRequests.length} Pending
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
                    <Clock className="w-8 h-8 text-[#70798C]/60 mx-auto mb-2" />
                    <p className="text-[11px] text-[#70798C] mt-1">
                      When tenants book an inspection, their requests will appear here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((b) => {
                      const property = listings.find((p) => p.id === b.propertyId) || listings[0];
                      return (
                        <div
                          key={b.id}
                          className="p-3.5 sm:p-4 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 overflow-hidden"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-[#000004]">
                                {b.applicantName}
                              </span>
                              <span className="text-xs text-[#70798C] font-mono">({b.applicantPhone})</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#342A21]/10 text-[#342A21] border border-[#342A21]/15 shrink-0">
                                Booking ID: {b.id}
                              </span>
                            </div>
                            <div className="text-xs text-[#70798C] line-clamp-2 break-words" title={property.title}>
                              Property: <strong className="text-[#000004] font-semibold">{property.title}</strong>
                            </div>
                            <div className="text-xs text-[#342A21] font-medium flex items-center gap-1.5 pt-0.5">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-[#342A21]" />
                              <span>Date & Time: <strong>{b.slotDate}, {b.slotTimeWindow}</strong></span>
                            </div>
                          </div>

                          {/* Check slot capacity (< 5 bookings) */}
                          {(() => {
                            const targetSlot = property.inspectionSlots.find((s) => s.id === b.slotId);
                            const isSlotFull = targetSlot ? targetSlot.bookedCount >= 5 : false;

                            return (
                              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-[#E5E7EB]/60">
                                {isSlotFull ? (
                                  <div className="col-span-2 sm:col-span-1 text-left md:text-right">
                                    <span className="px-2.5 py-1 rounded-[6px] bg-[#F0544F]/10 text-[#F0544F] border border-[#F0544F]/30 text-xs font-bold block mb-0.5">
                                      5/5 Capped
                                    </span>
                                    <span className="text-[10px] text-[#70798C] block">Concurrency cap reached</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onAcceptBooking(b.id)}
                                    className="w-full sm:w-auto py-2.5 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                                  >
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span>Accept Request</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onRejectBooking(b.id)}
                                  className="w-full sm:w-auto py-2.5 px-3 sm:px-3.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-xs font-semibold text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer shrink-0 whitespace-nowrap bg-white shadow-2xs text-center"
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
              <div className="bg-white rounded-2xl border border-[#F0544F]/30 p-3.5 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold text-[#000004]">
                      Waiting List (Time Slot Full: 5/5)
                    </h3>
                    <p className="text-xs text-[#70798C] mt-0.5 leading-relaxed">
                      People waiting for an open space if someone cancels. They get added automatically in line.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F0544F]/10 text-[#F0544F] shrink-0 self-start sm:self-auto">
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
                        className="p-3.5 sm:p-4 rounded-xl border border-[#F0544F]/20 bg-[#F0544F]/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 overflow-hidden"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#F0544F] text-white text-[11px] font-bold shrink-0">
                              Waiting List #{b.queuePosition || 1}
                            </span>
                            <span className="font-bold text-sm text-[#000004]">
                              {b.applicantName}
                            </span>
                          </div>
                          <div className="text-xs text-[#70798C] truncate">
                            Requested Time: {b.slotDate}, {b.slotTimeWindow}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F0544F]/20">
                          <button
                            onClick={() => onAcceptBooking(b.id)}
                            className="w-full md:w-auto py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors whitespace-nowrap cursor-pointer text-center"
                          >
                            Accept Early
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section: Confirmed Inspection Passes */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs">
                <h3 className="font-display text-base font-bold text-[#000004] mb-1">
                  Confirmed Inspections
                </h3>
                <p className="text-xs text-[#70798C] mb-4">
                  These tenants have booked their inspection. They have your phone number to call you.
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
                        className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs overflow-hidden"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#000004] line-clamp-1 break-words">{b.applicantName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white shrink-0">
                              CONFIRMED
                            </span>
                          </div>
                          <div className="text-[#70798C] mt-0.5 truncate">
                            Booking ID: <span className="font-mono text-[#000004] font-medium">{b.id}</span> • {b.slotDate}, {b.slotTimeWindow}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60">
                          <div className="font-display text-sm font-bold text-emerald-600">
                            CONFIRMED
                          </div>
                          <div className="text-[10px] text-[#70798C]">Tenant</div>
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

                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm text-[#000004] line-clamp-2 break-words flex-1 leading-snug">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="font-bold text-[#70798C] text-[11px] uppercase tracking-wider shrink-0">
                            Status:
                          </span>
                          <div className="grid grid-cols-3 sm:flex items-center gap-1 w-full sm:w-auto">
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
                                className={`w-full sm:w-auto text-center px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] p-2.5 rounded-[8px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.22)]">
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
                              className="w-full sm:w-auto text-center px-2 py-1 sm:py-0.5 rounded-[6px] bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              Confirm Still Vacant
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setEditingListing(prop)}
                            className="w-full sm:w-auto justify-center px-2.5 py-1.5 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000004] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95 whitespace-nowrap"
                            title="Edit property details, rent price, media, and inspection slots"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setListingToDelete(prop)}
                            className="w-full sm:w-auto justify-center px-2.5 py-1.5 sm:py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 shadow-2xs active:scale-95 whitespace-nowrap"
                            title="Permanently delete this property listing"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]/60">
                          <span className="text-[#70798C] text-[11px] whitespace-nowrap">
                            {prop.inspectionSlots.length} Slots
                          </span>
                          <button
                            type="button"
                            onClick={onSwitchToTenant || onSwitchToSeeker}
                            className="text-[#342A21] hover:underline font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span>View in Feed</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create or Edit Listing Modal */}
      <CreateListingModal
        isOpen={showCreateModal || Boolean(editingListing)}
        currentUser={currentUser}
        initialListing={editingListing}
        onClose={() => {
          setShowCreateModal(false);
          setEditingListing(null);
        }}
        onListingCreated={(newListing) => {
          onListingCreated(newListing);
          setDashboardToast(`Property "${newListing.title}" added to your listings!`);
          setTimeout(() => setDashboardToast(null), 3000);
        }}
        onListingUpdated={(updatedListing) => {
          if (onListingUpdated) {
            onListingUpdated(updatedListing);
          }
          setEditingListing(null);
          setDashboardToast(`Changes to "${updatedListing.title}" saved successfully!`);
          setTimeout(() => setDashboardToast(null), 3000);
        }}
      />

      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setListingToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display text-lg font-bold text-[#000004]">
                Delete Property Listing?
              </h3>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Are you sure you want to permanently delete <strong>"{listingToDelete.title}"</strong>? 
                This will remove it from Setlla across all devices and cancel any pending inspections.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setListingToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E7EB] text-[#70798C] hover:text-[#000004] hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!listingToDelete) return;
                  setIsDeleting(true);
                  try {
                    if (onDeleteListing) {
                      await onDeleteListing(listingToDelete.id);
                    }
                    setDashboardToast('Property listing permanently deleted.');
                    setTimeout(() => setDashboardToast(null), 3000);
                  } finally {
                    setIsDeleting(false);
                    setListingToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Listing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
