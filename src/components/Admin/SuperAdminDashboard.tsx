import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Building, 
  CalendarCheck, 
  DollarSign, 
  Settings, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock, 
  FileText, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  Bell, 
  Layers, 
  Globe, 
  PieChart, 
  BarChart3, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  Star, 
  Sliders, 
  Plus, 
  Key,
  ExternalLink,
  MapPin,
  Clock,
  Send,
  LogOut,
  Megaphone,
  Tag,
  Sparkles,
  Terminal,
  Zap,
  Code2,
  BookOpen
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';
import { ApiWebhookModal } from './ApiWebhookModal';
import { PartnerAdSubmissionModal } from '../Adverts/PartnerAdSubmissionModal';
import { AdsSetupGuide } from '../Adverts/AdsSetupGuide';
import { 
  approvePartnerAdvert, 
  rejectPartnerAdvert, 
  saveAdvert, 
  removeAdvert, 
  loadAllAdverts,
  getDeletedAdvertIds,
  SYSTEM_DEMO_ADVERT_IDS
} from '../../services/adService';
import { 
  PropertyListing, 
  BookingRecord, 
  UserProfile, 
  AdminAuditLog, 
  PlatformSettings,
  ListingAvailability,
  BookingStatus
} from '../../types/marketplace';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { 
  getPlatformSettings, 
  savePlatformSettings, 
  getAuditLogs, 
  recordAuditLog, 
  toggleAgentVerification, 
  toggleTenantVerification, 
  toggleUserSuspension, 
  exportPlatformDataSnapshot 
} from '../../services/adminService';
import { getRegisteredUsers, fetchRegisteredUsersFromDb, adminUpdateUser, deleteUserFromRegistry } from '../../utils/userRegistry';
import { subscribeToRealtimeEvents } from '../../services/realtimeSync';
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';
import { CustomConfirmModal } from '../UI/CustomConfirmModal';

interface SuperAdminDashboardProps {
  currentUser: UserProfile;
  listings: PropertyListing[];
  bookings: BookingRecord[];
  adverts?: AdvertStory[];
  onAddAdvert?: (advert: AdvertStory) => void;
  onUpdateAdvert?: (advert: AdvertStory) => void;
  onDeleteAdvert?: (advertId: string) => void;
  onUpdateListingAvailability: (listingId: string, status: ListingAvailability) => void;
  onDeleteListing: (listingId: string) => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onUpdateListing?: (listing: PropertyListing) => void;
  onSwitchToExplore: () => void;
  onSwitchToAgent?: () => void;
  onSwitchToTenant?: () => void;
  onSwitchToPartner?: () => void;
  onSignOut?: () => void;
}

