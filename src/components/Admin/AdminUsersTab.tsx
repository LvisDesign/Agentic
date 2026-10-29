import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Plus, 
  ExternalLink, 
  MapPin, 
  FileText, 
  Check, 
  X, 
  Building, 
  Building2,
  Phone, 
  Mail,
  UserCheck,
  UserX,
  LayoutGrid,
  List,
  Briefcase,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  Key,
  Home,
  Lock,
  Unlock,
  Edit3,
  CalendarCheck,
  ArrowUpRight,
  ChevronRight,
  Clock,
  FileCheck,
  Award
} from 'lucide-react';
import { UserProfile, PropertyListing, BookingRecord } from '../../types/marketplace';
import { JobListing, JobApplication } from '../../types/jobs';
import { AdvertStory } from '../../data/mockAdverts';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { ModalPortal } from '../UI/ModalPortal';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { 
  adminUpdateUser, 
  deleteUserFromRegistry, 
  deleteUserFromRegistryAsync,
  saveRegisteredUser, 
  normalizePhoneNumber,
  normalizeEmail,
  resolveUserPersona,
  PlatformUserPersona,
  isDeletedUserRecord
} from '../../utils/userRegistry';
import { toggleAgentVerification, toggleTenantVerification, toggleUserSuspension } from '../../services/adminService';
import { isElvisSuperAdmin, removeAdminCredential } from '../../services/adminAuthService';

