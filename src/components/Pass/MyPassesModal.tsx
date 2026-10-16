import React from 'react';
import { X, Ticket, Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { BookingRecord, PropertyListing } from '../../types/marketplace';
import { InspectionPassCard } from './InspectionPassCard';
import { formatNaira } from '../../utils/formatters';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#000004]">
                My Inspection Passes & Queue Tickets
              </h3>
              <p className="text-xs text-[#70798C]">
                {bookings.length} active reservation(s) in Delta State
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-[#FCF9F5] rounded-xl border border-dashed border-[#E5E7EB]">
              <p className="text-xs text-[#70798C]">You have not booked any property inspections yet.</p>
            </div>
          ) : (
            bookings.map((b) => {
              const listing = listings.find((p) => p.id === b.propertyId) || listings[0];

              if (b.status === 'CONFIRMED_UNLOCKED') {
                return (
                  <div key={b.id} className="border border-[#275DAD]/20 rounded-xl overflow-hidden">
                    <InspectionPassCard booking={b} listing={listing} />
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border ${
                    b.status === 'QUEUED'
                      ? 'border-[#F0544F]/30 bg-[#F0544F]/5'
                      : 'border-[#275DAD]/30 bg-blue-50/20'
                  } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#000004]">
                        {listing.title}
                      </span>
                      <span className="text-xs text-[#70798C]">({listing.city})</span>
                    </div>

                    <div className="text-xs text-[#70798C] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#275DAD]" />
                      <span>{b.slotDate}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-[#275DAD]" />
                      <span>{b.slotTimeWindow}</span>
                    </div>

                    <div className="pt-1">
                      {b.status === 'QUEUED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F0544F]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Standby Queue Position #{b.queuePosition} (Hourly Cap Reached)
                        </span>
                      )}
                      {b.status === 'REQUEST_SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#275DAD]">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting Agent Confirmation • Contact Details Protected
                        </span>
                      )}
                      {b.status === 'ACCEPTED_PENDING_PAYMENT' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Booking Confirmed • Contact Details Revealed
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenBookingModal(listing);
                    }}
                    className="py-2 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    View Status Details
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
