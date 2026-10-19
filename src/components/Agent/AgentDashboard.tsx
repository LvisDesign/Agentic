import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { PropertyListing, BookingRecord, AgentProfile } from '../../types/marketplace';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { CreateListingModal } from './CreateListingModal';

interface AgentDashboardProps {
  listings: PropertyListing[];
  bookings: BookingRecord[];
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onListingCreated: (listing: PropertyListing) => void;
  onSwitchToSeeker: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  listings,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onListingCreated,
  onSwitchToSeeker,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings'>('requests');

  // Primary Agent: Chief Oghenetega Macaulay
  const agentProfile: AgentProfile = listings[0]?.agent || {
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

  // Compute metrics
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED_UNLOCKED')
    .reduce((acc, curr) => acc + curr.inspectionFeeAmount, 85000); // 85k baseline + live confirmed

  const pendingRequests = bookings.filter(
    (b) => b.status === 'REQUEST_SUBMITTED'
  );

  const queuedRequests = bookings.filter(
    (b) => b.status === 'QUEUED'
  );

  const acceptedOrPaid = bookings.filter(
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] text-xs font-semibold">
                Partner
              </span>
            </div>
            <p className="text-xs text-[#70798C] mt-0.5">
              {agentProfile.agencyName} • CAC: {agentProfile.cacNumber} • Rating {agentProfile.rating}★
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#70798C]">
              <span className="font-mono text-[#000004] font-semibold">{formatNigerianPhone(agentProfile.phone)}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Active Dispatch Mode</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Rental</span>
          </button>

          <button
            onClick={onSwitchToSeeker}
            className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#000004] transition-colors"
          >
            Explore Feed
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Inspections Booked</span>
            <CalendarCheck className="w-4 h-4 text-[#342A21]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {agentProfile.completedInspections + acceptedOrPaid.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">100% Free Seeker Passes</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C]">Requires Agent Action</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Standby Queue</span>
            <Users className="w-4 h-4 text-[#F0544F]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#F0544F] mt-1">
            {queuedRequests.length}
          </div>
          <span className="text-[10px] text-[#F0544F]">Capped at 5 Seekers/Window</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Active Listings</span>
            <Building className="w-4 h-4 text-[#342A21]" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {listings.length}
          </div>
          <span className="text-[10px] text-[#70798C]">Delta State Network</span>
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
          <span>Inspection Queue & Requests</span>
          {(pendingRequests.length > 0 || queuedRequests.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#000004] text-white">
              {pendingRequests.length + queuedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'listings'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>Published Rental Inventory ({listings.length})</span>
        </button>
      </div>

      {/* TAB 1: INSPECTION QUEUE & REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Section: Pending Direct Booking Requests */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#000004]">
                  Incoming Booking Approvals (Strict 5-Slot Cap)
                </h3>
                <p className="text-xs text-[#70798C]">
                  You are restricted to strictly 5 bookings per window to prevent overcrowding and ensure you never waste house seekers' time.
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
                  Incoming property inspection reservations from verified seekers will appear here in real time.
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
                            Pass: {b.id}
                          </span>
                        </div>
                        <div className="text-xs text-[#70798C]">
                          Property: <strong className="text-[#000004]">{property.title}</strong>
                        </div>
                        <div className="text-xs text-[#342A21] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Requested Window: {b.slotDate} at {b.slotTimeWindow}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => onAcceptBooking(b.id)}
                          className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirm & Reveal Contact
                        </button>
                        <button
                          onClick={() => onRejectBooking(b.id)}
                          className="py-2 px-3 rounded-lg border border-[#E5E7EB] hover:bg-slate-100 text-xs font-medium text-[#70798C] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
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
                <h3 className="font-display text-base font-bold text-[#000004] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F0544F] animate-pulse" />
                  Standby Queue (Limit Reached: 5/5)
                </h3>
                <p className="text-xs text-[#70798C]">
                  Seekers waiting for a dropped or canceled slot. Automatically promoted in sequence.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F0544F]/10 text-[#F0544F]">
                {queuedRequests.length} on Queue
              </span>
            </div>

            {queuedRequests.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
                <p className="text-xs text-[#70798C]">
                  No applicants currently on standby waitlist.
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
                          Queue Position #{b.queuePosition || 1}
                        </span>
                        <span className="font-bold text-sm text-[#000004]">
                          {b.applicantName}
                        </span>
                      </div>
                      <div className="text-xs text-[#70798C] mt-1">
                        Locked Window: {b.slotDate} • {b.slotTimeWindow}
                      </div>
                    </div>

                    <button
                      onClick={() => onAcceptBooking(b.id)}
                      className="w-full sm:w-auto py-2 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      Grant Early Acceptance
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Confirmed Inspection Passes */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <h3 className="font-display text-base font-bold text-[#000004] mb-1">
              Active Confirmed Inspection Passes
            </h3>
            <p className="text-xs text-[#70798C] mb-4">
              Free inspection reservation confirmed. Your direct phone number has been provided to the applicant to coordinate the showing.
            </p>

            {acceptedOrPaid.length === 0 ? (
              <div className="p-6 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB] text-xs text-[#70798C]">
                No unlocked passes yet. Accept a booking request to generate a confirmed inspection pass!
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
                          PASS CONFIRMED
                        </span>
                      </div>
                      <div className="text-[#70798C] mt-0.5">
                        Pass ID: <span className="font-mono text-[#000004] font-medium">{b.id}</span> • {b.slotDate} at {b.slotTimeWindow}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-sm font-bold text-emerald-600">
                        FREE PASS
                      </div>
                      <div className="text-[10px] text-[#70798C]">Verified Seeker</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col"
              >
                <div className="h-44 relative">
                  <img
                    src={prop.media[0]?.url}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[11px] font-medium">
                    {prop.city}, Delta
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-display text-sm font-bold">
                    {formatNaira(prop.fees.baseRent)}/{prop.fees.rentPeriod}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#000004] line-clamp-1">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-[#70798C] line-clamp-1">
                      {prop.neighborhood} • {prop.propertyType}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="text-[#70798C]">
                      Slots: {prop.inspectionSlots.length} Windows
                    </span>
                    <button
                      onClick={onSwitchToSeeker}
                      className="text-[#342A21] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Preview in Feed</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListingCreated={onListingCreated}
      />
    </div>
  );
};
