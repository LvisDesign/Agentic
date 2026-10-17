import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard,
  UserCheck,
  Info,
  Lock
} from 'lucide-react';
import { PropertyListing, InspectionSlot, BookingRecord, BookingStatus } from '../../types/marketplace';
import { formatNaira, generateBookingRef } from '../../utils/formatters';
import { QueueStatusBadge } from './QueueStatusBadge';
import { InspectionPassCard } from '../Pass/InspectionPassCard';

interface InspectionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: PropertyListing;
  existingBooking?: BookingRecord;
  onBookSlot: (booking: BookingRecord) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  onSimulateAgentAccept?: (bookingId: string) => void;
}

export const InspectionBookingModal: React.FC<InspectionBookingModalProps> = ({
  isOpen,
  onClose,
  listing,
  existingBooking,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
}) => {
  // Select initial slot
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    listing.inspectionSlots[0]?.id || ''
  );
  const [applicantName, setApplicantName] = useState('Chinedu Okafor');
  const [applicantPhone, setApplicantPhone] = useState('0803 891 0293');
  const [applicantEmail, setApplicantEmail] = useState('');

  if (!isOpen) return null;

  const selectedSlot = listing.inspectionSlots.find((s) => s.id === selectedSlotId) || listing.inspectionSlots[0];
  const isSlotFull = selectedSlot ? selectedSlot.bookedCount >= selectedSlot.capacityLimit : false;
  const currentWaitlistPosition = selectedSlot ? selectedSlot.waitlistCount + 1 : 1;

  // Check if current user already has an active booking for this property
  const activeBooking = existingBooking;

  const handleInitiateBooking = () => {
    if (!selectedSlot) return;

    if (isSlotFull) {
      // Put on QUEUED waitlist (Free)
      const newBooking: BookingRecord = {
        id: generateBookingRef(listing.city),
        propertyId: listing.id,
        slotId: selectedSlot.id,
        slotTimeWindow: selectedSlot.timeWindow,
        slotDate: selectedSlot.date,
        applicantName,
        applicantPhone,
        applicantEmail,
        status: 'QUEUED',
        queuePosition: currentWaitlistPosition,
        inspectionFeeAmount: 0,
        createdAt: new Date().toISOString(),
      };
      onBookSlot(newBooking);
    } else {
      // Direct slot booking -> REQUEST_SUBMITTED (Free)
      const newBooking: BookingRecord = {
        id: generateBookingRef(listing.city),
        propertyId: listing.id,
        slotId: selectedSlot.id,
        slotTimeWindow: selectedSlot.timeWindow,
        slotDate: selectedSlot.date,
        applicantName,
        applicantPhone,
        applicantEmail,
        status: 'REQUEST_SUBMITTED',
        inspectionFeeAmount: 0,
        createdAt: new Date().toISOString(),
      };
      onBookSlot(newBooking);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004]">
              Book Inspection
            </h3>
            <p className="text-xs text-[#70798C] mt-0.5 line-clamp-1">
              {listing.title} • {listing.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E5E7EB]/60 hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* STATE 1: UNLOCKED FREE INSPECTION PASS */}
          {activeBooking && (activeBooking.status === 'CONFIRMED_UNLOCKED' || activeBooking.status === 'ACCEPTED_PENDING_PAYMENT') && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your free physical inspection pass is active and confirmed!</span>
              </div>
              <InspectionPassCard
                booking={activeBooking}
                listing={listing}
                onClose={onClose}
              />
            </div>
          )}

          {/* STATE 3: QUEUED IN STANDBY WAITLIST */}
          {activeBooking && activeBooking.status === 'QUEUED' && (
            <div className="p-5 rounded-2xl bg-[#FCF9F5] border-2 border-[#F0544F]/40 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F0544F]/10 text-[#F0544F] flex items-center justify-center mx-auto animate-pulse">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F0544F] bg-[#F0544F]/10 px-3 py-1 rounded-full">
                  You are #{activeBooking.queuePosition || 1} on Standby Queue
                </span>
                <h4 className="font-display text-xl font-bold text-[#000004] mt-2">
                  Agent Window Full (5/5 Limit)
                </h4>
                <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto leading-relaxed">
                  To ensure agents don't overcrowd showings or waste house seekers' time, this agent is restricted to 5 bookings for {activeBooking.slotTimeWindow}. You are locked in as standby applicant <span className="font-bold text-[#000004]">#{activeBooking.queuePosition || 1}</span>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-left text-xs space-y-1.5">
                <div className="text-xs font-semibold text-[#000004] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#342A21]" />
                  Automatic Queue Advancement Policy:
                </div>
                <p className="text-xs text-[#70798C] leading-normal">
                  If an active applicant drops their reservation, your standby position instantly upgrades to <strong>Confirmed Pass</strong> with immediate direct phone contact with the agent.
                </p>
              </div>

              {/* Live Queue Status Footer */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#70798C]">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live queue monitoring active
                </span>
                <span>Automatic SMS & In-App Alert</span>
              </div>
            </div>
          )}

          {/* STATE 4: REQUEST SUBMITTED (WAITING FOR AGENT) */}
          {activeBooking && activeBooking.status === 'REQUEST_SUBMITTED' && (
            <div className="p-5 rounded-2xl bg-white border border-[#342A21]/30 shadow-md space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#342A21]/10 text-[#342A21] flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#342A21] bg-[#342A21]/10 px-2.5 py-1 rounded-full">
                  Free Booking Request Sent to Agent
                </span>
                <h4 className="font-display text-xl font-bold text-[#000004] mt-2">
                  Awaiting Agent Acceptance
                </h4>
                <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto">
                  Your reservation request for <span className="font-bold text-[#000004]">{activeBooking.slotTimeWindow}</span> has been dispatched to {listing.agent.fullName}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#70798C]">Applicant:</span>
                  <span className="font-semibold text-[#000004]">{activeBooking.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#70798C]">Agent Response Avg:</span>
                  <span className="font-semibold text-[#342A21]">{listing.agent.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#70798C]">Booking Fee:</span>
                  <span className="font-bold text-emerald-600">FREE (₦0)</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                  <span className="text-[#70798C] flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3 text-[#342A21]" />
                    Agent Phone Number:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                    Revealed on Confirmation
                  </span>
                </div>
              </div>

              {/* Locked Contact Notice Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#000004]">
                  <Lock className="w-3.5 h-3.5 text-[#342A21]" />
                  <span>Contact Details Protected</span>
                </div>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  {listing.agent.fullName}'s direct phone number will be <strong>revealed only when the agent confirms this booking</strong> so you can call directly or copy their number to coordinate the meeting point.
                </p>
              </div>

              {/* Live Dispatch Footer */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#70798C]">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Request Dispatched to {listing.agent.fullName}
                </span>
                <span>Direct SMS confirmation pending</span>
              </div>
            </div>
          )}

          {/* INITIAL STATE: SELECT SLOT & FORM */}
          {!activeBooking && (
            <div className="space-y-4">
              {/* Step 1: Select Available Window */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#000004] block">
                  Select Inspection Time
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {listing.inspectionSlots.map((slot) => {
                    const isSelected = slot.id === selectedSlotId;
                    const isFull = slot.bookedCount >= slot.capacityLimit;
                    const remaining = Math.max(0, slot.capacityLimit - slot.bookedCount);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? isFull
                              ? 'border-[#F0544F] bg-[#F0544F]/5 ring-1 ring-[#F0544F]'
                              : 'border-[#342A21] bg-[#342A21]/5 ring-1 ring-[#342A21]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#70798C]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#000004] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#342A21]" />
                            {slot.timeWindow}
                          </span>
                          <span className="text-[11px] text-[#70798C]">
                            {slot.date}
                          </span>
                        </div>

                        <div className="text-[11px]">
                          {isFull ? (
                            <span className="font-semibold text-[#F0544F]">Full • Waitlist</span>
                          ) : (
                            <span className="text-[#70798C]">
                              {remaining} spot{remaining === 1 ? '' : 's'} available
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isSlotFull && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>This time slot is full. Submitting will add you to the standby waitlist (#{currentWaitlistPosition}).</span>
                  </div>
                )}
              </div>

              {/* Step 2: Contact Inputs */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <label className="text-xs font-bold text-[#000004] block">
                  Your Contact Details
                </label>

                <div>
                  <label className="text-xs text-[#70798C] block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Chinedu Okafor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#342A21]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#70798C] block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. 0803 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#342A21]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#70798C] block mb-1">
                      Email Address <span className="text-[10px] text-[#70798C]/70">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="e.g. you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>

                {/* Privacy reassurance note */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] text-xs text-[#70798C]">
                  <Lock className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                  <span>The agent's direct phone number will be revealed once confirmed.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInitiateBooking}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                    isSlotFull
                      ? 'bg-[#F0544F] hover:bg-[#d9433e]'
                      : 'bg-[#000004] hover:bg-[#1f2937]'
                  }`}
                >
                  {isSlotFull ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Join Standby Waitlist (#{currentWaitlistPosition})</span>
                    </>
                  ) : (
                    <>
                      <span>Book Inspection</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
