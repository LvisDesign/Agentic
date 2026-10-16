import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  Receipt, 
  CalendarCheck, 
  Share2, 
  ChevronDown, 
  CheckCircle, 
  Zap, 
  Droplet, 
  Bed, 
  Bath,
  Lock,
} from 'lucide-react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { formatNaira } from '../../utils/formatters';
import { MediaCarousel } from './MediaCarousel';
import { FeeBreakdownDrawer } from './FeeBreakdownDrawer';
import { QueueStatusBadge } from '../Booking/QueueStatusBadge';
import { InspectionBookingModal } from '../Booking/InspectionBookingModal';

interface PropertyCardProps {
  listing: PropertyListing;
  activeBooking?: BookingRecord;
  onBookSlot: (booking: BookingRecord) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  onSimulateAgentAccept?: (bookingId: string) => void;
  index: number;
  totalCount: number;
  onScrollNext?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  listing,
  activeBooking,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
  index,
  totalCount,
  onScrollNext,
}) => {
  const [showFeeDrawer, setShowFeeDrawer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Primary slot to display capacity badge
  const primarySlot = listing.inspectionSlots[0];

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="w-full h-full snap-start flex flex-col items-center justify-center p-2 sm:p-4 bg-[#FCF9F5] feed-snap-item overflow-hidden">
      {/* Centered Property Card with Half Image & Outside Descriptions */}
      <div className="w-full max-w-xl sm:max-w-2xl h-full max-h-[820px] bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col overflow-hidden relative">
        
        {/* CARD TOP HEADER: Location Tag, Live Capacity & Share (Zero Overlaps) */}
        <div className="px-3.5 sm:px-4 py-2 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-2 shrink-0">
          {/* Location tag */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#000004] truncate">
            <MapPin className="w-3.5 h-3.5 text-[#275DAD] shrink-0" />
            <span className="truncate">{listing.neighborhood}, {listing.city}</span>
            <span className="text-[#70798C] font-normal text-[11px] shrink-0 hidden sm:inline">• Delta</span>
          </div>

          {/* Capacity Badge & Share */}
          <div className="flex items-center gap-1.5 shrink-0">
            {primarySlot && (
              <QueueStatusBadge slot={primarySlot} size="sm" />
            )}
            <button
              onClick={handleShare}
              aria-label="Share property link"
              className="w-7 h-7 rounded-full bg-[#FCF9F5] hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center border border-[#E5E7EB] transition-colors"
              title="Share listing"
            >
              {copiedShare ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* TOP SECTION: Media Carousel (Approximately 44% - 46% height, completely clear of overlapping pills) */}
        <div className="relative w-full h-[44%] sm:h-[46%] shrink-0 overflow-hidden bg-slate-900">
          <MediaCarousel media={listing.media} title={listing.title} />
        </div>

        {/* BOTTOM SECTION: Descriptions Outside the Image (Remaining ~52% - 54% height) */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-y-auto bg-white text-[#000004]">
          <div className="space-y-2 sm:space-y-3">
            {/* 1. Verified Agent Pill */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF9F5] border border-[#E5E7EB] text-xs">
                <img
                  src={listing.agent.avatarUrl}
                  alt={listing.agent.fullName}
                  className="w-4 h-4 rounded-full object-cover border border-[#275DAD]"
                />
                <span className="font-semibold text-[#000004]">{listing.agent.fullName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#275DAD]" />
                <span className="text-[#70798C] text-[11px] hidden sm:inline">• {listing.agent.cacNumber}</span>
              </div>

              <span className="text-[#70798C] text-[11px] flex items-center gap-1 font-medium bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                <Lock className="w-3 h-3 text-[#70798C]" />
                Contact Protected
              </span>
            </div>

            {/* 2. Large Pricing & Title (Reckless Display Serif) */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#000004] tracking-tight">
                  {formatNaira(listing.fees.baseRent)}
                </span>
                <span className="text-[#70798C] text-xs sm:text-sm font-medium">
                  /{listing.fees.rentPeriod}
                </span>
              </div>

              <h2 className="font-display text-base sm:text-lg font-bold text-[#000004] mt-1 line-clamp-1">
                {listing.title}
              </h2>
              <p className="text-xs text-[#70798C] line-clamp-2 mt-1 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* 3. Feature Highlights & Amenity Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-[#70798C]" />
                {listing.bedrooms} Bed
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-[#70798C]" />
                {listing.bathrooms} Bath
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                {listing.electricityStatus}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 font-medium flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-blue-600" />
                {listing.waterSupply}
              </span>
            </div>

            {/* 4. Transparent Move-in Cost Schedule Preview Card */}
            <div 
              onClick={() => setShowFeeDrawer(true)}
              className="cursor-pointer p-2.5 sm:p-3 rounded-xl bg-[#FCF9F5] hover:bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-between text-xs transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#275DAD]/10 text-[#275DAD] flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#000004] text-xs">
                  Total Move-in Package:{' '}
                  <strong className="text-[#000004] font-display text-sm">
                    {formatNaira(listing.fees.totalMoveInPackage)}
                  </strong>
                </span>
              </div>
              <span className="text-[#275DAD] font-semibold text-[11px] flex items-center gap-0.5 group-hover:underline">
                View Schedule
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* 5. Bottom Actions: Inspection Booking & Fee Schedule */}
          <div className="pt-2 sm:pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBookingModal(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                  activeBooking?.status === 'CONFIRMED_UNLOCKED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : activeBooking?.status === 'ACCEPTED_PENDING_PAYMENT'
                    ? 'bg-[#00C3F7] hover:bg-[#00a8d4] text-[#0D233A]'
                    : activeBooking?.status === 'QUEUED'
                    ? 'bg-[#F0544F] hover:bg-[#d9433e] text-white'
                    : 'bg-[#000004] hover:bg-[#1f2937] text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                {activeBooking?.status === 'CONFIRMED_UNLOCKED' && 'View Inspection Pass'}
                {activeBooking?.status === 'ACCEPTED_PENDING_PAYMENT' && `Pay Clearance (${formatNaira(listing.inspectionFee)})`}
                {activeBooking?.status === 'QUEUED' && `Standby Queue (#${activeBooking.queuePosition})`}
                {activeBooking?.status === 'REQUEST_SUBMITTED' && 'Awaiting Agent Acceptance'}
                {!activeBooking && 'Book Inspection (5/hr Max)'}
              </button>

              <button
                onClick={() => setShowFeeDrawer(true)}
                className="py-3 px-3.5 rounded-xl bg-[#FCF9F5] hover:bg-[#E5E7EB] text-[#000004] font-semibold text-xs flex items-center gap-1.5 transition-colors border border-[#E5E7EB]"
                title="Inspect full move-in fee breakdown"
              >
                <Receipt className="w-4 h-4 text-[#275DAD]" />
                <span className="hidden sm:inline">Fees</span>
              </button>
            </div>

            {/* Scroll Next Cue */}
            {index < totalCount - 1 && onScrollNext && (
              <div 
                onClick={onScrollNext}
                className="mt-2 flex items-center justify-center gap-1 text-[#70798C] hover:text-[#000004] text-[10px] sm:text-[11px] cursor-pointer transition-colors"
              >
                <span>Scroll or swipe for next rental</span>
                <ChevronDown className="w-3 h-3 animate-bounce" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      <FeeBreakdownDrawer
        isOpen={showFeeDrawer}
        onClose={() => setShowFeeDrawer(false)}
        fees={listing.fees}
        title={listing.title}
        neighborhood={listing.neighborhood}
        city={listing.city}
      />

      <InspectionBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        listing={listing}
        existingBooking={activeBooking}
        onBookSlot={(b) => {
          onBookSlot(b);
        }}
        onUpdateBooking={(b) => {
          onUpdateBooking(b);
        }}
        onSimulateAgentAccept={onSimulateAgentAccept}
      />
    </div>
  );
};
