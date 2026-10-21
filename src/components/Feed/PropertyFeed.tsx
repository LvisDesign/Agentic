import React, { useRef, useEffect } from 'react';
import { PropertyListing, BookingRecord, ListingAvailability } from '../../types/marketplace';
import { PropertyCard } from './PropertyCard';
import { MapPin, SearchX, RefreshCcw, Building2, Plus } from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';
import { InFeedSponsoredCarousel } from './InFeedSponsoredCarousel';
import { AdvertStoriesTray } from './AdvertStoriesTray';

interface PropertyFeedProps {
  listings: PropertyListing[];
  bookings: BookingRecord[];
  userBookings?: BookingRecord[];
  onBookSlot: (booking: BookingRecord) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  onSimulateAgentAccept?: (bookingId: string) => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onUpdateAvailability?: (listingId: string, status: ListingAvailability) => void;
  onConfirmFreshness?: (listingId: string) => void;
  onResetFilters: () => void;
  adverts?: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  activeStoryId?: string | null;
  totalListingsCount?: number;
  onOpenBecomeAgent?: () => void;
}

export const PropertyFeed: React.FC<PropertyFeedProps> = ({
  listings,
  bookings,
  userBookings,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
  onOpenBookingModal,
  onUpdateAvailability,
  onConfirmFreshness,
  onResetFilters,
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
  totalListingsCount,
  onOpenBecomeAgent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth keyboard scrolling based on user actions (ArrowUp / ArrowDown / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (!containerRef.current) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        containerRef.current.scrollBy({
          top: 240,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        containerRef.current.scrollBy({
          top: -240,
          behavior: 'smooth',
        });
      } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        containerRef.current.scrollBy({
          top: 480,
          behavior: 'smooth',
        });
      } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        containerRef.current.scrollBy({
          top: -480,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (listings.length === 0) {
    if (totalListingsCount === 0) {
      return (
        <div className="h-[80vh] w-full flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F5]">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-[#70798C] mb-4">
            <Building2 className="w-8 h-8 text-[#342A21]" />
          </div>
          <h3 className="font-display text-2xl font-bold text-[#000004]">
            No Properties Listed Yet
          </h3>
          <p className="text-xs text-[#70798C] mt-1.5 max-w-sm leading-relaxed">
            Setlla is live! Be the first verified agent or landlord to publish rentals and connect with tenants across Delta State.
          </p>
          {onOpenBecomeAgent && (
            <button
              onClick={onOpenBecomeAgent}
              className="mt-5 py-2.5 px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>List Property as Agent</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F5]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-[#70798C] mb-4">
          <SearchX className="w-8 h-8 text-[#342A21]" />
        </div>
        <h3 className="font-display text-2xl font-bold text-[#000004]">
          No Properties Found
        </h3>
        <p className="text-xs text-[#70798C] mt-1.5 max-w-sm">
          No rentals in Delta State match your current filter parameters. Try loosening your price or selecting "All Delta Cities".
        </p>
        <button
          onClick={onResetFilters}
          className="mt-5 py-2.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Rental Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto feed-scroll-container no-scrollbar relative bg-[#FCF9F5] py-2 sm:py-4 px-1.5 sm:px-2 space-y-4 sm:space-y-6 overscroll-contain"
    >
      {/* Top Mobile Ads Section (Wide Banner Carousel) - Only visible on mobile/tablets (< lg) */}
      {adverts && adverts.length > 0 && onSelectAdvert && (
        <div className="block lg:hidden w-full pb-1">
          <AdvertStoriesTray
            adverts={adverts}
            onSelectAdvert={onSelectAdvert}
            onOpenPostAd={onOpenPostAd || (() => {})}
            activeStoryId={activeStoryId}
          />
        </div>
      )}

      {listings.map((listing, index) => {
        // Only mark activeBooking if THIS specific user/tenant created or owns the booking
        const activeBooking = (userBookings ?? []).find((b) => b.propertyId === listing.id);
        
        // Show sponsored carousel after 2nd listing (index === 1), or after 1st listing if only 1 listing exists.
        // If there are 6+ listings, also show secondary carousel set after 5th listing (index === 4).
        const showAdsAfterThisListing = adverts && adverts.length > 0 && (
          index === 1 || 
          (listings.length === 1 && index === 0) || 
          (listings.length >= 6 && index === 4)
        );

        return (
          <React.Fragment key={listing.id}>
            <PropertyCard
              listing={listing}
              activeBooking={activeBooking}
              onBookSlot={onBookSlot}
              onUpdateBooking={onUpdateBooking}
              onSimulateAgentAccept={onSimulateAgentAccept}
              onOpenBookingModal={onOpenBookingModal}
              onUpdateAvailability={onUpdateAvailability}
              onConfirmFreshness={onConfirmFreshness}
              index={index}
              totalCount={listings.length}
            />

            {/* In-feed Threads-style Sponsored Ads Carousel as tenants scroll down */}
            {showAdsAfterThisListing && (
              <InFeedSponsoredCarousel
                adverts={index === 1 ? adverts : [...adverts].reverse()}
                onSelectAdvert={onSelectAdvert}
                onOpenPostAd={onOpenPostAd}
                onOpenBookingModal={onOpenBookingModal}
                listings={listings}
              />
            )}
          </React.Fragment>
        );
      })}
      {/* Bottom spacer so user can comfortably scroll the last post into complete view */}
      <div className="h-10 sm:h-14 w-full shrink-0" />
    </div>
  );
};