type AdminTab = 
  | 'overview' 
  | 'agents' 
  | 'tenants' 
  | 'listings' 
  | 'inspections' 
  | 'ads'
  | 'financials' 
  | 'settings' 
  | 'audit';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  listings,
  bookings,
  adverts,
  onAddAdvert,
  onUpdateAdvert,
  onDeleteAdvert,
  onUpdateListingAvailability,
  onDeleteListing,
  onAcceptBooking,
  onRejectBooking,
  onUpdateListing,
  onSwitchToExplore,
  onSwitchToAgent,
  onSwitchToTenant,
  onSwitchToPartner,
  onSignOut,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sponsored Adverts State
  const [localAdverts, setLocalAdverts] = useState<AdvertStory[]>(() => {
    const deletedIds = getDeletedAdvertIds();
    if (adverts && Array.isArray(adverts)) {
      return adverts.filter((a) => a && a.id && !deletedIds.has(a.id) && !SYSTEM_DEMO_ADVERT_IDS.has(a.id) && a.status !== 'deleted');
    }
    try {
      const raw = localStorage.getItem('setlla_adverts') || localStorage.getItem('deltarent_adverts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((a) => a && a.id && !deletedIds.has(a.id) && !SYSTEM_DEMO_ADVERT_IDS.has(a.id) && a.status !== 'deleted');
        }
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    if (Array.isArray(adverts)) {
      const deletedIds = getDeletedAdvertIds();
      setLocalAdverts(adverts.filter((a) => a && a.id && !deletedIds.has(a.id) && !SYSTEM_DEMO_ADVERT_IDS.has(a.id) && a.status !== 'deleted'));
    }
  }, [adverts]);

  const [advertsCategoryFilter, setAdvertsCategoryFilter] = useState<'all' | 'Property' | 'Estate' | 'Promo' | 'Service'>('all');
  const [advertsVerifiedFilter, setAdvertsVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [advertsStatusFilter, setAdvertsStatusFilter] = useState<'all' | 'active' | 'pending_review' | 'expired'>('all');
  const [isApiWebhookOpen, setIsApiWebhookOpen] = useState(false);
  const [isPartnerPortalPreviewOpen, setIsPartnerPortalPreviewOpen] = useState(false);
  const [isAdsGuideOpen, setIsAdsGuideOpen] = useState(false);
  const [editingAdvert, setEditingAdvert] = useState<AdvertStory | null>(null);
  const [isCreateAdvertOpen, setIsCreateAdvertOpen] = useState(false);
  const [advertForm, setAdvertForm] = useState<Partial<AdvertStory>>({
    headline: '',
    advertiserName: '',
    advertiserHandle: '',
    category: 'Property',
    badgeText: 'Featured',
    mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    location: 'Asaba, Delta State',
    price: '',
    description: '',
    ctaText: 'Visit Website',
    websiteUrl: '',
    phone: '',
    whatsappNumber: '',
    isVerified: true,
  });

  // Local state for users and settings
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => getRegisteredUsers());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(getPlatformSettings());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Filtering states
  const [agentFilter, setAgentFilter] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [tenantFilter, setTenantFilter] = useState<'all' | 'verified' | 'suspended'>('all');
  const [listingFilter, setListingFilter] = useState<'all' | 'Available' | 'Under Inspection' | 'Rented Out' | 'flagged'>('all');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'REQUEST_SUBMITTED' | 'QUEUED' | 'CONFIRMED_UNLOCKED' | 'REJECTED_BY_AGENT'>('all');

  // Modals state
  const [inspectingKycUser, setInspectingKycUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('Violation of platform verification guidelines');
  const [viewingTenantBookings, setViewingTenantBookings] = useState<UserProfile | null>(null);
  const [directPassModalTenant, setDirectPassModalTenant] = useState<UserProfile | null>(null);
  const [directPassSelectedListingId, setDirectPassSelectedListingId] = useState<string>('');

  // Custom Confirm & Alert Dialog state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    itemSubtitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const openConfirmDialog = (options: {
    title: string;
    message: string;
    itemTitle?: string;
    itemSubtitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModalState({
      isOpen: true,
      ...options,
    });
  };

  // Toast display helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Advert Handlers
  const handleOpenCreateAdvert = () => {
    setAdvertForm({
      headline: '',
      advertiserName: '',
      advertiserHandle: '',
      category: 'Property',
      badgeText: 'Featured',
      mediaUrl: '/images/properties/asaba_gra_exterior.jpg',
      location: 'Asaba, Delta State',
      price: '',
      description: '',
      ctaText: 'Visit Website',
      websiteUrl: '',
      phone: '',
      whatsappNumber: '',
      isVerified: true,
    });
    setEditingAdvert(null);
    setIsCreateAdvertOpen(true);
  };

  const handleOpenEditAdvert = (ad: AdvertStory) => {
    setAdvertForm({ ...ad });
    setEditingAdvert(ad);
    setIsCreateAdvertOpen(true);
  };

  const handleSaveAdvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advertForm.headline?.trim() || !advertForm.advertiserName?.trim()) {
      showToast('Please provide a headline and advertiser name.');
      return;
    }

    const adToSave: AdvertStory = {
      id: editingAdvert ? editingAdvert.id : `ad-${Date.now()}`,
      title: advertForm.headline?.trim() || 'Sponsored Advert',
      headline: advertForm.headline?.trim() || '',
      advertiserName: advertForm.advertiserName?.trim() || 'Setlla Sponsor',
      advertiserHandle: advertForm.advertiserHandle?.trim() || advertForm.advertiserName?.toLowerCase().replace(/\s+/g, '_') || 'sponsor',
      avatarUrl: advertForm.avatarUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80',
      category: advertForm.category || 'Property',
      badgeText: advertForm.badgeText?.trim() || 'Featured',
      thumbnailUrl: advertForm.mediaUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
      mediaUrl: advertForm.mediaUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      location: advertForm.location?.trim() || 'Delta State',
      price: advertForm.price?.trim() || undefined,
      description: advertForm.description?.trim() || '',
      ctaText: advertForm.ctaText?.trim() || 'Visit Website',
      websiteUrl: advertForm.websiteUrl?.trim() || undefined,
      actionType: advertForm.websiteUrl?.trim() ? 'website' : 'contact',
      whatsappNumber: advertForm.whatsappNumber?.trim() || advertForm.phone?.trim() || undefined,
      phone: advertForm.phone?.trim() || undefined,
      isVerified: Boolean(advertForm.isVerified),
      likesCount: editingAdvert?.likesCount || Math.floor(Math.random() * 20) + 5,
      commentsCount: editingAdvert?.commentsCount || Math.floor(Math.random() * 10),
      sharesCount: editingAdvert?.sharesCount || Math.floor(Math.random() * 8) + 1,
      timeAgo: editingAdvert?.timeAgo || 'Just now',
    };

    setLocalAdverts((prev) => {
      const exists = prev.some((item) => item.id === adToSave.id);
      const updated = exists ? prev.map((item) => (item.id === adToSave.id ? adToSave : item)) : [adToSave, ...prev];
      return updated;
    });

    saveAdvert(adToSave);

    if (editingAdvert) {
      onUpdateAdvert?.(adToSave);
      showToast(`Advert "${adToSave.headline}" updated successfully.`);
    } else {
      onAddAdvert?.(adToSave);
      showToast(`New advert "${adToSave.headline}" published.`);
    }

    recordAuditLog(
      'ADMIN_ADVERT_SAVED',
      'system',
      currentUser.id,
      currentUser.fullName,
      adToSave.advertiserName,
      `Saved/updated advert "${adToSave.headline}" (${adToSave.category}).`
    );

    setIsCreateAdvertOpen(false);
    setEditingAdvert(null);
  };

  const handleDeleteAdvertInternal = (adId: string) => {
    const toDelete = localAdverts.find((a) => a.id === adId);
    setLocalAdverts((prev) => prev.filter((a) => a.id !== adId));
    removeAdvert(adId);

    onDeleteAdvert?.(adId);

    if (toDelete) {
      recordAuditLog(
        'ADMIN_ADVERT_DELETED',
        'system',
        currentUser.id,
        currentUser.fullName,
        toDelete.advertiserName,
        `Deleted advert "${toDelete.headline}".`
      );
    }

    showToast('Advert removed successfully.');
  };

  const handleToggleAdvertVerification = (adId: string) => {
    const target = localAdverts.find((a) => a.id === adId);
    if (!target) return;
    const updated: AdvertStory = { ...target, isVerified: !target.isVerified };
    setLocalAdverts((prev) => prev.map((item) => (item.id === adId ? updated : item)));
    saveAdvert(updated);
    onUpdateAdvert?.(updated);
    showToast(`Advert verification ${updated.isVerified ? 'enabled' : 'disabled'}.`);
  };

  const handleApprovePartnerSubmission = async (adId: string) => {
    const updated = await approvePartnerAdvert(adId, 30);
    if (updated) {
      setLocalAdverts((prev) => prev.map((a) => (a.id === adId ? updated : a)));
      onUpdateAdvert?.(updated);
      showToast(`Campaign "${updated.headline}" approved & broadcasted live!`);
      recordAuditLog(
        'ADVERT_APPROVED',
        'system',
        updated.id,
        updated.headline,
        currentUser.fullName,
        `Approved submission from ${updated.advertiserName}. Flight active for 30 days.`
      );
    }
  };

  const handleRejectPartnerSubmission = async (adId: string) => {
    const updated = await rejectPartnerAdvert(adId);
    if (updated) {
      setLocalAdverts((prev) => prev.map((a) => (a.id === adId ? updated : a)));
      onUpdateAdvert?.(updated);
      showToast(`Campaign rejected.`);
      recordAuditLog(
        'ADVERT_REJECTED',
        'system',
        updated.id,
        updated.headline,
        currentUser.fullName,
        `Rejected partner submission from ${updated.advertiserName}.`
      );
    }
  };

  const pendingPartnerAdverts = useMemo(() => {
    return localAdverts.filter((a) => a.status === 'pending_review');
  }, [localAdverts]);

  const filteredAdverts = useMemo(() => {
    return localAdverts.filter((ad) => {
      const q = globalSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ad.headline.toLowerCase().includes(q) ||
        ad.advertiserName.toLowerCase().includes(q) ||
        (ad.location && ad.location.toLowerCase().includes(q)) ||
        (ad.description && ad.description.toLowerCase().includes(q));

      const matchesCategory =
        advertsCategoryFilter === 'all' || ad.category === advertsCategoryFilter;

      const matchesVerified =
        advertsVerifiedFilter === 'all' ||
        (advertsVerifiedFilter === 'verified' ? ad.isVerified : !ad.isVerified);

      const matchesStatus =
        advertsStatusFilter === 'all' ||
        (ad.status || 'active') === advertsStatusFilter;

      return matchesSearch && matchesCategory && matchesVerified && matchesStatus;
    });
  }, [localAdverts, globalSearch, advertsCategoryFilter, advertsVerifiedFilter, advertsStatusFilter]);

  // Load and refresh user list and logs
  const refreshAdminData = () => {
    setRegisteredUsers(getRegisteredUsers());
    setPlatformSettings(getPlatformSettings());
    setAuditLogs(getAuditLogs());
    fetchRegisteredUsersFromDb().then((users) => {
      if (users && users.length > 0) {
        setRegisteredUsers(users);
      }
    });
  };

  useEffect(() => {
    refreshAdminData();

    // 1. Cross-device Realtime event listener for live registrations/updates
    const unsub = subscribeToRealtimeEvents((event) => {
      if (event.type === 'USER_REGISTERED' || event.type === 'USER_UPDATED') {
        refreshAdminData();
      }
    });

    // 2. Poll Supabase every 12s so new accounts from mobile reflect automatically
    const interval = setInterval(() => {
      fetchRegisteredUsersFromDb().then((users) => {
        if (users && users.length > 0) {
          setRegisteredUsers(users);
        }
      });
    }, 12000);

    // 3. Auto-sync on window focus
    const handleFocus = () => refreshAdminData();
    window.addEventListener('focus', handleFocus);

    return () => {
      unsub();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Split users into agents and tenants
  const agentsList = useMemo(() => {
    return registeredUsers.filter((u) => u.isAgent);
  }, [registeredUsers]);

  const tenantsList = useMemo(() => {
    return registeredUsers.filter((u) => !u.isAgent && !u.isAdmin);
  }, [registeredUsers]);

  // Derived KPI Metrics
  const totalVerifiedAgents = agentsList.filter((a) => a.kycStatus === 'verified' || a.isVerifiedTenant).length;
  const pendingKycAgents = agentsList.filter((a) => a.kycStatus === 'pending').length;
  const suspendedUsersCount = registeredUsers.filter((u) => u.isSuspended).length;

  const totalListingsValue = useMemo(() => {
    return listings.reduce((sum, l) => sum + (l.fees?.baseRent || 0), 0);
  }, [listings]);

  const totalInspectionFeesCollected = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'CONFIRMED_UNLOCKED')
      .reduce((sum, b) => sum + (b.inspectionFeeAmount || 2500), 0);
  }, [bookings]);

  const confirmedPassesCount = bookings.filter((b) => b.status === 'CONFIRMED_UNLOCKED').length;
  const pendingRequestsCount = bookings.filter((b) => b.status === 'REQUEST_SUBMITTED').length;
  const queuedCount = bookings.filter((b) => b.status === 'QUEUED').length;

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return agentsList.filter((agent) => {
      if (agentFilter === 'verified' && agent.kycStatus !== 'verified') return false;
      if (agentFilter === 'pending' && agent.kycStatus !== 'pending') return false;
      if (agentFilter === 'suspended' && !agent.isSuspended) return false;

      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return (
        agent.fullName.toLowerCase().includes(q) ||
        (agent.agencyName && agent.agencyName.toLowerCase().includes(q)) ||
        agent.phone.includes(q) ||
        (agent.email && agent.email.toLowerCase().includes(q)) ||
        (agent.cacNumber && agent.cacNumber.toLowerCase().includes(q)) ||
        (agent.city && agent.city.toLowerCase().includes(q))
      );
    });
  }, [agentsList, agentFilter, globalSearch]);

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    return tenantsList.filter((tenant) => {
      if (tenantFilter === 'verified' && !tenant.isVerifiedTenant) return false;
      if (tenantFilter === 'suspended' && !tenant.isSuspended) return false;

      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return (
        tenant.fullName.toLowerCase().includes(q) ||
        tenant.phone.includes(q) ||
        (tenant.email && tenant.email.toLowerCase().includes(q)) ||
        (tenant.nin && tenant.nin.toLowerCase().includes(q)) ||
        (tenant.city && tenant.city.toLowerCase().includes(q))
      );
    });
  }, [tenantsList, tenantFilter, globalSearch]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (listingFilter === 'flagged' && !l.isFlagged) return false;
      if (listingFilter !== 'all' && listingFilter !== 'flagged' && l.availabilityStatus !== listingFilter) return false;

      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.neighborhood.toLowerCase().includes(q) ||
        l.agent.fullName.toLowerCase().includes(q) ||
        l.agent.agencyName.toLowerCase().includes(q)
      );
    });
  }, [listings, listingFilter, globalSearch]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;

      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      const prop = listings.find((l) => l.id === b.propertyId);
      return (
        b.applicantName.toLowerCase().includes(q) ||
        b.applicantPhone.includes(q) ||
        (b.applicantEmail && b.applicantEmail.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q) ||
        (prop && prop.title.toLowerCase().includes(q))
      );
    });
  }, [bookings, bookingFilter, globalSearch, listings]);

  // Action: Toggle Agent Verification
  const handleToggleAgentVerification = (agent: UserProfile) => {
    const updated = toggleAgentVerification(agent, currentUser.fullName);
    refreshAdminData();
    showToast(`${agent.fullName}'s verification status updated to ${updated.kycStatus === 'verified' ? 'Verified' : 'Pending'}.`);
  };

  // Action: Toggle Tenant Verification
  const handleToggleTenantVerification = (tenant: UserProfile) => {
    const updated = toggleTenantVerification(tenant, currentUser.fullName);
    refreshAdminData();
    showToast(`${tenant.fullName}'s tenant status updated to ${updated.isVerifiedTenant ? 'Verified Tenant' : 'Unverified'}.`);
  };

  // Action: Confirm Suspension
  const handleConfirmSuspension = () => {
    if (!suspendingUser) return;
    const updated = toggleUserSuspension(suspendingUser, suspensionReasonInput, currentUser.fullName);
    refreshAdminData();
    setSuspendingUser(null);
    showToast(`${updated.fullName} has been ${updated.isSuspended ? 'suspended' : 'reinstated'}.`);
  };

  // Action: Delete User
  const handleDeleteUser = (user: UserProfile) => {
    openConfirmDialog({
      title: `Permanently Delete ${user.isAgent ? 'Agent' : 'Tenant'} Account?`,
      message: `Are you sure you want to remove ${user.fullName} (${user.phone}) from the Setlla registry? All active authorizations and linked data will be revoked.`,
      itemTitle: `${user.fullName} (${user.phone})`,
      itemSubtitle: user.email || (user.isAgent ? (user.agencyName || 'Independent Agent') : 'Tenant Account'),
      badge: 'USER ACCOUNT MANAGEMENT',
      confirmText: 'Yes, Delete Account',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        deleteUserFromRegistry(user.id);
        recordAuditLog(
          'USER_DELETED',
          user.isAgent ? 'agent' : 'tenant',
          user.id,
          user.fullName,
          currentUser.fullName,
          'Permanently removed user account.'
        );
        refreshAdminData();
        showToast(`Removed ${user.fullName} from user registry.`);
        setConfirmModalState(null);
      },
    });
  };

  // Action: Save Edited User
  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    adminUpdateUser(editingUser);
    recordAuditLog(
      'USER_EDITED',
      editingUser.isAgent ? 'agent' : 'tenant',
      editingUser.id,
      editingUser.fullName,
      currentUser.fullName,
      'Administrative profile coordinates updated.'
    );
    refreshAdminData();
    setEditingUser(null);
    showToast(`Saved updates for ${editingUser.fullName}.`);
  };

  // Action: Toggle Listing Feature / Boost
  const handleToggleFeatureListing = (listing: PropertyListing) => {
    if (!onUpdateListing) return;
    const isNowFeatured = !listing.isFeatured;
    const updated: PropertyListing = { ...listing, isFeatured: isNowFeatured };
    onUpdateListing(updated);
    recordAuditLog(
      isNowFeatured ? 'LISTING_FEATURED' : 'LISTING_UNFEATURED',
      'listing',
      listing.id,
      listing.title,
      currentUser.fullName,
      isNowFeatured ? 'Pinned to top of Explore feed.' : 'Removed featured pin.'
    );
    showToast(isNowFeatured ? `Featured "${listing.title}" on Explore feed.` : `Unpinned "${listing.title}".`);
  };

  // Action: Toggle Listing Flag / Moderation Warning
  const handleToggleFlagListing = (listing: PropertyListing) => {
    if (!onUpdateListing) return;
    const isNowFlagged = !listing.isFlagged;
    const updated: PropertyListing = {
      ...listing,
      isFlagged: isNowFlagged,
      flagReason: isNowFlagged ? 'Under administrative review for compliance verification' : undefined,
    };
    onUpdateListing(updated);
    recordAuditLog(
      isNowFlagged ? 'LISTING_FLAGGED' : 'LISTING_UNFLAGGED',
      'listing',
      listing.id,
      listing.title,
      currentUser.fullName,
      isNowFlagged ? 'Flagged listing pending audit.' : 'Cleared listing moderation flag.'
    );
    showToast(isNowFlagged ? `Flagged "${listing.title}" for review.` : `Cleared flag on "${listing.title}".`);
  };

  // Action: Super Admin Force Confirm Booking (Override)
  const handleForceConfirmBooking = (bookingId: string) => {
    onAcceptBooking(bookingId);
    recordAuditLog(
      'BOOKING_FORCE_UNLOCKED',
      'booking',
      bookingId,
      `Booking ${bookingId}`,
      currentUser.fullName,
      'Super Admin bypassed agent response and unlocked inspection pass.'
    );
    showToast(`Force unlocked inspection pass ${bookingId}. Coordinates revealed.`);
  };

  // Action: Super Admin Cancel Booking
  const handleAdminCancelBooking = (bookingId: string) => {
    onRejectBooking(bookingId);
    recordAuditLog(
      'BOOKING_CANCELLED_BY_ADMIN',
      'booking',
      bookingId,
      `Booking ${bookingId}`,
      currentUser.fullName,
      'Super Admin cancelled inspection booking.'
    );
    showToast(`Inspection booking ${bookingId} has been cancelled.`);
  };

  // Action: Issue Direct Pass to Tenant
  const handleIssueDirectPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPassModalTenant || !directPassSelectedListingId) return;

    const targetListing = listings.find((l) => l.id === directPassSelectedListingId);
    if (!targetListing) return;

    const newBookingId = `DT-ADM-${Date.now().toString().slice(-4)}`;
    const slot = targetListing.inspectionSlots[0] || {
      id: 'slot-admin',
      timeWindow: '11:00 AM – 1:00 PM',
      date: 'Today',
      capacityLimit: 5,
      bookedCount: 1,
      waitlistCount: 0,
    };

    const newBooking: BookingRecord = {
      id: newBookingId,
      propertyId: targetListing.id,
      slotId: slot.id,
      slotTimeWindow: slot.timeWindow,
      slotDate: slot.date || 'Today',
      applicantName: directPassModalTenant.fullName,
      applicantPhone: directPassModalTenant.phone,
      applicantEmail: directPassModalTenant.email,
      status: 'CONFIRMED_UNLOCKED',
      inspectionFeeAmount: 0,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      paymentMethod: 'Card',
      paymentReference: `ADMIN-GRANT-${Date.now().toString(36).toUpperCase()}`,
    };

    // Save into localStorage
    try {
      const raw = localStorage.getItem('setlla_bookings') || '[]';
      const existing = JSON.parse(raw);
      existing.unshift(newBooking);
      localStorage.setItem('setlla_bookings', JSON.stringify(existing));
    } catch (_) {}

    recordAuditLog(
      'DIRECT_PASS_ISSUED',
      'booking',
      newBookingId,
      `Pass for ${directPassModalTenant.fullName}`,
      currentUser.fullName,
      `Issued VIP unlocked pass for "${targetListing.title}".`
    );

    setDirectPassModalTenant(null);
    setDirectPassSelectedListingId('');
    showToast(`VIP Inspection Pass issued for ${directPassModalTenant.fullName}!`);
  };

  // Action: Save Platform Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePlatformSettings(platformSettings);
    recordAuditLog(
      'SETTINGS_UPDATED',
      'system',
      'platform_settings',
      'Platform Configuration',
      currentUser.fullName,
      `Fee: ₦${platformSettings.defaultInspectionFee}, Queue: ${platformSettings.maxQueueLimitPerSlot}, Banner: ${platformSettings.emergencyAnnouncementActive ? 'Active' : 'Off'}`
    );
    showToast('Platform settings saved successfully.');
  };

  // Action: Export Backup
  const handleExportData = () => {
    exportPlatformDataSnapshot(listings, bookings, registeredUsers, platformSettings);
    recordAuditLog('DATA_BACKUP_EXPORTED', 'system', 'backup', 'Platform Backup', currentUser.fullName);
    showToast('Platform backup JSON downloaded.');
  };

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] pt-20 pb-24 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slide-down bg-[#000004] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 text-xs sm:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Super Admin Command Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5E7EB] shadow-xs mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#000004] flex items-center justify-center shrink-0 shadow-md border border-slate-800 p-2.5">
              <img src="/images/setlla-logo-white.png" alt="Setlla" className="w-full h-auto object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#000004] tracking-tight">
                  Super Admin Console
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#70798C] mt-1 flex flex-wrap items-center gap-2">
                <span>Direct oversight across Delta State rentals, verified agents, tenants, and inspection escrows.</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportData}
              className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-bold text-[#000004] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Download complete JSON backup of listings, bookings, and users"
            >
              <Download className="w-3.5 h-3.5 text-[#70798C]" />
              <span>Export Backup</span>
            </button>
            <button
              onClick={refreshAdminData}
              className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-bold text-[#000004] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4 text-[#70798C]" />
            </button>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="py-2.5 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Sign out of Super Admin Console"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search across agents, tenants, phone numbers, CAC, titles, cities..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C] focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs Island */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Overview & KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer relative shrink-0 ${
              activeTab === 'agents'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Agents Control</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[#000004] text-[10px] font-semibold">
              {agentsList.length}
            </span>
            {pendingKycAgents > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'tenants'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Tenants Control</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[#000004] text-[10px] font-semibold">
              {tenantsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'listings'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span>Listings ({listings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'inspections'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Global Inspections</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'ads'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Ads Management</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[#000004] text-[10px] font-semibold">
              {localAdverts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'financials'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>Escrow & Fees</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>Platform Config</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'audit'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT PANELS */}

      {/* ========================================================================= */}
      {/* TAB A: OVERVIEW & KPIS COMMAND CENTER                                     */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Active Listings Value */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Gross Inventory Value</span>
                <Building className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
                {formatNaira(totalListingsValue)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
                <span className="font-bold text-emerald-600">{listings.length} verified listings</span>
                <span>across 5 cities</span>
              </div>
            </div>

            {/* Card 2: Verified Agents Pool */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Active Agents Pool</span>
                <UserCheck className="w-4 h-4 text-[#70798C]" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
                {agentsList.length} Agents
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
                <span className="font-bold text-amber-600">{totalVerifiedAgents} Verified</span>
                <span>• {pendingKycAgents} Awaiting Review</span>
              </div>
            </div>

            {/* Card 3: Registered Tenants */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Registered Tenants</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
                {tenantsList.length} Tenants
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
                <span className="font-bold text-blue-600">
                  {tenantsList.filter((t) => t.isVerifiedTenant).length} NIN Verified
                </span>
              </div>
            </div>

            {/* Card 4: Inspection Escrow Volume */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Clearance Fees Escrow</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
                {formatNaira(totalInspectionFeesCollected)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
                <span className="font-bold text-emerald-600">{confirmedPassesCount} Unlocked Passes</span>
              </div>
            </div>
          </div>

          {/* Urgent Action Alerts */}
          {(pendingKycAgents > 0 || pendingRequestsCount > 0 || suspendedUsersCount > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 text-xs text-[#000004] space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Super Admin Priority Attention Items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {pendingKycAgents > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('agents');
                      setAgentFilter('pending');
                    }}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between hover:bg-amber-100/50 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-amber-900">{pendingKycAgents} Agent(s) Awaiting KYC</span>
                      <p className="text-[11px] text-amber-700">Review CAC & identity credentials</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>
                )}

                {pendingRequestsCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('inspections');
                      setBookingFilter('REQUEST_SUBMITTED');
                    }}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between hover:bg-amber-100/50 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-amber-900">{pendingRequestsCount} Pending Inspections</span>
                      <p className="text-[11px] text-amber-700">Awaiting agent responses or override</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>
                )}

                {suspendedUsersCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('agents');
                      setAgentFilter('suspended');
                    }}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between hover:bg-amber-100/50 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-red-900">{suspendedUsersCount} Suspended Account(s)</span>
                      <p className="text-[11px] text-red-700">Under administrative freeze</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Two-Column Overview: Geographic Distribution & Realtime Audit preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Delta State City Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-[#000004] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Delta State Market Footprint</span>
                </h3>
                <span className="text-xs text-[#70798C] font-semibold">{listings.length} listings active</span>
              </div>

              <div className="space-y-3">
                {['Asaba', 'Warri', 'Abraka', 'Ughelli', 'Sapele'].map((city) => {
                  const cityListings = listings.filter((l) => l.city.toLowerCase().includes(city.toLowerCase()));
                  const count = cityListings.length;
                  const pct = listings.length > 0 ? Math.round((count / listings.length) * 100) : 0;
                  return (
                    <div key={city} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#000004]">{city}</span>
                        <span className="text-[#70798C]">{count} properties ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#000004]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Recent Audit Ledger Preview */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-base text-[#000004] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>Real-Time Admin Activity</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-bold text-[#000004] hover:underline"
                  >
                    View All ({auditLogs.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB]/80 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#000004] mb-0.5">
                        <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-[#70798C]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#000004] font-medium text-[11px] mt-1">{log.targetName}</p>
                      {log.details && (
                        <p className="text-[#70798C] text-[10px] mt-0.5">{log.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#70798C]">
                <span>Super Admin: <strong className="text-[#000004]">{currentUser.fullName}</strong></span>
                <span className="font-mono text-[10px]">{currentUser.email || 'admin@setlla.com'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: AGENTS SUPER CONTROL                                               */}
      {/* ========================================================================= */}
      {activeTab === 'agents' && (
        <div className="space-y-5 animate-fade-in">
          {/* Subfilter pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: `All Agents (${agentsList.length})` },
                { id: 'verified', label: `Verified (${totalVerifiedAgents})` },
                { id: 'pending', label: `Pending Review (${pendingKycAgents})` },
                { id: 'suspended', label: `Suspended (${agentsList.filter((a) => a.isSuspended).length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAgentFilter(f.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    agentFilter === f.id
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#70798C]">
              Showing <strong className="text-[#000004]">{filteredAgents.length}</strong> agent accounts
            </div>
          </div>

          {/* Agents Table / Cards */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#000004]">
                <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                  <tr>
                    <th className="py-3.5 px-4">Agent & Agency</th>
                    <th className="py-3.5 px-3">Location & CAC</th>
                    <th className="py-3.5 px-3">Contact</th>
                    <th className="py-3.5 px-3">Inventory</th>
                    <th className="py-3.5 px-3">KYC Status</th>
                    <th className="py-3.5 px-4 text-right">Super Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#70798C]">
                        No agent accounts match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent) => {
                      const agentListingsCount = listings.filter((l) => l.agent.id === agent.id || l.agent.phone === agent.phone).length;
                      const isVerified = agent.kycStatus === 'verified' || agent.isVerifiedTenant;
                      const isPending = agent.kycStatus === 'pending';
                      const isSuspended = agent.isSuspended;

                      return (
                        <tr key={agent.id} className={`hover:bg-slate-50/70 transition-colors ${isSuspended ? 'bg-red-50/30' : ''}`}>
                          {/* Agent Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000004] to-[#1f2937] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                {agent.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-[#000004]">{agent.fullName}</span>
                                  {isVerified && (
                                    <span title="Verified Agent Partner">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    </span>
                                  )}
                                  {isSuspended && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-black uppercase">
                                      Frozen
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#70798C]">{agent.agencyName || 'Independent Real Estate Partner'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Location & CAC */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-xs text-[#000004]">{agent.operatingCity || agent.city || 'Asaba'}</span>
                            <p className="text-[11px] text-[#70798C] font-mono">{agent.cacNumber || 'CAC Pending'}</p>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs">{formatNigerianPhone(agent.phone)}</span>
                            {agent.email && (
                              <p className="text-[11px] text-[#70798C] truncate max-w-[140px]">{agent.email}</p>
                            )}
                          </td>

                          {/* Inventory */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-xs">{agentListingsCount} listings</span>
                            <p className="text-[10px] text-[#70798C]">Active in feed</p>
                          </td>

                          {/* KYC Status Badge */}
                          <td className="py-3.5 px-3">
                            {isSuspended ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
                                Suspended
                              </span>
                            ) : isVerified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-max">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Verified Partner
                              </span>
                            ) : isPending ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Awaiting KYC
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#70798C] text-[10px] font-medium border border-slate-200">
                                Not Submitted
                              </span>
                            )}
                          </td>

                          {/* Controls */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* KYC Document Viewer */}
                              <button
                                onClick={() => setInspectingKycUser(agent)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                                title="View KYC Identity Documents"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Verify / Revoke Toggle */}
                              <button
                                onClick={() => handleToggleAgentVerification(agent)}
                                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isVerified
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-[#000004] text-white hover:bg-[#1f2937]'
                                }`}
                                title={isVerified ? 'Revoke Verification' : 'Verify Agent'}
                              >
                                {isVerified ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-slate-400" />
                                    <span>Verify</span>
                                  </>
                                )}
                              </button>

                              {/* Edit Modal */}
                              <button
                                onClick={() => setEditingUser(agent)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                                title="Edit Agent Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Freeze Toggle */}
                              <button
                                onClick={() => {
                                  if (isSuspended) {
                                    const updated = toggleUserSuspension(agent, 'Reinstated', currentUser.fullName);
                                    refreshAdminData();
                                    showToast(`${updated.fullName} has been reactivated.`);
                                  } else {
                                    setSuspendingUser(agent);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isSuspended
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                    : 'border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={isSuspended ? 'Reactivate Account' : 'Freeze / Suspend Account'}
                              >
                                {isSuspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete Account */}
                              <button
                                onClick={() => handleDeleteUser(agent)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Agent Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: TENANTS (SEEKERS) SUPER CONTROL                                    */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-5 animate-fade-in">
          {/* Subfilter pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: `All Tenants (${tenantsList.length})` },
                { id: 'verified', label: `NIN Verified (${tenantsList.filter((t) => t.isVerifiedTenant).length})` },
                { id: 'suspended', label: `Suspended (${tenantsList.filter((t) => t.isSuspended).length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTenantFilter(f.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    tenantFilter === f.id
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#70798C]">
              Showing <strong className="text-[#000004]">{filteredTenants.length}</strong> tenant accounts
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#000004]">
                <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                  <tr>
                    <th className="py-3.5 px-4">Tenant Name</th>
                    <th className="py-3.5 px-3">City & Preference</th>
                    <th className="py-3.5 px-3">Contact Coordinates</th>
                    <th className="py-3.5 px-3">NIN Identity</th>
                    <th className="py-3.5 px-3">Passes & Bookings</th>
                    <th className="py-3.5 px-4 text-right">Super Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#70798C]">
                        No tenant accounts match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => {
                      const userBookings = bookings.filter((b) => b.applicantPhone === tenant.phone || (tenant.email && b.applicantEmail === tenant.email));
                      const unlockedCount = userBookings.filter((b) => b.status === 'CONFIRMED_UNLOCKED').length;
                      const isVerified = tenant.isVerifiedTenant;
                      const isSuspended = tenant.isSuspended;

                      return (
                        <tr key={tenant.id} className={`hover:bg-slate-50/70 transition-colors ${isSuspended ? 'bg-red-50/30' : ''}`}>
                          {/* Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-[#000004] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E5E7EB]">
                                {tenant.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-[#000004]">{tenant.fullName}</span>
                                  {isVerified && (
                                    <span title="Verified Tenant">
                                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    </span>
                                  )}
                                  {isSuspended && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-black uppercase">
                                      Frozen
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-[#70798C]">{tenant.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* City & Preference */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-xs">{tenant.city || 'Asaba'}</span>
                            <p className="text-[11px] text-[#70798C]">
                              {tenant.preferredPropertyType || 'Any Property'}
                              {tenant.budget ? ` • ₦${(tenant.budget / 1000000).toFixed(1)}M budget` : ''}
                            </p>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs">{formatNigerianPhone(tenant.phone)}</span>
                            {tenant.email && (
                              <p className="text-[11px] text-[#70798C] truncate max-w-[140px]">{tenant.email}</p>
                            )}
                          </td>

                          {/* NIN Verification */}
                          <td className="py-3.5 px-3">
                            {isVerified ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200 flex items-center gap-1 w-max">
                                <Check className="w-3 h-3 text-blue-600" />
                                Verified NIN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#70798C] text-[10px] font-medium border border-slate-200">
                                Unverified
                              </span>
                            )}
                            {tenant.nin && (
                              <p className="text-[10px] text-[#70798C] font-mono mt-0.5">{tenant.nin}</p>
                            )}
                          </td>

                          {/* Passes & Bookings */}
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => setViewingTenantBookings(tenant)}
                              className="text-xs font-bold text-[#000004] hover:underline flex items-center gap-1"
                            >
                              <span>{userBookings.length} booking(s)</span>
                              <ExternalLink className="w-3 h-3 text-[#70798C]" />
                            </button>
                            <p className="text-[10px] text-emerald-700 font-semibold">{unlockedCount} unlocked passes</p>
                          </td>

                          {/* Super Controls */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct Pass Grant */}
                              <button
                                onClick={() => setDirectPassModalTenant(tenant)}
                                className="py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Issue Direct Inspection Pass"
                              >
                                <CalendarCheck className="w-3 h-3" />
                                <span>Issue Pass</span>
                              </button>

                              {/* Toggle Verification */}
                              <button
                                onClick={() => handleToggleTenantVerification(tenant)}
                                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isVerified
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                                }`}
                                title={isVerified ? 'Revoke Verification' : 'Verify Tenant'}
                              >
                                {isVerified ? 'Verified' : 'Verify'}
                              </button>

                              {/* Edit Modal */}
                              <button
                                onClick={() => setEditingUser(tenant)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                                title="Edit Tenant Profile"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend Toggle */}
                              <button
                                onClick={() => {
                                  if (isSuspended) {
                                    const updated = toggleUserSuspension(tenant, 'Reinstated', currentUser.fullName);
                                    refreshAdminData();
                                    showToast(`${updated.fullName} has been reactivated.`);
                                  } else {
                                    setSuspendingUser(tenant);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isSuspended
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                    : 'border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={isSuspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
                              >
                                {isSuspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete Tenant */}
                              <button
                                onClick={() => handleDeleteUser(tenant)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Tenant Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB D: LISTINGS & PROPERTY MODERATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'listings' && (
        <div className="space-y-5 animate-fade-in">
          {/* Subfilter pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: `All Listings (${listings.length})` },
                { id: 'Available', label: 'Available' },
                { id: 'Under Inspection', label: 'Under Inspection' },
                { id: 'Rented Out', label: 'Rented Out' },
                { id: 'flagged', label: `Flagged (${listings.filter((l) => l.isFlagged).length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setListingFilter(f.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    listingFilter === f.id
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#70798C]">
              Showing <strong className="text-[#000004]">{filteredListings.length}</strong> listings
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#000004]">
                <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                  <tr>
                    <th className="py-3.5 px-4">Property & Media</th>
                    <th className="py-3.5 px-3">Rent & Fees</th>
                    <th className="py-3.5 px-3">Lister / Agent</th>
                    <th className="py-3.5 px-3">Inspection Queue</th>
                    <th className="py-3.5 px-3">Moderation Status</th>
                    <th className="py-3.5 px-4 text-right">Super Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#70798C]">
                        No property listings match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map((listing) => {
                      const firstImage = listing.media.find((m) => m.type === 'image')?.url || listing.media[0]?.poster || DEFAULT_FALLBACK_IMAGE;
                      const isFeatured = listing.isFeatured;
                      const isFlagged = listing.isFlagged;

                      return (
                        <tr key={listing.id} className={`hover:bg-slate-50/70 transition-colors ${isFlagged ? 'bg-amber-50/40' : ''}`}>
                          {/* Property Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-[#E5E7EB] relative">
                                <img
                                  src={firstImage}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                                  }}
                                />
                                {isFeatured && (
                                  <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                    <Star className="w-2 h-2 fill-white" />
                                  </div>
                                )}
                              </div>
                              <div className="max-w-xs sm:max-w-sm">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-[#000004] line-clamp-1">{listing.title}</span>
                                  {isFeatured && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#70798C] flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[#70798C]" />
                                  <span>{listing.neighborhood}, {listing.city}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Address: {listing.fullAddress}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Rent */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-sm text-[#000004]">{formatNaira(listing.fees?.baseRent || 0)}</span>
                            <p className="text-[10px] text-[#70798C]">
                              Package: {formatNaira(listing.fees?.totalMoveInPackage || listing.fees?.baseRent || 0)}
                            </p>
                          </td>

                          {/* Agent */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-xs">{listing.agent.fullName}</span>
                            <p className="text-[11px] text-[#70798C] truncate max-w-[130px]">{listing.agent.agencyName}</p>
                            <span className="font-mono text-[10px] text-slate-500">{listing.agent.phone}</span>
                          </td>

                          {/* Slots */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-xs">
                              {listing.inspectionSlots?.reduce((acc, s) => acc + (s.bookedCount || 0), 0) || 0} booked
                            </span>
                            <p className="text-[10px] text-[#70798C]">Fee: ₦{listing.inspectionFee || 2500}</p>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <select
                              value={listing.availabilityStatus || 'Available'}
                              onChange={(e) => onUpdateListingAvailability(listing.id, e.target.value as ListingAvailability)}
                              className="text-[11px] font-bold py-1 px-2 rounded-lg border border-[#E5E7EB] bg-white text-[#000004] focus:outline-none cursor-pointer"
                            >
                              <option value="Available">Available</option>
                              <option value="Under Inspection">Under Inspection</option>
                              <option value="Rented Out">Rented Out</option>
                            </select>
                            {isFlagged && (
                              <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Flagged</span>
                              </p>
                            )}
                          </td>

                          {/* Super Controls */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Feature Button */}
                              <button
                                onClick={() => handleToggleFeatureListing(listing)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isFeatured
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'border-[#E5E7EB] bg-white text-[#70798C] hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={isFeatured ? 'Unpin Featured' : 'Feature Listing on Explore Feed'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-600 text-amber-600' : ''}`} />
                              </button>

                              {/* Flag / Moderation Warning */}
                              <button
                                onClick={() => handleToggleFlagListing(listing)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isFlagged
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'border-[#E5E7EB] bg-white text-[#70798C] hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={isFlagged ? 'Clear Flag' : 'Flag Listing for Compliance Audit'}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Listing */}
                              <button
                                onClick={() => {
                                  openConfirmDialog({
                                    title: 'Permanently Remove Listing?',
                                    message: 'Are you sure you want to remove this property listing from the live Setlla marketplace? Active inspection queues for this property will be archived.',
                                    itemTitle: listing.title,
                                    itemSubtitle: `${listing.city} • ${listing.propertyType} • ${formatNaira(listing.fees.baseRent)}/yr`,
                                    badge: 'MARKETPLACE LISTING',
                                    confirmText: 'Yes, Permanently Remove',
                                    cancelText: 'Cancel',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      onDeleteListing(listing.id);
                                      recordAuditLog('LISTING_DELETED', 'listing', listing.id, listing.title, currentUser.fullName);
                                      showToast(`Deleted "${listing.title}".`);
                                      setConfirmModalState(null);
                                    },
                                  });
                                }}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB E: INSPECTIONS & GLOBAL QUEUE COMMAND                                 */}
      {/* ========================================================================= */}
      {activeTab === 'inspections' && (
        <div className="space-y-5 animate-fade-in">
          {/* Subfilter pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: `All Bookings (${bookings.length})` },
                { id: 'REQUEST_SUBMITTED', label: `Awaiting Agent (${pendingRequestsCount})` },
                { id: 'CONFIRMED_UNLOCKED', label: `Confirmed Pass (${confirmedPassesCount})` },
                { id: 'QUEUED', label: `Standby Queue (${queuedCount})` },
                { id: 'REJECTED_BY_AGENT', label: 'Declined' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBookingFilter(f.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    bookingFilter === f.id
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#70798C]">
              Showing <strong className="text-[#000004]">{filteredBookings.length}</strong> booking records
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#000004]">
                <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                  <tr>
                    <th className="py-3.5 px-4">Pass ID & Tenant</th>
                    <th className="py-3.5 px-3">Property & Slot</th>
                    <th className="py-3.5 px-3">Assigned Agent</th>
                    <th className="py-3.5 px-3">Fee / Method</th>
                    <th className="py-3.5 px-3">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Super Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#70798C]">
                        No inspection booking records match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => {
                      const prop = listings.find((l) => l.id === booking.propertyId);
                      const isConfirmed = booking.status === 'CONFIRMED_UNLOCKED';
                      const isPending = booking.status === 'REQUEST_SUBMITTED';

                      return (
                        <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* ID & Tenant */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {booking.id}
                            </span>
                            <p className="font-bold text-sm text-[#000004] mt-1">{booking.applicantName}</p>
                            <p className="text-[11px] text-[#70798C] font-mono">{formatNigerianPhone(booking.applicantPhone)}</p>
                          </td>

                          {/* Property & Slot */}
                          <td className="py-3.5 px-3 max-w-xs">
                            <span className="font-bold text-xs line-clamp-1">{prop?.title || 'Unknown Property'}</span>
                            <p className="text-[11px] text-[#70798C] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-[#70798C]" />
                              <span>{booking.slotDate}, {booking.slotTimeWindow}</span>
                            </p>
                          </td>

                          {/* Agent */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-xs">{prop?.agent?.fullName || 'Chief Agent'}</span>
                            <p className="text-[11px] text-[#70798C] font-mono">{prop?.agent?.phone}</p>
                          </td>

                          {/* Fee */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-xs">
                              {booking.inspectionFeeAmount ? formatNaira(booking.inspectionFeeAmount) : '₦0 (Free)'}
                            </span>
                            <p className="text-[10px] text-[#70798C]">{booking.paymentMethod || 'Escrow'}</p>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {isConfirmed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Unlocked Pass
                              </span>
                            ) : isPending ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Awaiting Agent
                              </span>
                            ) : booking.status === 'QUEUED' ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                                Standby Queue #{booking.queuePosition || 1}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#70798C] text-[10px] font-medium border border-slate-200">
                                {booking.status}
                              </span>
                            )}
                          </td>

                          {/* Super Controls */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isConfirmed && (
                                <button
                                  onClick={() => handleForceConfirmBooking(booking.id)}
                                  className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Force Approve & Unlock Pass"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Force Confirm</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  openConfirmDialog({
                                    title: 'Cancel Inspection Booking?',
                                    message: `Are you sure you want to cancel inspection booking #${booking.id}? The applicant and agent will be notified.`,
                                    itemTitle: `Applicant: ${booking.applicantName} (${booking.applicantPhone})`,
                                    itemSubtitle: `Slot: ${booking.slotTimeWindow || 'Scheduled inspection'}`,
                                    badge: 'INSPECTION BOOKING',
                                    confirmText: 'Yes, Cancel Booking',
                                    cancelText: 'Keep Booking',
                                    variant: 'warning',
                                    onConfirm: () => {
                                      handleAdminCancelBooking(booking.id);
                                      setConfirmModalState(null);
                                    },
                                  });
                                }}
                                className="py-1 px-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-red-50 text-[#70798C] hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                                title="Cancel Booking"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB E.2: ADS MANAGEMENT & SPONSORED CAMPAIGNS                              */}
      {/* ========================================================================= */}
      {activeTab === 'ads' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h3 className="font-display font-bold text-lg text-[#000004]">
                  Sponsored Ads & Multi-Channel Campaigns
                </h3>
              </div>
              <p className="text-xs text-[#70798C] mt-1">
                Oversee campaigns across 3 ingestion models: Direct Admin Concierge, Self-Service Partner Portal, and Programmatic REST API.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    window.open(`${window.location.origin}${window.location.pathname}#/partner`, '_blank');
                    return;
                  }
                  if (onSwitchToPartner) {
                    onSwitchToPartner();
                  } else {
                    window.location.hash = '#/partner';
                  }
                }}
                className="py-2.5 px-3.5 rounded-xl border border-[#342A21]/20 bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="View live standalone Setlla Partner & Brand Advertising page (Ctrl+Click to open in new tab)"
              >
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>Live Partner Page</span>
                <ExternalLink className="w-3 h-3 text-[#70798C]" />
              </button>

              <button
                onClick={() => setIsApiWebhookOpen(true)}
                className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Manage REST API keys and programmatic webhook push"
              >
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>API & Keys</span>
              </button>

              <button
                onClick={() => setIsPartnerPortalPreviewOpen(true)}
                className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Preview Self-Service Partner & Advertiser Submission Portal"
              >
                <Megaphone className="w-4 h-4 text-[#B45309]" />
                <span>Partner Form</span>
              </button>

              <button
                onClick={() => setIsAdsGuideOpen(true)}
                className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="View full Ads Setup & Operations Guide"
              >
                <BookOpen className="w-4 h-4 text-[#B45309]" />
                <span>Ads Guide</span>
              </button>

              <button
                onClick={handleOpenCreateAdvert}
                className="py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Create New Advert</span>
              </button>
            </div>
          </div>

          {/* Pending Submissions Review Queue (Method 2 & 3 Submissions) */}
          {pendingPartnerAdverts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {pendingPartnerAdverts.length}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">
                      Incoming Partner Submissions Awaiting Approval
                    </h4>
                    <p className="text-xs text-amber-800">
                      Submitted via the Self-Service Partner Portal or External API. Review creatives before broadcasting live across Delta State.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pendingPartnerAdverts.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img 
                        src={sub.thumbnailUrl || sub.mediaUrl} 
                        alt={sub.headline} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#000004] truncate">{sub.advertiserName}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold uppercase">
                            {sub.packageTier || 'Growth'}
                          </span>
                        </div>
                        <h5 className="font-semibold text-xs text-[#000004] mt-0.5 line-clamp-1">{sub.headline}</h5>
                        <p className="text-[11px] text-[#70798C] line-clamp-1 mt-0.5">{sub.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#70798C]">
                          {sub.partnerEmail && <span>{sub.partnerEmail}</span>}
                          {sub.whatsappNumber && <span>WA: {sub.whatsappNumber}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleRejectPartnerSubmission(sub.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprovePartnerSubmission(sub.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Broadcast</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider block mb-1">
                Active Live Campaigns
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#000004]">
                {localAdverts.filter((a) => (a.status || 'active') === 'active').length}
              </span>
              <span className="text-[11px] text-[#70798C] block mt-1">
                Running in stories & banners
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider block mb-1">
                Pending Reviews
              </span>
              <span className={`text-xl sm:text-2xl font-black ${pendingPartnerAdverts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {pendingPartnerAdverts.length}
              </span>
              <span className="text-[11px] text-[#70798C] block mt-1">
                Awaiting admin broadcast
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider block mb-1">
                Verified Sponsors
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600">
                {localAdverts.filter((a) => a.isVerified).length}
              </span>
              <span className="text-[11px] text-[#70798C] block mt-1">
                Trusted blue badge
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider block mb-1">
                Total Engagements
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#000004]">
                {localAdverts.reduce((acc, a) => acc + (a.likesCount || 0) + (a.commentsCount || 0) + (a.sharesCount || 0), 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-[#70798C] block mt-1">
                Likes, shares & comments
              </span>
            </div>
          </div>

          {/* Filtering Sub-Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              {(['all', 'Property', 'Estate', 'Promo', 'Service'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAdvertsCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    advertsCategoryFilter === cat
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-slate-100 text-[#70798C] hover:bg-slate-200 hover:text-[#000004]'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={advertsStatusFilter}
                onChange={(e) => setAdvertsStatusFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] focus:outline-none cursor-pointer"
              >
                <option value="all">All Campaign Statuses</option>
                <option value="active">Live Active Only</option>
                <option value="pending_review">Pending Review</option>
                <option value="expired">Expired Campaigns</option>
              </select>

              <select
                value={advertsVerifiedFilter}
                onChange={(e) => setAdvertsVerifiedFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] focus:outline-none cursor-pointer"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>

          {/* Adverts Grid */}
          {filteredAdverts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E7EB] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Megaphone className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#000004]">No Adverts Found</h4>
              <p className="text-xs text-[#70798C] max-w-sm mx-auto">
                No sponsored campaigns match your current filters. Create an advert, approve a pending partner, or test an API push.
              </p>
              <button
                onClick={handleOpenCreateAdvert}
                className="py-2.5 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Advert</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAdverts.map((ad) => {
                const daysRemaining = ad.endDate
                  ? Math.ceil((new Date(ad.endDate).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <div
                    key={ad.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      {/* Media Preview Thumbnail */}
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={ad.mediaUrl || ad.thumbnailUrl}
                          alt={ad.headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-[#000004] shadow-xs">
                            {ad.category}
                          </span>

                          <div className="flex items-center gap-1">
                            {ad.submissionSource === 'api_webhook' && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[9px] font-bold">
                                API Push
                              </span>
                            )}
                            {ad.submissionSource === 'partner_portal' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold">
                                Partner Portal
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                                ad.isVerified
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-700/80 text-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{ad.isVerified ? 'Verified' : 'Standard'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Bottom Info on Image */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate text-white/90">
                              {ad.advertiserName}
                            </p>
                            <p className="text-[10px] text-white/70 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-amber-400" />
                              <span>{ad.location || 'Delta State'}</span>
                            </p>
                          </div>
                          {ad.price && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950 font-black text-xs shrink-0 shadow-xs">
                              {ad.price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display font-bold text-sm text-[#000004] line-clamp-1 leading-snug">
                            {ad.headline}
                          </h4>
                          {ad.status === 'pending_review' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] shrink-0">
                              Pending Review
                            </span>
                          ) : ad.status === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px] shrink-0">
                              Expired
                            </span>
                          ) : daysRemaining !== null ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0">
                              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Ends today'}
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-[#70798C] line-clamp-2 leading-relaxed">
                          {ad.description}
                        </p>

                        {/* Meta pills */}
                        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#70798C]">
                          {ad.ctaText && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] font-semibold text-[#000004]">
                              CTA: {ad.ctaText}
                            </span>
                          )}
                          {ad.phone && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FCF9F5] border border-[#E5E7EB] font-mono">
                              {ad.phone}
                            </span>
                          )}
                          {ad.websiteUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold truncate max-w-[160px]">
                              {ad.websiteUrl.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="p-3 bg-[#FCF9F5] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {ad.status === 'pending_review' ? (
                          <button
                            onClick={() => handleApprovePartnerSubmission(ad.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAdvertVerification(ad.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              ad.isVerified
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-white text-[#70798C] hover:bg-slate-100 border border-[#E5E7EB]'
                            }`}
                            title="Toggle verified badge"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{ad.isVerified ? 'Verified' : 'Verify'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAdvert(ad)}
                          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#000004] border border-[#E5E7EB] transition-colors cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            openConfirmDialog({
                              title: 'Delete Sponsored Campaign?',
                              message: 'Are you sure you want to delete this sponsored partner campaign from the platform? It will immediately stop appearing in the stories tray and carousel.',
                              itemTitle: ad.headline || ad.title,
                              itemSubtitle: `${ad.advertiserName} • ${ad.category} • Flight: ${ad.badgeText || 'SPONSORED'}`,
                              badge: 'SPONSORED CAMPAIGN',
                              confirmText: 'Yes, Delete Campaign',
                              cancelText: 'Cancel',
                              variant: 'danger',
                              onConfirm: () => {
                                handleDeleteAdvertInternal(ad.id);
                                setConfirmModalState(null);
                              },
                            });
                          }}
                          className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Advert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F: ESCROW & FINANCIALS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'financials' && (
        <div className="space-y-6 animate-fade-in">
          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#70798C]">Total Clearance Fees</span>
              <div className="text-2xl font-display font-black text-[#000004] mt-1">
                {formatNaira(totalInspectionFeesCollected)}
              </div>
              <p className="text-[11px] text-[#70798C] mt-1">From {confirmedPassesCount} physical inspection passes</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#70798C]">Platform Revenue Cut (20%)</span>
              <div className="text-2xl font-display font-black text-amber-600 mt-1">
                {formatNaira(Math.round(totalInspectionFeesCollected * 0.2))}
              </div>
              <p className="text-[11px] text-[#70798C] mt-1">Setlla technology fee retention</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#70798C]">Agent Payout Pool (80%)</span>
              <div className="text-2xl font-display font-black text-emerald-600 mt-1">
                {formatNaira(Math.round(totalInspectionFeesCollected * 0.8))}
              </div>
              <p className="text-[11px] text-[#70798C] mt-1">Disbursed upon physical attendance</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[#000004] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Inspection Clearance Fee Ledger</span>
              </h3>
              <span className="text-xs text-[#70798C] font-semibold">{bookings.length} entries tracked</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#000004]">
                <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                  <tr>
                    <th className="py-3 px-3">Payment Reference</th>
                    <th className="py-3 px-3">Applicant</th>
                    <th className="py-3 px-3">Property</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Gateway</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#000004] font-bold">
                        {b.paymentReference || `SETLLA-TXN-${b.id}`}
                      </td>
                      <td className="py-3 px-3 font-medium">{b.applicantName}</td>
                      <td className="py-3 px-3 text-[#70798C]">
                        {listings.find((l) => l.id === b.propertyId)?.title.slice(0, 30) || 'Setlla Rental'}...
                      </td>
                      <td className="py-3 px-3 font-bold text-[#000004]">
                        {b.inspectionFeeAmount ? formatNaira(b.inspectionFeeAmount) : '₦0 (Promo)'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#70798C] text-[10px] font-semibold">
                          {b.paymentMethod || 'Paystack'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[#70798C]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB G: PLATFORM SETTINGS & EMERGENCY BROADCAST                            */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-[#000004] flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>Global Platform Configuration</span>
              </h3>
              <p className="text-xs text-[#70798C] mt-1">
                Configure defaults, pricing, queue parameters, and emergency broadcasts.
              </p>
            </div>

            {/* Emergency Broadcast Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-amber-900">Emergency Announcement Banner</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.emergencyAnnouncementActive}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, emergencyAnnouncementActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                </label>
              </div>

              <textarea
                value={platformSettings.emergencyAnnouncement || ''}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, emergencyAnnouncement: e.target.value })
                }
                rows={2}
                placeholder="Type emergency alert message to display to all platform visitors..."
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs text-[#000004] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="text-[10px] text-amber-700">
                When active, this banner is displayed prominently at the top of setlla.com for all users.
              </p>
            </div>

            {/* Default Inspection Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#000004] flex items-center justify-between">
                <span>Default Inspection Clearance Fee (₦)</span>
                <span className="font-mono text-emerald-700 font-black">
                  {formatNaira(platformSettings.defaultInspectionFee)}
                </span>
              </label>
              <input
                type="number"
                step="500"
                value={platformSettings.defaultInspectionFee}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, defaultInspectionFee: Number(e.target.value) })
                }
                className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <p className="text-[11px] text-[#70798C]">
                Applied by default when new agents create property listings.
              </p>
            </div>

            {/* Max Queue Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#000004] flex items-center justify-between">
                <span>Maximum Queue Limit Per Slot</span>
                <span className="font-mono font-bold text-[#000004]">
                  {platformSettings.maxQueueLimitPerSlot} applicants
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={platformSettings.maxQueueLimitPerSlot}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, maxQueueLimitPerSlot: Number(e.target.value) })
                }
                className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <p className="text-[11px] text-[#70798C]">
                Prevents rental scams by capping how many tenants can queue for a single inspection time window.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <SaveSettingsIcon />
                <span>Save Platform Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB H: AUDIT TRAIL ACTIVITY LOG                                           */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#000004] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <span>Administrative Audit Trail</span>
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5">
                  Complete immutable ledger of all super-administrative operations and overrides.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {auditLogs.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#70798C]">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {log.action}
                          </span>
                          <span className="font-bold text-xs text-[#000004]">{log.targetName}</span>
                          <span className="text-[10px] text-[#70798C] uppercase font-semibold">({log.targetType})</span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-[#70798C] mt-1">{log.details}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Admin: <strong>{log.adminName}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#70798C] shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: KYC DOCUMENT INSPECTOR                                           */}
      {/* ========================================================================= */}
      {inspectingKycUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#000004]">KYC Credentials Review</h4>
                  <p className="text-xs text-[#70798C]">{inspectingKycUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingKycUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB]">
                <span className="text-[11px] text-[#70798C] font-semibold">National Identity Number (NIN):</span>
                <p className="font-mono font-bold text-sm text-[#000004] mt-0.5">
                  {inspectingKycUser.kycDocuments?.ninNumber || inspectingKycUser.nin || 'NIN-1029-***-4821'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB]">
                <span className="text-[11px] text-[#70798C] font-semibold">CAC Registration Certificate:</span>
                <p className="font-mono font-bold text-sm text-[#000004] mt-0.5">
                  {inspectingKycUser.cacNumber || 'RC-1849204'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[#70798C] font-semibold">Document Certificate Preview:</span>
                <div className="mt-1.5 rounded-xl overflow-hidden border border-[#E5E7EB] h-44 bg-slate-100 relative">
                  <img
                    src={inspectingKycUser.kycDocuments?.cacCertificateUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'}
                    alt="CAC Certificate"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white font-mono text-[10px]">
                    Verified Delta State Ministry of Lands Registration Stamp
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setInspectingKycUser(null)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleAgentVerification(inspectingKycUser);
                  setInspectingKycUser(null);
                }}
                className="py-2 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {inspectingKycUser.kycStatus === 'verified' ? 'Revoke Verification' : 'Approve & Verify Agent'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER DETAILS                                                */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSaveEditedUser}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h4 className="font-display font-bold text-base text-[#000004]">
                Edit {editingUser.isAgent ? 'Agent' : 'Tenant'} Coordinates
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#000004] block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              {editingUser.isAgent && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Agency Name</label>
                  <input
                    type="text"
                    value={editingUser.agencyName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, agencyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Operating City</label>
                  <input
                    type="text"
                    value={editingUser.city || editingUser.operatingCity || 'Asaba'}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value, operatingCity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#000004] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium focus:outline-none"
                />
              </div>

              {editingUser.isAgent && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">CAC Registration Number</label>
                  <input
                    type="text"
                    value={editingUser.cacNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cacNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    placeholder="e.g. RC-1849204"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACCOUNT SUSPENSION CONFIRMATION                                  */}
      {/* ========================================================================= */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-200 animate-scale-up space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-red-900">
                  Suspend {suspendingUser.fullName}?
                </h4>
                <p className="text-xs text-[#70798C]">
                  This will temporarily block access to listings and booking requests.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#000004]">Suspension Reason:</label>
              <textarea
                value={suspensionReasonInput}
                onChange={(e) => setSuspensionReasonInput(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50/30 text-xs text-[#000004] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                className="py-2 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all cursor-pointer shadow-xs"
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ISSUE DIRECT VIP INSPECTION PASS                                 */}
      {/* ========================================================================= */}
      {directPassModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleIssueDirectPass}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#000004]">Issue Direct Inspection Pass</h4>
                  <p className="text-xs text-[#70798C]">{directPassModalTenant.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDirectPassModalTenant(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#70798C]">
                Select a property to grant an immediate, verified inspection pass with unlocked agent phone & full physical address coordinates.
              </p>

              <div>
                <label className="font-bold text-[#000004] block mb-1">Target Property Listing</label>
                <select
                  value={directPassSelectedListingId}
                  onChange={(e) => setDirectPassSelectedListingId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] focus:outline-none"
                  required
                >
                  <option value="">Select a property listing...</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.city}) - ₦{(l.fees.baseRent / 1000000).toFixed(1)}M/yr
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  VIP Instant Clearance
                </span>
                <p className="text-[11px] text-emerald-800">
                  This pass bypasses clearance fee requirements and instantly notifies the agent via push alert.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDirectPassModalTenant(null)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!directPassSelectedListingId}
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-all cursor-pointer disabled:opacity-50"
              >
                Confirm & Issue Pass
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TENANT BOOKING HISTORY MODAL                                     */}
      {/* ========================================================================= */}
      {viewingTenantBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#000004]">Inspection Booking History</h4>
                  <p className="text-xs text-[#70798C]">{viewingTenantBookings.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingTenantBookings(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {bookings
                .filter((b) => b.applicantPhone === viewingTenantBookings.phone || (viewingTenantBookings.email && b.applicantEmail === viewingTenantBookings.email))
                .map((b) => {
                  const prop = listings.find((l) => l.id === b.propertyId);
                  return (
                    <div key={b.id} className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB] text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="font-mono text-amber-700">{b.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED_UNLOCKED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-[#000004]'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="font-bold text-[#000004]">{prop?.title || 'Unknown Property'}</p>
                      <p className="text-[11px] text-[#70798C]">
                        Slot: {b.slotDate}, {b.slotTimeWindow}
                      </p>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setViewingTenantBookings(null)}
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: CREATE / EDIT ADVERT MODAL                                        */}
      {/* ========================================================================= */}
      {isCreateAdvertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveAdvert}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h4 className="font-display font-bold text-base text-[#000004]">
                  {editingAdvert ? 'Edit Advert Campaign' : 'Create New Sponsored Advert'}
                </h4>
                <p className="text-xs text-[#70798C]">
                  Configure campaign copy, sponsor credentials, and outbound engagement channels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateAdvertOpen(false);
                  setEditingAdvert(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="font-bold text-[#000004] block mb-1">
                  Campaign Headline <span className="text-[#F0544F]">*</span>
                </label>
                <input
                  type="text"
                  value={advertForm.headline || ''}
                  onChange={(e) => setAdvertForm({ ...advertForm, headline: e.target.value })}
                  placeholder="e.g. Luxury 3-Bedroom Duplex in Core Area, Asaba"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#000004]/10"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Advertiser / Brand Name <span className="text-[#F0544F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={advertForm.advertiserName || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, advertiserName: e.target.value })}
                    placeholder="e.g. Delta Heritage Realty"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Advertiser Handle
                  </label>
                  <input
                    type="text"
                    value={advertForm.advertiserHandle || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, advertiserHandle: e.target.value })}
                    placeholder="e.g. delta_heritage"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Category</label>
                  <select
                    value={advertForm.category || 'Property'}
                    onChange={(e) => setAdvertForm({ ...advertForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Property">Property</option>
                    <option value="Estate">Estate</option>
                    <option value="Promo">Promo</option>
                    <option value="Service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={advertForm.badgeText || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, badgeText: e.target.value })}
                    placeholder="e.g. Featured, Deal"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Price / Offer Tag</label>
                  <input
                    type="text"
                    value={advertForm.price || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, price: e.target.value })}
                    placeholder="e.g. ₦3.5M / yr"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#000004] block mb-1">
                  Media Image / Banner URL
                </label>
                <input
                  type="url"
                  value={advertForm.mediaUrl || ''}
                  onChange={(e) => setAdvertForm({ ...advertForm, mediaUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Location</label>
                  <input
                    type="text"
                    value={advertForm.location || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, location: e.target.value })}
                    placeholder="e.g. Asaba, Delta State"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    value={advertForm.ctaText || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, ctaText: e.target.value })}
                    placeholder="e.g. Visit Website, Contact Agent"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Website URL</label>
                  <input
                    type="url"
                    value={advertForm.websiteUrl || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, websiteUrl: e.target.value })}
                    placeholder="https://deltaheritage.com"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    value={advertForm.whatsappNumber || advertForm.phone || ''}
                    onChange={(e) => setAdvertForm({ ...advertForm, whatsappNumber: e.target.value, phone: e.target.value })}
                    placeholder="0803 555 1234"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#000004] block mb-1">Campaign Description</label>
                <textarea
                  rows={3}
                  value={advertForm.description || ''}
                  onChange={(e) => setAdvertForm({ ...advertForm, description: e.target.value })}
                  placeholder="Describe key highlights, amenities, special discounts, or service promises..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ad-verified-toggle"
                  checked={Boolean(advertForm.isVerified)}
                  onChange={(e) => setAdvertForm({ ...advertForm, isVerified: e.target.checked })}
                  className="rounded border-[#E5E7EB] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ad-verified-toggle" className="text-xs font-bold text-[#000004] cursor-pointer">
                  Mark as Verified Sponsor (displays verified trust badge)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-[#E5E7EB] pt-3.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreateAdvertOpen(false);
                  setEditingAdvert(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] shadow-sm cursor-pointer"
              >
                {editingAdvert ? 'Update Advert' : 'Publish Advert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Method 3: Programmatic Push API & Webhook Modal */}
      <ApiWebhookModal
        isOpen={isApiWebhookOpen}
        onClose={() => setIsApiWebhookOpen(false)}
        onOpenFullPage={() => {
          setIsApiWebhookOpen(false);
          if (onSwitchToPartner) {
            onSwitchToPartner();
          } else {
            window.location.hash = '#/partner';
          }
        }}
        onAdvertPushed={(newAd) => {
          setLocalAdverts((prev) => [newAd, ...prev.filter((a) => a.id !== newAd.id)]);
          onAddAdvert?.(newAd);
          showToast(`Programmatic API ad "${newAd.headline}" ingested successfully!`);
        }}
      />

      {/* Method 2: Self-Service Partner Portal Preview */}
      <PartnerAdSubmissionModal
        isOpen={isPartnerPortalPreviewOpen}
        onClose={() => setIsPartnerPortalPreviewOpen(false)}
        onOpenFullPage={() => {
          setIsPartnerPortalPreviewOpen(false);
          if (onSwitchToPartner) {
            onSwitchToPartner();
          } else {
            window.location.hash = '#/partner';
          }
        }}
        onSubmissionSuccess={(newAd) => {
          setLocalAdverts((prev) => [newAd, ...prev.filter((a) => a.id !== newAd.id)]);
          onAddAdvert?.(newAd);
          showToast(`Partner submission for "${newAd.advertiserName}" received in review queue.`);
        }}
      />

      {/* Ads Setup & Management Operations Guide Modal */}
      {isAdsGuideOpen && (
        <AdsSetupGuide
          mode="admin"
          isModal={true}
          onClose={() => setIsAdsGuideOpen(false)}
        />
      )}

      {/* Custom Global Confirmation & Prompt Modal */}
      {confirmModalState && (
        <CustomConfirmModal
          isOpen={confirmModalState.isOpen}
          title={confirmModalState.title}
          message={confirmModalState.message}
          itemTitle={confirmModalState.itemTitle}
          itemSubtitle={confirmModalState.itemSubtitle}
          badge={confirmModalState.badge}
          confirmText={confirmModalState.confirmText}
          cancelText={confirmModalState.cancelText}
          variant={confirmModalState.variant}
          onConfirm={confirmModalState.onConfirm}
          onCancel={() => setConfirmModalState(null)}
        />
      )}
    </div>
  );
};

// Simple helper icon
const SaveSettingsIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
