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
  const [applicantEmail, setApplicantEmail] = useState('chinedu.okafor@gmail.com');

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
            <span className="text-xs font-semibold text-[#275DAD] uppercase tracking-wider">
              {listing.city}, Delta State
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004] mt-0.5 line-clamp-1">
              Book Physical Property Inspection
            </h3>
            <p className="text-xs text-[#70798C] mt-0.5">
              Live Concurrency Cap: Strictly 5 persons per window
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E5E7EB]/60 hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors"
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
                  Slot Cap Reached (5/5 Limit)
                </h4>
                <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto leading-relaxed">
                  The {activeBooking.slotTimeWindow} window is currently filled to maximum capacity. You are locked in as standby applicant <span className="font-bold text-[#000004]">#{activeBooking.queuePosition || 1}</span>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-left text-xs space-y-1.5">
                <div className="text-xs font-semibold text-[#000004] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#275DAD]" />
                  Automatic Queue Advancement Policy:
                </div>
                <p className="text-xs text-[#70798C] leading-normal">
                  If an active applicant drops their reservation, your standby position instantly upgrades to <strong>Confirmed Pass</strong> with immediate street address access.
                </p>
              </div>

              {/* Developer / Demo Simulator Helper */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    if (onSimulateAgentAccept) {
                      onSimulateAgentAccept(activeBooking.id);
                    } else {
                      onUpdateBooking({
                        ...activeBooking,
                        status: 'CONFIRMED_UNLOCKED',
                        confirmedAt: new Date().toISOString(),
                      });
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>[Demo] Simulate Slot Freeing & Auto-Confirm Pass</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: REQUEST SUBMITTED (WAITING FOR AGENT) */}
          {activeBooking && activeBooking.status === 'REQUEST_SUBMITTED' && (
            <div className="p-5 rounded-2xl bg-white border border-[#275DAD]/30 shadow-md space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#275DAD]/10 text-[#275DAD] flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#275DAD] bg-blue-50 px-2.5 py-1 rounded-full">
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
                  <span className="font-semibold text-[#275DAD]">{listing.agent.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#70798C]">Booking Fee:</span>
                  <span className="font-bold text-emerald-600">FREE (₦0)</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                  <span className="text-[#70798C] flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3 text-[#275DAD]" />
                    Agent Contact & Street Address:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                    Revealed on Confirmation
                  </span>
                </div>
              </div>

              {/* Locked Contact Notice Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#000004]">
                  <Lock className="w-3.5 h-3.5 text-[#275DAD]" />
                  <span>Contact Details Protected</span>
                </div>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  {listing.agent.fullName}'s direct phone number, 1-click WhatsApp link, complete physical address, and gate access code will be <strong>revealed only when the agent confirms this booking</strong>.
                </p>
              </div>

              {/* Developer / Demo Simulator Helper */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    if (onSimulateAgentAccept) {
                      onSimulateAgentAccept(activeBooking.id);
                    } else {
                      onUpdateBooking({
                        ...activeBooking,
                        status: 'CONFIRMED_UNLOCKED',
                        confirmedAt: new Date().toISOString(),
                      });
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>[Demo] Simulate Agent Accepts & Confirms Pass</span>
                </button>
                <p className="text-[11px] text-[#70798C] mt-1.5">
                  Tip: You can also switch to <strong>Agent Portal</strong> at the top to accept this request live!
                </p>
              </div>
            </div>
          )}

          {/* INITIAL STATE: SELECT SLOT & FORM */}
          {!activeBooking && (
            <div className="space-y-5">
              {/* Step 1: Select Available Window */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center justify-between">
                  <span>1. Select Inspection Window</span>
                  <span className="text-[11px] text-[#275DAD] normal-case font-medium">
                    Strict Concurrency Limit: 5/hr
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {listing.inspectionSlots.map((slot) => {
                    const isSelected = slot.id === selectedSlotId;
                    const isFull = slot.bookedCount >= slot.capacityLimit;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? isFull
                              ? 'border-[#F0544F] bg-[#F0544F]/5 ring-1 ring-[#F0544F]'
                              : 'border-[#275DAD] bg-blue-50/20 ring-1 ring-[#275DAD]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#70798C]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-[#000004] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#275DAD]" />
                            {slot.timeWindow}
                          </span>
                          <span className="text-[10px] font-medium text-[#70798C]">
                            {slot.date}
                          </span>
                        </div>

                        <div className="mt-1">
                          <QueueStatusBadge slot={slot} size="sm" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status explanation strip */}
              {isSlotFull ? (
                <div className="p-3 rounded-xl bg-[#F0544F]/10 border border-[#F0544F]/30 text-xs text-[#000004] flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#F0544F]">Capacity Cap Active: </span>
                    All 5 official slots for this hour are currently booked. Booking will place you at{' '}
                    <strong>Standby Position #{currentWaitlistPosition}</strong>. If an active slot cancels, you advance automatically!
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[#275DAD]/20 text-xs text-[#000004] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#275DAD] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#275DAD]">Direct Slot Available: </span>
                    {5 - (selectedSlot?.bookedCount || 0)} opening(s) remaining. Contact details and physical street address will be revealed only when the agent confirms your booking.
                  </div>
                </div>
              )}

              {/* Step 2: Applicant Contact Inputs */}
              <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block">
                  2. Applicant Contact Credentials
                </label>

                <div>
                  <label className="text-xs text-[#70798C] block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Chinedu Okafor"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#275DAD]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#70798C] block mb-1">WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. 0803 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#275DAD]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#70798C] block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="e.g. you@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] focus:outline-none focus:border-[#275DAD]"
                      required
                    />
                  </div>
                </div>

                {/* Privacy Protection Notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#70798C] flex items-start gap-2.5 mt-2">
                  <Lock className="w-4 h-4 text-[#275DAD] shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="text-[#000004]">Privacy Protection:</strong> Agent contact details (direct phone number, WhatsApp link, and physical street address) are protected and will <strong>only be revealed when the agent confirms your inspection booking</strong>.
                  </div>
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
                      <span>Join Standby Waitlist (#{currentWaitlistPosition} in line)</span>
                    </>
                  ) : (
                    <>
                      <span>Reserve Free Inspection Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#70798C] mt-2">
                  100% Free Booking • Contact details revealed upon agent confirmation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
