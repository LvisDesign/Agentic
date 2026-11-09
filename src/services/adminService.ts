import { AdminAuditLog, PlatformSettings, UserProfile, PropertyListing, BookingRecord } from '../types/marketplace';
import { getRegisteredUsers, adminUpdateUser, deleteUserFromRegistry, deleteUserFromRegistryAsync } from '../utils/userRegistry';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
export { deleteUserFromRegistry, deleteUserFromRegistryAsync };

const AUDIT_LOGS_KEY = 'setlla_admin_audit_logs';
const SETTINGS_KEY = 'setlla_platform_settings';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  defaultInspectionFee: 2500,
  maxQueueLimitPerSlot: 5,
  maintenanceMode: false,
  emergencyAnnouncement: 'Delta State real estate regulatory compliance active. All inspection fees protected by Setlla Escrow.',
  emergencyAnnouncementActive: false,
  autoApproveVerifiedAgentListings: true,
  adPricingDaily: 2500,
  adPricingStarter: 15000,
  adPricingGrowth: 45000,
  adPricingCorporate: 120000,
  adPricingFeedWeekly: 5000,
  adPricingFeedMonthly: 15000,
  jobPromotionFee: 2000,
};

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-sys-init',
    action: 'SYSTEM_INITIALIZED',
    targetType: 'system',
    targetId: 'setlla-core',
    targetName: 'Setlla Platform Core',
    adminName: 'System',
    details: 'Production platform security and audit logging active.',
    timestamp: new Date().toISOString(),
  },
];

/**
 * Loads platform settings from localStorage with safe defaults.
 */
