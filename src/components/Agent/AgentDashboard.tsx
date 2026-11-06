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
  Trash2,
  Megaphone
} from 'lucide-react';
import { PropertyListing, BookingRecord, AgentProfile, UserProfile, ListingAvailability } from '../../types/marketplace';
import { formatNaira } from '../../utils/formatters';
import { CreateListingModal } from './CreateListingModal';
import { ModalPortal } from '../UI/ModalPortal';
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';
import { syncLocalListingsToCloud } from '../../services/listingService';
import { isSupabaseConfigured } from '../../utils/supabaseClient';
import { getListingLifecycleInfo } from '../../utils/listingLifecycle';
import { AdvertiserDashboard } from '../Advertiser/AdvertiserDashboard';
import { ensureAdvertiserForUser } from '../../services/advertiserAuthService';

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
  onOpenAdsPortal?: () => void;
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
  onOpenAdsPortal,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings' | 'ads'>('requests');
  const [adsInitialTab, setAdsInitialTab] = useState<'campaigns' | 'new-campaign'>('campaigns');
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
  const cleanUserAvatar = currentUser?.avatarUrl &&
    !currentUser.avatarUrl.includes('/images/properties/') &&
    !currentUser.avatarUrl.includes('images.unsplash.com')
    ? currentUser.avatarUrl
    : '';

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
    avatarUrl: cleanUserAvatar,
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
    avatarUrl: cleanUserAvatar,
  } : {
    ...defaultAgent,
    avatarUrl: cleanUserAvatar,
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

  const agentInitials = agentProfile.fullName
    ? agentProfile.fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AG'
    : 'AG';

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-16 pb-20 px-3.5 sm:px-6 max-w-5xl mx-auto">
      {/* Top Banner / Agent Identity */}
      <div className="bg-gradient-to-br from-white via-[#FEFCFA] to-[#F7F3ED] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E8E1D7] shadow-xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {agentProfile.avatarUrl ? (
            <img
              src={agentProfile.avatarUrl}
              alt={agentProfile.fullName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#E5E7EB] shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#000004] text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl shadow-xs shrink-0">
              {agentInitials}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#000004] truncate">
                {agentProfile.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#342A21] border border-[#E5E7EB] shrink-0">
                Partner Agent
              </span>
            </div>

            <p className="text-xs text-[#70798C] font-medium truncate">
              <span className="text-[#342A21] font-semibold">{agentProfile.agencyName || 'Independent Partner Agency'}</span>
              {agentProfile.reviewCount > 0 && (
                <span> &bull; Rating {agentProfile.rating}★ ({agentProfile.reviewCount} reviews)</span>
              )}
            </p>

            <div className="flex items-center gap-2 text-xs text-[#70798C] flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-[#342A21] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Online &amp; Available</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
          <button
            onClick={() => {
              setAdsInitialTab('new-campaign');
              setActiveTab('ads');
            }}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-[#342A21]/15 bg-[#F6F3EF] hover:bg-[#342A21] text-[#342A21] hover:text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap group"
            title="Post and manage adverts directly inside your Agent Portal"
          >
            <Megaphone className="w-3.5 h-3.5 text-[#342A21] group-hover:text-[#FCF9F5] transition-colors shrink-0" />
            <span>Promote</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Property</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-6">
        <div
          onClick={() => setActiveTab('requests')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white via-[#F9FBFA] to-[#EFF5F2] border border-[#E0EBE6] shadow-2xs hover:shadow-sm transition-all min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#4A5D54] gap-1.5">
            <span className="truncate font-semibold">Booked Inspections</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#E5F0EC] text-[#285E4B] border border-[#D2E4DC] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-[26px] font-bold text-[#1C2A24] mt-1.5 leading-tight">
            {agentProfile.completedInspections + acceptedOrPaid.length}
          </div>
          <span className="text-[11px] text-[#5B7066] font-medium block truncate mt-1">
            {agentProfile.completedInspections === 0 && acceptedOrPaid.length === 0
              ? 'No inspections yet'
              : 'Total scheduled'}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('requests')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white via-[#FDFAF6] to-[#F7EFE4] border border-[#EBE0D0] shadow-2xs hover:shadow-sm transition-all min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#63513D] gap-1.5">
            <span className="truncate font-semibold">Pending Requests</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F3E7D7] text-[#8A5A2B] border border-[#E5D3BC] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-[26px] font-bold text-[#2A2118] mt-1.5 leading-tight">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-[#786550] font-medium block truncate mt-1">
            {pendingRequests.length === 0 ? 'All caught up' : 'Waiting for reply'}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('requests')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white via-[#F9FAFC] to-[#EEF2F7] border border-[#DFE6F0] shadow-2xs hover:shadow-sm transition-all min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#495668] gap-1.5">
            <span className="truncate font-semibold">Waiting List</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#E4ECF5] text-[#38557E] border border-[#D0DCEC] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-[26px] font-bold text-[#1D2530] mt-1.5 leading-tight">
            {queuedRequests.length}
          </div>
          <span className="text-[11px] text-[#606F82] font-medium block truncate mt-1">
            Max 5 per time slot
          </span>
        </div>

        <div
          onClick={() => setActiveTab('listings')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white via-[#FAF8F6] to-[#F2ECE5] border border-[#E5DDD3] shadow-2xs hover:shadow-sm transition-all min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#594A3E] gap-1.5">
            <span className="truncate font-semibold">My Listed Houses</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#EAE1D8] text-[#543D2C] border border-[#DCD0C4] flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-[26px] font-bold text-[#241B14] mt-1.5 leading-tight">
            {agentListings.length}
          </div>
          <span className="text-[11px] text-[#6E5D4F] font-medium block truncate mt-1">
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

        <button
          onClick={() => {
            setAdsInitialTab('campaigns');
            setActiveTab('ads');
          }}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'ads'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Promotions & Ads</span>
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
                  Welcome, <strong>{agentProfile.fullName}</strong>! You haven't added any properties yet. Once you publish your available apartments or houses, tenants will book verified inspection slots and requests will appear here.
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
                        className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs overflow-hidden"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#000004] line-clamp-1 break-words">{b.applicantName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#342A21] text-white shrink-0">
                              CONFIRMED
                            </span>
                          </div>
                          <div className="text-[#70798C] mt-0.5 truncate">
                            Booking ID: <span className="font-mono text-[#000004] font-medium">{b.id}</span> • {b.slotDate}, {b.slotTimeWindow}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
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
                  Start listing your flats, self-contains, or houses. Verified listings appear live on the video feed and search immediately.
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
                const lifecycle = getListingLifecycleInfo(prop);
                const isRentedOut = prop.availabilityStatus === 'Rented Out';

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                  >
                    {/* Media Header */}
                    <div className="h-44 relative bg-neutral-950 overflow-hidden">
                      {prop.media[0]?.type === 'video' ? (
                        <div className="w-full h-full relative">
                          <img
                            src={prop.media[0]?.poster || prop.media[0]?.url || DEFAULT_FALLBACK_IMAGE}
                            alt={prop.title}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                            }}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                            <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md">
                              <Film className="w-3.5 h-3.5 text-white" />
                            </span>
                          </div>
                          <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 z-10">
                            <Film className="w-3 h-3 text-white/80" />
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
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      )}

                      {/* Smooth bottom gradient overlay for readability */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

                      {/* Top-left Minimalist Status Pill */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        {lifecycle.stage === 'expired' ? (
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/15 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Off Feed (72h)</span>
                          </span>
                        ) : lifecycle.stage === 'needs_confirmation' ? (
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/15 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Verify Freshness ({Math.ceil(lifecycle.hoursUntilDelist)}h)</span>
                          </span>
                        ) : lifecycle.stage === 'taken_grace' ? (
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/15 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            <span>Taken</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/15 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Live on Feed</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom-left Price Badge */}
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <div className="bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-semibold border border-white/15 flex items-baseline gap-1 shadow-sm">
                          <span>{formatNaira(prop.fees.baseRent)}</span>
                          <span className="text-white/60 text-[10px] font-normal">/{prop.fees.rentPeriod}</span>
                        </div>
                      </div>

                      {/* Bottom-right City Badge */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-white/80 text-[10px] font-medium border border-white/10">
                        {prop.city}
                      </div>

                      {/* Rented Out Backdrop Overlay */}
                      {isRentedOut && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-3 text-center">
                          <span className="px-3 py-1 rounded-lg bg-neutral-800 text-white text-xs font-semibold tracking-wide border border-white/20 shadow-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            RENTED OUT
                          </span>
                          <span className="text-white/70 text-[10px] mt-1">
                            Auto-archiving from feed in 3s...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-900 line-clamp-1 leading-snug group-hover:text-black transition-colors" title={prop.title}>
                          {prop.title}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                          {prop.neighborhood} • {prop.propertyType}
                        </p>

                        {/* Feature / Addon Chips - Subtle Neutral Palette */}
                        {prop.addons && prop.addons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prop.addons.map((addon) => (
                              <span
                                key={addon}
                                className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200/60 text-[10px] font-medium"
                              >
                                {addon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Segmented Status Selector */}
                      <div className="space-y-2 pt-1 border-t border-neutral-100">
                        <div className="bg-neutral-100/90 p-0.5 rounded-xl border border-neutral-200/70 grid grid-cols-3 gap-0.5 text-[11px]">
                          {(['Available', 'Under Inspection', 'Rented Out'] as ListingAvailability[]).map((st) => {
                            const isSelected = prop.availabilityStatus === st || (!prop.availabilityStatus && st === 'Available');
                            return (
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
                                className={`py-1 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs border border-neutral-200/60'
                                    : 'text-neutral-500 hover:text-neutral-900 font-medium'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>

                        {/* Subtle Freshness / 48-Hour Lifecycle Row */}
                        <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                            {lifecycle.stage === 'expired' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="text-neutral-600 truncate text-[11px]">Delisted (72h unconfirmed)</span>
                              </>
                            ) : lifecycle.stage === 'needs_confirmation' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                <span className="text-amber-800 font-medium truncate text-[11px]">Verify vacancy ({Math.ceil(lifecycle.hoursUntilDelist)}h left)</span>
                              </>
                            ) : lifecycle.stage === 'taken_grace' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                                <span className="text-neutral-600 truncate text-[11px]">Rented Out ({Math.ceil(lifecycle.hoursUntilTakenCleanup || 24)}h left)</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-neutral-600 truncate text-[11px]">Fresh on Feed ({Math.ceil(48 - lifecycle.hoursSinceConfirmed)}h)</span>
                              </>
                            )}
                          </div>

                          {onConfirmFreshness && (
                            <button
                              type="button"
                              onClick={() => {
                                onConfirmFreshness(prop.id);
                                setDashboardToast(
                                  lifecycle.stage === 'expired' 
                                    ? 'Listing relisted and live on Explore feed!'
                                    : 'Listing availability verified! Freshness renewed for 48h.'
                                );
                                setTimeout(() => setDashboardToast(null), 3000);
                              }}
                              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 ${
                                lifecycle.stage === 'expired' || lifecycle.stage === 'needs_confirmation'
                                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white font-semibold'
                                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200/90'
                              }`}
                            >
                              {lifecycle.stage === 'expired'
                                ? 'Relist'
                                : lifecycle.stage === 'needs_confirmation'
                                ? 'Still Vacant'
                                : 'Confirm Vacant'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingListing(prop)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-200/70 shadow-2xs"
                            title="Edit property details, rent price, media, and inspection slots"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setListingToDelete(prop)}
                            className="px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-rose-50 text-neutral-400 hover:text-rose-600 hover:border-rose-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent"
                            title="Permanently delete this property listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-neutral-400 text-[11px] whitespace-nowrap">
                            {prop.inspectionSlots.length} slots
                          </span>
                          <button
                            type="button"
                            onClick={onSwitchToTenant || onSwitchToSeeker}
                            className="text-neutral-700 hover:text-neutral-950 font-medium text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap hover:underline"
                          >
                            <span>View in Feed</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
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

      {/* TAB 3: EMBEDDED PROMOTIONS & ADS MANAGEMENT */}
      {activeTab === 'ads' && (
        <AdvertiserDashboard
          advertiser={ensureAdvertiserForUser(currentUser || agentProfile)}
          embedded
          initialTab={adsInitialTab}
          onLogout={() => setActiveTab('requests')}
        />
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
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
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
      </ModalPortal>
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