export interface AdminUsersTabProps {
  currentUser: UserProfile;
  registeredUsers: UserProfile[];
  setRegisteredUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  listings: PropertyListing[];
  bookings: BookingRecord[];
  jobsList?: JobListing[];
  jobApplications?: JobApplication[];
  adverts?: AdvertStory[];
  defaultPersonaFilter?: 'all' | 'agent' | 'tenant' | 'job_seeker' | 'employer' | 'advertiser' | 'admin';
  openConfirmDialog: (options: {
    title: string;
    message: string;
    itemTitle?: string;
    itemSubtitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  }) => void;
  showToast: (msg: string) => void;
  onRecordAuditLog: (action: string, targetType: string, targetName: string, details: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const DELTA_CITIES = ['All Cities', 'Asaba', 'Warri', 'Abraka', 'Ughelli', 'Sapele', 'Effurun', 'Agbor'];

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  currentUser,
  registeredUsers,
  setRegisteredUsers,
  listings,
  bookings,
  jobsList = [],
  jobApplications = [],
  adverts = [],
  defaultPersonaFilter = 'all',
  openConfirmDialog,
  showToast,
  onRecordAuditLog,
  onNavigateTab,
}) => {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [personaFilter, setPersonaFilter] = useState<'all' | 'agent' | 'tenant' | 'job_seeker' | 'employer' | 'advertiser' | 'admin'>(defaultPersonaFilter);
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [standingFilter, setStandingFilter] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals & Drawers state
  const [inspectingCvCandidate, setInspectingCvCandidate] = useState<UserProfile | null>(null);
  const [inspectingEmployer, setInspectingEmployer] = useState<UserProfile | null>(null);
  const [inspectingKycAgent, setInspectingKycAgent] = useState<UserProfile | null>(null);
  const [inspectingTenantBookings, setInspectingTenantBookings] = useState<UserProfile | null>(null);
  const [directPassTenant, setDirectPassTenant] = useState<UserProfile | null>(null);
  const [directPassListingId, setDirectPassListingId] = useState<string>('');
  
  // Edit & Add User state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    city: string;
    persona: PlatformUserPersona;
    agencyName: string;
    companyName: string;
    cacNumber: string;
    targetRole: string;
    preferredPropertyType: string;
    isVerified: boolean;
  }>({
    fullName: '',
    email: '',
    phone: '',
    city: 'Asaba',
    persona: 'agent',
    agencyName: '',
    companyName: '',
    cacNumber: '',
    targetRole: '',
    preferredPropertyType: 'Bedseater',
    isVerified: false,
  });

  // Suspend modal state
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('Violation of platform verification guidelines');

  // Helper to resolve any user's persona with footprint awareness
  const getUserPersona = (user: UserProfile): PlatformUserPersona => {
    const hasListings = listings.some(
      (l) =>
        l.availabilityStatus !== 'Deleted' &&
        ((l.agent?.id && l.agent.id === user.id) ||
          (user.phone && l.agent?.phone && normalizePhoneNumber(l.agent.phone) === normalizePhoneNumber(user.phone)))
    );
    const hasJobs = jobsList.some(
      (j) =>
        (j.posterId && j.posterId === user.id) ||
        (user.email && j.posterEmail && j.posterEmail.toLowerCase() === user.email.toLowerCase())
    );
    const hasAdverts = adverts.some(
      (a) => a.partnerEmail && user.email && a.partnerEmail.toLowerCase() === user.email.toLowerCase()
    );
    return resolveUserPersona(user, hasListings, hasJobs, hasAdverts);
  };

  // Persona Counts & Metrics
  const userMetrics = useMemo(() => {
    let agents = 0;
    let tenants = 0;
    let jobSeekers = 0;
    let employers = 0;
    let advertisers = 0;
    let admins = 0;
    let verifiedCount = 0;
    let pendingKycCount = 0;
    let suspendedCount = 0;
    let cvCount = 0;

    const activeUsers = registeredUsers.filter((u) => !isDeletedUserRecord(u));
    activeUsers.forEach((u) => {
      const p = getUserPersona(u);
      if (p === 'agent' || p === 'admin') agents++;
      if (p === 'tenant') tenants++;
      else if (p === 'job_seeker') {
        jobSeekers++;
        if (u.cvUrl || u.cvFileName) cvCount++;
      } else if (p === 'employer' || p === 'admin') employers++;
      if (p === 'advertiser') advertisers++;
      if (p === 'admin') admins++;

      if (u.isVerifiedTenant || u.kycStatus === 'verified' || p === 'admin') verifiedCount++;
      if (u.kycStatus === 'pending') pendingKycCount++;
      if (u.isSuspended) suspendedCount++;
    });

    return {
      total: activeUsers.length,
      agents,
      tenants,
      jobSeekers,
      employers,
      advertisers,
      admins,
      verifiedCount,
      pendingKycCount,
      suspendedCount,
      cvCount,
    };
  }, [registeredUsers, listings, jobsList, adverts]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      if (isDeletedUserRecord(u)) return false;
      const p = getUserPersona(u);

      // Persona Filter (Admin has upper-level authority across agents and employers)
      if (personaFilter !== 'all') {
        const matches = p === personaFilter || (p === 'admin' && (personaFilter === 'agent' || personaFilter === 'employer'));
        if (!matches) return false;
      }

      // City Filter
      if (cityFilter !== 'All Cities') {
        const userCity = (u.city || u.operatingCity || '').toLowerCase();
        if (!userCity.includes(cityFilter.toLowerCase())) return false;
      }

      // Standing Filter
      if (standingFilter === 'verified') {
        const isVerified = u.isVerifiedTenant || u.kycStatus === 'verified';
        if (!isVerified) return false;
      } else if (standingFilter === 'pending') {
        if (u.kycStatus !== 'pending') return false;
      } else if (standingFilter === 'suspended') {
        if (!u.isSuspended) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.fullName.toLowerCase().includes(q);
        const matchesEmail = u.email ? u.email.toLowerCase().includes(q) : false;
        const matchesPhone = u.phone ? u.phone.includes(q) : false;
        const matchesAgency = u.agencyName ? u.agencyName.toLowerCase().includes(q) : false;
        const matchesCompany = u.companyName ? u.companyName.toLowerCase().includes(q) : false;
        const matchesRole = u.targetRole ? u.targetRole.toLowerCase().includes(q) : false;
        const matchesPref = u.preferredPropertyType ? u.preferredPropertyType.toLowerCase().includes(q) : false;
        const matchesCac = u.cacNumber ? u.cacNumber.toLowerCase().includes(q) : false;
        const matchesCity = (u.city || u.operatingCity || '').toLowerCase().includes(q);
        const matchesCv = u.cvFileName ? u.cvFileName.toLowerCase().includes(q) : false;

        return (
          matchesName ||
          matchesEmail ||
          matchesPhone ||
          matchesAgency ||
          matchesCompany ||
          matchesRole ||
          matchesPref ||
          matchesCac ||
          matchesCity ||
          matchesCv
        );
      }

      return true;
    });
  }, [registeredUsers, personaFilter, cityFilter, standingFilter, searchQuery, listings, jobsList, adverts]);

  // Handler: Toggle Verification
  const handleToggleVerification = (user: UserProfile) => {
    const p = getUserPersona(user);
    if (p === 'agent') {
      const updated = toggleAgentVerification(user, currentUser.fullName);
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`${user.fullName}'s Agent Verification ${updated.kycStatus === 'verified' ? 'Approved' : 'Revoked'}.`);
      onRecordAuditLog(
        'TOGGLE_AGENT_VERIFICATION',
        'agent',
        user.fullName,
        `Set KYC status to ${updated.kycStatus}`
      );
    } else {
      const updated = toggleTenantVerification(user, currentUser.fullName);
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`${user.fullName}'s Tenant Verification ${updated.isVerifiedTenant ? 'Activated' : 'Revoked'}.`);
      onRecordAuditLog(
        'TOGGLE_TENANT_VERIFICATION',
        'tenant',
        user.fullName,
        `Set verified badge to ${updated.isVerifiedTenant}`
      );
    }
  };

  const isCurrentElvis = isElvisSuperAdmin(currentUser);

  // Authority check helpers: Elvis has super authority to delete or disable every other account, including other admins
  const canDeleteUser = (target: UserProfile): boolean => {
    if (target.id === currentUser.id) return false;
    if (isElvisSuperAdmin(target)) return false;
    if (target.isAdmin || target.isSuperAdmin) {
      return isCurrentElvis;
    }
    return true;
  };

  const canSuspendUser = (target: UserProfile): boolean => {
    if (target.id === currentUser.id) return false;
    if (isElvisSuperAdmin(target)) return false;
    if (target.isAdmin || target.isSuperAdmin) {
      return isCurrentElvis;
    }
    return true;
  };

  // Handler: Suspend User
  const handleConfirmSuspension = () => {
    if (!suspendingUser) return;
    if (isElvisSuperAdmin(suspendingUser)) {
      showToast('Super Admin Elvis account is protected and cannot be disabled.');
      setSuspendingUser(null);
      return;
    }

    const isTargetAdmin = Boolean(suspendingUser.isAdmin || suspendingUser.isSuperAdmin);
    if (isTargetAdmin && !isCurrentElvis) {
      showToast('Only Super Admin Elvis has authority to disable administrator accounts.');
      setSuspendingUser(null);
      return;
    }

    const reason = suspensionReason.trim() || 'Administrative freeze';
    const updated = toggleUserSuspension(suspendingUser, reason, currentUser.fullName);
    setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    showToast(`${suspendingUser.fullName} account has been ${isTargetAdmin ? 'disabled' : 'suspended'}.`);
    onRecordAuditLog(
      isTargetAdmin ? 'ADMIN_ACCOUNT_DISABLED' : 'USER_SUSPENDED',
      'system',
      suspendingUser.fullName,
      `Reason: ${reason} (Enforced by Super Admin ${currentUser.fullName})`
    );
    setSuspendingUser(null);
    setSuspensionReason('Violation of platform verification guidelines');
  };

  // Handler: Reinstate User
  const handleReinstateUser = (user: UserProfile) => {
    const isTargetAdmin = Boolean(user.isAdmin || user.isSuperAdmin);
    if (isTargetAdmin && !isCurrentElvis) {
      showToast('Only Super Admin Elvis has authority to modify administrator accounts.');
      return;
    }
    const updated = toggleUserSuspension(user, 'Reinstated', currentUser.fullName);
    setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    showToast(`${user.fullName} account has been reinstated active.`);
    onRecordAuditLog(
      isTargetAdmin ? 'ADMIN_ACCOUNT_REINSTATED' : 'USER_REINSTATED',
      'system',
      user.fullName,
      `Reinstated active status by Super Admin ${currentUser.fullName}`
    );
  };

  // Handler: Delete User
  const handleDeleteUser = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      showToast('You cannot delete your own active administrator account.');
      return;
    }

    if (isElvisSuperAdmin(user)) {
      showToast('Super Admin Elvis account is protected and cannot be deleted.');
      return;
    }

    const isTargetAdmin = Boolean(user.isAdmin || user.isSuperAdmin);
    if (isTargetAdmin && !isCurrentElvis) {
      showToast('Only Super Admin Elvis has authority to delete administrator accounts.');
      return;
    }

    openConfirmDialog({
      title: isTargetAdmin ? `Revoke & Delete Admin (${user.fullName})?` : `Delete ${user.fullName}'s Account?`,
      message: isTargetAdmin
        ? `Permanently revoke all administrator privileges and platform credentials for ${user.fullName} (${user.phone}). This administrator account will be permanently erased.`
        : `Are you sure you want to permanently remove this user account from Setlla? This action removes their credentials and cannot be undone.`,
      itemTitle: user.fullName,
      itemSubtitle: `${user.phone} · ${user.city || 'Delta State'}${isTargetAdmin ? ' · Platform Administrator' : ''}`,
      badge: isTargetAdmin ? 'SUPER ADMIN REVOCATION' : getUserPersona(user).toUpperCase(),
      confirmText: isTargetAdmin ? 'Revoke & Delete Admin' : 'Delete Account',
      variant: 'danger',
      onConfirm: async () => {
        showToast(`Wiping all records for ${user.fullName}...`);
        await deleteUserFromRegistryAsync(user);
        if (isTargetAdmin) {
          removeAdminCredential(user.email, user.phone);
        }
        const normPhone = normalizePhoneNumber(user.phone);
        const normEmail = normalizeEmail(user.email);
        setRegisteredUsers((prev) => prev.filter((u) => {
          if (u.id === user.id) return false;
          if (normPhone && normalizePhoneNumber(u.phone) === normPhone) return false;
          if (normEmail && normalizeEmail(u.email) === normEmail) return false;
          return true;
        }));
        showToast(`${user.fullName} and all records permanently wiped from database.`);
        onRecordAuditLog(
          isTargetAdmin ? 'ADMIN_ACCOUNT_PURGED' : 'USER_DELETED',
          'system',
          user.fullName,
          `Super Admin Elvis permanently wiped ${isTargetAdmin ? 'administrator' : 'user'} ID: ${user.id} (${user.email || user.phone}) from database and registries.`
        );
      },
    });
  };

  // Handler: Save Edited User
  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    adminUpdateUser(editingUser);
    setRegisteredUsers((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
    showToast(`Saved changes for ${editingUser.fullName}.`);
    onRecordAuditLog(
      'USER_UPDATED',
      'system',
      editingUser.fullName,
      `Updated user profile & persona credentials (ID: ${editingUser.id})`
    );
    setEditingUser(null);
  };

  // Handler: Create New User
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName.trim() || !newUserForm.phone.trim()) {
      showToast('Full name and phone number are required.');
      return;
    }

    const normPhone = normalizePhoneNumber(newUserForm.phone);
    const newId = `DT-${newUserForm.persona.slice(0, 3).toUpperCase()}-${normPhone ? normPhone.slice(-4) : Math.floor(1000 + Math.random() * 9000)}`;

    const createdUser: UserProfile = {
      id: newId,
      fullName: newUserForm.fullName.trim(),
      email: newUserForm.email.trim() || undefined,
      phone: newUserForm.phone.trim(),
      city: newUserForm.city,
      state: 'Delta State',
      persona: newUserForm.persona,
      isAgent: newUserForm.persona === 'agent',
      agencyName: newUserForm.persona === 'agent' ? newUserForm.agencyName.trim() : (newUserForm.companyName.trim() || undefined),
      companyName: newUserForm.companyName.trim() || (newUserForm.persona === 'agent' ? newUserForm.agencyName.trim() : undefined),
      cacNumber: newUserForm.persona === 'agent' ? newUserForm.cacNumber.trim() : undefined,
      targetRole: newUserForm.persona === 'job_seeker' ? newUserForm.targetRole.trim() : undefined,
      preferredPropertyType: newUserForm.persona === 'tenant' ? newUserForm.preferredPropertyType : undefined,
      isVerifiedTenant: newUserForm.persona === 'tenant' && newUserForm.isVerified,
      kycStatus: newUserForm.persona === 'agent' && newUserForm.isVerified ? 'verified' : 'not_submitted',
      savedListingIds: [],
      createdAt: new Date().toISOString(),
    };

    saveRegisteredUser(createdUser, { allowReRegistration: true });
    setRegisteredUsers((prev) => [createdUser, ...prev]);
    showToast(`Created new user "${createdUser.fullName}" as ${newUserForm.persona.replace('_', ' ').toUpperCase()}.`);
    onRecordAuditLog(
      'USER_MANUALLY_CREATED',
      'system',
      createdUser.fullName,
      `Created as ${newUserForm.persona} (ID: ${createdUser.id})`
    );

    setIsAddUserModalOpen(false);
    setNewUserForm({
      fullName: '',
      email: '',
      phone: '',
      city: 'Asaba',
      persona: 'agent',
      agencyName: '',
      companyName: '',
      cacNumber: '',
      targetRole: '',
      preferredPropertyType: 'Bedseater',
      isVerified: false,
    });
  };

  // Helper to render persona badge
  const renderPersonaBadge = (persona: PlatformUserPersona) => {
    switch (persona) {
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
            <Home className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Agent / Realtor</span>
          </span>
        );
      case 'tenant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200">
            <Key className="w-3 h-3 text-sky-600 shrink-0" />
            <span>Tenant / Renter</span>
          </span>
        );
      case 'job_seeker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
            <Briefcase className="w-3 h-3 text-purple-600 shrink-0" />
            <span>Job Seeker</span>
          </span>
        );
      case 'employer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
            <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Employer / Recruiter</span>
          </span>
        );
      case 'advertiser':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
            <Megaphone className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Brand Partner / Advertiser</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold border border-slate-700">
            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Administrator</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
            <Users className="w-3 h-3 shrink-0" />
            <span>Platform User</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. TOP METRICS BANNER                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Users */}
        <div 
          onClick={() => setPersonaFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'all'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-[#000004]/20'
              : 'bg-white border-[#E5E7EB] hover:border-slate-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'all' ? 'text-slate-300' : 'text-[#70798C]'}`}>
              Total Accounts
            </span>
            <Users className={`w-4 h-4 ${personaFilter === 'all' ? 'text-amber-400' : 'text-[#70798C]'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.total}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'all' ? 'text-slate-300' : 'text-[#70798C]'}`}>
            {userMetrics.verifiedCount} verified standing
          </div>
        </div>

        {/* Agents */}
        <div 
          onClick={() => setPersonaFilter('agent')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'agent'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-emerald-500/30'
              : 'bg-white border-[#E5E7EB] hover:border-emerald-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'agent' ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Agents / Realtors
            </span>
            <Home className={`w-4 h-4 ${personaFilter === 'agent' ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.agents}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'agent' ? 'text-emerald-300' : 'text-[#70798C]'}`}>
            {userMetrics.pendingKycCount > 0 ? (
              <span className="text-amber-500 font-bold">{userMetrics.pendingKycCount} KYC pending</span>
            ) : (
              'All KYC cleared'
            )}
          </div>
        </div>

        {/* Tenants */}
        <div 
          onClick={() => setPersonaFilter('tenant')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'tenant'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-sky-500/30'
              : 'bg-white border-[#E5E7EB] hover:border-sky-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'tenant' ? 'text-sky-300' : 'text-sky-700'}`}>
              Tenants / Renters
            </span>
            <Key className={`w-4 h-4 ${personaFilter === 'tenant' ? 'text-sky-400' : 'text-sky-600'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.tenants}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'tenant' ? 'text-sky-300' : 'text-[#70798C]'}`}>
            Rent search profiles
          </div>
        </div>

        {/* Job Seekers */}
        <div 
          onClick={() => setPersonaFilter('job_seeker')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'job_seeker'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-purple-500/30'
              : 'bg-white border-[#E5E7EB] hover:border-purple-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'job_seeker' ? 'text-purple-300' : 'text-purple-700'}`}>
              Job Candidates
            </span>
            <Briefcase className={`w-4 h-4 ${personaFilter === 'job_seeker' ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.jobSeekers}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'job_seeker' ? 'text-purple-300' : 'text-[#70798C]'}`}>
            {userMetrics.cvCount} CVs attached
          </div>
        </div>

        {/* Employers */}
        <div 
          onClick={() => setPersonaFilter('employer')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'employer'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-amber-500/30'
              : 'bg-white border-[#E5E7EB] hover:border-amber-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'employer' ? 'text-amber-300' : 'text-amber-700'}`}>
              Hiring Employers
            </span>
            <Building2 className={`w-4 h-4 ${personaFilter === 'employer' ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.employers}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'employer' ? 'text-amber-300' : 'text-[#70798C]'}`}>
            {jobsList.length} vacancies live
          </div>
        </div>

        {/* Advertisers & Partners */}
        <div 
          onClick={() => setPersonaFilter('advertiser')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            personaFilter === 'advertiser'
              ? 'bg-[#000004] text-white border-[#000004] shadow-md ring-2 ring-rose-500/30'
              : 'bg-white border-[#E5E7EB] hover:border-rose-400 text-[#000004]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${personaFilter === 'advertiser' ? 'text-rose-300' : 'text-rose-700'}`}>
              Brand Partners
            </span>
            <Megaphone className={`w-4 h-4 ${personaFilter === 'advertiser' ? 'text-rose-400' : 'text-rose-600'}`} />
          </div>
          <div className="text-2xl font-black">{userMetrics.advertisers}</div>
          <div className={`text-[11px] mt-1 truncate ${personaFilter === 'advertiser' ? 'text-rose-300' : 'text-[#70798C]'}`}>
            {adverts.length} campaigns
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PERSONA SELECTOR TABS & ACTION BAR                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs space-y-4">
        {/* Row 1: 1-Click Persona Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {[
              { id: 'all', label: 'All Users', count: userMetrics.total },
              { id: 'agent', label: 'Agents & Realtors', count: userMetrics.agents, icon: Home },
              { id: 'tenant', label: 'Tenants & Renters', count: userMetrics.tenants, icon: Key },
              { id: 'job_seeker', label: 'Job Candidates', count: userMetrics.jobSeekers, icon: Briefcase },
              { id: 'employer', label: 'Hiring Employers', count: userMetrics.employers, icon: Building2 },
              { id: 'advertiser', label: 'Brand Advertisers', count: userMetrics.advertisers, icon: Megaphone },
              { id: 'admin', label: 'Admins', count: userMetrics.admins, icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = personaFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPersonaFilter(tab.id as any)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#000004] text-white shadow-xs'
                      : 'bg-[#FCF9F5] border border-[#E5E7EB] text-[#70798C] hover:text-[#000004] hover:bg-slate-100'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#000004]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* "+ Add New User" Button */}
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#1f2937] transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Row 2: Search, Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, agency, company, CAC, or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium text-[#000004] placeholder:text-[#70798C] focus:outline-none focus:ring-2 focus:ring-[#000004]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City & Standing Filters + View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* City Filter */}
            <AdminCustomSelect
              value={cityFilter}
              onChange={(val) => setCityFilter(val)}
              options={DELTA_CITIES.map((c) => ({ value: c, label: c }))}
              variant="filter"
            />

            {/* Standing Filter */}
            <AdminCustomSelect
              value={standingFilter}
              onChange={(val) => setStandingFilter(val as any)}
              options={[
                { value: 'all', label: 'All Standings' },
                { value: 'verified', label: 'Verified Accounts', dotColor: '#10B981' },
                { value: 'pending', label: 'Pending KYC Review', dotColor: '#F59E0B' },
                { value: 'suspended', label: 'Suspended (Frozen)', dotColor: '#EF4444' },
              ]}
              variant="filter"
            />

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-[#E5E7EB] shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#000004] shadow-xs' : 'text-[#70798C] hover:text-[#000004]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#000004] shadow-xs' : 'text-[#70798C] hover:text-[#000004]'
                }`}
                title="Cards Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. USERS DIRECTORY VIEW (TABLE OR CARDS)                                 */}
      {/* ========================================================================= */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E7EB] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-[#000004]">No User Accounts Match Criteria</h4>
          <p className="text-xs text-[#70798C] max-w-sm mx-auto">
            Try adjusting your search keywords, clearing persona filters, or registering a new platform account.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPersonaFilter('all');
              setCityFilter('All Cities');
              setStandingFilter('all');
            }}
            className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#000004]">
              <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                <tr>
                  <th className="py-3.5 px-4">User & Persona</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Location & Contact</th>
                  <th className="py-3.5 px-3">Platform Footprint</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Standing</th>
                  <th className="py-3.5 px-4 text-right">Super Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredUsers.map((user) => {
                  const persona = getUserPersona(user);
                  const isVerified = user.isVerifiedTenant || user.kycStatus === 'verified';
                  const isSuspended = Boolean(user.isSuspended);

                  // Footprint Calculations
                  const userListings = listings.filter(
                    (l) =>
                      l.availabilityStatus !== 'Deleted' &&
                      ((l.agent?.id && l.agent.id === user.id) ||
                        (user.phone && l.agent?.phone && normalizePhoneNumber(l.agent.phone) === normalizePhoneNumber(user.phone)))
                  );
                  const userPasses = bookings.filter(
                    (b) =>
                      b.applicantPhone === user.phone ||
                      (user.email && b.applicantEmail === user.email)
                  );
                  const userJobs = jobsList.filter(
                    (j) =>
                      (j.posterId && j.posterId === user.id) ||
                      (user.email && j.posterEmail && j.posterEmail.toLowerCase() === user.email.toLowerCase())
                  );
                  const userApplications = jobApplications.filter(
                    (a) =>
                      (a.applicantId && a.applicantId === user.id) ||
                      (user.email && a.applicantEmail && a.applicantEmail.toLowerCase() === user.email.toLowerCase()) ||
                      (user.phone && a.applicantPhone && normalizePhoneNumber(a.applicantPhone) === normalizePhoneNumber(user.phone))
                  );
                  const userAdverts = adverts.filter(
                    (ad) => ad.partnerEmail && user.email && ad.partnerEmail.toLowerCase() === user.email.toLowerCase()
                  );

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isSuspended ? 'bg-red-50/30' : ''}`}
                    >
                      {/* 1. User & Persona */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#000004] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E5E7EB] relative">
                            {(user.fullName || '').trim().split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                            {isVerified && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-[#000004]">{user.fullName}</span>
                              {user.isAdmin && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                                  {isElvisSuperAdmin(user) ? 'Primary Admin' : 'Admin'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {renderPersonaBadge(persona)}
                              {persona === 'agent' && user.agencyName && (
                                <span className="text-[11px] text-[#70798C] font-medium truncate max-w-[180px]">
                                  {user.agencyName}
                                </span>
                              )}
                              {persona === 'employer' && (user.companyName || user.agencyName) && (
                                <span className="text-[11px] text-[#70798C] font-medium truncate max-w-[180px]">
                                  {user.companyName || user.agencyName}
                                </span>
                              )}
                              {persona === 'job_seeker' && (user.targetRole || user.preferredPropertyType) && (
                                <span className="text-[11px] text-purple-700 font-medium truncate max-w-[180px]">
                                  {user.targetRole || user.preferredPropertyType}
                                </span>
                              )}
                              {persona === 'tenant' && user.preferredPropertyType && (
                                <span className="text-[11px] text-[#70798C] truncate max-w-[180px]">
                                  Pref: {user.preferredPropertyType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Location & Contact */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-[#000004]">
                            <MapPin className="w-3 h-3 text-[#70798C]" />
                            <span>{user.city || user.operatingCity || 'Asaba'}, Delta</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${user.phone}`} 
                              className="font-mono text-[11px] text-[#70798C] hover:text-[#000004]"
                            >
                              {formatNigerianPhone(user.phone)}
                            </a>
                            {user.phone && (
                              <a
                                href={`https://wa.me/234${normalizePhoneNumber(user.phone).slice(-10)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 inline-flex items-center"
                                title="Chat on WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {user.email && (
                            <a
                              href={`mailto:${user.email}`}
                              className="text-[11px] text-[#70798C] hover:underline block truncate max-w-[170px]"
                            >
                              {user.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. Platform Footprint */}
                      <td className="py-3.5 px-3">
                        {persona === 'agent' && (
                          <div className="space-y-1">
                            <span className="font-bold text-xs text-[#000004] block">
                              {userListings.length} Active Listings
                            </span>
                            <span className="text-[11px] text-[#70798C] block">
                              CAC: <strong className="font-mono text-[#000004]">{user.cacNumber || 'Unregistered'}</strong>
                            </span>
                          </div>
                        )}

                        {persona === 'tenant' && (
                          <div className="space-y-1">
                            <span className="font-bold text-xs text-[#000004] block">
                              {userPasses.length} Inspection Passes
                            </span>
                            <span className="text-[11px] text-emerald-700 block">
                              {userPasses.filter((b) => b.status === 'CONFIRMED_UNLOCKED').length} Confirmed Unlocked
                            </span>
                          </div>
                        )}

                        {persona === 'job_seeker' && (
                          <div className="space-y-1">
                            {user.cvUrl || user.cvFileName ? (
                              <button
                                onClick={() => setInspectingCvCandidate(user)}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-purple-600" />
                                <span className="truncate max-w-[130px]">{user.cvFileName || 'Candidate CV.pdf'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">No CV attached yet</span>
                            )}
                            <span className="text-[11px] text-[#70798C] block">
                              {userApplications.length} Vacancy Applications
                            </span>
                          </div>
                        )}

                        {persona === 'employer' && (
                          <div className="space-y-1">
                            <button
                              onClick={() => setInspectingEmployer(user)}
                              className="font-bold text-xs text-amber-900 hover:underline block text-left cursor-pointer"
                            >
                              {userJobs.length} Vacancies Posted
                            </button>
                            <span className="text-[11px] text-emerald-700 block font-semibold">
                              ₦{(userJobs.length * 2000).toLocaleString()} Listing Fees Paid
                            </span>
                          </div>
                        )}

                        {persona === 'advertiser' && (
                          <div className="space-y-1">
                            <span className="font-bold text-xs text-rose-900 block">
                              {userAdverts.length} Active Campaigns
                            </span>
                            <span className="text-[11px] text-[#70798C] block">
                              Billboard / Stories Sponsor
                            </span>
                          </div>
                        )}

                        {persona === 'admin' && (
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-slate-900 block">
                              {isElvisSuperAdmin(user) ? 'Supreme Platform Authority' : 'Full Governance'}
                            </span>
                            <span className="text-[10px] text-[#70798C] font-mono">
                              {isElvisSuperAdmin(user) ? 'Master Access & Deletion Control' : 'System Audit Log Access'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Standing */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            <Lock className="w-3 h-3 text-red-600" />
                            <span>{user.isAdmin ? 'Disabled Admin' : 'Suspended'}</span>
                          </span>
                        ) : user.kycStatus === 'pending' ? (
                          <button
                            onClick={() => setInspectingKycAgent(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold animate-pulse cursor-pointer hover:bg-amber-200"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Review KYC</span>
                          </button>
                        ) : isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* 5. Super Controls */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Persona Specific Action */}
                          {persona === 'job_seeker' && (
                            <button
                              onClick={() => setInspectingCvCandidate(user)}
                              className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Inspect Candidate CV"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {persona === 'employer' && (
                            <button
                              onClick={() => setInspectingEmployer(user)}
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Inspect Employer Vacancies"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {persona === 'agent' && (
                            <button
                              onClick={() => setInspectingKycAgent(user)}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Review CAC & Identity KYC"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {persona === 'tenant' && (
                            <button
                              onClick={() => setInspectingTenantBookings(user)}
                              className="p-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
                              title="Inspection Passes History"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {persona === 'advertiser' && onNavigateTab && (
                            <button
                              onClick={() => onNavigateTab('ads')}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Open In Ads Management"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Verification Toggle */}
                          {!user.isAdmin && (
                            <button
                              onClick={() => handleToggleVerification(user)}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isVerified
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                              }`}
                            >
                              {isVerified ? 'Verified' : 'Verify'}
                            </button>
                          )}

                          {/* Edit User & Persona */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                            title="Edit User Profile & Persona"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Reinstate Toggle */}
                          {canSuspendUser(user) && (
                            <button
                              onClick={() => {
                                if (isSuspended) {
                                  handleReinstateUser(user);
                                } else {
                                  setSuspendingUser(user);
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isSuspended
                                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                  : 'border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isSuspended ? (user.isAdmin ? 'Reactivate Administrator' : 'Reactivate Account') : (user.isAdmin ? 'Disable Administrator' : 'Suspend Account')}
                            >
                              {isSuspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Delete Account */}
                          {canDeleteUser(user) && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#70798C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title={user.isAdmin ? 'Revoke & Delete Administrator' : 'Delete Account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const persona = getUserPersona(user);
            const isVerified = user.isVerifiedTenant || user.kycStatus === 'verified';
            const isSuspended = Boolean(user.isSuspended);

            return (
              <div
                key={user.id}
                className={`bg-white rounded-3xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
                  isSuspended
                    ? 'border-red-300 bg-red-50/20'
                    : isVerified
                    ? 'border-[#E5E7EB] hover:border-emerald-400'
                    : 'border-[#E5E7EB] hover:border-slate-300'
                } shadow-xs`}
              >
                <div className="space-y-3">
                  {/* Card Header: Avatar, Name, Persona badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#000004] flex items-center justify-center font-bold text-sm shrink-0 border border-[#E5E7EB] relative">
                        {(user.fullName || '').trim().split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        {isVerified && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#000004] truncate">{user.fullName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#70798C] mt-0.5">
                          <MapPin className="w-3 h-3 text-[#70798C] shrink-0" />
                          <span className="truncate">{user.city || user.operatingCity || 'Asaba'}, Delta</span>
                        </div>
                      </div>
                    </div>

                    <div>{renderPersonaBadge(persona)}</div>
                  </div>

                  {/* Persona-Specific Card Body */}
                  <div className="p-3 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2 text-xs">
                    {persona === 'agent' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Agency:</span>
                          <span className="font-bold text-[#000004] truncate max-w-[160px]">
                            {user.agencyName || 'Independent'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">CAC Number:</span>
                          <span className="font-mono font-bold text-[#000004]">{user.cacNumber || 'Pending'}</span>
                        </div>
                      </>
                    )}

                    {persona === 'tenant' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Search Preference:</span>
                          <span className="font-bold text-[#000004]">{user.preferredPropertyType || 'Flexible'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Budget Target:</span>
                          <span className="font-bold text-[#000004]">
                            {user.budget ? formatNaira(user.budget) : 'Negotiable'}
                          </span>
                        </div>
                      </>
                    )}

                    {persona === 'job_seeker' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Target Role:</span>
                          <span className="font-bold text-purple-900 truncate max-w-[160px]">
                            {user.targetRole || user.preferredPropertyType || 'General Candidate'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Resume / CV:</span>
                          {user.cvUrl || user.cvFileName ? (
                            <button
                              onClick={() => setInspectingCvCandidate(user)}
                              className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{user.cvFileName || 'View CV'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">Not uploaded</span>
                          )}
                        </div>
                      </>
                    )}

                    {persona === 'employer' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Hiring Company:</span>
                          <span className="font-bold text-amber-900 truncate max-w-[160px]">
                            {user.companyName || user.agencyName || 'Employer Organization'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Fee Clearance:</span>
                          <span className="font-bold text-emerald-700">₦2,000 / post cleared</span>
                        </div>
                      </>
                    )}

                    {persona === 'advertiser' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Sponsor Brand:</span>
                          <span className="font-bold text-rose-900 truncate max-w-[160px]">
                            {user.companyName || user.agencyName || 'Brand Advertiser'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#70798C]">Placement:</span>
                          <span className="font-bold text-[#000004]">Billboard & Stories</span>
                        </div>
                      </>
                    )}

                    {persona === 'admin' && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#70798C]">Access Level:</span>
                        <span className="font-bold text-slate-900">
                          {isElvisSuperAdmin(user) ? 'Primary Administrator' : 'Platform Administrator'}
                        </span>
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#70798C]">{formatNigerianPhone(user.phone)}</span>
                      {user.phone && (
                        <a
                          href={`https://wa.me/234${normalizePhoneNumber(user.phone).slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Persona Primary Action */}
                    {persona === 'job_seeker' && (
                      <button
                        onClick={() => setInspectingCvCandidate(user)}
                        className="py-1.5 px-3 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect CV</span>
                      </button>
                    )}

                    {persona === 'employer' && (
                      <button
                        onClick={() => setInspectingEmployer(user)}
                        className="py-1.5 px-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Vacancies</span>
                      </button>
                    )}

                    {persona === 'agent' && (
                      <button
                        onClick={() => setInspectingKycAgent(user)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Review KYC</span>
                      </button>
                    )}

                    {persona === 'tenant' && (
                      <button
                        onClick={() => setInspectingTenantBookings(user)}
                        className="py-1.5 px-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-bold text-xs hover:bg-sky-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Passes</span>
                      </button>
                    )}

                    {!user.isAdmin && (
                      <button
                        onClick={() => handleToggleVerification(user)}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-[#70798C] hover:text-[#000004]'
                        }`}
                      >
                        {isVerified ? 'Verified' : 'Verify'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                      title="Edit Profile & Persona"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {canSuspendUser(user) && (
                      <button
                        onClick={() => {
                          if (isSuspended) {
                            handleReinstateUser(user);
                          } else {
                            setSuspendingUser(user);
                          }
                        }}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isSuspended
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-[#E5E7EB] hover:bg-red-50 text-[#70798C] hover:text-red-600'
                        }`}
                        title={isSuspended ? (user.isAdmin ? 'Reactivate Administrator' : 'Reactivate') : (user.isAdmin ? 'Disable Administrator' : 'Suspend')}
                      >
                        {isSuspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {canDeleteUser(user) && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 rounded-xl border border-[#E5E7EB] hover:bg-red-50 text-[#70798C] hover:text-red-600 transition-colors cursor-pointer"
                        title={user.isAdmin ? 'Revoke & Delete Administrator' : 'Delete Account'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS & DRAWERS                                                       */}
      {/* ========================================================================= */}

      {/* DRAWER 1: JOB SEEKER CV INSPECTION & APPLICATION DRAWER */}
      {inspectingCvCandidate && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setInspectingCvCandidate(null)}
          >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-5 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#000004]">Candidate Profile & CV Dossier</h4>
                  <p className="text-xs text-[#70798C]">{inspectingCvCandidate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCvCandidate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[#70798C] block text-[10px] font-bold uppercase">Target Career Role</span>
                <span className="font-bold text-[#000004] text-sm mt-0.5 block">
                  {inspectingCvCandidate.targetRole || inspectingCvCandidate.preferredPropertyType || 'Full-Stack Candidate'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[#70798C] block text-[10px] font-bold uppercase">Delta City Base</span>
                <span className="font-bold text-[#000004] text-sm mt-0.5 block">
                  {inspectingCvCandidate.city || 'Asaba'}, Delta State
                </span>
              </div>
            </div>

            {/* CV Attachment Box */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-purple-950 block truncate max-w-[250px]">
                      {inspectingCvCandidate.cvFileName || 'Candidate_Resume_CV.pdf'}
                    </span>
                    <span className="text-[10px] text-purple-700">Official Uploaded Resume File</span>
                  </div>
                </div>

                {inspectingCvCandidate.cvUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={inspectingCvCandidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-white border border-purple-300 text-purple-800 text-xs font-bold hover:bg-purple-100 flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </a>
                    <a
                      href={inspectingCvCandidate.cvUrl}
                      download={inspectingCvCandidate.cvFileName || 'Candidate_CV.pdf'}
                      className="py-1.5 px-3 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Contact Options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#70798C]">Contact Candidate:</span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${inspectingCvCandidate.phone}`}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 font-bold text-[#000004] flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {inspectingCvCandidate.phone}</span>
                </a>
                <a
                  href={`https://wa.me/234${normalizePhoneNumber(inspectingCvCandidate.phone).slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setInspectingCvCandidate(null)}
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* DRAWER 2: EMPLOYER VACANCIES INSPECTION */}
      {inspectingEmployer && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setInspectingEmployer(null)}
          >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#000004]">Employer Vacancies & Footprint</h4>
                  <p className="text-xs text-[#70798C]">{inspectingEmployer.companyName || inspectingEmployer.agencyName || inspectingEmployer.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingEmployer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vacancies List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {jobsList
                .filter(
                  (j) =>
                    (j.posterId && j.posterId === inspectingEmployer.id) ||
                    (inspectingEmployer.email && j.posterEmail && j.posterEmail.toLowerCase() === inspectingEmployer.email.toLowerCase())
                )
                .map((job) => (
                  <div key={job.id} className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#000004] text-sm">{job.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {job.status === 'active' ? 'Live Active' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#70798C] text-[11px]">
                      <span>{job.city}, Delta · {job.roleType}</span>
                      <span className="font-semibold text-emerald-700">₦2,000 Listing Fee Cleared</span>
                    </div>
                  </div>
                ))}
              {jobsList.filter(
                (j) =>
                  (j.posterId && j.posterId === inspectingEmployer.id) ||
                  (inspectingEmployer.email && j.posterEmail && j.posterEmail.toLowerCase() === inspectingEmployer.email.toLowerCase())
              ).length === 0 && (
                <p className="text-center py-6 text-xs text-[#70798C]">No vacancies currently registered for this employer.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setInspectingEmployer(null);
                    onNavigateTab('jobs');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open in Setlla Jobs Control</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setInspectingEmployer(null)}
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* DRAWER 3: AGENT CAC & KYC INSPECTION MODAL */}
      {inspectingKycAgent && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setInspectingKycAgent(null)}
          >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#000004]">Review Agent KYC & CAC Credentials</h4>
                  <p className="text-xs text-[#70798C]">{inspectingKycAgent.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingKycAgent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB]">
                  <span className="text-[#70798C] block text-[10px] font-bold">Agency Name:</span>
                  <span className="font-bold text-sm text-[#000004]">{inspectingKycAgent.agencyName || 'Independent'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB]">
                  <span className="text-[#70798C] block text-[10px] font-bold">CAC Number:</span>
                  <span className="font-mono font-bold text-sm text-[#000004]">{inspectingKycAgent.cacNumber || 'RC-Pending'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#000004] block mb-1">Corporate Affairs Commission (CAC) Certificate:</span>
                {inspectingKycAgent.kycDocuments?.cacCertificateUrl ? (
                  <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-slate-900 max-h-52 flex items-center justify-center">
                    <img
                      src={inspectingKycAgent.kycDocuments.cacCertificateUrl}
                      alt="CAC Certificate"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-[#E5E7EB] text-center text-[#70798C]">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs">Physical CAC Document copy pending agent upload.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setInspectingKycAgent(null)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleToggleVerification(inspectingKycAgent);
                  setInspectingKycAgent(null);
                }}
                className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  inspectingKycAgent.kycStatus === 'verified'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {inspectingKycAgent.kycStatus === 'verified' ? 'Revoke Verification' : 'Approve & Verify Agent'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* DRAWER 4: TENANT INSPECTION PASSES MODAL */}
      {inspectingTenantBookings && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setInspectingTenantBookings(null)}
          >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#000004]">Inspection Booking & Pass History</h4>
                  <p className="text-xs text-[#70798C]">{inspectingTenantBookings.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingTenantBookings(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {bookings
                .filter(
                  (b) =>
                    b.applicantPhone === inspectingTenantBookings.phone ||
                    (inspectingTenantBookings.email && b.applicantEmail === inspectingTenantBookings.email)
                )
                .map((b) => {
                  const prop = listings.find((l) => l.id === b.propertyId);
                  return (
                    <div key={b.id} className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB] text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="font-mono text-amber-700">{b.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'CONFIRMED_UNLOCKED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-[#000004]'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="font-bold text-[#000004]">{prop?.title || 'Target Property'}</p>
                      <p className="text-[11px] text-[#70798C]">
                        Slot: {b.slotDate}, {b.slotTimeWindow}
                      </p>
                    </div>
                  );
                })}
              {bookings.filter(
                (b) =>
                  b.applicantPhone === inspectingTenantBookings.phone ||
                  (inspectingTenantBookings.email && b.applicantEmail === inspectingTenantBookings.email)
              ).length === 0 && (
                <p className="text-center py-6 text-xs text-[#70798C]">No booking records found for this tenant.</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setInspectingTenantBookings(null)}
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* MODAL 5: EDIT USER & PERSONA MODAL */}
      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveEditedUser}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h4 className="font-bold text-base text-[#000004]">Edit User Profile & Persona</h4>
                <p className="text-xs text-[#70798C]">Update contact coordinates, assigned role, and platform permissions.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Persona Selector */}
              <div>
                <label className="font-bold text-[#000004] block mb-1.5">User Platform Persona</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'agent', label: 'Agent / Realtor' },
                    { id: 'tenant', label: 'Tenant / Renter' },
                    { id: 'job_seeker', label: 'Job Seeker' },
                    { id: 'employer', label: 'Employer' },
                    { id: 'advertiser', label: 'Advertiser' },
                    { id: 'admin', label: 'Administrator' },
                  ].map((p) => {
                    const isSelected = (editingUser.persona || (editingUser.isAgent ? 'agent' : 'tenant')) === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setEditingUser({
                            ...editingUser,
                            persona: p.id as any,
                            isAgent: p.id === 'agent',
                          });
                        }}
                        className={`p-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                            : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
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

              {/* Phone & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Operating City</label>
                  <AdminCustomSelect
                    value={editingUser.city || editingUser.operatingCity || 'Asaba'}
                    onChange={(val) => setEditingUser({ ...editingUser, city: val, operatingCity: val })}
                    options={DELTA_CITIES.filter((c) => c !== 'All Cities').map((c) => ({ value: c, label: c }))}
                    variant="form"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-[#000004] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Persona-Dependent Fields */}
              {(editingUser.persona === 'agent' || editingUser.isAgent) && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">Agency Name</label>
                    <input
                      type="text"
                      value={editingUser.agencyName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, agencyName: e.target.value })}
                      placeholder="e.g. Apex Real Estate Ltd"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">CAC Registration No.</label>
                    <input
                      type="text"
                      value={editingUser.cacNumber || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, cacNumber: e.target.value })}
                      placeholder="e.g. RC-1849204"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingUser.persona === 'employer' && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Hiring Organization / Company Name</label>
                  <input
                    type="text"
                    value={editingUser.companyName || editingUser.agencyName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value, agencyName: e.target.value })}
                    placeholder="e.g. Delta Cold-Chain Logistics Ltd"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}

              {editingUser.persona === 'job_seeker' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">Target Role / Career Title</label>
                    <input
                      type="text"
                      value={editingUser.targetRole || editingUser.preferredPropertyType || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, targetRole: e.target.value, preferredPropertyType: e.target.value })}
                      placeholder="e.g. Full-Stack Software Engineer"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">Resume File Name / URL</label>
                    <input
                      type="text"
                      value={editingUser.cvFileName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, cvFileName: e.target.value })}
                      placeholder="e.g. Candidate_CV.pdf"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingUser.persona === 'advertiser' && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Brand / Sponsor Organization</label>
                  <input
                    type="text"
                    value={editingUser.companyName || editingUser.agencyName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value, agencyName: e.target.value })}
                    placeholder="e.g. Apex Grand Hospitality Ltd"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
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
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-all cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>
      )}

      {/* MODAL 6: ADD NEW USER MODAL */}
      {isAddUserModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleCreateNewUser}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-scale-up space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h4 className="font-bold text-base text-[#000004]">Add New User to Setlla</h4>
                <p className="text-xs text-[#70798C]">Create an agent, job seeker, tenant, employer, or brand partner account.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-[#70798C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Persona Selection */}
              <div>
                <label className="font-bold text-[#000004] block mb-1.5">User Persona Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'agent', label: 'Agent / Realtor' },
                    { id: 'tenant', label: 'Tenant / Renter' },
                    { id: 'job_seeker', label: 'Job Seeker' },
                    { id: 'employer', label: 'Employer' },
                    { id: 'advertiser', label: 'Advertiser' },
                    { id: 'admin', label: 'Administrator' },
                  ].map((p) => {
                    const isSelected = newUserForm.persona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNewUserForm({ ...newUserForm, persona: p.id as any })}
                        className={`p-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                            : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="font-bold text-[#000004] block mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  placeholder="e.g. Osaro Kenneth"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="0803 000 0000"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Operating City</label>
                  <AdminCustomSelect
                    value={newUserForm.city}
                    onChange={(val) => setNewUserForm({ ...newUserForm, city: val })}
                    options={DELTA_CITIES.filter((c) => c !== 'All Cities').map((c) => ({ value: c, label: c }))}
                    variant="form"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-[#000004] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. user@setlla.com"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Persona Fields */}
              {newUserForm.persona === 'agent' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">Agency Name</label>
                    <input
                      type="text"
                      value={newUserForm.agencyName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, agencyName: e.target.value })}
                      placeholder="e.g. Delta Heritage Realty"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#000004] block mb-1">CAC Registration No.</label>
                    <input
                      type="text"
                      value={newUserForm.cacNumber}
                      onChange={(e) => setNewUserForm({ ...newUserForm, cacNumber: e.target.value })}
                      placeholder="RC-1234567"
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {newUserForm.persona === 'employer' && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Hiring Organization Name</label>
                  <input
                    type="text"
                    value={newUserForm.companyName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                    placeholder="e.g. Asaba Tech Innovations Ltd"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}

              {newUserForm.persona === 'job_seeker' && (
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Target Career Role</label>
                  <input
                    type="text"
                    value={newUserForm.targetRole}
                    onChange={(e) => setNewUserForm({ ...newUserForm, targetRole: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-all cursor-pointer shadow-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>
      )}

      {/* MODAL 7: SUSPEND USER MODAL */}
      {suspendingUser && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setSuspendingUser(null)}
          >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-200 animate-scale-up space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-red-900">
                  {suspendingUser.isAdmin ? 'Disable Administrator' : 'Suspend'} {suspendingUser.fullName}?
                </h4>
                <p className="text-xs text-[#70798C]">
                  {suspendingUser.isAdmin
                    ? 'This will revoke administrative portal privileges and freeze account access.'
                    : 'This will temporarily block platform access and freeze account activity.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#000004]">
                {suspendingUser.isAdmin ? 'Disable Reason:' : 'Suspension Reason:'}
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
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
                {suspendingUser.isAdmin ? 'Confirm Disable' : 'Confirm Freeze'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
};
