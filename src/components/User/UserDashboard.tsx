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
  MessageSquare,
  AlertCircle,
  XCircle,
  UserCheck,
  Copy,
  Check
} from 'lucide-react';
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
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-20 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
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
                    <ShieldCheck className="w-3 h-3" />
                    Verified Partner Agent
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <UserCheck className="w-3 h-3" />
                      Verified Tenant
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Tenant Account
                    </span>
                  </>
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
                  ? `${currentUser.agencyName || 'Partner Agency'} • Agent ID: ${currentUser.id} • Operating in ${currentUser.operatingCity || currentUser.city || 'Delta State'}`
                  : `${currentUser.state || 'Delta State'} Tenant • Member ID: ${currentUser.id} • Looking in ${currentUser.city || 'Delta'}`
                : 'Browsing rentals as guest • Create an account to book verified inspection appointments'}
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
                Tenant Access: Direct Browsing of Verified Agent Rentals
              </h4>
              <p className="text-[11px] text-[#70798C] mt-0.5">
                You are signed in as a tenant. You can book as many property inspections as you want across Delta State! Only agents are restricted to 5 bookings per window to prevent overcrowding and ensure they never waste your time.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Confirmed Inspections</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {confirmedPasses.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            100% Free Micro-Clearance
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C]">
            Awaiting Agent Response
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Standby Queue</span>
            <Users className="w-4 h-4 text-[#F0544F]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#F0544F] mt-1">
            {queuedRequests.length}
          </div>
          <span className="text-[10px] text-[#F0544F]">
            Auto-Promoting Waitlist
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Agent Inventory</span>
            <Building className="w-4 h-4 text-[#342A21]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {listings.length}
          </div>
          <span className="text-[10px] text-[#70798C]">
            Uploaded by Verified Agents
          </span>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] mb-6">
        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
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
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>Available Agent Apartments ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
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
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Confirmed & Unlocked Inspection Passes
                </h3>
                <p className="text-xs text-[#70798C]">
                  Direct agent dispatch confirmed. Agent direct phone number unlocked — call directly or copy number to coordinate.
                </p>
              </div>
              <button
                onClick={onOpenMyPasses}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Inspections ({confirmedPasses.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
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
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 pr-0 md:pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[#000004] truncate">
                            {property.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                            CONFIRMED & UNLOCKED
                          </span>
                          <span className="text-[10px] font-mono text-[#70798C] shrink-0">
                            Pass: {b.id}
                          </span>
                        </div>
                        <div className="text-xs text-[#70798C] flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                          <span className="truncate">Landmark / Area: <strong className="text-[#000004]">{property.neighborhood}, {property.city}</strong></span>
                        </div>
                        <div className="text-xs text-[#70798C] flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[#342A21] font-medium shrink-0">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {b.slotDate} at {b.slotTimeWindow}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            Agent: <strong className="text-[#000004]">{property.agent.fullName}</strong> ({formatNigerianPhone(rawPhone)})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                        <a
                          href={`tel:${rawPhone.replace(/[^0-9+]/g, '')}`}
                          className="flex-1 sm:flex-none py-2 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
                          title="Call Agent Directly"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call Agent</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyPhone(b.id, rawPhone)}
                          className="flex-1 sm:flex-none py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FCF9F5] text-xs font-semibold text-[#000004] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedPhoneId === b.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#342A21]" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={onOpenMyPasses}
                          className="flex-1 sm:flex-none py-2 px-3 rounded-lg border border-[#342A21]/30 bg-[#342A21]/5 hover:bg-[#342A21]/10 text-xs font-bold text-[#342A21] transition-colors cursor-pointer"
                        >
                          View Pass
                        </button>

                        <a
                          href={`https://wa.me/${property.agent.whatsapp}?text=Hello%20${encodeURIComponent(property.agent.fullName)},%20I%20have%20a%20confirmed%20inspection%20pass%20(${b.id})%20for%20${encodeURIComponent(property.title)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-semibold text-emerald-800 transition-colors flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Inspection Requests Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004]">
                  Pending Booking Requests (Awaiting Agent Acceptance)
                </h3>
                <p className="text-xs text-[#70798C]">
                  Your request has been submitted directly to the verified agent. Once accepted, full details unlock instantly.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21]">
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
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-0 sm:pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[#000004] truncate">
                            {property.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 shrink-0">
                            Awaiting Agent
                          </span>
                        </div>
                        <div className="text-xs text-[#70798C] truncate">
                          Assigned Agent: <strong className="text-[#000004]">{property.agent.fullName}</strong> ({property.agent.agencyName})
                        </div>
                        <div className="text-xs text-[#342A21] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Requested Window: {b.slotDate} at {b.slotTimeWindow}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <button
                          onClick={() => onCancelBooking(b.id)}
                          className="flex-1 sm:flex-none py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-xs font-semibold text-rose-600 transition-colors cursor-pointer whitespace-nowrap"
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
          <div className="bg-white rounded-2xl border border-[#F0544F]/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004]">
                  My Standby Waitlist Queue
                </h3>
                <p className="text-xs text-[#70798C]">
                  Agent window currently at maximum 5/5 capacity. If an applicant cancels, your position advances automatically.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F0544F]/10 text-[#F0544F]">
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
                      className="p-4 rounded-xl border border-[#F0544F]/20 bg-[#F0544F]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-0 sm:pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#F0544F] text-white text-[11px] font-bold shrink-0">
                            Queue Position #{b.queuePosition || 1}
                          </span>
                          <span className="font-bold text-sm text-[#000004] truncate">
                            {property.title}
                          </span>
                        </div>
                        <div className="text-xs text-[#70798C] mt-1 truncate">
                          Locked Window: {b.slotDate} • {b.slotTimeWindow} • Agent: {property.agent.fullName}
                        </div>
                      </div>

                      <button
                        onClick={() => onCancelBooking(b.id)}
                        className="w-full sm:w-auto shrink-0 py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-xs font-semibold text-[#70798C] transition-colors cursor-pointer whitespace-nowrap mt-2 sm:mt-0"
                      >
                        Leave Queue
                      </button>
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
          <div className="p-4 rounded-xl bg-[#342A21]/5 border border-[#342A21]/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#342A21]" />
              <span className="text-[#000004] font-medium">
                Browsing <strong>{listings.length} verified apartments</strong> uploaded by registered Delta State agents.
              </span>
            </div>
            <button
              onClick={onSwitchToFeed}
              className="text-[#342A21] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                      <span>{prop.city}, Delta</span>
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

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#000004] line-clamp-1">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#70798C] line-clamp-1 mt-0.5">
                        {prop.neighborhood} • {prop.propertyType} • {prop.bedrooms} Bed
                      </p>
                    </div>

                    {/* Agent attribution banner */}
                    <div className="p-2.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={prop.agent.avatarUrl}
                          alt={prop.agent.fullName}
                          className="w-6 h-6 rounded-full object-cover border border-[#342A21]"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-[#000004]">{prop.agent.fullName}</span>
                          <span className="text-[#70798C] ml-1">({prop.agent.agencyName})</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {prop.agent.rating}★
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="text-[#70798C] text-[11px] whitespace-nowrap">
                        {prop.inspectionSlots.length} Slots Available
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenBookingModal(prop)}
                          className="py-1.5 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
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
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
              <Bookmark className="w-8 h-8 text-[#70798C]/60 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#000004]">No saved apartments yet</h4>
              <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto">
                Click the bookmark icon on any agent rental to save it here for quick comparison and future bookings.
              </p>
              <button
                onClick={() => setActiveTab('inventory')}
                className="mt-3 py-2 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
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
                      {prop.city}, Delta
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

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#000004] line-clamp-1">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#70798C]">
                        Uploaded by {prop.agent.fullName} • {prop.neighborhood}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      <button
                        onClick={() => onToggleSaveProperty(prop.id)}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>

                      <button
                        onClick={() => onOpenBookingModal(prop)}
                        className="py-1.5 px-3 rounded-lg bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
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
