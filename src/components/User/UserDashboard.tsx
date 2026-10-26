import React, { useState } from 'react';
import { 
  Building, 
  CalendarCheck, 
  Clock, 
  Users, 
  ArrowUpRight, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  CheckCircle, 
  CheckCircle2,
  Calendar, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink,
  AlertCircle,
  XCircle,
  UserCheck,
  Copy,
  Check,
  Megaphone,
  Building2
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { PropertyListing, BookingRecord, UserProfile } from '../../types/marketplace';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';

interface UserDashboardProps {
  currentUser: UserProfile;
  listings: PropertyListing[];
  bookings: BookingRecord[];
  savedPropertyIds: string[];
  onToggleSaveProperty: (propertyId: string) => void;
  onOpenBookingModal: (listing: PropertyListing) => void;
  onCancelBooking: (bookingId: string) => void;
  onOpenMyPasses: () => void;
  onOpenBecomeAgent: () => void;
  onOpenSignup: () => void;
  onSwitchToFeed: () => void;
  onSwitchToAgent?: () => void;
  onOpenAdsPortal?: () => void;
  isAuthenticated?: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  listings,
  bookings,
  savedPropertyIds,
  onToggleSaveProperty,
  onOpenBookingModal,
  onCancelBooking,
  onOpenMyPasses,
  onOpenBecomeAgent,
  onOpenSignup,
  onSwitchToFeed,
  onSwitchToAgent,
  onOpenAdsPortal,
  isAuthenticated = true,
}) => {
  const [activeTab, setActiveTab] = useState<'passes' | 'inventory' | 'saved'>('passes');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const handleCopyPhone = (bookingId: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(bookingId);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Filter bookings belonging to or viewed by this user
  const confirmedPasses = bookings.filter((b) => b.status === 'CONFIRMED_UNLOCKED');
  const pendingRequests = bookings.filter((b) => b.status === 'REQUEST_SUBMITTED');
  const queuedRequests = bookings.filter((b) => b.status === 'QUEUED');

  const savedListings = listings.filter((l) => savedPropertyIds.includes(l.id));

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-20 pb-20 px-3.5 sm:px-6 max-w-5xl mx-auto">
      {/* 1. Top Banner / User Identity */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#342A21] to-[#1f1914] text-white flex items-center justify-center font-bold text-xl shadow-xs border-2 border-white ring-2 ring-[#342A21]/20 shrink-0 overflow-hidden">
            {isAuthenticated && currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : isAuthenticated ? (
              currentUser.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            ) : (
              'GU'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#000004]">
                {isAuthenticated ? currentUser.fullName : 'Guest Explorer'}
              </h1>
              {isAuthenticated ? (
                currentUser.isAgent ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#000004] text-amber-300 text-xs font-semibold">
                    <Building className="w-3 h-3" />
                    Partner Agent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#342A21] text-xs font-semibold border border-slate-200">
                    <UserCheck className="w-3 h-3" />
                    Tenant Account
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#70798C] text-xs font-semibold border border-slate-200">
                  Guest Mode (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-[#70798C] mt-0.5">
              {isAuthenticated
                ? currentUser.isAgent
                  ? `${currentUser.agencyName || 'Partner Agency'} • Agent ID: ${currentUser.id} • Operating in ${currentUser.operatingCity || currentUser.city || 'Network'}`
                  : `${currentUser.state || 'Active'} Tenant • Member ID: ${currentUser.id} • Looking in ${currentUser.city || 'All Cities'}`
                : 'Browsing rentals as guest • Create an account to book inspection appointments'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#70798C]">
              {isAuthenticated ? (
                <>
                  <span className="font-mono text-[#000004] font-semibold">
                    {formatNigerianPhone(currentUser.phone)}
                  </span>
                  <span>•</span>
                  <span className="text-[#342A21] font-medium">
                    {currentUser.isAgent
                      ? `CAC: ${currentUser.cacNumber || 'Registered Agent'}`
                      : `Seeking: ${currentUser.preferredPropertyType || 'Any Rental'}`}
                  </span>
                </>
              ) : (
                <button
                  onClick={onOpenSignup}
                  className="font-bold text-xs text-[#342A21] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Click here to Sign Up / Log In →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Become an Agent + View Live Feed */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {currentUser.isAgent ? (
            <button
              onClick={() => onSwitchToAgent?.()}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-amber-400/30 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Agent Portal</span>
            </button>
          ) : (
            <button
              onClick={onOpenBecomeAgent}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#000004] to-[#1f2937] hover:from-[#1f2937] hover:to-[#374151] text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-amber-400/30 cursor-pointer"
            >
              <span>Become an Agent</span>
            </button>
          )}

          <button
            onClick={() => onOpenAdsPortal?.()}
            className="py-2.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-[#342A21] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Launch Customer Ads & Campaigns"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-700" />
            <span>Ads Portal</span>
          </button>

          <button
            onClick={onSwitchToFeed}
            className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#000004] transition-colors cursor-pointer"
          >
            Explore Feed
          </button>
        </div>
      </div>

      {/* 2. Notice Box */}
      {currentUser.isAgent ? (
        <div className="mb-6 p-4 rounded-2xl bg-[#FCF9F5] border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#000004] text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-[#000004]">
                Agent Portal Active: {currentUser.agencyName || 'Partner Agent'}
              </h4>
              <p className="text-[11px] text-[#70798C] mt-0.5">
                You are logged in as a partner agent. You can preview house rentals here or open your Agent Portal to manage listings and tenant bookings.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSwitchToAgent?.()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open Agent Portal →</span>
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#342A21]/5 via-[#FCF9F5] to-emerald-50/70 border border-[#342A21]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#342A21]/10 text-[#342A21] flex items-center justify-center shrink-0 mt-0.5">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-[#000004]">
                Tenant Access: Direct Browsing of Agent Rentals
              </h4>
              <p className="text-[11px] text-[#70798C] mt-0.5">
                You are signed in as a tenant. You can book as many property inspections as you want! Only agents are restricted to 5 bookings per window to prevent overcrowding and ensure they never waste your time.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBecomeAgent}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-amber-300 text-[11px] font-bold text-[#000004] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Want to upload properties? Become an Agent →</span>
          </button>
        </div>
      )}

      {/* 3. KPI Cards Grid (Matches Agent Dashboard 4-card structure) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-6">
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Confirmed</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {confirmedPasses.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium truncate mt-0.5">
            Free Micro-Clearance
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Pending</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C] truncate mt-0.5">
            Awaiting Agent
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Waitlist</span>
            <Users className="w-4 h-4 text-[#F0544F] shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#F0544F] mt-1">
            {queuedRequests.length}
          </div>
          <span className="text-[10px] text-[#F0544F] truncate mt-0.5">
            Auto-Promoting
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#70798C] gap-1">
            <span className="truncate">Properties</span>
            <Building className="w-4 h-4 text-[#342A21] shrink-0" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {listings.length}
          </div>
          <span className="text-[10px] text-[#70798C] truncate mt-0.5">
            Active Listings
          </span>
        </div>
      </div>

      {/* 4. Tabs Navigation (Horizontally scrollable on mobile without wrapping) */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-[#E5E7EB] mb-6 overflow-x-auto scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'passes'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>My Inspections & Queue</span>
          {(confirmedPasses.length > 0 || pendingRequests.length > 0 || queuedRequests.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#000004] text-white">
              {confirmedPasses.length + pendingRequests.length + queuedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>Available Agent Apartments ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'saved'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>Saved / Watchlist ({savedListings.length})</span>
        </button>
      </div>

      {/* 5. TAB CONTENT */}
      {/* TAB 1: PASSES & QUEUE */}
      {activeTab === 'passes' && (
        <div className="space-y-6">
          {/* Confirmed Passes Section */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-3.5 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-[#000004] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Confirmed & Unlocked Inspection Passes</span>
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5 leading-relaxed">
                  Direct agent dispatch confirmed. Agent direct phone number unlocked — call directly or copy number to coordinate.
                </p>
              </div>
              <button
                onClick={onOpenMyPasses}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>View All Inspections ({confirmedPasses.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            {confirmedPasses.length === 0 ? (
              <div className="p-8 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
                <Calendar className="w-8 h-8 text-[#70798C]/60 mx-auto mb-2" />
                <p className="text-xs text-[#70798C]">
                  You do not have any confirmed inspection passes yet.
                </p>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="mt-3 text-xs text-[#342A21] font-semibold hover:underline cursor-pointer"
                >
                  Browse agent apartments to book a free inspection slot →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedPasses.map((b) => {
                  const property = listings.find((p) => p.id === b.propertyId) || listings[0];
                  const rawPhone = property.agent.phone;
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                            CONFIRMED & UNLOCKED
                          </span>
                          <span className="text-[10px] font-mono text-[#70798C] shrink-0">
                            Pass: {b.id}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-[#000004] line-clamp-2 break-words leading-snug">
                          {property.title}
                        </h4>

                        <div className="text-xs text-[#70798C] flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                          <span className="truncate">Area: <strong className="text-[#000004]">{property.neighborhood}, {property.city}</strong></span>
                        </div>

                        <div className="text-xs text-[#70798C] flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="flex items-center gap-1 text-[#342A21] font-semibold shrink-0">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {b.slotDate} at {b.slotTimeWindow}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            Agent: <strong className="text-[#000004]">{property.agent.fullName}</strong> ({formatNigerianPhone(rawPhone)})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-emerald-100">
                        <a
                          href={`tel:${rawPhone.replace(/[^0-9+]/g, '')}`}
                          className="w-full sm:w-auto py-2.5 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap min-w-0"
                          title="Call Agent Directly"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Call Agent</span>
                        </a>

                        <a
                          href={`https://wa.me/${property.agent.whatsapp}?text=Hello%20${encodeURIComponent(property.agent.fullName)},%20I%20have%20a%20confirmed%20inspection%20pass%20(${b.id})%20for%20${encodeURIComponent(property.title)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto py-2.5 px-3 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-semibold text-emerald-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap min-w-0"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyPhone(b.id, rawPhone)}
                          className="w-full sm:w-auto py-2.5 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FCF9F5] text-xs font-semibold text-[#000004] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap min-w-0"
                          title="Copy phone number"
                        >
                          {copiedPhoneId === b.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700 truncate">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                              <span className="truncate">Copy Phone</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={onOpenMyPasses}
                          className="w-full sm:w-auto py-2.5 px-3 rounded-lg border border-[#342A21]/30 bg-[#342A21]/5 hover:bg-[#342A21]/10 text-xs font-bold text-[#342A21] transition-colors cursor-pointer whitespace-nowrap min-w-0 flex items-center justify-center"
                        >
                          <span className="truncate">View Pass</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Inspection Requests Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-[#000004]">
                  Pending Booking Requests (Awaiting Agent Acceptance)
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5 leading-relaxed">
                  Your request has been submitted directly to the verified agent. Once accepted, full details unlock instantly.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] shrink-0 self-start sm:self-auto">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB] text-xs text-[#70798C]">
                No pending requests. When you book a time slot on an agent listing, it appears here.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((b) => {
                  const property = listings.find((p) => p.id === b.propertyId) || listings[0];
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 shrink-0">
                            Awaiting Agent
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-[#000004] line-clamp-2 break-words leading-snug">
                          {property.title}
                        </h4>
                        <div className="text-xs text-[#70798C] truncate">
                          Assigned Agent: <strong className="text-[#000004]">{property.agent.fullName}</strong> ({property.agent.agencyName})
                        </div>
                        <div className="text-xs text-[#342A21] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Requested Window: {b.slotDate} at {b.slotTimeWindow}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
                        <button
                          onClick={() => onCancelBooking(b.id)}
                          className="w-full sm:w-auto py-2.5 px-3.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-600 transition-colors cursor-pointer text-center whitespace-nowrap"
                        >
                          Cancel Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Standby Waitlist Queue (5/5 Limit Reached) */}
          <div className="bg-white rounded-2xl border border-[#F0544F]/30 p-3.5 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-[#000004]">
                  My Standby Waitlist Queue
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5 leading-relaxed">
                  Agent window currently at maximum 5/5 capacity. If an applicant cancels, your position advances automatically.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F0544F]/10 text-[#F0544F] shrink-0 self-start sm:self-auto">
                {queuedRequests.length} on Waitlist
              </span>
            </div>

            {queuedRequests.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB] text-xs text-[#70798C]">
                You are not currently in any standby queues.
              </div>
            ) : (
              <div className="space-y-3">
                {queuedRequests.map((b) => {
                  const property = listings.find((p) => p.id === b.propertyId) || listings[0];
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-[#F0544F]/20 bg-[#F0544F]/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#F0544F] text-white text-[11px] font-bold shrink-0">
                            Queue Position #{b.queuePosition || 1}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-[#000004] line-clamp-2 break-words leading-snug">
                          {property.title}
                        </h4>
                        <div className="text-xs text-[#70798C] truncate">
                          Locked Window: {b.slotDate} • {b.slotTimeWindow} • Agent: {property.agent.fullName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0544F]/20">
                        <button
                          onClick={() => onCancelBooking(b.id)}
                          className="w-full sm:w-auto py-2.5 px-3.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-xs font-semibold text-[#70798C] transition-colors cursor-pointer text-center whitespace-nowrap"
                        >
                          Leave Queue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AGENT RENTAL INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#342A21]/5 border border-[#342A21]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#342A21] shrink-0" />
              <span className="text-[#000004] font-medium leading-relaxed">
                Browsing <strong>{listings.length} apartments</strong> uploaded by partner agents.
              </span>
            </div>
            <button
              onClick={onSwitchToFeed}
              className="text-[#342A21] font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>Switch to Snap Feed View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((prop) => {
              const isSaved = savedPropertyIds.includes(prop.id);
              const userHasBooking = bookings.some((b) => b.propertyId === prop.id);

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col hover:border-[#342A21]/50 transition-colors"
                >
                  <div className="h-48 relative bg-slate-900 overflow-hidden">
                    <img
                      src={prop.media[0]?.poster || prop.media[0]?.url || DEFAULT_FALLBACK_IMAGE}
                      alt={prop.title}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[11px] font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-white" />
                      <span>{prop.city}</span>
                    </div>

                    <button
                      onClick={() => onToggleSaveProperty(prop.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                      title={isSaved ? 'Remove from saved' : 'Save property'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-display text-sm font-bold">
                      {formatNaira(prop.fees.baseRent)}/{prop.fees.rentPeriod}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#000004] line-clamp-2 break-words leading-snug">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#70798C] line-clamp-1 mt-0.5">
                        {prop.neighborhood} • {prop.propertyType} • {prop.bedrooms} Bed
                      </p>
                    </div>

                    {/* Agent attribution banner */}
                    <div className="p-2.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img
                          src={prop.agent.avatarUrl}
                          alt={prop.agent.fullName}
                          className="w-6 h-6 rounded-full object-cover border border-[#342A21] shrink-0"
                        />
                        <div className="text-[11px] min-w-0 flex-1 truncate">
                          <span className="font-bold text-[#000004]">{prop.agent.fullName}</span>
                          <span className="text-[#70798C] ml-1">({prop.agent.agencyName})</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                        {prop.agent.rating}★
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                      <span className="text-[#70798C] text-[11px] whitespace-nowrap">
                        {prop.inspectionSlots.length} Slots Available
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => onOpenBookingModal(prop)}
                          className="w-full sm:w-auto py-2 sm:py-1.5 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer whitespace-nowrap text-center"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{userHasBooking ? 'Manage Booking' : 'Book Free Slot'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED PROPERTIES */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedListings.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
              <Bookmark className="w-8 h-8 text-[#70798C]/60 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#000004]">No saved apartments yet</h4>
              <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto">
                Click the bookmark icon on any agent rental to save it here for quick comparison and future bookings.
              </p>
              <button
                onClick={() => setActiveTab('inventory')}
                className="mt-3 py-2.5 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
              >
                Browse Agent Apartments
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedListings.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col"
                >
                  <div className="h-44 relative bg-slate-900 overflow-hidden">
                    <img
                      src={prop.media[0]?.poster || prop.media[0]?.url || DEFAULT_FALLBACK_IMAGE}
                      alt={prop.title}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[11px] font-medium">
                      {prop.city}
                    </div>
                    <button
                      onClick={() => onToggleSaveProperty(prop.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    </button>
                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-display text-sm font-bold">
                      {formatNaira(prop.fees.baseRent)}/{prop.fees.rentPeriod}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#000004] line-clamp-2 break-words leading-snug">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#70798C] mt-0.5 line-clamp-1">
                        Uploaded by {prop.agent.fullName} • {prop.neighborhood}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                      <button
                        onClick={() => onToggleSaveProperty(prop.id)}
                        className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
                      >
                        Remove
                      </button>

                      <button
                        onClick={() => onOpenBookingModal(prop)}
                        className="py-2 sm:py-1.5 px-3.5 rounded-lg bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer whitespace-nowrap"
                      >
                        Book Inspection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
