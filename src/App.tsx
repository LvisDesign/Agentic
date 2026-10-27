import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PropertyListing, BookingRecord, UserRole, UserProfile, ListingAvailability, PlatformSettings } from './types/marketplace';
import { Header } from './components/Header';
import { setAppBadge, clearAppBadge, autoEnableNotifications } from './utils/pwa';
import { 
  saveRegisteredUser, 
  saveRegisteredUserAsync, 
  isBookingForUser, 
  getMyDeviceBookingIds, 
  recordMyDeviceBookingId, 
  clearMyDeviceBookingIds, 
  getNotifiedBookingIds, 
  recordNotifiedBookingId, 
  getNotifiedDeclinedBookingIds, 
  recordNotifiedDeclinedBookingId, 
  getNotifiedAgentBookingIds, 
  recordNotifiedAgentBookingId,
  fetchRegisteredUsersFromDb,
  mapDbToUserProfile,
  normalizePhoneNumber
} from './utils/userRegistry';
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
import { NotificationsModal } from './components/Notifications/NotificationsModal';
import { UserProfileModal } from './components/Profile/UserProfileModal';
import { InspectionBookingModal } from './components/Booking/InspectionBookingModal';
import { AdvertStory } from './data/mockAdverts';
import { loadAllAdverts, saveAdvert, removeAdvert, subscribeToAdvertChanges, getDeletedAdvertIds, SYSTEM_DEMO_ADVERT_IDS } from './services/adService';
import { PostAdModal } from './components/Feed/PostAdModal';
import { PartnerAdSubmissionModal } from './components/Adverts/PartnerAdSubmissionModal';
import { PartnerPortalPage } from './components/Partner/PartnerPortalPage';
import { AdvertiserAuthModal } from './components/Advertiser/AdvertiserAuthModal';
import { getActiveAdvertiser } from './services/advertiserAuthService';
import { DesktopAdvertSidebar } from './components/Feed/DesktopAdvertSidebar';
import { JobsFeed } from './components/Jobs/JobsFeed';
import { JobsDashboard } from './components/Jobs/JobsDashboard';
import { JobAgentDashboard } from './components/Jobs/JobAgentDashboard';
import { PushNotificationBanner, PushNotificationData } from './components/Notifications/PushNotificationBanner';
import { UnlockedContactSheet } from './components/Booking/UnlockedContactSheet';
import { SuperAdminDashboard } from './components/Admin/SuperAdminDashboard';
import { CustomConfirmModal } from './components/UI/CustomConfirmModal';
import { AdminAuthPortal } from './components/Admin/AdminAuthPortal';
import { 
  isSuperAdminAuthenticated, 
  getActiveAdminUser, 
  logoutAdminSession, 
  DEFAULT_SUPER_ADMIN_USER,
  OFFICIAL_ADMIN_EMAIL,
  verifyAdminSessionWithSupabase
} from './services/adminAuthService';
import { getPlatformSettings } from './services/adminService';
import { fetchAllListings, saveNewListing, updateListing, deleteListing, updateAvailability, confirmFreshness, getDeletedListingIds, recordDeletedListingId } from './services/listingService';
import { fetchAllBookings, saveNewBooking, updateBookingStatus } from './services/bookingService';
import { supabase, isSupabaseConfigured, getSupabaseClient } from './utils/supabaseClient';
import { broadcastRealtimeEvent, subscribeToRealtimeEvents } from './services/realtimeSync';
import { playNotificationSound, showDeviceNotification, requestDeviceNotificationPermission } from './utils/realtimeNotifications';

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

// Platform Administrator Profile for Super Admin
const ADMIN_USER: UserProfile = {
  id: 'DT-ADMIN-001',
  fullName: 'Platform Administrator',
  email: 'admin@setlla.com',
  phone: '0800 000 0001',
  state: 'Delta State',
  city: 'Asaba',
  isVerifiedTenant: false,
  isAgent: false,
  isAdmin: true,
  isSuperAdmin: true,
  savedListingIds: [],
  createdAt: '2026-09-01T08:00:00.000Z',
};

interface InitialNavState {
  role: UserRole;
  view: 'dashboard' | 'feed' | 'partner';
  openPasses: boolean;
}

/**
 * Resolves the initial navigation state upon page load or browser refresh.
 * Preserves the exact view the user or agent was on (Explore, Agent Portal, Dashboard, Passes, Partner Portal)
 * so every page refresh stays on the same page instead of resetting.
 */
function resolveInitialNavState(isUserAgent: boolean, isUserAdmin: boolean = false): InitialNavState {
  if (typeof window === 'undefined') {
    return { role: isUserAdmin ? 'admin' : isUserAgent ? 'agent' : 'tenant', view: 'feed', openPasses: false };
  }

  const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
  const pathname = typeof window !== 'undefined' ? (window.location.pathname || '').toLowerCase() : '';
  const search = typeof window !== 'undefined' ? (window.location.search || '').toLowerCase() : '';
  const savedRole = (localStorage.getItem('setlla_active_role') || localStorage.getItem('deltarent_active_role')) as UserRole | null;
  const savedView = (localStorage.getItem('setlla_active_view') || localStorage.getItem('deltarent_active_view')) as ('dashboard' | 'feed' | 'partner') | null;

  // 1. Explicit Routing (e.g. #/partner, ?view=partner, #/admin, #/agent, #/dashboard, #/explore, #/inspections)
  if (
    hash.includes('partner') || 
    hash.includes('advertise') || 
    hash.includes('advertiser') || 
    pathname.includes('/partner') || 
    pathname.includes('/advertise') || 
    pathname.includes('/advertiser') ||
    search.includes('partner') ||
    search.includes('advertise')
  ) {
    return { role: 'tenant', view: 'partner', openPasses: false };
  }
  if (hash.includes('admin')) {
    return { role: 'admin', view: 'feed', openPasses: false };
  }
  if (hash.includes('agent') || hash.includes('employer')) {
    if (isUserAgent) {
      return { role: 'agent', view: 'feed', openPasses: false };
    }
  }
  if (hash.includes('dashboard')) {
    if (isUserAgent && !hash.includes('jobs')) {
      return { role: 'agent', view: 'feed', openPasses: false };
    }
    return { role: 'tenant', view: 'dashboard', openPasses: false };
  }
  if (hash.includes('explore') || hash.includes('feed') || hash === '#/jobs' || hash === '#jobs') {
    return { role: 'tenant', view: 'feed', openPasses: false };
  }
  if (hash.includes('inspections') || hash.includes('passes')) {
    return { role: 'tenant', view: savedView === 'dashboard' ? 'dashboard' : 'feed', openPasses: true };
  }

  // 2. LocalStorage Persistence (Preserves active page across normal F5 / page reloads)
  if (savedRole === 'admin') {
    if (isSuperAdminAuthenticated() && (hash.includes('admin') || pathname.includes('/admin'))) {
      return { role: 'admin', view: 'feed', openPasses: false };
    }
    return { role: 'tenant', view: 'feed', openPasses: false };
  }
  if (savedRole === 'agent' && isUserAgent) {
    return { role: 'agent', view: 'feed', openPasses: false };
  }
  if (savedRole === 'seeker' || savedRole === 'tenant') {
    return { role: 'tenant', view: savedView === 'dashboard' ? 'dashboard' : 'feed', openPasses: false };
  }

  // 3. Fallback defaults:
  if (isUserAdmin && isSuperAdminAuthenticated() && (hash.includes('admin') || pathname.includes('/admin'))) {
    return { role: 'admin', view: 'feed', openPasses: false };
  }
  if (isUserAgent) {
    return { role: 'agent', view: 'feed', openPasses: false };
  }
  return { role: 'tenant', view: 'feed', openPasses: false };
}

