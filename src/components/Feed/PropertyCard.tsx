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
  Flag,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { PropertyListing, BookingRecord, ListingAvailability } from '../../types/marketplace';
import { formatNaira } from '../../utils/formatters';
import { MediaCarousel } from './MediaCarousel';
import { FeeBreakdownSheet } from './FeeBreakdownSheet';
import { ReportListingModal } from './ReportListingModal';
import { QueueStatusBadge } from '../Booking/QueueStatusBadge';
import { InspectionBookingModal } from '../Booking/InspectionBookingModal';
import { UnlockedContactSheet } from '../Booking/UnlockedContactSheet';

interface PropertyCardProps {
  listing: PropertyListing;
  activeBooking?: BookingRecord;
  onBookSlot: (booking: BookingRecord) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  onSimulateAgentAccept?: (bookingId: string) => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  onConfirmFreshness?: (listingId: string) => void;
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
  onUpdateAvailability,
  onConfirmFreshness,
  index,
  totalCount,
}) => {
  const [showFeeDrawer, setShowFeeDrawer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUnlockedContact, setShowUnlockedContact] = useState(false);
  const [showAgentControls, setShowAgentControls] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeMediaRatio, setActiveMediaRatio] = useState<number | null>(null);
  const [isListingExpanded, setIsListingExpanded] = useState(false);

  // Dynamic aspect ratio calculation based on real uploaded dimensions
  const containerAspectRatio = activeMediaRatio
    ? Math.max(0.5625, Math.min(1.7778, activeMediaRatio))
    : (listing.media?.[0]?.type === 'video' ? 0.8 : 1.6);

  const isPortrait = containerAspectRatio < 1;

  // Primary slot to display capacity badge
  const primarySlot = listing.inspectionSlots[0];

  const isFreshnessUnconfirmed = (() => {
    if (!listing.lastConfirmedAt) return true;
    const confirmedTime = new Date(listing.lastConfirmedAt).getTime();
    const now = new Date('2026-10-19T23:24:27+01:00').getTime();
    return (now - confirmedTime) > 48 * 60 * 60 * 1000;
  })();

  const isConfirmed = activeBooking?.status === 'CONFIRMED_UNLOCKED' || activeBooking?.status === 'APPROVED_CONFIRMED' || activeBooking?.status === 'ACCEPTED_PENDING_PAYMENT';
  const isRentedOut = listing.availabilityStatus === 'Rented Out';
  const isUnderInspection = listing.availabilityStatus === 'Under Inspection';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleReportSubmitted = (_propertyId: string, _reason: string, _notes?: string) => {
    setIsReported(true);
    setToastMessage('Thank you. Our team will review this listing within 2 hours.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start py-1 sm:py-2">
      {/* Centered Property Card with Natural Proportions & Outside Descriptions */}
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col overflow-hidden relative">
        
        {/* CARD TOP HEADER: Location Tag, Live Capacity, Report Flag & Share (Zero Overlaps) */}
        <div className="px-3.5 sm:px-4 py-2 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-2 shrink-0">
          {/* Location tag */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#000004] truncate">
            <MapPin className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
            <span className="truncate">{listing.neighborhood}, {listing.city}</span>
            <span className="text-[#70798C] font-normal text-[11px] shrink-0 hidden sm:inline">• Delta</span>
          </div>

          {/* Capacity Badge, Report Flag & Share */}
          <div className="flex items-center gap-1.5 shrink-0">
            {primarySlot && (
              <QueueStatusBadge slot={primarySlot} size="sm" />
            )}

            {isRentedOut && (
              <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold bg-[#F0544F] text-white">
                RENTED OUT
              </span>
            )}

            {isUnderInspection && (
              <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-amber-500 text-white">
                Under Inspection
              </span>
            )}

            {isReported && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0544F]/10 text-[#F0544F] border border-[#F0544F]/20">
                <Flag className="w-2.5 h-2.5 fill-[#F0544F]" />
                <span>Report Submitted</span>
              </span>
            )}

            {/* Quick Agent Status Toggle Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAgentControls(!showAgentControls);
              }}
              aria-label="Toggle agent controls"
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                showAgentControls 
                  ? 'bg-[#000004] text-white border-[#000004]' 
                  : 'bg-[#FCF9F5] hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] border-[#E5E7EB]'
              }`}
              title="Agent status & proof-of-life controls"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Subtle Flag Report Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReportModal(true);
              }}
              aria-label="Report inaccurate or occupied listing"
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                isReported
                  ? 'bg-[#F0544F]/15 text-[#F0544F] border-[#F0544F]/30'
                  : 'bg-[#FCF9F5] hover:bg-[#F0544F]/10 text-[#70798C] hover:text-[#F0544F] border-[#E5E7EB]'
              }`}
              title={isReported ? 'Report Submitted (Under Review)' : 'Report listing'}
            >
              <Flag className={`w-3.5 h-3.5 ${isReported ? 'fill-[#F0544F]' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              type="button"
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

        {/* 48-Hour Proof-of-Life Check Banner */}
        {isFreshnessUnconfirmed && (
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Availability Unconfirmed (&gt;48 hrs)</span>
            </div>
            {onConfirmFreshness && (
              <button
                type="button"
                onClick={() => {
                  onConfirmFreshness(listing.id);
                  setToastMessage('Listing freshness verified! Ranking refreshed.');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full sm:w-auto text-center px-2.5 py-1.5 sm:py-1 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Confirm listing is still vacant
              </button>
            )}
          </div>
        )}

        {/* Quick Agent Availability Controls (Management Bar) */}
        {showAgentControls && (
          <div className="px-3.5 py-2 bg-[#FCF9F5] border-b border-[rgba(112,121,140,0.22)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 text-xs animate-fade-in">
            <span className="font-bold text-[#70798C] text-[11px] uppercase tracking-wider shrink-0">
              Agent Availability:
            </span>
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
              {(['Available', 'Under Inspection', 'Rented Out'] as ListingAvailability[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    if (onUpdateAvailability) {
                      onUpdateAvailability(listing.id, st);
                      if (st === 'Rented Out') {
                        setToastMessage('Listing marked as Rented Out. Hiding from public feed in 3s...');
                        setTimeout(() => setToastMessage(null), 3500);
                      }
                    }
                  }}
                  className={`w-full sm:w-auto text-center px-2.5 py-1 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    listing.availabilityStatus === st || (!listing.availabilityStatus && st === 'Available')
                      ? st === 'Rented Out'
                        ? 'bg-[#F0544F] text-white shadow-xs'
                        : st === 'Under Inspection'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-[#000004] text-white shadow-xs'
                      : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TOP SECTION: Media Carousel with Exact Natural Dimensions & Adaptive Aspect Ratio */}
        <div 
          className="relative w-full shrink-0 overflow-hidden bg-slate-950 transition-all duration-300"
          style={{ 
            aspectRatio: `${containerAspectRatio}`,
            maxHeight: isPortrait ? '560px' : '400px'
          }}
        >
          <MediaCarousel 
            media={listing.media} 
            title={listing.title} 
            onAspectRatioChange={(ratio) => setActiveMediaRatio(ratio)}
          />

          {/* Rented Out Backdrop Overlay */}
          {isRentedOut && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
              <span className="px-4 py-1.5 rounded-[8px] bg-[#F0544F] text-white text-sm font-extrabold uppercase tracking-widest shadow-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                RENTED OUT
              </span>
              <p className="text-white/80 text-xs mt-2 max-w-xs">
                This property is taken. Auto-archiving from public feed in 3s...
              </p>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: Descriptions Outside the Image with Collapsible Details */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-col space-y-2.5 sm:space-y-3 bg-white text-[#000004]">
          <div className="space-y-2">
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#000004] tracking-tight">
                    {formatNaira(listing.fees.baseRent)}
                  </span>
                  <span className="text-[#70798C] text-xs font-medium">
                    /{listing.fees.rentPeriod}
                  </span>
                </div>

                {/* [Fees] Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowFeeDrawer(true)}
                  className="px-2.5 py-1 rounded-[8px] bg-[#342A21]/10 hover:bg-[#342A21]/20 text-[#342A21] text-xs font-bold transition-colors cursor-pointer border border-[#342A21]/25 active:scale-95 flex items-center gap-1 shadow-2xs"
                  title="View move-in fee breakdown"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>[Fees]</span>
                </button>
              </div>

              <h2 className="font-display text-sm sm:text-base font-bold text-[#000004] mt-0.5 line-clamp-2 break-words leading-snug">
                {listing.title}
              </h2>
            </div>

            {/* 3. Essential Quick Summary Pills (Bedrooms & Bathrooms) */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bed className="w-3 h-3 text-[#70798C]" />
                {listing.bedrooms} Bed
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] text-[#000004] font-medium flex items-center gap-1">
                <Bath className="w-3 h-3 text-[#70798C]" />
                {listing.bathrooms} Bath
              </span>
              {listing.electricityStatus && !isListingExpanded && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-600" />
                  {listing.electricityStatus}
                </span>
              )}
            </div>

            {/* 4. Description Preview (1 line when collapsed, full text when expanded) */}
            <div>
              <p 
                onClick={() => setIsListingExpanded(!isListingExpanded)}
                className={`text-[11px] sm:text-xs text-[#70798C] mt-0.5 leading-relaxed cursor-pointer hover:text-[#342A21] transition-colors ${
                  isListingExpanded ? 'break-words' : 'line-clamp-1'
                }`}
                title="Click to toggle full listing details"
              >
                {listing.description}
              </p>
            </div>

            {/* 5. Collapsible Full Details Area (Features, Addons & Move-in Package) */}
            {isListingExpanded && (
              <div className="space-y-3 pt-2.5 border-t border-[#E5E7EB] animate-fade-in">
                {/* Full Verified Amenities & Features */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] block">
                    Verified Amenities & Features
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {listing.electricityStatus && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        {listing.electricityStatus}
                      </span>
                    )}
                    {listing.waterSupply && (
                      <span className="px-2 py-0.5 rounded-md bg-[#00C3F7]/10 border border-[#00C3F7]/30 text-[#075985] font-medium flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-[#0284c7]" />
                        {listing.waterSupply}
                      </span>
                    )}
                    {listing.isServiced && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                        Serviced Property
                      </span>
                    )}
                    {listing.isFurnished && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                        Fully Furnished
                      </span>
                    )}
                    {listing.addons && listing.addons.map((addon) => (
                      <span
                        key={addon}
                        className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/80 text-purple-900 font-medium shrink-0"
                      >
                        {addon}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Move-in Cost Breakdown Schedule Card */}
                <div 
                  onClick={() => setShowFeeDrawer(true)}
                  className="cursor-pointer p-2.5 rounded-xl bg-[#FCF9F5] hover:bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-between text-xs transition-colors group"
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
            )}

            {/* 6. Expand / Collapse Trigger Bar */}
            <button
              type="button"
              onClick={() => setIsListingExpanded(!isListingExpanded)}
              className="w-full py-1.5 px-3 rounded-xl bg-[#FCF9F5] hover:bg-[#F4F5F7] text-[#342A21] text-xs font-semibold flex items-center justify-between border border-[#E5E7EB] transition-colors cursor-pointer group/toggle"
            >
              <span className="text-[11px] sm:text-xs font-bold text-[#342A21] flex items-center gap-1.5">
                {isListingExpanded ? (
                  <span>Hide listing details</span>
                ) : (
                  <>
                    <span>View full listing</span>
                    {((listing.addons?.length || 0) > 0 || listing.waterSupply) && (
                      <span className="text-[10px] font-medium text-[#70798C] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded-full">
                        +{(listing.addons?.length || 0) + (listing.waterSupply ? 1 : 0)} features & package
                      </span>
                    )}
                  </>
                )}
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[#70798C] group-hover/toggle:text-[#342A21] transition-transform duration-200 ${
                  isListingExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>
        </div>

        {/* 5. PINNED BOTTOM ACTION BAR: Always 100% visible on both mobile & desktop without any vertical scrolling */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white border-t border-[#E5E7EB] shrink-0">
          {isConfirmed ? (
            <button
              type="button"
              onClick={() => setShowUnlockedContact(true)}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Inspection Confirmed • View Agent Contact</span>
            </button>
          ) : isRentedOut ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#F0544F]/15 text-[#F0544F] border border-[#F0544F]/30 cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Rented Out / No Longer Vacant</span>
            </button>
          ) : isUnderInspection ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal(listing);
                } else {
                  setShowBookingModal(true);
                }
              }}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Under Inspection • Standby Only</span>
            </button>
          ) : activeBooking?.status === 'REQUEST_SUBMITTED' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenBookingModal) {
                    onOpenBookingModal(listing);
                  } else {
                    setShowBookingModal(true);
                  }
                }}
                className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer bg-[#342A21] hover:bg-[#251E17] text-white"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Awaiting Agent Approval</span>
              </button>
              {onSimulateAgentAccept && (
                <button
                  type="button"
                  onClick={() => onSimulateAgentAccept(activeBooking.id)}
                  className="shrink-0 py-2.5 sm:py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  title="Simulate Agent Approval (Instant Free Contact Unlock)"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Agent Accept</span>
                </button>
              )}
            </div>
          ) : activeBooking?.status === 'QUEUED' ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal(listing);
                } else {
                  setShowBookingModal(true);
                }
              }}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer bg-[#F0544F] hover:bg-[#d9433e] text-white"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Standby Queue (#{activeBooking.queuePosition})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenBookingModal) {
                  onOpenBookingModal(listing);
                } else {
                  setShowBookingModal(true);
                }
              }}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer bg-[#000004] hover:bg-[#1f2937] text-white"
            >
              <span>Book Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawers & Modals */}
      <FeeBreakdownSheet
        isOpen={showFeeDrawer}
        onClose={() => setShowFeeDrawer(false)}
        fees={listing.fees}
        title={listing.title}
        onProceedToBooking={() => {
          if (onOpenBookingModal) {
            onOpenBookingModal(listing);
          } else {
            setShowBookingModal(true);
          }
        }}
      />

      <ReportListingModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        propertyId={listing.id}
        propertyTitle={listing.title}
        onSubmitReport={handleReportSubmitted}
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

      {activeBooking && (
        <UnlockedContactSheet
          isOpen={showUnlockedContact}
          onClose={() => setShowUnlockedContact(false)}
          listing={listing}
          booking={activeBooking}
        />
      )}

      {/* Quick Success Toast for Feedback / Reporting */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-[12px] bg-[#000004] text-white shadow-2xl text-xs sm:text-sm font-medium animate-slide-up border border-white/10 max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