export function getPlatformSettings(): PlatformSettings {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[AdminService] Failed to load settings:', err);
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

let inflightSettingsPromise: Promise<PlatformSettings> | null = null;

/**
 * Asynchronously fetches platform settings and ad prices from Supabase central database.
 * Merges cloud values into local cache so all devices and screens see identical prices set by Super Admin.
 */
export async function fetchPlatformSettingsAsync(): Promise<PlatformSettings> {
  const current = getPlatformSettings();
  if (!isSupabaseConfigured()) return current;

  if (inflightSettingsPromise) {
    return inflightSettingsPromise;
  }

  inflightSettingsPromise = (async (): Promise<PlatformSettings> => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) {
        console.warn('[AdminService] Error fetching platform_settings from Supabase:', error);
        return current;
      }

      if (Array.isArray(data) && data.length > 0) {
        const globalRow = data.find((r) => r.id === 'global_config') || data[0];
        const pricingRow = data.find((r) => r.id === 'ad_pricing_config');

        let parsedPricing: any = {};
        if (pricingRow?.emergency_announcement) {
          try {
            parsedPricing = JSON.parse(pricingRow.emergency_announcement);
          } catch (_) {}
        }

        const settingsData = (globalRow as any)?.settings_data || {};

        const daily = Number((globalRow as any)?.ad_pricing_daily ?? parsedPricing.adPricingDaily ?? parsedPricing.daily ?? settingsData.adPricingDaily ?? current.adPricingDaily ?? 2500);
        const starter = Number((globalRow as any)?.ad_pricing_starter ?? parsedPricing.adPricingStarter ?? parsedPricing.starter ?? settingsData.adPricingStarter ?? current.adPricingStarter ?? 15000);
        const growth = Number((globalRow as any)?.ad_pricing_growth ?? parsedPricing.adPricingGrowth ?? parsedPricing.growth ?? settingsData.adPricingGrowth ?? current.adPricingGrowth ?? 45000);
        const corporate = Number((globalRow as any)?.ad_pricing_corporate ?? parsedPricing.adPricingCorporate ?? parsedPricing.corporate ?? settingsData.adPricingCorporate ?? current.adPricingCorporate ?? 120000);
        let feedWeekly = Number((globalRow as any)?.ad_pricing_feed_weekly ?? parsedPricing.adPricingFeedWeekly ?? parsedPricing.feedWeekly ?? settingsData.adPricingFeedWeekly ?? current.adPricingFeedWeekly ?? 5000);
        let feedMonthly = Number((globalRow as any)?.ad_pricing_feed_monthly ?? parsedPricing.adPricingFeedMonthly ?? parsedPricing.feedMonthly ?? settingsData.adPricingFeedMonthly ?? current.adPricingFeedMonthly ?? 15000);
        const jobFee = Number((globalRow as any)?.job_promotion_fee ?? parsedPricing.jobPromotionFee ?? parsedPricing.jobFee ?? settingsData.jobPromotionFee ?? current.jobPromotionFee ?? 2000);
        const rawInspFee = Number(globalRow.default_inspection_fee || parsedPricing.defaultInspectionFee || pricingRow?.default_inspection_fee || current.defaultInspectionFee || 2500);

        // Harmonization: If the admin customized 7-Day or 30-Day under Starter/Growth but left feedWeekly/feedMonthly at defaults (or vice versa), keep them aligned
        if (feedWeekly === 5000 && starter !== 15000) {
          feedWeekly = starter;
        }
        if (feedMonthly === 15000 && growth !== 45000) {
          feedMonthly = growth;
        }

        const merged: PlatformSettings = {
          ...DEFAULT_PLATFORM_SETTINGS,
          ...current,
          defaultInspectionFee: rawInspFee > 0 ? rawInspFee : 2500,
          maxQueueLimitPerSlot: Number(globalRow.max_queue_limit_per_slot ?? current.maxQueueLimitPerSlot),
          maintenanceMode: Boolean(globalRow.maintenance_mode ?? current.maintenanceMode),
          emergencyAnnouncement: globalRow.id === 'global_config' ? (globalRow.emergency_announcement ?? current.emergencyAnnouncement) : current.emergencyAnnouncement,
          emergencyAnnouncementActive: Boolean(globalRow.emergency_announcement_active ?? current.emergencyAnnouncementActive),
          autoApproveVerifiedAgentListings: Boolean(globalRow.auto_approve_verified_agent_listings ?? current.autoApproveVerifiedAgentListings),
          
          // Dynamic ad & platform pricing from cloud database (strictly synchronized across all devices)
          adPricingDaily: daily > 0 ? daily : 2500,
          adPricingStarter: starter > 0 ? starter : 15000,
          adPricingGrowth: growth > 0 ? growth : 45000,
          adPricingCorporate: corporate > 0 ? corporate : 120000,
          adPricingFeedWeekly: feedWeekly > 0 ? feedWeekly : 5000,
          adPricingFeedMonthly: feedMonthly > 0 ? feedMonthly : 15000,
          jobPromotionFee: jobFee > 0 ? jobFee : 2000,
        };

        if (typeof window !== 'undefined') {
          const prevRaw = localStorage.getItem(SETTINGS_KEY);
          const nextRaw = JSON.stringify(merged);
          if (prevRaw !== nextRaw) {
            localStorage.setItem(SETTINGS_KEY, nextRaw);
            window.dispatchEvent(new CustomEvent('setlla:platform_settings_updated', { detail: merged }));
          }
        }
        return merged;
      }
    } catch (err) {
      console.warn('[AdminService] Exception in fetchPlatformSettingsAsync:', err);
    } finally {
      inflightSettingsPromise = null;
    }

    return current;
  })();

  return inflightSettingsPromise;
}

/**
 * Checks whether the current user is an authorized administrator.
 */
