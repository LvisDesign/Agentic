import React, { useState, useMemo } from 'react';
import { INITIAL_LISTINGS } from './data/mockListings';
import { PropertyListing, BookingRecord, UserRole } from './types/marketplace';
import { Header } from './components/Header';
import { PropertyFeed } from './components/Feed/PropertyFeed';
import { FilterBar } from './components/Feed/FilterBar';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { MyPassesModal } from './components/Pass/MyPassesModal';
import { SystemGuideModal } from './components/UI/SystemGuideModal';
import { InspectionBookingModal } from './components/Booking/InspectionBookingModal';
import { MOCK_ADVERT_STORIES, AdvertStory } from './data/mockAdverts';
import { AdvertStoryModal } from './components/Feed/AdvertStoryModal';
import { PostAdModal } from './components/Feed/PostAdModal';

// Seed initial bookings for immediate testability
const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'DT-ASB-8492',
    propertyId: 'prop-asaba-01',
    slotId: 'slot-asb-1',
    slotTimeWindow: '10:00 AM – 11:00 AM',
    slotDate: 'Today',
    applicantName: 'Chinedu Okafor',
    applicantPhone: '0803 891 0293',
    applicantEmail: 'chinedu.okafor@gmail.com',
    status: 'REQUEST_SUBMITTED',
    inspectionFeeAmount: 2500,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DT-WRI-3918',
    propertyId: 'prop-warri-02',
    slotId: 'slot-wri-1',
    slotTimeWindow: '11:00 AM – 12:00 PM',
    slotDate: 'Today',
    applicantName: 'Tariere Ebi',
    applicantPhone: '0814 391 8291',
    applicantEmail: 'tariere.ebi@outlook.com',
    status: 'QUEUED',
    queuePosition: 1, // Standby queue position #1
    inspectionFeeAmount: 3000,
    createdAt: new Date().toISOString(),
  }
];

