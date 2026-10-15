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
  onResetFilters: () => void;
}

export const PropertyFeed: React.FC<PropertyFeedProps> = ({
  listings,
  bookings,
  onBookSlot,
  onUpdateBooking,
  onSimulateAgentAccept,
  onResetFilters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for power users (ArrowUp / ArrowDown / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const { scrollTop, clientHeight } = containerRef.current;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: scrollTop + clientHeight,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: Math.max(0, scrollTop - clientHeight),
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScrollNext = (currentIndex: number) => {
    if (!containerRef.current) return;
    const clientHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: (currentIndex + 1) * clientHeight,
      behavior: 'smooth',
    });
  };

  if (listings.length === 0) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center bg-[#FCF9F5]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-[#70798C] mb-4">
          <SearchX className="w-8 h-8 text-[#275DAD]" />
        </div>
        <h3 className="font-display text-2xl font-bold text-[#000004]">
          No Properties Found
        </h3>
        <p className="text-xs text-[#70798C] mt-1.5 max-w-sm">
          No rentals in Delta State match your current filter parameters. Try loosening your price or selecting "All Delta Cities".
        </p>
        <button
          onClick={onResetFilters}
          className="mt-5 py-2.5 px-5 rounded-xl bg-[#275DAD] hover:bg-[#1e4b8f] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
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
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory feed-snap-container no-scrollbar relative bg-[#FCF9F5]"
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
            index={index}
            totalCount={listings.length}
            onScrollNext={() => handleScrollNext(index)}
          />
        );
      })}
    </div>
  );
};
