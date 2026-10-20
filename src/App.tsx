import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { INITIAL_LISTINGS } from './data/mockListings';
import { PropertyListing, BookingRecord, UserRole, UserProfile, ListingAvailability } from './types/marketplace';
import { Header } from './components/Header';
import { setAppBadge, clearAppBadge } from './utils/pwa';
import { saveRegisteredUser, isBookingForUser, getMyDeviceBookingIds, recordMyDeviceBookingId, clearMyDeviceBookingIds, getNotifiedBookingIds, recordNotifiedBookingId } from './utils/userRegistry';
import { isLocalUrl } from './utils/environment';
import { PropertyFeed } from './components/Feed/PropertyFeed';
import { FilterBar } from './components/Feed/FilterBar';
import { matchesLocation } from './utils/locationMatcher';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { FALLBACK_PROPERTY_IMAGES } from './utils/mediaStorage';
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
import { fetchAllListings, saveNewListing, updateListing, deleteListing, updateAvailability, confirmFreshness, getDeletedListingIds, recordDeletedListingId } from './services/listingService';
import { fetchAllBookings, saveNewBooking, updateBookingStatus } from './services/bookingService';
import { supabase, isSupabaseConfigured, getSupabaseClient } from './utils/supabaseClient';
import { broadcastRealtimeEvent, subscribeToRealtimeEvents } from './services/realtimeSync';
import { playNotificationSound, showDeviceNotification, requestDeviceNotificationPermission } from './utils/realtimeNotifications';

// Initial User Profile (Tenant Demo User)
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

// Guest Profile for new, unauthenticated visitors
const GUEST_USER: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  state: 'Delta State',
  city: 'Asaba',
  preferredPropertyType: 'Bedseater',
  isVerifiedTenant: false,
  isAgent: false,
  savedListingIds: [],
  createdAt: '',
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

interface InitialNavState {
  role: UserRole;
  view: 'dashboard' | 'feed';
  openPasses: boolean;
}

/**
 * Resolves the initial navigation state upon page load or browser refresh.
 * Preserves the exact view the user or agent was on (Explore, Agent Portal, Dashboard, Passes)
 * so every page refresh stays on the same page instead of resetting.
 */
function resolveInitialNavState(isUserAgent: boolean): InitialNavState {
  if (typeof window === 'undefined') {
    return { role: isUserAgent ? 'agent' : 'seeker', view: 'feed', openPasses: false };
  }

  const hash = window.location.hash.toLowerCase();
  const savedRole = localStorage.getItem('deltarent_active_role') as UserRole | null;
  const savedView = localStorage.getItem('deltarent_active_view') as ('dashboard' | 'feed') | null;

  // 1. Explicit Hash Routing (e.g. #/agent, #/dashboard, #/explore, #/inspections)
  if (hash.includes('agent')) {
    if (isUserAgent) {
      return { role: 'agent', view: 'feed', openPasses: false };
    }
  }
  if (hash.includes('dashboard')) {
    return { role: 'seeker', view: 'dashboard', openPasses: false };
  }
  if (hash.includes('explore') || hash.includes('feed')) {
    return { role: 'seeker', view: 'feed', openPasses: false };
  }
  if (hash.includes('inspections') || hash.includes('passes')) {
    return { role: 'seeker', view: savedView === 'dashboard' ? 'dashboard' : 'feed', openPasses: true };
  }

  // 2. LocalStorage Persistence (Preserves active page across normal F5 / page reloads)
  if (savedRole === 'agent' && isUserAgent) {
    return { role: 'agent', view: 'feed', openPasses: false };
  }
  if (savedRole === 'seeker') {
    return { role: 'seeker', view: savedView === 'dashboard' ? 'dashboard' : 'feed', openPasses: false };
  }

  // 3. Fallback defaults:
  if (isUserAgent) {
    return { role: 'agent', view: 'feed', openPasses: false };
  }
  return { role: 'seeker', view: 'feed', openPasses: false };
}

