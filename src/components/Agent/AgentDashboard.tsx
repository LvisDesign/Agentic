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
import { PropertyListing, BookingRecord, AgentProfile, UserProfile } from '../../types/marketplace';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { CreateListingModal } from './CreateListingModal';

interface AgentDashboardProps {
  currentUser?: UserProfile;
  listings: PropertyListing[];
  bookings: BookingRecord[];
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onListingCreated: (listing: PropertyListing) => void;
  onSwitchToSeeker?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  currentUser,
  listings,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onListingCreated,
  onSwitchToSeeker,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'listings'>('requests');

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
    agencyName: currentUser.agencyName || 'Apex Real Estate Ltd',
    isVerified: true,
    cacNumber: currentUser.cacNumber || 'RC-1849204',
    rating: 4.9,
    reviewCount: 42,
    completedInspections: 138,
    responseTime: 'Responds within 10 mins',
    phone: currentUser.phone || '0803 555 1234',
    whatsapp: currentUser.whatsapp || currentUser.phone || '2348035551234',
    avatarUrl: currentUser.avatarUrl || defaultAgent.avatarUrl,
  } : {
    ...defaultAgent,
    avatarUrl: currentUser?.avatarUrl || defaultAgent.avatarUrl,
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
            </div>
            <p className="text-xs text-[#70798C] mt-0.5">
              {agentProfile.agencyName} • CAC: {agentProfile.cacNumber} • Rating {agentProfile.rating}★
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
          <span className="text-[10px] text-emerald-600 font-medium">Total inspections scheduled</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#70798C]">
            <span>Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#000004] mt-1">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-[#70798C]">Waiting for your reply</span>
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
            {listings.length}
          </div>
          <span className="text-[10px] text-[#70798C]">Live on platform</span>
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
          className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'listings'
              ? 'border-[#000004] text-[#000004]'
              : 'border-transparent text-[#70798C] hover:text-[#000004]'
          }`}
        >
          <span>My Properties ({listings.length})</span>
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

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => onAcceptBooking(b.id)}
                          className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept Booking
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
                      {prop.inspectionSlots.length} Time Slots
                    </span>
                    <button
                      onClick={onSwitchToSeeker}
                      className="text-[#342A21] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>View in Feed</span>
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