export function isAuthorizedAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('setlla_admin_auth') === 'true') return true;
  try {
    const rawUser = localStorage.getItem('setlla_admin_user') || localStorage.getItem('setlla_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.isAdmin || u.isSuperAdmin) return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Returns dynamic ad and platform pricing rates set by Super Admin (with sensible defaults)
 */
export function getAdPricing(): {
  daily: number;
  starter: number;
  growth: number;
  corporate: number;
  feedWeekly: number;
  feedMonthly: number;
  jobPromotionFee: number;
  defaultInspectionFee: number;
} {
  const settings = getPlatformSettings();
  const daily = Number(settings.adPricingDaily) > 0 ? Number(settings.adPricingDaily) : 2500;
  const starter = Number(settings.adPricingStarter) > 0 ? Number(settings.adPricingStarter) : 15000;
  const growth = Number(settings.adPricingGrowth) > 0 ? Number(settings.adPricingGrowth) : 45000;
  const corporate = Number(settings.adPricingCorporate) > 0 ? Number(settings.adPricingCorporate) : 120000;
  let feedWeekly = Number(settings.adPricingFeedWeekly) > 0 ? Number(settings.adPricingFeedWeekly) : 5000;
  let feedMonthly = Number(settings.adPricingFeedMonthly) > 0 ? Number(settings.adPricingFeedMonthly) : 15000;
  const jobPromotionFee = Number(settings.jobPromotionFee) > 0 ? Number(settings.jobPromotionFee) : 2000;
  const defaultInspectionFee = Number(settings.defaultInspectionFee) > 0 ? Number(settings.defaultInspectionFee) : 2500;

  // Harmonization fallback: if starter was customized, ensure feed story advert follows
  if (feedWeekly === 5000 && starter !== 15000) {
    feedWeekly = starter;
  }
  if (feedMonthly === 15000 && growth !== 45000) {
    feedMonthly = growth;
  }

  return {
    daily,
    starter,
    growth,
    corporate,
    feedWeekly,
    feedMonthly,
    jobPromotionFee,
    defaultInspectionFee,
  };
}

/**
 * Saves updated platform settings and synchronizes them to Supabase cloud.
 * Broadcasts changes so all devices/screens reflect new pricing immediately.
 */
export async function savePlatformSettingsAsync(settings: PlatformSettings): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('setlla:platform_settings_updated', { detail: settings }));
  }

  if (!isSupabaseConfigured()) return;

  try {
    // 1. Sync global settings to Supabase
    const globalPayload: any = {
      id: 'global_config',
      default_inspection_fee: settings.defaultInspectionFee,
      max_queue_limit_per_slot: settings.maxQueueLimitPerSlot,
      maintenance_mode: settings.maintenanceMode,
      emergency_announcement: settings.emergencyAnnouncement,
      emergency_announcement_active: settings.emergencyAnnouncementActive,
      auto_approve_verified_agent_listings: settings.autoApproveVerifiedAgentListings,
      updated_at: new Date().toISOString(),
    };

    const { error: err1 } = await supabase.from('platform_settings').upsert(globalPayload);
    if (err1) {
      console.warn('[AdminService] Supabase global settings upsert warning:', err1);
    }

    // 2. Sync ad pricing config row so devices without custom columns read updated rates
    const adPricingData = {
      daily: settings.adPricingDaily ?? 2500,
      starter: settings.adPricingStarter ?? 15000,
      growth: settings.adPricingGrowth ?? 45000,
      corporate: settings.adPricingCorporate ?? 120000,
      feedWeekly: settings.adPricingFeedWeekly ?? 5000,
      feedMonthly: settings.adPricingFeedMonthly ?? 15000,
      jobPromotionFee: settings.jobPromotionFee ?? 2000,
      defaultInspectionFee: settings.defaultInspectionFee ?? 2500,
      adPricingDaily: settings.adPricingDaily ?? 2500,
      adPricingStarter: settings.adPricingStarter ?? 15000,
      adPricingGrowth: settings.adPricingGrowth ?? 45000,
      adPricingCorporate: settings.adPricingCorporate ?? 120000,
      adPricingFeedWeekly: settings.adPricingFeedWeekly ?? 5000,
      adPricingFeedMonthly: settings.adPricingFeedMonthly ?? 15000,
    };

    const { error: err2 } = await supabase.from('platform_settings').upsert({
      id: 'ad_pricing_config',
      default_inspection_fee: settings.defaultInspectionFee ?? 2500,
      emergency_announcement: JSON.stringify(adPricingData),
      emergency_announcement_active: false,
      updated_at: new Date().toISOString(),
    });
    if (err2) {
      console.error('[AdminService] Supabase ad pricing upsert failed:', err2);
      throw new Error(err2.message || 'Failed to update ad pricing in cloud');
    }

    console.log('[AdminService] Platform settings & ad prices synchronized to Supabase cloud successfully.');
  } catch (err) {
    console.error('[AdminService] Failed to synchronize settings to cloud:', err);
    throw err;
  }
}

/**
 * Saves updated platform settings.
 * Strictly guarded to prevent unauthorized tampering or defacement.
 */
