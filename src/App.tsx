import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_LISTINGS } from './data/mockListings';
import { PropertyListing, BookingRecord, UserRole, UserProfile, ListingAvailability } from './types/marketplace';
import { Header } from './components/Header';
import { setAppBadge, clearAppBadge } from './utils/pwa';
import { saveRegisteredUser } from './utils/userRegistry';
import { PropertyFeed } from './components/Feed/PropertyFeed';
import { FilterBar } from './components/Feed/FilterBar';
import { matchesLocation } from './utils/locationMatcher';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { UserDashboard } from './components/User/UserDashboard';
import { BecomeAgentModal } from './components/User/BecomeAgentModal';
import { SignupModal } from './components/User/SignupModal';
import { MyPassesModal } from './components/Pass/MyPassesModal';
import { UserProfileModal } from './components/Profile/UserProfileModal';
import { InspectionBookingModal } from './components/Booking/InspectionBookingModal';
import { MOCK_ADVERT_STORIES, AdvertStory } from './data/mockAdverts';
import { PostAdModal } from './components/Feed/PostAdModal';
import { DesktopAdvertSidebar } from './components/Feed/DesktopAdvertSidebar';
import { PushNotificationBanner, PushNotificationData } from './components/Notifications/PushNotificationBanner';
import { UnlockedContactSheet } from './components/Booking/UnlockedContactSheet';

// Initial User Profile (Tenant / Non-Agent)
const INITIAL_USER: UserProfile = {
  id: 'DT-USR-8492',
  fullName: 'Chinedu Okafor',
  email: 'chinedu.okafor@gmail.com',
  phone: '0803 891 0293',
  state: 'Delta State',
  city: 'Asaba',
  preferredPropertyType: 'Bedseater',
  budget: 2000000,
  nin: 'NIN-2910-***-9021',
  isVerifiedTenant: true,
  isAgent: false,
  savedListingIds: ['prop-asaba-01'],
  createdAt: '2026-10-01T10:00:00.000Z',
};

// Seed initial bookings for immediate testability
const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'DT-ABK-5120',
    propertyId: 'prop-abraka-03',
    slotId: 'slot-abk-1',
    slotTimeWindow: '2:00 PM – 3:00 PM',
    slotDate: 'Today',
    applicantName: 'Chinedu Okafor',
    applicantPhone: '0803 891 0293',
    applicantEmail: 'chinedu.okafor@gmail.com',
    status: 'CONFIRMED_UNLOCKED',
    inspectionFeeAmount: 0,
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
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
    inspectionFeeAmount: 0,
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
    inspectionFeeAmount: 0,
    createdAt: new Date().toISOString(),
  }
];

