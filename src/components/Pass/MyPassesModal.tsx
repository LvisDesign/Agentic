import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Phone, Copy, Check } from 'lucide-react';
import { BookingRecord, PropertyListing } from '../../types/marketplace';
import { InspectionPassCard } from './InspectionPassCard';
import { formatNigerianPhone } from '../../utils/formatters';
import { ModalPortal } from '../UI/ModalPortal';

interface MyPassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  listings: PropertyListing[];
  onOpenBookingModal: (listing: PropertyListing) => void;
}

export const MyPassesModal: React.FC<MyPassesModalProps> = ({
  isOpen,
  onClose,
  bookings,
  listings,
  onOpenBookingModal,
}) => {
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyPhone = (bookingId: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(bookingId);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div>
            <h3 className="font-display text-lg font-bold text-[#000004]">
              House Inspections
            </h3>
            <p className="text-xs text-[#70798C]">
              {bookings.length} active inspection(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
              <p className="text-xs text-[#70798C]">You have not booked any house inspections yet.</p>
            </div>
          ) : (
            bookings.map((b) => {
              const listing = listings.find((p) => p.id === b.propertyId) || listings[0];

              if (b.status === 'CONFIRMED_UNLOCKED') {
                const rawPhone = listing.agent.phone;
                return (
                  <div
                    key={b.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shadow-xs overflow-hidden"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                          CONFIRMED
                        </span>
                        <span className="text-xs text-[#70798C] shrink-0 font-medium">({listing.city})</span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-[#000004] line-clamp-2 break-words leading-snug">
                        {listing.title}
                      </h4>

                      <div className="text-xs text-[#70798C] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                        <span>{b.slotDate}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                        <span>{b.slotTimeWindow}</span>
                      </div>

                      <div className="text-xs pt-0.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Inspection Confirmed
                        </span>
                        <span className="text-[#70798C]">•</span>
                        <span className="text-[#70798C] truncate">
                          Agent: <strong className="text-[#000004]">{listing.agent.fullName}</strong> ({formatNigerianPhone(rawPhone)})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60">
                      <a
                        href={`tel:${rawPhone.replace(/[^0-9+]/g, '')}`}
                        className="w-full sm:w-auto py-2 sm:py-2 px-2 sm:px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs whitespace-nowrap"
                        title="Call Agent"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(b.id, rawPhone, e)}
                        className="w-full sm:w-auto py-2 sm:py-2 px-2 sm:px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FCF9F5] text-xs font-semibold text-[#000004] transition-colors flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                        title="Copy phone number"
                      >
                        {copiedPhoneId === b.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenBookingModal(listing);
                        }}
                        className="w-full sm:w-auto py-2 sm:py-2 px-2 sm:px-3.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-colors shadow-xs cursor-pointer text-center whitespace-nowrap"
                      >
                        View Pass
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  className={`p-3.5 sm:p-4 rounded-xl border ${
                    b.status === 'QUEUED'
                      ? 'border-[#F0544F]/30 bg-[#F0544F]/5'
                      : 'border-[#342A21]/30 bg-[#342A21]/5'
                  } flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 overflow-hidden`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#70798C] font-semibold shrink-0">({listing.city})</span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-[#000004] line-clamp-2 break-words leading-snug">
                      {listing.title}
                    </h4>

                    <div className="text-xs text-[#70798C] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                      <span>{b.slotDate}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                      <span>{b.slotTimeWindow}</span>
                    </div>

                    <div className="pt-0.5">
                      {b.status === 'QUEUED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F0544F]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Standby Queue Position #{b.queuePosition} (Hourly Cap Reached)
                        </span>
                      )}
                      {b.status === 'REQUEST_SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#342A21]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Awaiting Agent Confirmation • Contact Details Protected
                        </span>
                      )}
                      {b.status === 'ACCEPTED_PENDING_PAYMENT' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Booking Confirmed • Contact Details Revealed
                        </span>
                      )}
                      {b.status === 'REJECTED_BY_AGENT' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Inspection Request Declined by Agent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBookingModal(listing);
                      }}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors shadow-xs whitespace-nowrap cursor-pointer text-center"
                    >
                      View Status Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