export function App() {
  const [listings, setListings] = useState<PropertyListing[]>(() => {
    const saved = localStorage.getItem('deltarent_listings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep custom agent listings created on this device, and sanitize any expired blob URLs
          const deletedIds = getDeletedListingIds();
          const customAgentListings = parsed
            .filter((item: PropertyListing) => 
              item.id && 
              !deletedIds.has(item.id) &&
              item.availabilityStatus !== 'Deleted' &&
              item.id.startsWith('prop-agent-')
            )
            .map((item: PropertyListing, idx: number) => {
              const sanitizedMedia = (item.media || []).map((m, mIdx) => {
                const isBlob = typeof m.url === 'string' && m.url.startsWith('blob:');
                if (isBlob) {
                  const fallback = FALLBACK_PROPERTY_IMAGES[(idx + mIdx) % FALLBACK_PROPERTY_IMAGES.length];
                  return {
                    ...m,
                    url: m.poster || fallback,
                    poster: m.poster || fallback,
                  };
                }
                return m;
              });

              return {
                ...item,
                media: sanitizedMedia.length > 0 ? sanitizedMedia : [{
                  type: 'image' as const,
                  url: FALLBACK_PROPERTY_IMAGES[idx % FALLBACK_PROPERTY_IMAGES.length],
                  caption: 'Property Exterior',
                }],
              };
            });

          // Only return real listings created by agents (exclude all mock/demo listings)
          return customAgentListings;
        }
      } catch (e) {
        console.error('Failed to parse saved listings', e);
      }
    }
    return [];
  });

  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    const isLocal = isLocalUrl();
    const saved = localStorage.getItem('deltarent_bookings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!isLocal) {
            return parsed.filter((b: BookingRecord) =>
              !INITIAL_BOOKINGS.some((m) => m.id === b.id)
            );
          }
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return isLocal ? INITIAL_BOOKINGS : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('deltarent_listings', JSON.stringify(listings));
    } catch (e) {
      // ignore
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem('deltarent_bookings', JSON.stringify(bookings));
    } catch (e) {
      // ignore
    }
  }, [bookings]);

  // User Authentication State (Persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isLocal = isLocalUrl();
    const isAuth = localStorage.getItem('deltarent_auth') === 'true';
    if (!isLocal && isAuth) {
      const saved = localStorage.getItem('deltarent_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.id === 'DT-USR-8492' || parsed.id === 'DT-AGT-9012') {
            localStorage.removeItem('deltarent_auth');
            localStorage.removeItem('deltarent_user');
            return false;
          }
        } catch (e) {}
      }
    }
    return isAuth;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const isLocal = isLocalUrl();
    const isAuth = localStorage.getItem('deltarent_auth') === 'true';
    const saved = localStorage.getItem('deltarent_user');
    if (isAuth && saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!isLocal && (parsed.id === 'DT-USR-8492' || parsed.id === 'DT-AGT-9012')) {
          return GUEST_USER;
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return (isAuth && isLocal) ? INITIAL_USER : GUEST_USER;
  });

  // Track booking IDs created on this specific device/session
  const [myDeviceBookingIds, setMyDeviceBookingIds] = useState<Set<string>>(() => getMyDeviceBookingIds());

  // Strict User Isolation: Filter bookings that belong strictly to THIS logged-in user / tenant
  // Ensures one tenant's booking or approval never appears on another tenant's screen or feed card
  const userBookings = useMemo(() => {
    return bookings.filter((b) => isBookingForUser(b, currentUser, myDeviceBookingIds));
  }, [bookings, currentUser, myDeviceBookingIds]);

  // Navigation State Initialization: Resolves from URL Hash or localStorage
  // Ensures refreshing keeps users on their current page (Explore, Agent Portal, Dashboard, Passes)
  const initialNav = useMemo(() => {
    let isAgent = false;
    const isAuth = localStorage.getItem('deltarent_auth') === 'true';
    if (isAuth) {
      const savedUser = localStorage.getItem('deltarent_user');
      if (savedUser) {
        try { isAgent = Boolean(JSON.parse(savedUser).isAgent); } catch (_) {}
      }
    }
    return resolveInitialNavState(isAgent);
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>(initialNav.role);
  const [userView, setUserView] = useState<'dashboard' | 'feed'>(initialNav.view);
  const [isMyPassesOpen, setIsMyPassesOpen] = useState(initialNav.openPasses);

  // 1. Keep active view & role in sync with localStorage and URL Hash on every navigation
  useEffect(() => {
    try {
      localStorage.setItem('deltarent_active_role', currentRole);
      localStorage.setItem('deltarent_active_view', userView);
    } catch (_) {}

    const targetHash = currentRole === 'agent' ? '#/agent' : userView === 'dashboard' ? '#/dashboard' : '#/explore';
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  }, [currentRole, userView]);

  // 2. Support browser Back/Forward navigation seamlessly via hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('agent') && (currentUser.isAgent || currentRole === 'agent')) {
        setCurrentRole('agent');
      } else if (hash.includes('dashboard')) {
        setCurrentRole('seeker');
        setUserView('dashboard');
      } else if (hash.includes('inspections') || hash.includes('passes')) {
        setIsMyPassesOpen(true);
      } else if (hash.includes('explore') || hash.includes('feed')) {
        setCurrentRole('seeker');
        setUserView('feed');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser.isAgent, currentRole]);

  // Background Data Synchronizer without requiring manual page reloads
  const syncLatestData = useCallback(async () => {
    try {
      const [fetchedListings, fetchedBookings] = await Promise.all([
        fetchAllListings(),
        fetchAllBookings(),
      ]);

      if (fetchedListings && fetchedListings.length > 0) {
        setListings(fetchedListings);
      }
      if (fetchedBookings) {
        setBookings(fetchedBookings);
      }
    } catch (err) {
      console.warn('[DeltaRent Sync] Real-time background refresh notice:', err);
    }
  }, []);

  // When user opens the app, unlocks screen, or switches to tab, auto-sync immediately without reload
  useEffect(() => {
    syncLatestData();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLatestData();
      }
    };
    const handleFocus = () => {
      syncLatestData();
    };
    const handleOnline = () => {
      syncLatestData();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Heartbeat auto-sync every 12 seconds in background
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncLatestData();
      }
    }, 12000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [syncLatestData]);

  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(() => {
    const isAuth = localStorage.getItem('deltarent_auth') === 'true';
    if (!isAuth) return [];
    const saved = localStorage.getItem('deltarent_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.savedListingIds || [];
      } catch (e) {}
    }
    return [];
  });

  // Filter state
  const [selectedCity, setSelectedCity] = useState('All Delta Cities');
  const [selectedType, setSelectedType] = useState('All Property Types');
  const [selectedState, setSelectedState] = useState('Delta State');
  const [maxRent, setMaxRent] = useState(5000000);

  // Modals & Navigation state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  // Real-time Push Notifications & Pop-up Alerts across devices and tabs without page reload
  useEffect(() => {
    let isMounted = true;

    // A. Cross-device & cross-tab custom event listener
    const unsubBroadcast = subscribeToRealtimeEvents((event) => {
      if (!isMounted) return;

      if (event.type === 'NEW_BOOKING_REQUEST' && event.booking) {
        setBookings((prev) => [event.booking!, ...prev.filter((b) => b.id !== event.booking!.id)]);

        const targetListing = event.listing || listings.find((p) => p.id === event.booking!.propertyId);
        if (currentUser.isAgent && currentUser.phone !== event.booking.applicantPhone) {
          const title = targetListing ? targetListing.title : 'your listing';
          setPushNotification({
            title: '🔔 New Inspection Request!',
            body: `${event.booking.applicantName} requested inspection for "${title}" (${event.booking.slotTimeWindow}).`,
            type: 'inspection_request',
            listing: targetListing,
            booking: event.booking,
            actionText: 'Tap to review in Agent Portal',
            onAction: () => {
              setCurrentRole('agent');
            },
          });
          showDeviceNotification('🔔 New Inspection Request!', {
            body: `${event.booking.applicantName} requested inspection for "${title}".`,
          });
          playNotificationSound('alert');
        }
      } else if (event.type === 'BOOKING_ACCEPTED' && event.booking) {
        setBookings((prev) => prev.map((b) => (b.id === event.booking!.id ? event.booking! : b)));

        const targetListing = event.listing || listings.find((p) => p.id === event.booking!.propertyId);
        const isApplicant = isBookingForUser(event.booking, currentUser, myDeviceBookingIds);

        if (isApplicant && !currentUser.isAgent) {
          recordNotifiedBookingId(event.booking.id);
          const agentName = targetListing?.agent.fullName || 'The Lister';
          setPushNotification({
            title: '🎉 Inspection Approved!',
            body: `${agentName} confirmed your inspection for "${targetListing?.title || 'the property'}". Contact details unlocked!`,
            type: 'inspection_confirmed',
            listing: targetListing,
            booking: event.booking,
            actionText: 'Tap to view unlocked contact details',
            onAction: () => {
              if (targetListing && event.booking) {
                setUnlockedSheetData({ listing: targetListing, booking: event.booking });
              }
            },
          });
          showDeviceNotification('🎉 Inspection Approved!', {
            body: `${agentName} confirmed your inspection. Contact details unlocked!`,
            onClick: () => {
              if (targetListing && event.booking) {
                setUnlockedSheetData({ listing: targetListing, booking: event.booking });
              }
            },
          });
          playNotificationSound('success');
        }
      } else if (event.type === 'LISTING_CREATED' && event.listing) {
        setListings((prev) => [event.listing!, ...prev.filter((l) => l.id !== event.listing!.id)]);
        if (!currentUser.isAgent) {
          setPushNotification({
            title: `🏡 New Property in ${event.listing.city}!`,
            body: `"${event.listing.title}" was just listed. Tap to view.`,
            type: 'new_listing',
            listing: event.listing,
            actionText: 'Tap to view in Explore feed',
            onAction: () => {
              setCurrentRole('seeker');
              setUserView('feed');
            },
          });
          playNotificationSound('info');
        }
      } else if (event.type === 'LISTING_UPDATED' && event.listing) {
        setListings((prev) => prev.map((l) => (l.id === event.listing!.id ? event.listing! : l)));
      } else if (event.type === 'LISTING_DELETED' && event.listingId) {
        setListings((prev) => prev.filter((l) => l.id !== event.listingId));
      }
    });

    // B. Supabase Postgres Realtime replication listener
    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      const channel = client
        .channel('deltarent_realtime_db_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'listings' },
          (payload) => {
            if (!isMounted) return;
            fetchAllListings().then((updated) => {
              if (!isMounted || !updated) return;
              setListings(updated);

              if (payload.eventType === 'INSERT' && payload.new) {
                const newRow = payload.new as any;
                const isMine = currentUser.isAgent && (newRow.agent_id === currentUser.id || newRow.agentId === currentUser.id);
                if (!isMine && !currentUser.isAgent) {
                  const city = newRow.city || 'Delta State';
                  const title = newRow.title || 'Verified Property';
                  setPushNotification({
                    title: `🏡 New Property in ${city}!`,
                    body: `"${title}" was just listed by an agent. Tap to view.`,
                    type: 'new_listing',
                    actionText: 'Tap to view in Explore',
                    onAction: () => {
                      setCurrentRole('seeker');
                      setUserView('feed');
                    },
                  });
                  playNotificationSound('info');
                }
              }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          (payload) => {
            if (!isMounted) return;
            fetchAllBookings().then((updated) => {
              if (!isMounted || !updated) return;
              setBookings(updated);

              if (payload.eventType === 'INSERT' && payload.new) {
                const newBookingRow = payload.new as any;
                const applicantName = newBookingRow.applicant_name || newBookingRow.applicantName || 'Applicant';
                const applicantPhone = newBookingRow.applicant_phone || newBookingRow.applicantPhone;
                const propId = newBookingRow.property_id || newBookingRow.propertyId;
                const slotTime = newBookingRow.slot_time_window || newBookingRow.slotTimeWindow || '';
                const targetListing = listings.find((p) => p.id === propId);

                const isMe = currentUser.phone && applicantPhone &&
                  currentUser.phone.replace(/[^0-9]/g, '').slice(-10) === applicantPhone.replace(/[^0-9]/g, '').slice(-10);

                if (currentUser.isAgent && !isMe) {
                  const propTitle = targetListing?.title || 'your listed property';
                  setPushNotification({
                    title: '🔔 New Inspection Request!',
                    body: `${applicantName} booked an inspection for "${propTitle}" (${slotTime}).`,
                    type: 'inspection_request',
                    actionText: 'Tap to review in Agent Portal',
                    onAction: () => {
                      setCurrentRole('agent');
                    },
                  });
                  showDeviceNotification('🔔 New Inspection Request!', {
                    body: `${applicantName} booked "${propTitle}" (${slotTime}).`,
                  });
                  playNotificationSound('alert');
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedRow = payload.new as any;
                const status = updatedRow.status;
                const propId = updatedRow.property_id || updatedRow.propertyId;
                const targetListing = listings.find((p) => p.id === propId);

                const bookingRecord: BookingRecord = {
                  id: updatedRow.id,
                  propertyId: propId,
                  slotId: updatedRow.slot_id || updatedRow.slotId,
                  slotTimeWindow: updatedRow.slot_time_window || updatedRow.slotTimeWindow,
                  slotDate: updatedRow.slot_date || updatedRow.slotDate,
                  applicantName: updatedRow.applicant_name || updatedRow.applicantName || 'Applicant',
                  applicantPhone: updatedRow.applicant_phone || updatedRow.applicantPhone,
                  applicantEmail: updatedRow.applicant_email || updatedRow.applicantEmail,
                  status: status as any,
                  inspectionFeeAmount: Number(updatedRow.inspection_fee_amount || 0),
                  createdAt: updatedRow.created_at || updatedRow.createdAt || new Date().toISOString(),
                  confirmedAt: updatedRow.confirmed_at || updatedRow.confirmedAt || new Date().toISOString(),
                };

                const isMe = isBookingForUser(bookingRecord, currentUser, myDeviceBookingIds);

                if (isMe && !currentUser.isAgent && (status === 'CONFIRMED_UNLOCKED' || status === 'APPROVED_CONFIRMED')) {
                  recordNotifiedBookingId(bookingRecord.id);
                  const agentName = targetListing?.agent.fullName || 'Agent';
                  const propTitle = targetListing?.title || 'the property';

                  setPushNotification({
                    title: '🎉 Inspection Approved!',
                    body: `${agentName} confirmed your inspection for "${propTitle}". Contact details unlocked!`,
                    type: 'inspection_confirmed',
                    listing: targetListing,
                    booking: bookingRecord,
                    actionText: 'Tap to view unlocked contact',
                    onAction: () => {
                      if (targetListing) {
                        setUnlockedSheetData({ listing: targetListing, booking: bookingRecord });
                      }
                    },
                  });
                  showDeviceNotification('🎉 Inspection Approved!', {
                    body: `${agentName} confirmed your inspection. Contact details unlocked!`,
                    onClick: () => {
                      if (targetListing) {
                        setUnlockedSheetData({ listing: targetListing, booking: bookingRecord });
                      }
                    },
                  });
                  playNotificationSound('success');
                }
              }
            });
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        client.removeChannel(channel);
        unsubBroadcast();
      };
    }

    return () => {
      isMounted = false;
      unsubBroadcast();
    };
  }, [currentUser, myDeviceBookingIds, listings]);

  // Synchronize dynamic home-screen badge count strictly with THIS user's active inspection passes
  useEffect(() => {
    const activePassesCount = userBookings.filter(
      (b) => b.status === 'CONFIRMED_UNLOCKED' || b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED' || b.status === 'ACCEPTED_PENDING_PAYMENT'
    ).length;
    if (activePassesCount > 0) {
      setAppBadge(activePassesCount);
    } else {
      clearAppBadge();
    }
  }, [userBookings]);

  // Persistent Tenant Notification Trigger:
  // Guarantees the applying tenant receives their celebratory alert & unlocked contact prompt
  // even if their app was closed, offline, or logged out when the agent approved the booking.
  useEffect(() => {
    if (!currentUser || currentUser.isAgent) return;

    const notified = getNotifiedBookingIds();
    const unnotifiedConfirmedBooking = userBookings.find(
      (b) =>
        (b.status === 'CONFIRMED_UNLOCKED' || b.status === 'APPROVED_CONFIRMED') &&
        !notified.has(b.id)
    );

    if (unnotifiedConfirmedBooking) {
      recordNotifiedBookingId(unnotifiedConfirmedBooking.id);

      const targetListing = listings.find((p) => p.id === unnotifiedConfirmedBooking.propertyId);
      const agentName = targetListing?.agent.fullName || 'The Lister';
      const propTitle = targetListing?.title || 'the property';

      setPushNotification({
        title: '🎉 Inspection Approved!',
        body: `${agentName} confirmed your inspection for "${propTitle}". Contact details unlocked!`,
        type: 'inspection_confirmed',
        listing: targetListing,
        booking: unnotifiedConfirmedBooking,
        actionText: 'Tap to view unlocked contact',
        onAction: () => {
          if (targetListing) {
            setUnlockedSheetData({ listing: targetListing, booking: unnotifiedConfirmedBooking });
          }
        },
      });

      playNotificationSound('success');
      showDeviceNotification('🎉 Inspection Approved!', {
        body: `${agentName} confirmed your inspection for "${propTitle}". Contact details unlocked!`,
        onClick: () => {
          if (targetListing) {
            setUnlockedSheetData({ listing: targetListing, booking: unnotifiedConfirmedBooking });
          }
        },
      });
    }
  }, [userBookings, listings, currentUser]);

  // Authentication gating & resume booking state
  const [pendingBookingListing, setPendingBookingListing] = useState<PropertyListing | null>(null);
  const [signupNotice, setSignupNotice] = useState<{ title: string; message: string } | null>(null);
  const [signupInitialRole, setSignupInitialRole] = useState<'seeker' | 'agent'>('seeker');
  const [signupInitialMode, setSignupInitialMode] = useState<'signup' | 'login'>('signup');

  // Sponsored adverts state - Only seed demo ads on local development
  const [adverts, setAdverts] = useState<AdvertStory[]>(() => {
    const isLocal = isLocalUrl();
    const saved = localStorage.getItem('deltarent_adverts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!isLocal) {
            return parsed.filter((ad: AdvertStory) =>
              !MOCK_ADVERT_STORIES.some((m) => m.id === ad.id)
            );
          }
          return parsed;
        }
      } catch (e) {}
    }
    return isLocal ? MOCK_ADVERT_STORIES : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('deltarent_adverts', JSON.stringify(adverts));
    } catch (e) {}
  }, [adverts]);

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
      // 1. Auto-archive: hide rented out, deleted, or archived listings from public feed
      if (item.isArchived || item.availabilityStatus === 'Deleted') {
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
    updateAvailability(listingId, status);

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
    confirmFreshness(listingId);
  };

  // Handler: Book an inspection slot
  const handleBookSlot = (newBooking: BookingRecord) => {
    recordMyDeviceBookingId(newBooking.id);
    setMyDeviceBookingIds((prev) => new Set([...prev, newBooking.id]));
    setBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);
    saveNewBooking(newBooking);

    const targetListing = listings.find((p) => p.id === newBooking.propertyId);

    // Broadcast across all connected devices and open tabs immediately
    broadcastRealtimeEvent('NEW_BOOKING_REQUEST', {
      booking: newBooking,
      listing: targetListing,
    });

    // Proactively request device notification permission if not yet decided
    requestDeviceNotificationPermission().catch(() => {});

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
    updateBookingStatus(bookingId, 'CONFIRMED_UNLOCKED');

    // Broadcast booking acceptance to user devices and tabs in real-time
    broadcastRealtimeEvent('BOOKING_ACCEPTED', {
      booking: updatedBooking,
      listing: targetListing,
    });

    // Provide immediate feedback to the AGENT that they successfully confirmed the applicant
    if (currentUser.isAgent) {
      setPushNotification({
        title: '✅ Inspection Approved!',
        body: `You approved ${targetBooking.applicantName}'s inspection for "${targetListing.title}". Contact details unlocked for applicant.`,
        type: 'general',
      });
      playNotificationSound('info');
    }
  };

  // Handler: Agent declines a slot -> Automatically promotes next queued applicant!
  const handleRejectBooking = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    updateBookingStatus(bookingId, 'REJECTED_BY_AGENT');

    broadcastRealtimeEvent('BOOKING_REJECTED', {
      bookingId,
      propertyId: targetBooking.propertyId,
    });

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
    saveNewListing(newListing);
    broadcastRealtimeEvent('LISTING_CREATED', {
      listing: newListing,
    });
  };

  // Handler: Update listing from agent editor
  const handleListingUpdated = (updatedListing: PropertyListing) => {
    setListings((prev) => prev.map((l) => (l.id === updatedListing.id ? updatedListing : l)));
    updateListing(updatedListing);
    broadcastRealtimeEvent('LISTING_UPDATED', {
      listing: updatedListing,
    });
  };

  // Handler: Delete listing permanently
  const handleDeleteListing = async (listingId: string) => {
    recordDeletedListingId(listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    broadcastRealtimeEvent('LISTING_DELETED', {
      listingId,
    });
    await deleteListing(listingId);
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
    localStorage.removeItem('deltarent_active_role');
    localStorage.removeItem('deltarent_active_view');
    clearMyDeviceBookingIds();
    setMyDeviceBookingIds(new Set());
    setCurrentUser(GUEST_USER);
    setCurrentRole('seeker');
    setSavedPropertyIds([]);
    setUserView('feed');
    window.location.hash = '#/explore';
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

    if (updatedUser.savedListingIds) {
      setSavedPropertyIds(updatedUser.savedListingIds);
    }

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
        activeBookings={userBookings}
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
              bookings={userBookings}
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
                  userBookings={userBookings}
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
                  totalListingsCount={listings.length}
                  onOpenBecomeAgent={() => {
                    if (isAuthenticated) {
                      setIsBecomeAgentOpen(true);
                    } else {
                      handleOpenAgentSignup();
                    }
                  }}
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
            onListingUpdated={handleListingUpdated}
            onDeleteListing={handleDeleteListing}
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
        bookings={userBookings}
        listings={listings}
        onOpenBookingModal={handleOpenBooking}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        activeBookings={userBookings}
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
          existingBooking={userBookings.find((b) => b.propertyId === activeModalListing.id)}
          currentUser={currentUser}
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
          if (data.onAction) {
            data.onAction();
          } else if (data.listing && data.booking) {
            setUnlockedSheetData({ listing: data.listing, booking: data.booking });
          }
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