export function App() {
  const [listings, setListings] = useState<PropertyListing[]>(INITIAL_LISTINGS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);

  // User Authentication State (Persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('deltarent_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('deltarent_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('deltarent_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isAgent) return 'agent';
      } catch (e) {
        // fallback
      }
    }
    return 'seeker';
  });

  // Default to live video feed for first-time visitors / guests
  const [userView, setUserView] = useState<'dashboard' | 'feed'>('feed');
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(['prop-asaba-01']);

  // Filter state
  const [selectedCity, setSelectedCity] = useState('All Delta Cities');
  const [selectedType, setSelectedType] = useState('All Property Types');
  const [selectedState, setSelectedState] = useState('Delta State');
  const [maxRent, setMaxRent] = useState(5000000);

  // Modals & Navigation state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMyPassesOpen, setIsMyPassesOpen] = useState(false);
  const [isBecomeAgentOpen, setIsBecomeAgentOpen] = useState(false);

  // For first-time visitors, open signup modal on arrival if they haven't skipped yet
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(() => {
    const isAuth = localStorage.getItem('deltarent_auth') === 'true';
    const hasSkipped = sessionStorage.getItem('deltarent_guest_skipped') === 'true';
    return !isAuth && !hasSkipped;
  });

  const [activeModalListing, setActiveModalListing] = useState<PropertyListing | null>(null);
  const [pushNotification, setPushNotification] = useState<PushNotificationData | null>(null);
  const [unlockedSheetData, setUnlockedSheetData] = useState<{ listing: PropertyListing; booking: BookingRecord } | null>(null);

  // Synchronize dynamic home-screen badge count with active inspection passes
  useEffect(() => {
    const activePassesCount = bookings.filter(
      (b) => b.status === 'CONFIRMED_UNLOCKED' || b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED' || b.status === 'ACCEPTED_PENDING_PAYMENT'
    ).length;
    if (activePassesCount > 0) {
      setAppBadge(activePassesCount);
    } else {
      clearAppBadge();
    }
  }, [bookings]);

  // Authentication gating & resume booking state
  const [pendingBookingListing, setPendingBookingListing] = useState<PropertyListing | null>(null);
  const [signupNotice, setSignupNotice] = useState<{ title: string; message: string } | null>(null);
  const [signupInitialRole, setSignupInitialRole] = useState<'seeker' | 'agent'>('seeker');
  const [signupInitialMode, setSignupInitialMode] = useState<'signup' | 'login'>('signup');

  // Sponsored adverts state
  const [adverts, setAdverts] = useState<AdvertStory[]>(MOCK_ADVERT_STORIES);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);

  const handleAddAdvert = (newAd: AdvertStory) => {
    setAdverts((prev) => [newAd, ...prev]);
  };

  const handleSelectAdvert = (ad: AdvertStory) => {
    // 1. External organization / influencer link
    if (ad.actionType === 'website' || (ad.websiteUrl && !ad.propertyId)) {
      if (ad.websiteUrl) {
        window.open(ad.websiteUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // 2. Direct property listing on platform
    if (ad.propertyId) {
      const prop = listings.find((l) => l.id === ad.propertyId);
      if (prop) {
        handleOpenBooking(prop);
        return;
      }
    }

    // 3. Direct WhatsApp chat
    if (ad.whatsappNumber) {
      const message = encodeURIComponent(
        `Hello, I saw your verified advert "${ad.headline}" on DeltaRent. I would like to make an inquiry.`
      );
      window.open(`https://wa.me/${ad.whatsappNumber}?text=${message}`, '_blank');
      return;
    }

    // 4. Phone
    if (ad.phone) {
      window.open(`tel:${ad.phone.replace(/\s+/g, '')}`, '_self');
      return;
    }

    // 5. Fallback link
    if (ad.websiteUrl) {
      window.open(ad.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper: Check if listing freshness is unconfirmed (> 48 hours)
  const isFreshnessUnconfirmed = (lastConfirmedAt?: string) => {
    if (!lastConfirmedAt) return true;
    const confirmedTime = new Date(lastConfirmedAt).getTime();
    const now = new Date('2026-10-19T23:24:27+01:00').getTime();
    return (now - confirmedTime) > 48 * 60 * 60 * 1000;
  };

  // Smart Location & Word-Similarity Filter Logic with 48-Hour Proof-of-Life Ranking
  const filteredListings = useMemo(() => {
    const list = listings.filter((item) => {
      // 1. Auto-archive: hide rented out / archived listings from public feed
      if (item.isArchived) {
        return false;
      }
      // 2. Dynamic location matching (checks state, city, neighborhood, address)
      if (!matchesLocation(item, selectedCity, selectedState)) {
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

    // 3. 48-Hour Proof-of-Life Demotion: listings with unconfirmed freshness are demoted down the feed order
    return list.sort((a, b) => {
      const aUnconfirmed = isFreshnessUnconfirmed(a.lastConfirmedAt);
      const bUnconfirmed = isFreshnessUnconfirmed(b.lastConfirmedAt);
      if (aUnconfirmed && !bUnconfirmed) return 1;
      if (!aUnconfirmed && bUnconfirmed) return -1;
      return 0;
    });
  }, [listings, selectedCity, selectedState, selectedType, maxRent]);

  // Handler: Update listing availability status (Available, Under Inspection, Rented Out)
  const handleUpdateListingAvailability = (listingId: string, status: ListingAvailability) => {
    setListings((prev) =>
      prev.map((item) => (item.id === listingId ? { ...item, availabilityStatus: status } : item))
    );

    // If marked as Rented Out, auto-archive/hide from public feed within 3 seconds
    if (status === 'Rented Out') {
      setTimeout(() => {
        setListings((prev) =>
          prev.map((item) => (item.id === listingId ? { ...item, isArchived: true } : item))
        );
      }, 3000);
    }
  };

  // Handler: Refresh 48-hour proof-of-life heartbeat
  const handleConfirmListingFreshness = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { ...item, lastConfirmedAt: new Date().toISOString() }
          : item
      )
    );
  };

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

  // Handler: Update existing booking
  const handleUpdateBooking = (updatedBooking: BookingRecord) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  // Handler: Cancel user booking
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  // Handler: Toggle saved/bookmarked property
  const handleToggleSaveProperty = (propId: string) => {
    setSavedPropertyIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId]
    );
  };

  // Handler: Lister accepts a booking (Free instant contact unlock & push notification)
  const handleAcceptBooking = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const targetListing = listings.find((p) => p.id === targetBooking.propertyId);
    if (!targetListing) return;

    // Concurrency Rule: Lister can accept an applicant ONLY if requested slot has active capacity (< 5 bookings)
    const targetSlot = targetListing.inspectionSlots.find((s) => s.id === targetBooking.slotId);
    if (targetSlot && targetSlot.bookedCount >= 5 && targetBooking.status === 'QUEUED') {
      alert('Concurrency limit reached: This slot already has 5 confirmed applicants. An applicant must cancel before a standby applicant can be admitted.');
      return;
    }

    const updatedBooking: BookingRecord = {
      ...targetBooking,
      status: 'CONFIRMED_UNLOCKED',
      confirmedAt: new Date().toISOString(),
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? updatedBooking : b))
    );

    // Trigger instant PWA Web Push notification simulation
    const listerName = targetListing.agent.fullName || 'Chief Oghenetega Macaulay';
    const startTime = targetBooking.slotTimeWindow.includes('–')
      ? targetBooking.slotTimeWindow.split('–')[0].trim()
      : targetBooking.slotTimeWindow.includes('-')
      ? targetBooking.slotTimeWindow.split('-')[0].trim()
      : '2:00 PM';

    setPushNotification({
      title: 'Inspection Approved!',
      body: `${listerName} confirmed your inspection for tomorrow at ${startTime}. Tap to view contact details.`,
      listing: targetListing,
      booking: updatedBooking,
    });
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
      const updatedQueued = remainingBookings.map((b) => {
        if (b.id === queuedApplicant.id) {
          return {
            ...b,
            status: 'CONFIRMED_UNLOCKED' as const,
            queuePosition: undefined,
            confirmedAt: new Date().toISOString(),
          };
        }
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

  // Handler: User upgrades to Agent
  const handleBecomeAgent = (agentData: {
    agencyName: string;
    cacNumber: string;
    phone: string;
    cities: string[];
  }) => {
    const updatedAgentProfile: UserProfile = {
      ...currentUser,
      isAgent: true,
      agencyName: agentData.agencyName,
      cacNumber: agentData.cacNumber,
      phone: agentData.phone,
    };
    saveRegisteredUser(updatedAgentProfile);
    setCurrentUser(updatedAgentProfile);
    setCurrentRole('agent');
  };

  // Centralized booking opener with auth guard:
  // If user is a guest/unauthenticated, prompt signup/login and remember listing to resume!
  const handleOpenBooking = (listing: PropertyListing) => {
    if (!isAuthenticated) {
      setPendingBookingListing(listing);
      setSignupNotice({
        title: 'Sign Up Required to Book Inspection',
        message: `Create a free account or sign in to book your inspection slot for "${listing.title}". It takes less than 30 seconds!`,
      });
      setSignupInitialRole('seeker');
      setSignupInitialMode('signup');
      setIsSignupOpen(true);
      return;
    }
    setActiveModalListing(listing);
  };

  const handleOpenSignup = () => {
    if (isAuthenticated) return;
    setSignupNotice(null);
    setSignupInitialRole('seeker');
    setSignupInitialMode('signup');
    setIsSignupOpen(true);
  };

  const handleOpenLogin = () => {
    if (isAuthenticated) return;
    setSignupNotice(null);
    setSignupInitialRole('seeker');
    setSignupInitialMode('login');
    setIsSignupOpen(true);
  };

  const handleOpenAgentSignup = () => {
    if (isAuthenticated) return;
    setSignupNotice(null);
    setSignupInitialRole('agent');
    setSignupInitialMode('signup');
    setIsSignupOpen(true);
  };

  const handleSkipSignup = () => {
    sessionStorage.setItem('deltarent_guest_skipped', 'true');
    setIsSignupOpen(false);
    setSignupNotice(null);
    setPendingBookingListing(null);
    setUserView('feed');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('deltarent_auth');
    localStorage.removeItem('deltarent_user');
    setCurrentRole('seeker');
    setUserView('feed');
  };

  const handleUpdateAvatar = (avatarUrl: string) => {
    const updated: UserProfile = {
      ...currentUser,
      avatarUrl,
    };
    saveRegisteredUser(updated);
    setCurrentUser(updated);
    localStorage.setItem('deltarent_user', JSON.stringify(updated));
  };

  // Handler: Update current user from signup/login modal
  const handleUpdateUser = (updatedUser: UserProfile, role?: 'seeker' | 'agent') => {
    saveRegisteredUser(updatedUser);
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('deltarent_auth', 'true');
    localStorage.setItem('deltarent_user', JSON.stringify(updatedUser));
    setSignupNotice(null);

    if (role === 'agent' || updatedUser.isAgent) {
      setCurrentRole('agent');
      setPendingBookingListing(null);
    } else {
      setCurrentRole('seeker');
      // If there was a pending booking attempt, smoothly open the inspection booking modal for them!
      if (pendingBookingListing) {
        const target = pendingBookingListing;
        setPendingBookingListing(null);
        setTimeout(() => {
          setActiveModalListing(target);
        }, 350);
      }
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCity('All Delta Cities');
    setSelectedType('All Property Types');
    setMaxRent(5000000);
  };

  // Determine root container layout:
  // Seeker Feed is viewport locked for snap reels; Seeker Dashboard and Agent Dashboard are naturally scrolling pages.
  const isFeedView = currentRole === 'seeker' && (userView === 'feed' || !isAuthenticated);

  return (
    <div className={`bg-[#FCF9F5] text-[#000004] flex flex-col font-body selection:bg-[#342A21]/15 selection:text-[#342A21] ${
      isFeedView ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen overflow-x-hidden'
    }`}>
      {/* 1. Global Navigation Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        userView={userView}
        onChangeUserView={setUserView}
        activeBookings={bookings}
        onOpenMyPasses={() => {
          if (!isAuthenticated) {
            handleOpenSignup();
            return;
          }
          setIsMyPassesOpen(true);
        }}
        onOpenProfile={() => {
          if (!isAuthenticated) {
            handleOpenSignup();
            return;
          }
          setIsProfileOpen(true);
        }}
        currentUser={currentUser}
        onOpenBecomeAgent={() => setIsBecomeAgentOpen(true)}
        onOpenSignup={handleOpenSignup}
        onOpenLogin={handleOpenLogin}
        isAuthenticated={isAuthenticated}
        onOpenAgentSignup={handleOpenAgentSignup}
      />

      {/* 2. Main Content Area */}
      {currentRole === 'seeker' ? (
        userView === 'dashboard' && isAuthenticated ? (
          /* Seeker / User Dashboard: Strictly for authenticated users */
          <main className="flex-1 w-full">
            <UserDashboard
              currentUser={currentUser}
              listings={listings}
              bookings={bookings}
              savedPropertyIds={savedPropertyIds}
              onToggleSaveProperty={handleToggleSaveProperty}
              onOpenBookingModal={handleOpenBooking}
              onCancelBooking={handleCancelBooking}
              onOpenMyPasses={() => setIsMyPassesOpen(true)}
              onOpenBecomeAgent={() => setIsBecomeAgentOpen(true)}
              onOpenSignup={handleOpenSignup}
              onSwitchToFeed={() => setUserView('feed')}
              onSwitchToAgent={() => setCurrentRole('agent')}
              isAuthenticated={isAuthenticated}
            />
          </main>
        ) : (
          /* Seeker Snap Feed View */
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
              listings={listings}
              adverts={adverts}
              onSelectAdvert={handleSelectAdvert}
              onOpenPostAd={() => setIsPostAdOpen(true)}
            />

            {/* Responsive Layout: Desktop features Sponsored Ads on left; mobile features in-feed sponsored carousel as tenants scroll down */}
            <div className="w-full max-w-7xl mx-auto h-[calc(100dvh-112px)] mt-[112px] flex items-center justify-center gap-6 px-2 sm:px-6 overflow-hidden">
              {/* Desktop Left Side Sponsored Ads */}
              <DesktopAdvertSidebar
                adverts={adverts}
                onSelectAdvert={handleSelectAdvert}
                onOpenPostAd={() => setIsPostAdOpen(true)}
              />

              {/* Main Property Rental Continuous Feed */}
              <div className="w-full max-w-xl xl:max-w-2xl h-full overflow-hidden flex-1 flex flex-col justify-start">
                <PropertyFeed
                  listings={filteredListings}
                  bookings={bookings}
                  onBookSlot={handleBookSlot}
                  onUpdateBooking={handleUpdateBooking}
                  onSimulateAgentAccept={handleAcceptBooking}
                  onOpenBookingModal={handleOpenBooking}
                  onUpdateAvailability={handleUpdateListingAvailability}
                  onConfirmFreshness={handleConfirmListingFreshness}
                  onResetFilters={handleResetFilters}
                  adverts={adverts}
                  onSelectAdvert={handleSelectAdvert}
                  onOpenPostAd={() => setIsPostAdOpen(true)}
                />
              </div>
            </div>
          </main>
        )
      ) : (
        /* Agent Mode Portal */
        <main className="flex-1 w-full">
          <AgentDashboard
            currentUser={currentUser}
            listings={listings}
            bookings={bookings}
            onAcceptBooking={handleAcceptBooking}
            onRejectBooking={handleRejectBooking}
            onListingCreated={handleListingCreated}
            onUpdateAvailability={handleUpdateListingAvailability}
            onConfirmFreshness={handleConfirmListingFreshness}
            onSwitchToSeeker={() => {
              setCurrentRole('seeker');
              setUserView('feed');
            }}
          />
        </main>
      )}

      {/* 3. Global Drawers & Modals */}
      <MyPassesModal
        isOpen={isMyPassesOpen}
        onClose={() => setIsMyPassesOpen(false)}
        bookings={bookings}
        listings={listings}
        onOpenBookingModal={handleOpenBooking}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        activeBookings={bookings}
        onOpenMyPasses={() => setIsMyPassesOpen(true)}
        currentUser={currentUser}
        onUpdateAvatar={handleUpdateAvatar}
        onUpdateProfile={handleUpdateUser}
        onOpenBecomeAgent={() => setIsBecomeAgentOpen(true)}
        onOpenSignup={handleOpenSignup}
        onSignOut={handleSignOut}
      />

      <BecomeAgentModal
        isOpen={isBecomeAgentOpen}
        onClose={() => setIsBecomeAgentOpen(false)}
        currentUser={currentUser}
        onBecomeAgent={handleBecomeAgent}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => {
          setIsSignupOpen(false);
          setSignupNotice(null);
        }}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onSkip={handleSkipSignup}
        initialRole={signupInitialRole}
        initialMode={signupInitialMode}
        notice={signupNotice}
        isAuthenticated={isAuthenticated}
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


      <PostAdModal
        isOpen={isPostAdOpen}
        onClose={() => setIsPostAdOpen(false)}
        onAddAdvert={handleAddAdvert}
      />

      {/* 4. Instant PWA Web Push Notification Banner Simulation */}
      <PushNotificationBanner
        notification={pushNotification}
        onDismiss={() => setPushNotification(null)}
        onClickNotification={(data) => {
          setPushNotification(null);
          setUnlockedSheetData({ listing: data.listing, booking: data.booking });
        }}
      />

      {/* 5. Global Free Instant Unlocked Contact Sheet */}
      {unlockedSheetData && (
        <UnlockedContactSheet
          isOpen={Boolean(unlockedSheetData)}
          onClose={() => setUnlockedSheetData(null)}
          listing={unlockedSheetData.listing}
          booking={unlockedSheetData.booking}
        />
      )}
    </div>
  );
}

export default App;