export function App() {
  const [listings, setListings] = useState<PropertyListing[]>(INITIAL_LISTINGS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [currentRole, setCurrentRole] = useState<UserRole>('seeker');

  // Filter state
  const [selectedCity, setSelectedCity] = useState('All Delta Cities');
  const [selectedType, setSelectedType] = useState('All Property Types');
  const [selectedState, setSelectedState] = useState('Delta State (Active Launch)');
  const [maxRent, setMaxRent] = useState(5000000);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMyPassesOpen, setIsMyPassesOpen] = useState(false);
  const [activeModalListing, setActiveModalListing] = useState<PropertyListing | null>(null);

  // Advert stories state
  const [adverts, setAdverts] = useState<AdvertStory[]>(MOCK_ADVERT_STORIES);
  const [selectedStoryAd, setSelectedStoryAd] = useState<AdvertStory | null>(null);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);

  const handleAddAdvert = (newAd: AdvertStory) => {
    setAdverts((prev) => [newAd, ...prev]);
  };

  // Filter logic
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCity !== 'All Delta Cities' && item.city !== selectedCity) {
        return false;
      }
      if (selectedType !== 'All Property Types' && item.propertyType !== selectedType) {
        return false;
      }
      if (item.fees.baseRent > maxRent) {
        return false;
      }
      return true;
    });
  }, [listings, selectedCity, selectedType, maxRent]);

  // Handler: Book an inspection slot
  const handleBookSlot = (newBooking: BookingRecord) => {
    setBookings((prev) => [newBooking, ...prev.filter((b) => b.propertyId !== newBooking.propertyId)]);

    // Update listing slot counter
    setListings((prevListings) =>
      prevListings.map((prop) => {
        if (prop.id !== newBooking.propertyId) return prop;

        return {
          ...prop,
          inspectionSlots: prop.inspectionSlots.map((slot) => {
            if (slot.id !== newBooking.slotId) return slot;

            if (newBooking.status === 'QUEUED') {
              return {
                ...slot,
                waitlistCount: slot.waitlistCount + 1,
              };
            } else {
              return {
                ...slot,
                bookedCount: Math.min(slot.capacityLimit, slot.bookedCount + 1),
              };
            }
          }),
        };
      })
    );
  };

  // Handler: Update existing booking (e.g. after Paystack payment)
  const handleUpdateBooking = (updatedBooking: BookingRecord) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  // Handler: Agent accepts a booking
  const handleAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'ACCEPTED_PENDING_PAYMENT',
          };
        }
        return b;
      })
    );
  };

  // Handler: Agent declines a slot -> Automatically promotes next queued applicant!
  const handleRejectBooking = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    // Remove or cancel the target booking
    const remainingBookings = bookings.filter((b) => b.id !== bookingId);

    // Check if there is someone in the queue for this same slot
    const queuedApplicant = remainingBookings.find(
      (b) => b.propertyId === targetBooking.propertyId && b.slotId === targetBooking.slotId && b.status === 'QUEUED'
    );

    if (queuedApplicant) {
      // Auto-advance queued applicant to ACCEPTED_PENDING_PAYMENT!
      const updatedQueued = remainingBookings.map((b) => {
        if (b.id === queuedApplicant.id) {
          return {
            ...b,
            status: 'ACCEPTED_PENDING_PAYMENT' as const,
            queuePosition: undefined,
          };
        }
        // Shift up other queued people
        if (b.propertyId === targetBooking.propertyId && b.slotId === targetBooking.slotId && b.queuePosition && b.queuePosition > 1) {
          return {
            ...b,
            queuePosition: b.queuePosition - 1,
          };
        }
        return b;
      });
      setBookings(updatedQueued);
    } else {
      setBookings(remainingBookings);
    }
  };

  // Handler: Create listing from agent onboarding form
  const handleListingCreated = (newListing: PropertyListing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCity('All Delta Cities');
    setSelectedType('All Property Types');
    setMaxRent(5000000);
  };

  return (
    <div className={`bg-[#FCF9F5] text-[#000004] flex flex-col font-body selection:bg-[#275DAD]/15 selection:text-[#275DAD] ${
      currentRole === 'seeker' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen overflow-x-hidden'
    }`}>
      {/* 1. Global Navigation Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        activeBookings={bookings}
        onOpenMyPasses={() => setIsMyPassesOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* 2. Main Content Area */}
      {currentRole === 'seeker' ? (
        <main className="flex-1 w-full h-[calc(100dvh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Snap-Feed Filter Bar with Squared Rounded-Edges Adverts Tray */}
          <FilterBar
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedState={selectedState}
            onSelectState={setSelectedState}
            maxRent={maxRent}
            onSelectMaxRent={setMaxRent}
            totalFiltered={filteredListings.length}
            adverts={adverts}
            onSelectAdvert={(ad) => setSelectedStoryAd(ad)}
            onOpenPostAd={() => setIsPostAdOpen(true)}
            activeStoryId={selectedStoryAd?.id}
          />

          {/* Clean Responsive Feed without vertical scrollbar (adjusted offset for adverts tray) */}
          <div className="w-full h-[calc(100dvh-194px)] mt-[194px] overflow-hidden">
            <PropertyFeed
              listings={filteredListings}
              bookings={bookings}
              onBookSlot={handleBookSlot}
              onUpdateBooking={handleUpdateBooking}
              onSimulateAgentAccept={handleAcceptBooking}
              onResetFilters={handleResetFilters}
            />
          </div>
        </main>
      ) : (
        /* Agent Mode Portal */
        <main className="flex-1 w-full">
          <AgentDashboard
            listings={listings}
            bookings={bookings}
            onAcceptBooking={handleAcceptBooking}
            onRejectBooking={handleRejectBooking}
            onListingCreated={handleListingCreated}
            onSwitchToSeeker={() => setCurrentRole('seeker')}
          />
        </main>
      )}

      {/* 3. Global Drawers & Modals */}
      <MyPassesModal
        isOpen={isMyPassesOpen}
        onClose={() => setIsMyPassesOpen(false)}
        bookings={bookings}
        listings={listings}
        onOpenBookingModal={(listing) => setActiveModalListing(listing)}
      />

      <SystemGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {activeModalListing && (
        <InspectionBookingModal
          isOpen={true}
          onClose={() => setActiveModalListing(null)}
          listing={activeModalListing}
          existingBooking={bookings.find((b) => b.propertyId === activeModalListing.id)}
          onBookSlot={handleBookSlot}
          onUpdateBooking={handleUpdateBooking}
          onSimulateAgentAccept={handleAcceptBooking}
        />
      )}

      {/* 4. Advert Stories & Submission Modals */}
      {selectedStoryAd && (
        <AdvertStoryModal
          isOpen={Boolean(selectedStoryAd)}
          onClose={() => setSelectedStoryAd(null)}
          adverts={adverts}
          initialAdvertId={selectedStoryAd.id}
          onNavigateToProperty={(propertyId) => {
            setSelectedStoryAd(null);
            const prop = listings.find((l) => l.id === propertyId);
            if (prop) {
              setActiveModalListing(prop);
            }
          }}
        />
      )}

      <PostAdModal
        isOpen={isPostAdOpen}
        onClose={() => setIsPostAdOpen(false)}
        onAddAdvert={handleAddAdvert}
      />
    </div>
  );
}

export default App;
