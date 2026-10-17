import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  Receipt, 
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
  onOpenBookingModal?: (listing: PropertyListing) => void;
  index: number;
  totalCount: number;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  listing,
  activeBooking,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
  onOpenBookingModal,
  index,
  totalCount,
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
    <div className="w-full flex flex-col items-center justify-start py-1 sm:py-2">
      {/* Centered Property Card with Natural Proportions & Outside Descriptions */}
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col overflow-hidden relative">
        
        {/* CARD TOP HEADER: Location Tag, Live Capacity & Share (Zero Overlaps) */}
        <div className="px-3.5 sm:px-4 py-2 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-2 shrink-0">
          {/* Location tag */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#000004] truncate">
            <MapPin className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
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
              className="w-7 h-7 rounded-full bg-[#FCF9F5] hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center border border-[#E5E7EB] transition-colors cursor-pointer"
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

        {/* TOP SECTION: Media Carousel with Responsive Aspect Ratio */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[380px] shrink-0 overflow-hidden bg-slate-900">
          <MediaCarousel media={listing.media} title={listing.title} />
        </div>

        {/* MIDDLE SECTION: Descriptions Outside the Image (NO vertical scrolling into image container) */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-col space-y-2.5 sm:space-y-3 bg-white text-[#000004]">
          <div className="space-y-1.5 sm:space-y-2">
            {/* 1. Agent Pill */}
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCF9F5] border border-[#E5E7EB] text-[11px]">
                <img
                  src={listing.agent.avatarUrl}
                  alt={listing.agent.fullName}
                  className="w-3.5 h-3.5 rounded-full object-cover border border-[#342A21]"
                />
                <span className="font-semibold text-[#000004] truncate max-w-[160px] sm:max-w-none">{listing.agent.fullName}</span>
                <span className="text-[#70798C] text-[10px] hidden sm:inline">• {listing.agent.cacNumber}</span>
              </div>

              <span className="text-[#70798C] text-[10px] flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                <Lock className="w-2.5 h-2.5 text-[#70798C]" />
                Contact Protected (Reveals on Confirmation)
              </span>
            </div>

            {/* 2. Large Pricing & Title */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#000004] tracking-tight">
                  {formatNaira(listing.fees.baseRent)}
                </span>
                <span className="text-[#70798C] text-xs font-medium">
                  /{listing.fees.rentPeriod}
                </span>
              </div>

              <h2 className="font-display text-sm sm:text-base font-bold text-[#000004] mt-0.5 line-clamp-1">
                {listing.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#70798C] line-clamp-1 sm:line-clamp-2 mt-0.5 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* 3. Feature Highlights & Amenity Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bed className="w-3 h-3 text-[#70798C]" />
                {listing.bedrooms} Bed
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bath className="w-3 h-3 text-[#70798C]" />
                {listing.bathrooms} Bath
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                {listing.electricityStatus}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#00C3F7]/10 border border-[#00C3F7]/30 text-[#075985] font-medium flex items-center gap-1">
                <Droplet className="w-3 h-3 text-[#0284c7]" />
                {listing.waterSupply}
              </span>
            </div>

            {/* 4. Transparent Move-in Cost Schedule Preview Card */}
            <div 
              onClick={() => setShowFeeDrawer(true)}
              className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-[#FCF9F5] hover:bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-between text-xs transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#342A21]/10 text-[#342A21] flex items-center justify-center">
                  <Receipt className="w-3 h-3" />
                </div>
                <span className="text-[#000004] text-[11px] sm:text-xs">
                  Total Move-in Package:{' '}
                  <strong className="text-[#000004] font-display text-xs sm:text-sm">
                    {formatNaira(listing.fees.totalMoveInPackage)}
                  </strong>
                </span>
              </div>
              <span className="text-[#342A21] font-semibold text-[10px] sm:text-[11px] flex items-center gap-0.5 group-hover:underline">
                View Breakdown
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* 5. PINNED BOTTOM ACTION BAR: Always 100% visible on both mobile & desktop without any vertical scrolling */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white border-t border-[#E5E7EB] shrink-0">
          <button
            onClick={() => {
              if (onOpenBookingModal) {
                onOpenBookingModal(listing);
              } else {
                setShowBookingModal(true);
              }
            }}
            className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
              activeBooking?.status === 'CONFIRMED_UNLOCKED' || activeBooking?.status === 'ACCEPTED_PENDING_PAYMENT'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : activeBooking?.status === 'QUEUED'
                ? 'bg-[#F0544F] hover:bg-[#d9433e] text-white'
                : activeBooking?.status === 'REQUEST_SUBMITTED'
                ? 'bg-[#342A21] hover:bg-[#251E17] text-white'
                : 'bg-[#000004] hover:bg-[#1f2937] text-white'
            }`}
          >
            <span className="truncate">
              {(activeBooking?.status === 'CONFIRMED_UNLOCKED' || activeBooking?.status === 'ACCEPTED_PENDING_PAYMENT') && 'View Inspection Pass (Contact Revealed)'}
              {activeBooking?.status === 'QUEUED' && `Standby Queue (#${activeBooking.queuePosition})`}
              {activeBooking?.status === 'REQUEST_SUBMITTED' && 'Awaiting Agent Confirmation'}
              {!activeBooking && 'Book Inspection'}
            </span>
          </button>
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