export function App() {
  const [listings, setListings] = useState<PropertyListing[]>(() => {
    const saved = localStorage.getItem('setlla_listings') || localStorage.getItem('deltarent_listings');
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
    const saved = localStorage.getItem('setlla_bookings') || localStorage.getItem('deltarent_bookings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b: BookingRecord) =>
            b && b.id && !b.id.startsWith('DT-ABK-5120') && !b.id.startsWith('DT-ASB-8492') && b.applicantName !== 'Chinedu Okafor'
          );
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('setlla_listings', JSON.stringify(listings));
    } catch (e) {
      // ignore
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem('setlla_bookings', JSON.stringify(bookings));
    } catch (e) {
      // ignore
    }
  }, [bookings]);

  // Seamless auto-activation of mobile alerts on user interaction
  useEffect(() => {
    const handleGesture = () => {
      autoEnableNotifications().catch(() => {});
    };

    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Super Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return isSuperAdminAuthenticated();
  });

  const [activeAdminUser, setActiveAdminUser] = useState<UserProfile | null>(() => {
    return getActiveAdminUser();
  });

  // User Authentication State (Persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
    if (hash.includes('admin')) {
      return isSuperAdminAuthenticated();
    }
    const isAuth = (localStorage.getItem('setlla_auth') || localStorage.getItem('deltarent_auth')) === 'true';
    if (isAuth) {
      const saved = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.id === 'DT-USR-8492' || parsed.id === 'DT-AGT-9012' || parsed.email === 'chinedu.okafor@gmail.com') {
            localStorage.removeItem('setlla_auth');
            localStorage.removeItem('deltarent_auth');
            localStorage.removeItem('setlla_user');
            localStorage.removeItem('deltarent_user');
            return false;
          }
        } catch (e) {}
      }
    }
    return isAuth;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
    if (hash.includes('admin') && isSuperAdminAuthenticated()) {
      return getActiveAdminUser() || ADMIN_USER;
    }
    const isAuth = (localStorage.getItem('setlla_auth') || localStorage.getItem('deltarent_auth')) === 'true';
    const saved = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
    if (isAuth && saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'DT-USR-8492' || parsed.id === 'DT-AGT-9012' || parsed.email === 'chinedu.okafor@gmail.com') {
          return GUEST_USER;
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return GUEST_USER;
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
    let isAdmin = false;
    const isAuth = (localStorage.getItem('setlla_auth') || localStorage.getItem('deltarent_auth')) === 'true';
    if (isAuth) {
      const savedUser = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          isAgent = Boolean(parsed.isAgent);
          isAdmin = Boolean(parsed.isAdmin || parsed.isSuperAdmin);
        } catch (_) {}
      }
    }
    return resolveInitialNavState(isAgent, isAdmin);
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>(initialNav.role);
  const [userView, setUserView] = useState<'dashboard' | 'feed' | 'partner'>(initialNav.view);
  const [isMyPassesOpen, setIsMyPassesOpen] = useState(initialNav.openPasses);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getPlatformSettings());

  // Active Room state: 'rentals' (Accommodations) or 'jobs' (Setlla Jobs)
  const [activeRoom, setActiveRoom] = useState<'rentals' | 'jobs'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('jobs') || search.includes('jobs')) return 'jobs';
      const saved = localStorage.getItem('setlla_active_room');
      if (saved === 'jobs' || saved === 'rentals') return saved;
    }
    return 'rentals';
  });

  const handleRoomChange = useCallback((room: 'rentals' | 'jobs') => {
    setActiveRoom(room);
    try {
      localStorage.setItem('setlla_active_room', room);
    } catch (_) {}

    // Determine target hash for the new room, preserving the user's active sub-view and role
    if (typeof window !== 'undefined') {
      const targetHash = userView === 'partner'
        ? '#/partner'
        : currentRole === 'admin'
        ? '#/admin'
        : room === 'jobs'
        ? (currentRole === 'agent' ? '#/jobs/agent' : userView === 'dashboard' ? '#/jobs/dashboard' : '#/jobs')
        : currentRole === 'agent'
        ? '#/agent'
        : userView === 'dashboard'
        ? '#/dashboard'
        : '#/explore';

      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }
  }, [userView, currentRole]);

  // Auto-heal agent status if current user has published listings on this device or in cloud
  useEffect(() => {
    if (!currentUser || currentUser.id === 'GUEST_USER' || currentUser.isAgent) return;
    const phoneNorm = currentUser.phone ? normalizePhoneNumber(currentUser.phone) : '';
    const myListing = listings.find(
      (l) =>
        l.availabilityStatus !== 'Deleted' &&
        ((l.agent?.id && l.agent.id === currentUser.id) ||
          (phoneNorm && l.agent?.phone && normalizePhoneNumber(l.agent.phone) === phoneNorm))
    );

    if (myListing) {
      console.log('[App] Detected active agent listing for current user - auto-upgrading user profile to Agent.');
      const healedAgent: UserProfile = {
        ...currentUser,
        isAgent: true,
        isVerifiedTenant: false,
        agencyName: myListing.agent?.agencyName || currentUser.agencyName || currentUser.fullName,
        cacNumber: myListing.agent?.cacNumber || currentUser.cacNumber || 'VERIFIED-REG',
        agentType: 'agency',
        phone: myListing.agent?.phone || currentUser.phone,
        operatingCity: myListing.city || currentUser.city || 'Asaba',
        operatingState: myListing.state || currentUser.state || 'Delta State',
      };
      setCurrentUser(healedAgent);
      setCurrentRole('agent');
      localStorage.setItem('setlla_user', JSON.stringify(healedAgent));
      localStorage.setItem('deltarent_user', JSON.stringify(healedAgent));
      localStorage.setItem('setlla_active_role', 'agent');
      localStorage.setItem('deltarent_active_role', 'agent');
      saveRegisteredUser(healedAgent);
      saveRegisteredUserAsync(healedAgent);
    }
  }, [listings, currentUser]);

  // 1. Keep active view, role & room in sync with localStorage and URL Hash on every navigation
  useEffect(() => {
    try {
      localStorage.setItem('setlla_active_role', currentRole);
      localStorage.setItem('setlla_active_view', userView);
      localStorage.setItem('setlla_active_room', activeRoom);
    } catch (_) {}

    const targetHash = userView === 'partner'
      ? '#/partner'
      : currentRole === 'admin'
      ? '#/admin'
      : activeRoom === 'jobs'
      ? (currentRole === 'agent' ? '#/jobs/agent' : userView === 'dashboard' ? '#/jobs/dashboard' : '#/jobs')
      : currentRole === 'agent'
      ? '#/agent'
      : userView === 'dashboard'
      ? '#/dashboard'
      : '#/explore';

    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  }, [currentRole, userView, activeRoom]);

  // 2. Support browser Back/Forward navigation seamlessly via hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('jobs')) {
        setActiveRoom('jobs');
        if (hash.includes('agent') || hash.includes('employer')) {
          setCurrentRole('agent');
        } else if (hash.includes('dashboard')) {
          setCurrentRole('tenant');
          setUserView('dashboard');
        } else {
          // #/jobs or #/jobs/explore
          setCurrentRole('tenant');
          setUserView('feed');
        }
      } else if (hash.includes('partner') || hash.includes('advertise') || hash.includes('advertiser')) {
        setUserView('partner');
      } else if (hash.includes('admin')) {
        setCurrentRole('admin');
        setUserView('feed');
      } else if (hash.includes('agent')) {
        setActiveRoom('rentals');
        setCurrentRole('agent');
      } else if (hash.includes('dashboard')) {
        setActiveRoom('rentals');
        if (currentUser.isAgent) {
          setCurrentRole('agent');
        } else {
          setCurrentRole('tenant');
          setUserView('dashboard');
        }
      } else if (hash.includes('inspections') || hash.includes('passes')) {
        setIsMyPassesOpen(true);
      } else if (hash.includes('explore') || hash.includes('feed') || hash.includes('rentals')) {
        setActiveRoom('rentals');
        setCurrentRole('tenant');
        setUserView('feed');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser.isAgent]);

  // Background Data Synchronizer without requiring manual page reloads
  const syncLatestData = useCallback(async () => {
    try {
      const [fetchedListings, fetchedBookings, fetchedUsers, fetchedAdverts] = await Promise.all([
        fetchAllListings(),
        fetchAllBookings(),
        fetchRegisteredUsersFromDb(),
        loadAllAdverts(),
      ]);

      if (fetchedListings && fetchedListings.length > 0) {
        setListings(fetchedListings);
      }
      if (fetchedBookings) {
        setBookings(fetchedBookings);
      }
      if (fetchedAdverts && fetchedAdverts.length > 0) {
        setAdverts(fetchedAdverts);
      }
      // Keep active session in sync with central platform_users database
      if (fetchedUsers && currentUser.id && currentUser.id !== 'GUEST_USER' && currentUser.id !== 'DT-USR-GUEST') {
        const matched = fetchedUsers.find(
          (u) =>
            u.id === currentUser.id ||
            (currentUser.phone && normalizePhoneNumber(u.phone) === normalizePhoneNumber(currentUser.phone))
        );
        if (matched) {
          setCurrentUser((prev) => ({ ...prev, ...matched }));
        }
      }
    } catch (err) {
      console.warn('[Setlla Sync] Real-time background refresh notice:', err);
    }
  }, [currentUser.id, currentUser.phone]);

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
    const isAuth = (localStorage.getItem('setlla_auth') || localStorage.getItem('deltarent_auth')) === 'true';
    if (!isAuth) return [];
    const saved = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
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
  const [isAdvertiserAuthOpen, setIsAdvertiserAuthOpen] = useState(false);

  // For first-time visitors, open signup modal on arrival if they haven't skipped yet (NEVER on admin or partner pages)
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
    const search = typeof window !== 'undefined' ? (window.location.search || '').toLowerCase() : '';
    if (
      hash.includes('admin') || 
      hash.includes('partner') || 
      hash.includes('advertise') || 
      search.includes('partner') || 
      search.includes('advertise') || 
      initialNav.role === 'admin' || 
      initialNav.view === 'partner' || 
      isSuperAdminAuthenticated()
    ) {
      return false;
    }
    const isAuth = (localStorage.getItem('setlla_auth') || localStorage.getItem('deltarent_auth')) === 'true';
    const hasSkipped = (sessionStorage.getItem('setlla_guest_skipped') || sessionStorage.getItem('deltarent_guest_skipped')) === 'true';
    return !isAuth && !hasSkipped;
  });

  // Ensure signup modal is immediately dismissed whenever in Admin or Partner mode
  useEffect(() => {
    if (currentRole === 'admin' || isAdminAuthenticated || userView === 'partner') {
      setIsSignupOpen(false);
      setSignupNotice(null);
    }
  }, [currentRole, isAdminAuthenticated, userView]);

  const [activeModalListing, setActiveModalListing] = useState<PropertyListing | null>(null);
  const [pushNotification, setPushNotification] = useState<PushNotificationData | null>(null);
  const [unlockedSheetData, setUnlockedSheetData] = useState<{ listing: PropertyListing; booking: BookingRecord } | null>(null);
  const [platformAlertModal, setPlatformAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    badge?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
  } | null>(null);

  // Real-time Push Notifications & Pop-up Alerts across devices and tabs without page reload
  useEffect(() => {
    let isMounted = true;

    // A. Cross-device & cross-tab custom event listener
    const unsubBroadcast = subscribeToRealtimeEvents((event) => {
      if (!isMounted) return;

      if (event.type === 'NEW_BOOKING_REQUEST' && event.booking) {
        setBookings((prev) => [event.booking!, ...prev.filter((b) => b.id !== event.booking!.id)]);

        const targetListing = event.listing || listings.find((p) => p.id === event.booking!.propertyId);
        const isMyListing = !targetListing || targetListing.agent.id === currentUser.id || targetListing.agent.phone === currentUser.phone || currentUser.isAdmin;

        if (currentUser.isAgent && currentUser.phone !== event.booking.applicantPhone && isMyListing) {
          recordNotifiedAgentBookingId(event.booking.id);
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
            body: `${event.booking.applicantName} requested inspection for "${title}" (${event.booking.slotTimeWindow}).`,
          });
          playNotificationSound('alert');
        }
      } else if (event.type === 'BOOKING_ACCEPTED' && event.booking) {
        setBookings((prev) => prev.map((b) => (b.id === event.booking!.id ? event.booking! : b)));

        const targetListing = event.listing || listings.find((p) => p.id === event.booking!.propertyId);
        const isApplicant = isBookingForUser(event.booking, currentUser, myDeviceBookingIds);

        if (isApplicant && !currentUser.isAgent) {
          recordNotifiedBookingId(event.booking.id);
          const agentName = targetListing?.agent.fullName || 'The Agent';
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
      } else if (event.type === 'BOOKING_REJECTED' && (event.booking || event.bookingId)) {
        const rejectedId = event.booking?.id || event.bookingId;
        const rejectedBooking: BookingRecord | undefined = event.booking || bookings.find((b) => b.id === rejectedId);
        const targetListing = event.listing || (rejectedBooking ? listings.find((p) => p.id === rejectedBooking.propertyId) : undefined);

        setBookings((prev) =>
          prev.map((b) =>
            b.id === rejectedId
              ? { ...b, status: 'REJECTED_BY_AGENT' as const }
              : b
          )
        );

        const isApplicant = rejectedBooking ? isBookingForUser(rejectedBooking, currentUser, myDeviceBookingIds) : false;

        if (isApplicant && !currentUser.isAgent && rejectedId) {
          recordNotifiedDeclinedBookingId(rejectedId);
          const agentName = targetListing?.agent.fullName || 'The Agent';
          const propTitle = targetListing?.title || 'the property';

          setPushNotification({
            title: '❌ Inspection Request Declined',
            body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
            type: 'inspection_declined',
            listing: targetListing,
            booking: rejectedBooking,
            actionText: 'Tap to explore other properties',
            onAction: () => {
              setCurrentRole('tenant');
              setUserView('feed');
            },
          });
          showDeviceNotification('❌ Inspection Request Declined', {
            body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
          });
          playNotificationSound('alert');
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
              setCurrentRole('tenant');
              setUserView('feed');
            },
          });
          playNotificationSound('info');
        }
      } else if (event.type === 'LISTING_UPDATED' && event.listing) {
        setListings((prev) => prev.map((l) => (l.id === event.listing!.id ? event.listing! : l)));
      } else if (event.type === 'LISTING_DELETED' && event.listingId) {
        setListings((prev) => prev.filter((l) => l.id !== event.listingId));
      } else if ((event.type === 'USER_REGISTERED' || event.type === 'USER_UPDATED') && event.user) {
        saveRegisteredUser(event.user);
        if (currentUser.id === event.user.id || (currentUser.phone && event.user.phone && normalizePhoneNumber(currentUser.phone) === normalizePhoneNumber(event.user.phone))) {
          setCurrentUser(event.user);
          localStorage.setItem('setlla_user', JSON.stringify(event.user));
        }
      }
    });

    // B. Supabase Postgres Realtime replication listener
    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      const channel = client
        .channel('setlla_realtime_db_sync')
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
                      setCurrentRole('tenant');
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
                const bookingId = newBookingRow.id;
                const applicantName = newBookingRow.applicant_name || newBookingRow.applicantName || 'Applicant';
                const applicantPhone = newBookingRow.applicant_phone || newBookingRow.applicantPhone;
                const propId = newBookingRow.property_id || newBookingRow.propertyId;
                const slotTime = newBookingRow.slot_time_window || newBookingRow.slotTimeWindow || '';
                const targetListing = listings.find((p) => p.id === propId);

                const isMe = currentUser.phone && applicantPhone &&
                  currentUser.phone.replace(/[^0-9]/g, '').slice(-10) === applicantPhone.replace(/[^0-9]/g, '').slice(-10);

                const isMyListing = !targetListing || targetListing.agent.id === currentUser.id || targetListing.agent.phone === currentUser.phone || currentUser.isAdmin;

                if (currentUser.isAgent && !isMe && isMyListing && bookingId) {
                  if (!getNotifiedAgentBookingIds().has(bookingId)) {
                    recordNotifiedAgentBookingId(bookingId);
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
                  if (!getNotifiedBookingIds().has(bookingRecord.id)) {
                    recordNotifiedBookingId(bookingRecord.id);
                    const agentName = targetListing?.agent.fullName || 'The Agent';
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
                } else if (isMe && !currentUser.isAgent && status === 'REJECTED_BY_AGENT') {
                  if (!getNotifiedDeclinedBookingIds().has(bookingRecord.id)) {
                    recordNotifiedDeclinedBookingId(bookingRecord.id);
                    const agentName = targetListing?.agent.fullName || 'The Agent';
                    const propTitle = targetListing?.title || 'the property';

                    setPushNotification({
                      title: '❌ Inspection Request Declined',
                      body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
                      type: 'inspection_declined',
                      listing: targetListing,
                      booking: bookingRecord,
                      actionText: 'Tap to explore other properties',
                      onAction: () => {
                        setCurrentRole('tenant');
                        setUserView('feed');
                      },
                    });
                    showDeviceNotification('❌ Inspection Request Declined', {
                      body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
                    });
                    playNotificationSound('alert');
                  }
                }
              }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'platform_users' },
          (payload) => {
            if (!isMounted) return;
            fetchRegisteredUsersFromDb().then(() => {
              if (payload.new) {
                const updated = mapDbToUserProfile(payload.new);
                if (currentUser.id === updated.id || (currentUser.phone && normalizePhoneNumber(currentUser.phone) === normalizePhoneNumber(updated.phone))) {
                  setCurrentUser(updated);
                  localStorage.setItem('setlla_user', JSON.stringify(updated));
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
      const agentName = targetListing?.agent.fullName || 'The Agent';
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

  // Persistent Tenant Decline Notification Trigger:
  // Ensures applying tenants are notified if an agent declined their request while offline or away
  useEffect(() => {
    if (!currentUser || currentUser.isAgent) return;

    const notifiedDeclined = getNotifiedDeclinedBookingIds();
    const unnotifiedDeclinedBooking = userBookings.find(
      (b) => b.status === 'REJECTED_BY_AGENT' && !notifiedDeclined.has(b.id)
    );

    if (unnotifiedDeclinedBooking) {
      recordNotifiedDeclinedBookingId(unnotifiedDeclinedBooking.id);

      const targetListing = listings.find((p) => p.id === unnotifiedDeclinedBooking.propertyId);
      const agentName = targetListing?.agent.fullName || 'The Agent';
      const propTitle = targetListing?.title || 'the property';

      setPushNotification({
        title: '❌ Inspection Request Declined',
        body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
        type: 'inspection_declined',
        listing: targetListing,
        booking: unnotifiedDeclinedBooking,
        actionText: 'Tap to explore other properties',
        onAction: () => {
          setCurrentRole('tenant');
          setUserView('feed');
        },
      });

      playNotificationSound('alert');
      showDeviceNotification('❌ Inspection Request Declined', {
        body: `${agentName} was unable to accept your inspection request for "${propTitle}".`,
      });
    }
  }, [userBookings, listings, currentUser]);

  // Persistent Agent Booking Request Notification Trigger:
  // Guarantees agents receive a pop-up alert & sound for pending booking requests even if their app was closed
  useEffect(() => {
    if (!currentUser || !currentUser.isAgent) return;

    const notifiedAgentRequests = getNotifiedAgentBookingIds();
    const agentListingIds = new Set(
      listings
        .filter((l) => l.agent.id === currentUser.id || l.agent.phone === currentUser.phone || currentUser.isAdmin)
        .map((l) => l.id)
    );

    const unnotifiedBooking = bookings.find(
      (b) =>
        (b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED') &&
        agentListingIds.has(b.propertyId) &&
        !notifiedAgentRequests.has(b.id) &&
        b.applicantPhone !== currentUser.phone
    );

    if (unnotifiedBooking) {
      recordNotifiedAgentBookingId(unnotifiedBooking.id);

      const targetListing = listings.find((p) => p.id === unnotifiedBooking.propertyId);
      const propTitle = targetListing?.title || 'your listing';

      setPushNotification({
        title: '🔔 New Inspection Request!',
        body: `${unnotifiedBooking.applicantName} requested inspection for "${propTitle}" (${unnotifiedBooking.slotTimeWindow}).`,
        type: 'inspection_request',
        listing: targetListing,
        booking: unnotifiedBooking,
        actionText: 'Tap to review in Agent Portal',
        onAction: () => {
          setCurrentRole('agent');
        },
      });

      playNotificationSound('alert');
      showDeviceNotification('🔔 New Inspection Request!', {
        body: `${unnotifiedBooking.applicantName} requested inspection for "${propTitle}".`,
      });
    }
  }, [bookings, listings, currentUser]);

  // Authentication gating & resume booking state
  const [pendingBookingListing, setPendingBookingListing] = useState<PropertyListing | null>(null);
  const [signupNotice, setSignupNotice] = useState<{ title: string; message: string } | null>(null);
  const [signupInitialRole, setSignupInitialRole] = useState<'seeker' | 'agent'>('seeker');
  const [signupInitialMode, setSignupInitialMode] = useState<'signup' | 'login'>('signup');

  // Sponsored adverts state - Loaded live from adService (Supabase + active partner campaigns)
  const [adverts, setAdverts] = useState<AdvertStory[]>(() => {
    const deletedIds = getDeletedAdvertIds();
    const saved = typeof window !== 'undefined'
      ? (localStorage.getItem('setlla_adverts') || localStorage.getItem('deltarent_adverts'))
      : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly filter out any deleted or system demo ads
          return parsed.filter(
            (a: AdvertStory) => a && a.id && !deletedIds.has(a.id) && !SYSTEM_DEMO_ADVERT_IDS.has(a.id) && a.status !== 'deleted'
          );
        }
      } catch (e) {}
    }
    // Strictly return [] - Never fallback to demo mock ads
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('setlla_adverts', JSON.stringify(adverts));
    } catch (e) {}
  }, [adverts]);

  // Initial cloud sync on mount: Loads live adverts from Supabase and purges deleted ads on mobile
  useEffect(() => {
    loadAllAdverts().then((freshAds) => {
      if (Array.isArray(freshAds)) {
        setAdverts(freshAds);
      }
    });
  }, []);

  // Subscribe to realtime advert updates across all mobile & desktop devices
  useEffect(() => {
    const unsubscribe = subscribeToAdvertChanges((updatedAdverts) => {
      // Must accept empty array [] so deleted ads immediately vanish from mobile
      if (Array.isArray(updatedAdverts)) {
        setAdverts(updatedAdverts);
      }
    });
    return unsubscribe;
  }, []);

  // Active, verified campaigns to broadcast on the public feed (filters out declined, pending, and expired ads)
  const activePublicAdverts = useMemo(() => {
    return adverts.filter(
      (a) =>
        a &&
        a.id &&
        a.status !== 'rejected' &&
        a.status !== 'pending_review' &&
        a.status !== 'deleted' &&
        a.status !== 'expired' &&
        (a.status === 'active' || !a.status)
    );
  }, [adverts]);

  const [isPostAdOpen, setIsPostAdOpen] = useState(false);
  const [isPartnerPortalOpen, setIsPartnerPortalOpen] = useState(false);

  const handleAddAdvert = (newAd: AdvertStory) => {
    setAdverts((prev) => [newAd, ...prev.filter((a) => a.id !== newAd.id)]);
    saveAdvert(newAd).catch((err) => console.warn('[Setlla Adverts] Failed to save ad:', err));
  };

  const handleUpdateAdvert = (updatedAd: AdvertStory) => {
    setAdverts((prev) => prev.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad)));
    saveAdvert(updatedAd).catch((err) => console.warn('[Setlla Adverts] Failed to update ad:', err));
  };

  const handleDeleteAdvert = (advertId: string) => {
    setAdverts((prev) => prev.filter((ad) => ad.id !== advertId));
    removeAdvert(advertId).catch((err) => console.warn('[Setlla Adverts] Failed to remove ad:', err));
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
        `Hello, I saw your verified advert "${ad.headline}" on Setlla. I would like to make an inquiry.`
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

  // Handler: Agent accepts a booking (Free instant contact unlock & push notification)
  const handleAcceptBooking = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const targetListing = listings.find((p) => p.id === targetBooking.propertyId);
    if (!targetListing) return;

    // Concurrency Rule: Agent can accept an applicant ONLY if requested slot has active capacity (< 5 bookings)
    const targetSlot = targetListing.inspectionSlots.find((s) => s.id === targetBooking.slotId);
    if (targetSlot && targetSlot.bookedCount >= 5 && targetBooking.status === 'QUEUED') {
      setPlatformAlertModal({
        isOpen: true,
        title: 'Inspection Slot Full (Capacity Limit)',
        message: 'Concurrency limit reached: This inspection slot already has 5 confirmed applicants. An applicant must cancel before a standby applicant can be admitted.',
        badge: 'SLOT CAPACITY LIMIT',
        variant: 'warning',
        confirmText: 'Understood',
      });
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

  // Handler: Agent declines a slot -> Notifies tenant with popup/sound and promotes next queued applicant if any!
  const handleRejectBooking = (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;
    const targetListing = listings.find((p) => p.id === targetBooking.propertyId);

    const updatedRejectedBooking: BookingRecord = {
      ...targetBooking,
      status: 'REJECTED_BY_AGENT',
    };

    updateBookingStatus(bookingId, 'REJECTED_BY_AGENT');

    broadcastRealtimeEvent('BOOKING_REJECTED', {
      bookingId,
      booking: updatedRejectedBooking,
      listing: targetListing,
      propertyId: targetBooking.propertyId,
    });

    // Provide immediate feedback to the AGENT that they declined this applicant
    if (currentUser.isAgent) {
      setPushNotification({
        title: 'Inspection Request Declined',
        body: `You declined ${targetBooking.applicantName}'s inspection request for "${targetListing?.title || 'the property'}". Notification sent to tenant.`,
        type: 'general',
      });
      playNotificationSound('info');
    }

    // Check if there is someone in the queue for this same slot to promote
    const queuedApplicant = bookings.find(
      (b) => b.propertyId === targetBooking.propertyId && b.slotId === targetBooking.slotId && b.status === 'QUEUED' && b.id !== bookingId
    );

    let promotedBooking: BookingRecord | undefined;
    if (queuedApplicant) {
      promotedBooking = {
        ...queuedApplicant,
        status: 'CONFIRMED_UNLOCKED' as const,
        queuePosition: undefined,
        confirmedAt: new Date().toISOString(),
      };
      updateBookingStatus(queuedApplicant.id, 'CONFIRMED_UNLOCKED');
      broadcastRealtimeEvent('BOOKING_ACCEPTED', {
        booking: promotedBooking,
        listing: targetListing,
      });
    }

    // Keep the rejected booking in bookings with status REJECTED_BY_AGENT so the tenant can see the updated status
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return updatedRejectedBooking;
        }
        if (promotedBooking && b.id === promotedBooking.id) {
          return promotedBooking;
        }
        if (b.propertyId === targetBooking.propertyId && b.slotId === targetBooking.slotId && b.queuePosition && b.queuePosition > 1) {
          return {
            ...b,
            queuePosition: b.queuePosition - 1,
          };
        }
        return b;
      })
    );
  };

  // Handler: Create listing from agent onboarding form
  const handleListingCreated = (newListing: PropertyListing) => {
    setListings((prev) => [newListing, ...prev]);
    saveNewListing(newListing);

    // Confirm and reinforce agent profile for current user upon publishing listing
    if (currentUser && !currentUser.isAgent) {
      const upgraded: UserProfile = {
        ...currentUser,
        isAgent: true,
        isVerifiedTenant: false,
        agencyName: newListing.agent?.agencyName || currentUser.agencyName || currentUser.fullName,
        cacNumber: newListing.agent?.cacNumber || currentUser.cacNumber || 'VERIFIED-REG',
        agentType: 'agency',
        phone: newListing.agent?.phone || currentUser.phone,
        operatingCity: newListing.city || currentUser.city || 'Asaba',
        operatingState: newListing.state || currentUser.state || 'Delta State',
      };
      setCurrentUser(upgraded);
      setCurrentRole('agent');
      localStorage.setItem('setlla_user', JSON.stringify(upgraded));
      localStorage.setItem('deltarent_user', JSON.stringify(upgraded));
      localStorage.setItem('setlla_active_role', 'agent');
      localStorage.setItem('deltarent_active_role', 'agent');
      saveRegisteredUser(upgraded);
      saveRegisteredUserAsync(upgraded);
    }

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
  const handleBecomeAgent = async (agentData: {
    agencyName: string;
    cacNumber: string;
    phone: string;
    cities: string[];
  }) => {
    const updatedAgentProfile: UserProfile = {
      ...currentUser,
      isAgent: true,
      isVerifiedTenant: false,
      agencyName: agentData.agencyName,
      cacNumber: agentData.cacNumber,
      phone: agentData.phone,
      whatsapp: agentData.phone,
      agentType: 'agency',
      operatingCity: agentData.cities[0] || currentUser.city || 'Asaba',
      operatingState: currentUser.state || 'Delta State',
      kycStatus: currentUser.kycStatus === 'verified' ? 'verified' : 'pending',
      lastProfileEditAt: new Date().toISOString(),
    };

    // 1. Immediately persist to localStorage so mobile reloads / refreshes remain Agent
    localStorage.setItem('setlla_user', JSON.stringify(updatedAgentProfile));
    localStorage.setItem('deltarent_user', JSON.stringify(updatedAgentProfile));
    localStorage.setItem('setlla_active_role', 'agent');
    localStorage.setItem('deltarent_active_role', 'agent');
    localStorage.setItem('setlla_active_view', 'feed');
    localStorage.setItem('deltarent_active_view', 'feed');
    localStorage.setItem('setlla_auth', 'true');
    localStorage.setItem('deltarent_auth', 'true');

    // 2. Update React application state
    setCurrentUser(updatedAgentProfile);
    setCurrentRole('agent');
    setUserView('feed');
    window.location.hash = '#/agent';

    // 3. Save to registry and Supabase platform_users database
    saveRegisteredUser(updatedAgentProfile);
    await saveRegisteredUserAsync(updatedAgentProfile);

    // 4. Broadcast live cross-device event so admin console updates immediately
    broadcastRealtimeEvent('USER_UPDATED', {
      user: updatedAgentProfile,
    });
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
    if (isAuthenticated || isAdminAuthenticated || currentRole === 'admin') return;
    setSignupNotice(null);
    setSignupInitialRole('seeker');
    setSignupInitialMode('signup');
    setIsSignupOpen(true);
  };

  const handleOpenLogin = () => {
    if (isAuthenticated || isAdminAuthenticated || currentRole === 'admin') return;
    setSignupNotice(null);
    setSignupInitialRole('seeker');
    setSignupInitialMode('login');
    setIsSignupOpen(true);
  };

  const handleOpenAgentSignup = () => {
    if (isAuthenticated || isAdminAuthenticated || currentRole === 'admin') return;
    setSignupNotice(null);
    setSignupInitialRole('agent');
    setSignupInitialMode('signup');
    setIsSignupOpen(true);
  };

  const handleSkipSignup = () => {
    sessionStorage.setItem('setlla_guest_skipped', 'true');
    setIsSignupOpen(false);
    setSignupNotice(null);
    setPendingBookingListing(null);
    setUserView('feed');
  };

  const handleOpenAdsPortal = useCallback(() => {
    if (getActiveAdvertiser()) {
      setUserView('partner');
      window.location.hash = '#/partner';
    } else {
      setIsAdvertiserAuthOpen(true);
    }
  }, []);

  const handleAdminAuthSuccess = useCallback((admin: UserProfile) => {
    setIsAdminAuthenticated(true);
    setActiveAdminUser(admin);
    setCurrentUser(admin);
    setCurrentRole('admin');
  }, []);

  // Listen for Supabase email confirmation link clicks (e.g. #access_token=... or session callbacks)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const authorizeSuperAdminFromEmail = async (_email?: string | null) => {
      const verified = await verifyAdminSessionWithSupabase();
      if (verified) {

        const currentHash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
        const currentSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
        const currentPath = typeof window !== 'undefined' ? (window.location.pathname || '').toLowerCase() : '';
        const isPartnerTarget = 
          currentHash.includes('partner') || 
          currentHash.includes('advertise') || 
          currentSearch.includes('partner') || 
          currentSearch.includes('advertise') || 
          currentPath.includes('/partner') || 
          userView === 'partner';

        setIsAdminAuthenticated(true);
        setActiveAdminUser(verified);
        setCurrentUser(verified);

        if (isPartnerTarget) {
          setUserView('partner');
          return;
        }

        const isExplicitAdminTarget = currentHash.includes('admin') || currentHash.includes('access_token') || currentSearch.includes('admin') || currentPath.includes('/admin');
        if (isExplicitAdminTarget) {
          setCurrentRole('admin');
          window.location.hash = '#/admin';
        }
      }
    };

    // 1. Check existing session on load (handles instant token parse from email link redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        authorizeSuperAdminFromEmail(session.user.email);
      }
    }).catch(() => {});

    // 2. Subscribe to auth state changes (handles magic link click while app is open or loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
        authorizeSuperAdminFromEmail(session.user.email);
      }
    });

    // 3. Fallback: Parse URL hash if direct fragment redirect occurs (#access_token=...)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        supabase.auth.getUser(accessToken).then(({ data: { user } }) => {
          if (user?.email) {
            authorizeSuperAdminFromEmail(user.email);
          }
        }).catch(() => {});
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAdminAuthSuccess]);

  const handleAdminSignOut = () => {
    logoutAdminSession();
    setIsAdminAuthenticated(false);
    setActiveAdminUser(null);
    if (isSupabaseConfigured()) {
      try {
        supabase.auth.signOut().catch(() => {});
      } catch (_) {}
    }
    setCurrentUser(GUEST_USER);
    setCurrentRole('tenant');
    setUserView('feed');
    if (typeof window !== 'undefined') {
      window.location.hash = '#/explore';
    }
  };

  const handleSignOut = () => {
    logoutAdminSession();
    setIsAdminAuthenticated(false);
    setActiveAdminUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('setlla_auth');
    localStorage.removeItem('deltarent_auth');
    localStorage.removeItem('setlla_user');
    localStorage.removeItem('deltarent_user');
    localStorage.removeItem('setlla_active_role');
    localStorage.removeItem('deltarent_active_role');
    localStorage.removeItem('setlla_active_view');
    localStorage.removeItem('deltarent_active_view');
    clearMyDeviceBookingIds();
    setMyDeviceBookingIds(new Set());
    setCurrentUser(GUEST_USER);
    setCurrentRole('tenant');
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
    localStorage.setItem('setlla_user', JSON.stringify(updated));
  };

  // Handler: Update current user from signup/login modal
  const handleUpdateUser = (updatedUser: UserProfile, role?: UserRole, targetRoom?: 'rentals' | 'jobs') => {
    saveRegisteredUser(updatedUser);
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('setlla_auth', 'true');
    localStorage.setItem('setlla_user', JSON.stringify(updatedUser));
    setSignupNotice(null);

    if (updatedUser.savedListingIds) {
      setSavedPropertyIds(updatedUser.savedListingIds);
    }

    const resolvedRoom = targetRoom || (
      (updatedUser.persona === 'job_seeker' || updatedUser.persona === 'employer') ? 'jobs' : 'rentals'
    );
    handleRoomChange(resolvedRoom);

    if ((role === 'admin' || updatedUser.isAdmin || updatedUser.isSuperAdmin) && isSuperAdminAuthenticated()) {
      setCurrentRole('admin');
      setPendingBookingListing(null);
    } else if (role === 'agent' || updatedUser.isAgent) {
      setCurrentRole('agent');
      setPendingBookingListing(null);
    } else {
      setCurrentRole('tenant');
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
  // Feed view is viewport-locked for continuous momentum feeds (both Rentals and Setlla Jobs) so desktop ad sidebars stay static while feeds scroll
  const isFeedView = (activeRoom === 'rentals' || activeRoom === 'jobs') && (currentRole === 'tenant' || currentRole === 'seeker') && userView === 'feed';

  return (
    <div className={`bg-[#FCF9F5] text-[#000004] flex flex-col font-body selection:bg-[#342A21]/15 selection:text-[#342A21] ${
      isFeedView ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen overflow-x-hidden'
    }`}>
      {/* 1. Global Navigation Header (Strictly rendered for public pages, never for admin portal) */}
      {currentRole !== 'admin' && userView !== 'partner' && (
        <Header
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          userView={userView}
          onChangeUserView={setUserView}
          activeBookings={userBookings}
          activeRoom={activeRoom}
          onChangeRoom={handleRoomChange}
          onOpenMyPasses={() => {
            if (!isAuthenticated) {
              handleOpenSignup();
              return;
            }
            setIsMyPassesOpen(true);
          }}
          onOpenNotifications={() => {
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
      )}

      {/* Platform Emergency Announcement Banner */}
      {currentRole !== 'admin' && userView !== 'partner' && platformSettings.emergencyAnnouncementActive && platformSettings.emergencyAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white px-4 py-2.5 text-xs font-bold text-center shadow-xs flex items-center justify-center gap-2 border-b border-amber-800 z-40">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping shrink-0" />
          <span>{platformSettings.emergencyAnnouncement}</span>
        </div>
      )}

      {/* 2. Main Content Area */}
      {userView === 'partner' ? (
        /* Setlla Partner & Brand Advertising Dedicated Standalone Page */
        <main className="flex-1 w-full min-h-screen">
          <PartnerPortalPage
            currentUser={currentUser}
            onBackToExplore={() => {
              // Strictly ensure any admin state is purged so Explore Feed NEVER opens with admin privileges
              setIsAdminAuthenticated(false);
              try {
                localStorage.removeItem('setlla_admin_auth');
                localStorage.removeItem('setlla_admin_user');
              } catch (_) {}
              setCurrentRole('tenant');
              setUserView('feed');
              window.location.hash = activeRoom === 'jobs' ? '#/jobs' : '#/explore';
            }}
            onAdSubmitted={handleAddAdvert}
          />
        </main>
      ) : currentRole === 'admin' ? (
        /* Super Admin Control Center or Admin Authentication Portal */
        isAdminAuthenticated ? (
          <main className="flex-1 w-full">
            <SuperAdminDashboard
              currentUser={activeAdminUser || currentUser}
              listings={listings}
              bookings={bookings}
              adverts={adverts}
              onAddAdvert={handleAddAdvert}
              onUpdateAdvert={handleUpdateAdvert}
              onDeleteAdvert={handleDeleteAdvert}
              onUpdateListingAvailability={handleUpdateListingAvailability}
              onDeleteListing={handleDeleteListing}
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              onUpdateListing={handleListingUpdated}
              onRefreshData={syncLatestData}
              onSwitchToExplore={() => {
                setCurrentRole('tenant');
                setUserView('feed');
              }}
              onSwitchToAgent={() => setCurrentRole('agent')}
              onSwitchToTenant={() => {
                setCurrentRole('tenant');
                setUserView('dashboard');
              }}
              onSwitchToPartner={() => {
                setUserView('partner');
                window.location.hash = '#/partner';
              }}
              onSignOut={handleAdminSignOut}
            />
          </main>
        ) : (
          <main className="flex-1 w-full">
            <AdminAuthPortal
              onSuccess={handleAdminAuthSuccess}
              onSwitchToExplore={() => {
                setCurrentRole('tenant');
                setUserView('feed');
              }}
            />
          </main>
        )
      ) : userView === 'dashboard' && isAuthenticated ? (
        activeRoom === 'jobs' ? (
          (currentRole === 'agent' || currentUser.isAgent || currentUser.persona === 'employer') ? (
            /* Setlla Job Agent & Employer Dashboard */
            <main className="flex-1 w-full pt-16">
              <JobAgentDashboard
                currentUser={currentUser}
                onSwitchToFeed={() => {
                  setCurrentRole('tenant');
                  setUserView('feed');
                }}
                onSwitchToRentals={() => handleRoomChange('rentals')}
                isAuthenticated={isAuthenticated}
              />
            </main>
          ) : (
            /* Setlla Jobs Candidate Dashboard */
            <main className="flex-1 w-full pt-16">
              <JobsDashboard
                currentUser={currentUser}
                onSwitchToFeed={() => setUserView('feed')}
                onOpenSignup={handleOpenSignup}
                onOpenPostAd={() => setIsPostAdOpen(true)}
                isAuthenticated={isAuthenticated}
              />
            </main>
          )
        ) : currentUser.isAgent ? (
          /* If the user is an agent, their dashboard is the Agent Dashboard */
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
                setCurrentRole('tenant');
                setUserView('feed');
              }}
              onSwitchToTenant={() => {
                setCurrentRole('tenant');
                setUserView('feed');
              }}
              onOpenAdsPortal={handleOpenAdsPortal}
            />
          </main>
        ) : (
          /* Tenant / User Dashboard: Strictly for authenticated non-agent tenants */
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
              onOpenAdsPortal={handleOpenAdsPortal}
            />
          </main>
        )
      ) : activeRoom === 'jobs' ? (
        (currentRole === 'agent' || (currentUser.isAgent && userView !== 'feed')) ? (
          /* Setlla Job Agent & Employer Portal */
          <main className="flex-1 w-full pt-16">
            <JobAgentDashboard
              currentUser={currentUser}
              onSwitchToFeed={() => {
                setCurrentRole('tenant');
                setUserView('feed');
              }}
              onSwitchToRentals={() => handleRoomChange('rentals')}
              isAuthenticated={isAuthenticated}
            />
          </main>
        ) : (
          /* Setlla Jobs Continuous Feed */
          <main className="flex-1 w-full h-[calc(100dvh-4rem)] mt-16 flex flex-col overflow-hidden bg-[#FCF9F5]">
            <JobsFeed
              currentUser={currentUser}
              adverts={activePublicAdverts}
              onSelectAdvert={handleSelectAdvert}
              onTriggerSignup={handleOpenSignup}
              isAuthenticated={isAuthenticated}
              onOpenPostAd={() => setIsPostAdOpen(true)}
              onOpenEmployerPortal={() => {
                setCurrentRole('agent');
                setUserView('dashboard');
              }}
            />
          </main>
        )
      ) : (currentRole === 'tenant' || currentRole === 'seeker' || userView === 'feed') && currentRole !== 'agent' ? (
          /* Tenant Snap Feed View */
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
              adverts={activePublicAdverts}
              onSelectAdvert={handleSelectAdvert}
              onOpenPostAd={() => setIsPostAdOpen(true)}
            />

            {/* Responsive Layout: Desktop features Sponsored Ads on left; mobile features in-feed sponsored carousel as tenants scroll down */}
            <div className="w-full max-w-7xl mx-auto h-[calc(100dvh-112px)] mt-[112px] flex items-center justify-center gap-6 px-2 sm:px-6 overflow-hidden">
              {/* Desktop Left Side Sponsored Ads */}
              <DesktopAdvertSidebar
                adverts={activePublicAdverts}
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
                  adverts={activePublicAdverts}
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
              setCurrentRole('tenant');
              setUserView('feed');
            }}
            onSwitchToTenant={() => {
              setCurrentRole('tenant');
              setUserView('feed');
            }}
            onOpenAdsPortal={handleOpenAdsPortal}
          />
        </main>
      )}

      {/* 3. Global Drawers & Modals */}
      <NotificationsModal
        isOpen={isMyPassesOpen}
        onClose={() => setIsMyPassesOpen(false)}
        bookings={userBookings}
        listings={listings}
        currentUser={currentUser}
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
        onOpenAdsPortal={handleOpenAdsPortal}
      />

      {/* Customer Ads Authentication & OTP Verification Modal */}
      <AdvertiserAuthModal
        isOpen={isAdvertiserAuthOpen}
        onClose={() => setIsAdvertiserAuthOpen(false)}
        initialMode="signup"
        initialEmail={currentUser?.email || ''}
        initialName={currentUser?.fullName || ''}
        initialPhone={currentUser?.phone || ''}
        initialCompanyName={currentUser?.agencyName || currentUser?.fullName || ''}
        onAuthSuccess={(_advertiser) => {
          setIsAdvertiserAuthOpen(false);
          setUserView('partner');
          window.location.hash = '#/partner';
        }}
      />

      <BecomeAgentModal
        isOpen={isBecomeAgentOpen}
        onClose={() => setIsBecomeAgentOpen(false)}
        currentUser={currentUser}
        onBecomeAgent={handleBecomeAgent}
      />

      {/* Sign In / Sign Up Modal: Strictly for non-admin visitor views */}
      {currentRole !== 'admin' && (
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
      )}

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

      <PartnerAdSubmissionModal
        isOpen={isPartnerPortalOpen}
        onClose={() => setIsPartnerPortalOpen(false)}
        onSubmissionSuccess={handleAddAdvert}
        onOpenFullPage={() => {
          setIsPartnerPortalOpen(false);
          setUserView('partner');
        }}
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

      {/* Global Platform Notice / Alert Modal */}
      {platformAlertModal && (
        <CustomConfirmModal
          isOpen={platformAlertModal.isOpen}
          title={platformAlertModal.title}
          message={platformAlertModal.message}
          badge={platformAlertModal.badge}
          variant={platformAlertModal.variant}
          confirmText={platformAlertModal.confirmText}
          isAlertOnly={true}
          onConfirm={() => setPlatformAlertModal(null)}
          onCancel={() => setPlatformAlertModal(null)}
        />
      )}
    </div>
  );
}

export default App;
