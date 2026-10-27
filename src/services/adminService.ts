import { AdminAuditLog, PlatformSettings, UserProfile, PropertyListing, BookingRecord } from '../types/marketplace';
import { getRegisteredUsers, adminUpdateUser, deleteUserFromRegistry } from '../utils/userRegistry';

const AUDIT_LOGS_KEY = 'setlla_admin_audit_logs';
const SETTINGS_KEY = 'setlla_platform_settings';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  defaultInspectionFee: 2500,
  maxQueueLimitPerSlot: 5,
  maintenanceMode: false,
  emergencyAnnouncement: 'Delta State real estate regulatory compliance active. All inspection fees protected by Setlla Escrow.',
  emergencyAnnouncementActive: false,
  autoApproveVerifiedAgentListings: true,
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

/**
 * Saves updated platform settings.
 */
export function savePlatformSettings(settings: PlatformSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[AdminService] Failed to save settings:', err);
  }
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
  adminName: string = 'Platform Administrator',
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
  adminName: string = 'Platform Administrator'
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
  adminName: string = 'Platform Administrator'
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
 * Suspends or reinstates any user account (Agent or Tenant).
 */
export function toggleUserSuspension(
  user: UserProfile,
  reason: string = 'Administrative review',
  adminName: string = 'Platform Administrator'
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
    user.isAgent ? 'agent' : 'tenant',
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
