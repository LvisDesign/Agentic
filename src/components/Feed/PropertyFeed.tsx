import React, { useRef, useEffect } from 'react';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { PropertyCard } from './PropertyCard';
import { MapPin, SearchX, RefreshCcw } from 'lucide-react';

interface PropertyFeedProps {
  listings: PropertyListing[];
  bookings: BookingRecord[];
  onBookSlot: (booking: BookingRecord) => void;
  onUpdateBooking: (booking: BookingRecord) => void;
  onSimulateAgentAccept?: (bookingId: string) => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  onResetFilters: () => void;
}

export const PropertyFeed: React.FC<PropertyFeedProps> = ({
  listings,
  bookings,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
  onOpenBookingModal,
  onResetFilters,
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
      {listings.map((listing, index) => {
        const activeBooking = bookings.find((b) => b.propertyId === listing.id);

        return (
          <PropertyCard
            key={listing.id}
            listing={listing}
            activeBooking={activeBooking}
            onBookSlot={onBookSlot}
            onUpdateBooking={onUpdateBooking}
            onSimulateAgentAccept={onSimulateAgentAccept}
            onOpenBookingModal={onOpenBookingModal}
            index={index}
            totalCount={listings.length}
          />
        );
      })}
      {/* Bottom spacer so user can comfortably scroll the last post into complete view */}
      <div className="h-10 sm:h-14 w-full shrink-0" />
    </div>
  );
};