export function savePlatformSettings(settings: PlatformSettings): void {
  if (typeof window === 'undefined') return;
  if (!isAuthorizedAdmin()) {
    console.warn('[AdminService] Unauthorized attempt to modify platform settings rejected.');
    return;
  }

  savePlatformSettingsAsync(settings).catch((err) => {
    console.error('[AdminService] Error saving settings:', err);
  });
}

/**
 * Loads audit logs from storage or initializes with defaults.
 */
export function getAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[AdminService] Failed to load audit logs:', err);
  }
  return INITIAL_AUDIT_LOGS;
}

/**
 * Appends a new audit log record.
 */
export function recordAuditLog(
  action: string,
  targetType: 'agent' | 'tenant' | 'listing' | 'booking' | 'system',
  targetId: string,
  targetName: string,
  adminName: string = 'Elvis',
  details?: string
): AdminAuditLog {
  const newLog: AdminAuditLog = {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    targetType,
    targetId,
    targetName,
    adminName,
    details,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getAuditLogs();
      const updated = [newLog, ...existing].slice(0, 100); // keep last 100
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('[AdminService] Failed to record audit log:', err);
    }
  }

  return newLog;
}

/**
 * Clears audit logs (admin only).
 */
export function clearAuditLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUDIT_LOGS_KEY);
  } catch (_) {}
}

/**
 * Toggles Agent verification state.
 */
export function toggleAgentVerification(
  agentUser: UserProfile,
  adminName: string = 'Elvis'
): UserProfile {
  const newStatus = !agentUser.isVerifiedTenant; // Agents use isVerified flag or kycStatus
  const updated: UserProfile = {
    ...agentUser,
    kycStatus: agentUser.kycStatus === 'verified' ? 'pending' : 'verified',
  };
  adminUpdateUser(updated);
  recordAuditLog(
    updated.kycStatus === 'verified' ? 'AGENT_VERIFIED' : 'AGENT_VERIFICATION_REVOKED',
    'agent',
    updated.id,
    updated.agencyName ? `${updated.fullName} (${updated.agencyName})` : updated.fullName,
    adminName,
    `KYC status changed to: ${updated.kycStatus}`
  );
  return updated;
}

/**
 * Toggles Tenant verification state.
 */
export function toggleTenantVerification(
  tenantUser: UserProfile,
  adminName: string = 'Elvis'
): UserProfile {
  const updated: UserProfile = {
    ...tenantUser,
    isVerifiedTenant: !tenantUser.isVerifiedTenant,
  };
  adminUpdateUser(updated);
  recordAuditLog(
    updated.isVerifiedTenant ? 'TENANT_VERIFIED' : 'TENANT_VERIFICATION_REVOKED',
    'tenant',
    updated.id,
    updated.fullName,
    adminName,
    `Tenant verification status: ${updated.isVerifiedTenant ? 'Verified Account' : 'Unverified'}`
  );
  return updated;
}

/**
 * Suspends or reinstates any user account (Agent, Tenant, or Administrator).
 */
export function toggleUserSuspension(
  user: UserProfile,
  reason: string = 'Administrative review',
  adminName: string = 'Elvis'
): UserProfile {
  const isSuspending = !user.isSuspended;
  const updated: UserProfile = {
    ...user,
    isSuspended: isSuspending,
    suspensionReason: isSuspending ? reason : undefined,
  };
  adminUpdateUser(updated);
  recordAuditLog(
    isSuspending ? 'USER_SUSPENDED' : 'USER_REINSTATED',
    user.isAgent ? 'agent' : user.isAdmin ? 'system' : 'tenant',
    user.id,
    user.fullName,
    adminName,
    isSuspending ? `Reason: ${reason}` : 'Account reactivated by Super Admin'
  );
  return updated;
}

/**
 * Exports complete platform snapshot as a downloadable JSON file.
 */
export function exportPlatformDataSnapshot(
  listings: PropertyListing[],
  bookings: BookingRecord[],
  users: UserProfile[],
  settings: PlatformSettings
): void {
  const data = {
    platform: 'Setlla Real Estate Marketplace',
    domain: 'setlla.com',
    exportedAt: new Date().toISOString(),
    settings,
    summary: {
      totalListings: listings.length,
      totalBookings: bookings.length,
      totalUsers: users.length,
    },
    users,
    listings,
    bookings,
    auditLogs: getAuditLogs(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `setlla-platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
