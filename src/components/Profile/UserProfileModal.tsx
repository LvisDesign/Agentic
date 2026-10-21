import React, { useState, useRef } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Building2, 
  AlertCircle,
  UserCheck,
  UserPlus,
  LogOut,
  BellRing,
  Download,
  Share2,
  PlusSquare,
  Camera,
  Trash2,
  Edit3,
  Lock,
  Key,
  Clock,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { UserRole, BookingRecord, UserProfile } from '../../types/marketplace';
import { formatNigerianPhone } from '../../utils/formatters';
import { getNotificationPermission, requestNotificationPermission, setAppBadge, usePWA } from '../../utils/pwa';
import { DELTA_CITY_OPTIONS } from '../../data/deltaCities';
import { CustomDropdown } from '../UI/CustomDropdown';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
  currentUser: UserProfile;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onUpdateProfile?: (updatedUser: UserProfile) => void;
  onOpenBecomeAgent: () => void;
  onOpenSignup?: () => void;
  onSignOut?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  activeBookings,
  onOpenMyPasses,
  currentUser,
  onUpdateAvatar,
  onUpdateProfile,
  onOpenBecomeAgent,
  onOpenSignup,
  onSignOut,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showArchitectureGuide, setShowArchitectureGuide] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const [testAlertSent, setTestAlertSent] = useState(false);

  // Profile Edit States
  const [editMode, setEditMode] = useState<'view' | 'verify' | 'editing'>('view');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState('849201');
  const [demoBypassTime, setDemoBypassTime] = useState(false);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Profile Edit Form Fields
  const [editFullName, setEditFullName] = useState(currentUser.fullName || '');
  const [editAgencyName, setEditAgencyName] = useState(currentUser.agencyName || '');
  const [editCacNumber, setEditCacNumber] = useState(currentUser.cacNumber || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(currentUser.whatsapp || currentUser.phone || '');
  const [editEmail, setEditEmail] = useState(currentUser.email || '');
  const [editCity, setEditCity] = useState(currentUser.city || currentUser.operatingCity || 'Asaba');
  const [editNin, setEditNin] = useState(currentUser.nin || '');

  // Eligibility: 7 days after signup, 14 days after last edit
  const now = Date.now();
  const signupTime = currentUser.createdAt 
    ? new Date(currentUser.createdAt).getTime() 
    : now - 10 * 24 * 60 * 60 * 1000;
  const daysSinceSignup = Math.floor((now - signupTime) / (1000 * 60 * 60 * 24));
  const isSignupEligible = demoBypassTime || daysSinceSignup >= 7;
  const daysUntilSignupEligible = Math.max(1, 7 - daysSinceSignup);

  const lastEditTime = currentUser.lastProfileEditAt 
    ? new Date(currentUser.lastProfileEditAt).getTime() 
    : 0;
  const daysSinceLastEdit = lastEditTime 
    ? Math.floor((now - lastEditTime) / (1000 * 60 * 60 * 24)) 
    : 999;
  const isEditCooldownEligible = demoBypassTime || !lastEditTime || daysSinceLastEdit >= 14;
  const daysUntilEditEligible = Math.max(1, 14 - daysSinceLastEdit);

  const isEligibleToEdit = isSignupEligible && isEditCooldownEligible;

  const handleStartEdit = () => {
    if (!isEligibleToEdit) {
      setShowLockNotice(true);
      return;
    }
    setShowLockNotice(false);
    setVerificationCodeInput('');
    setVerificationError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(code);
    setEditFullName(currentUser.fullName || '');
    setEditAgencyName(currentUser.agencyName || '');
    setEditCacNumber(currentUser.cacNumber || '');
    setEditPhone(currentUser.phone || '');
    setEditWhatsapp(currentUser.whatsapp || currentUser.phone || '');
    setEditEmail(currentUser.email || (isAgent ? 'victor@apexrealty.ng' : 'chinedu.okafor@gmail.com'));
    setEditCity(currentUser.city || currentUser.operatingCity || 'Asaba');
    setEditNin(currentUser.nin || '');
    setEditMode('verify');
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCodeInput.trim() !== demoCode) {
      setVerificationError('Invalid 6-digit code. Please enter the verification code sent to your email.');
      return;
    }
    setVerificationError(null);
    setEditMode('editing');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editPhone.trim()) {
      alert('Full name and phone number are required.');
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      city: editCity,
      ...(isAgent ? {
        agencyName: editAgencyName.trim() || 'Independent Partner Agent',
        cacNumber: editCacNumber.trim() || 'RC-1849204',
        whatsapp: editWhatsapp.trim() || editPhone.trim(),
        operatingCity: editCity,
      } : {
        nin: editNin.trim() || currentUser.nin,
      }),
      lastProfileEditAt: new Date().toISOString(),
    };

    onUpdateProfile?.(updatedUser);
    setSaveSuccessMessage('Profile updated successfully! Next edit will be allowed in 14 days.');
    setEditMode('view');
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateAvatar?.(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateAvatar?.('');
  };

  // Persistent Unobtrusive PWA Install State
  const { isStandalone, isIOS, installApp } = usePWA();
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [installSuccessNotice, setInstallSuccessNotice] = useState(false);

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSInstallGuide((prev) => !prev);
      return;
    }
    const outcome = await installApp();
    if (outcome === 'accepted') {
      setInstallSuccessNotice(true);
      setTimeout(() => setInstallSuccessNotice(false), 3500);
    }
  };

  const handleToggleAlerts = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
  };

  const handleSendTestNotification = async () => {
    if (notificationPermission !== 'granted') {
      const perm = await requestNotificationPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') return;
    }

    setAppBadge(1);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Inspection Accepted by Agent', {
        body: 'Your apartment inspection pass for Asaba 2-Bedroom Flat is confirmed. Agent contact coordinates unlocked!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'setlla-test-alert',
      });
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 3000);
    }
  };

  const isAgent = Boolean(currentUser.isAgent || currentRole === 'agent');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#000004] text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#000004]">
                {isAgent ? 'Agent Profile' : 'Tenant Profile'}
              </h3>
              <p className="text-xs text-[#70798C]">
                {isAgent ? 'Delta State Partner Agent Account' : 'Setlla Member Account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs no-scrollbar">
          {/* User Card with Avatar Upload */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-[#342A21]/5 border border-[#342A21]/15 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />

              {/* Avatar with Click-to-Upload & Camera Overlay */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#342A21] text-white font-bold text-lg flex items-center justify-center shadow-xs cursor-pointer group-hover:ring-2 group-hover:ring-[#000004] transition-all"
                  title="Click to upload profile photo"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                  {/* Subtle dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                </button>

                {/* Camera upload badge button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#000004] text-amber-300 border-2 border-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#000004]">
                    {currentUser.fullName}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-[#342A21] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Camera className="w-2.5 h-2.5 text-[#342A21]" />
                    <span>{currentUser.avatarUrl ? 'Change photo' : 'Upload photo'}</span>
                  </button>
                  {currentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      title="Remove photo"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-[#70798C] flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#342A21]" /> {currentUser.city || currentUser.operatingCity || 'Asaba'}, Delta
                  </span>
                  <span>•</span>
                  <span>{isAgent ? (currentUser.agencyName || 'Partner Agency') : 'Verified Tenant'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Role & Scope Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#000004] text-xs flex items-center gap-1.5">
                {isAgent ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Account Type: Partner Agent
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Account Type: Tenant
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-[#70798C] leading-relaxed">
              {isAgent
                ? 'You have full access to list apartments across Delta State, set inspection time slots, accept inspection bookings, and connect directly with verified tenants.'
                : 'You have full, unrestricted access to browse apartments uploaded by verified Delta State agents and book as many inspections as you want. Only agents are restricted to 5 bookings per window so your time is never wasted.'}
            </p>
          </div>

          {/* BECOME AN AGENT OPTION CARD (Only shown if not already an agent) */}
          {!isAgent && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#000004] to-[#1a2332] text-white shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    Want to List Properties?
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#000004]">
                  Upgrade
                </span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Register as a Setlla Partner Agent. Upload unlimited apartments across Delta State, set strict 5-capacity inspection time slots, and dispatch directly to tenants.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenBecomeAgent();
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#000004] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Apply to Become an Agent</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Mode 1: Email Verification Step */}
          {editMode === 'verify' && (
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3.5 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#000004] text-white flex items-center justify-center">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#000004]">Email Verification Required</h4>
                    <p className="text-[10px] text-[#70798C]">Security check before editing profile</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode('view')}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-[#70798C] leading-relaxed">
                To protect your verified account, we sent a 6-digit confirmation code to:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-[#000004] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#342A21]" />
                <span className="truncate">{currentUser.email || (isAgent ? 'victor@apexrealty.ng' : 'chinedu.okafor@gmail.com')}</span>
              </div>

              {/* Demo security code box for instant testability */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block">Demo Verification Code</span>
                  <span className="font-mono font-bold text-amber-950 text-sm tracking-wider">{demoCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationCodeInput(demoCode)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] transition-colors cursor-pointer"
                >
                  Auto-Fill Code
                </button>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#000004] mb-1">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCodeInput}
                    onChange={(e) => {
                      setVerificationCodeInput(e.target.value.replace(/\D/g, ''));
                      setVerificationError(null);
                    }}
                    placeholder="e.g. 849201"
                    className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:border-[#000004] outline-none"
                    autoFocus
                  />
                  {verificationError && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {verificationError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode('view')}
                    className="flex-1 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-bold text-[#70798C] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#000004] hover:bg-[#1a2332] text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Verify & Unlock</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Mode 2: Edit Profile Form */}
          {editMode === 'editing' && (
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3.5 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-[#000004] flex items-center justify-center font-bold">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#000004]">Edit {isAgent ? 'Agent' : 'Tenant'} Profile</h4>
                    <p className="text-[10px] text-[#70798C]">14-day lock will apply after saving</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode('view')}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#70798C] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                    required
                  />
                </div>

                {isAgent && (
                  <>
                    {/* Agency Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#70798C] mb-1">Agency Name</label>
                      <input
                        type="text"
                        value={editAgencyName}
                        onChange={(e) => setEditAgencyName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                        placeholder="e.g. Apex Real Estate Ltd"
                      />
                    </div>

                    {/* CAC Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#70798C] mb-1">CAC Registration</label>
                      <input
                        type="text"
                        value={editCacNumber}
                        onChange={(e) => setEditCacNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                        placeholder="e.g. RC-1849204"
                      />
                    </div>
                  </>
                )}

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#70798C] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                      required
                    />
                  </div>
                  {isAgent ? (
                    <div>
                      <label className="block text-[11px] font-bold text-[#70798C] mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                        placeholder="e.g. 0803 555 1234"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-[#70798C] mb-1">NIN / National ID</label>
                      <input
                        type="text"
                        value={editNin}
                        onChange={(e) => setEditNin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                        placeholder="NIN-2910-***-9021"
                      />
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-[#70798C] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#000004] focus:border-[#000004] outline-none"
                    required
                  />
                </div>

                {/* City in Delta */}
                <div>
                  <label className="block text-[11px] font-bold text-[#70798C] mb-1">
                    {isAgent ? 'Primary Operating City in Delta' : 'City in Delta State'}
                  </label>
                  <CustomDropdown
                    options={DELTA_CITY_OPTIONS}
                    value={editCity}
                    onChange={(val) => setEditCity(val)}
                    headerTitle="Select City or Town"
                    placeholder="Select City / Town"
                    variant="form"
                    allowCustomInput={true}
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[10px] text-amber-900 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>Saving changes will apply a 14-day security lock before the next profile edit is permitted.</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditMode('view')}
                    className="flex-1 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-bold text-[#70798C] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#000004] hover:bg-[#1a2332] text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Mode 3: View Credentials (Standard display with Edit button) */}
          {editMode === 'view' && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#70798C]">
                  {isAgent ? 'Agent Credentials' : 'Member Credentials'}
                </div>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="Edit Profile Details"
                >
                  {isEligibleToEdit ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-[#342A21]" />
                      <span>Edit Profile</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>

              {/* Informational Lock Notice Banner if clicked while in cooldown/waiting period */}
              {showLockNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#000004] space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-900">Profile Editing Locked</span>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        {!isSignupEligible
                          ? `New accounts can only edit profile details 7 days after signup to prevent fraud and impersonation. Available in ${daysUntilSignupEligible} day(s).`
                          : `To protect your account identity, profile edits can only be made once every 14 days. Next edit available in ${daysUntilEditEligible} day(s).`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[10px]">
                    <span className="text-amber-700 font-semibold">Testing Rule?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoBypassTime(true);
                        setShowLockNotice(false);
                        handleStartEdit();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold transition-colors cursor-pointer"
                    >
                      Fast-Forward Time (Unlock for Demo)
                    </button>
                  </div>
                </div>
              )}

              {isAgent ? (
                <>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#342A21]" /> Agency Name
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {currentUser.agencyName || 'Independent Partner Agent'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#342A21]" /> CAC / Registration
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {currentUser.cacNumber || 'RC-1849204'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#342A21]" /> Business Phone
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {formatNigerianPhone(currentUser.phone)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#342A21]" /> Email
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {currentUser.email || 'victor@apexrealty.ng'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#342A21]" /> Operating Area
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {currentUser.operatingCity || currentUser.city || 'Asaba'}, {currentUser.operatingState || currentUser.state || 'Delta State'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#342A21]" /> Phone
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {formatNigerianPhone(currentUser.phone)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#342A21]" /> Email
                    </span>
                    <span className="font-semibold text-[#000004]">{currentUser.email || 'Optional (Not provided)'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#342A21]" /> Looking For Apartment In
                    </span>
                    <span className="font-semibold text-[#000004]">{currentUser.state || `${currentUser.city}, Delta State`}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#70798C] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#342A21]" /> NIN / Identity
                    </span>
                    <span className="font-semibold text-[#000004]">
                      {currentUser.nin || 'NIN-2910-***-9021'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Inspection Quick View */}
          {isAgent ? (
            <div 
              onClick={() => {
                onChangeRole('agent');
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#000004] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004] group-hover:text-[#342A21] transition-colors">
                    Agent Inspections & Bookings
                  </div>
                  <div className="text-[11px] text-[#70798C]">
                    Manage tenant requests in your Agent Portal
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#70798C] group-hover:translate-x-0.5 group-hover:text-[#342A21] transition-all" />
            </div>
          ) : (
            <div 
              onClick={() => {
                onClose();
                onOpenMyPasses();
              }}
              className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#342A21] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#342A21]/10 text-[#342A21] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004] group-hover:text-[#342A21] transition-colors">
                    My Inspections
                  </div>
                  <div className="text-[11px] text-[#70798C]">
                    {activeBookings.length} inspection records on file
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#70798C] group-hover:translate-x-0.5 group-hover:text-[#342A21] transition-all" />
            </div>
          )}

          {/* Mobile Alerts & Push Notifications Setting */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#342A21]/10 text-[#342A21] flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#000004]">Mobile Alerts & Notifications</h5>
                  <p className="text-[11px] text-[#70798C]">Push updates for inspection slots & agent updates</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : notificationPermission === 'denied'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not Enabled'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleToggleAlerts}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Enable Mobile Alerts</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="flex-1 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{testAlertSent ? 'Test Alert Sent (Badge Set)!' : 'Send Test Push Alert'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Persistent Unobtrusive Install Option (Hidden when running in standalone mode / installed) */}
          {!isStandalone && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#342A21]/30 transition-all space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#342A21]/10 text-[#342A21] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#000004] flex items-center gap-1.5">
                      <span>Install Setlla App</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#342A21]/10 text-[#342A21]">
                        PWA
                      </span>
                    </div>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Fast mobile access, instant Agent alerts & inspection updates
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="py-1.5 px-3 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>
              </div>

              {/* Install success notification */}
              {installSuccessNotice && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>App successfully added to your home screen!</span>
                </div>
              )}

              {/* iOS Guide Accordion */}
              {showIOSInstallGuide && (
                <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[rgba(112,121,140,0.22)] text-left space-y-2 text-[11px] animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#000004]">Add to iOS Home Screen:</span>
                    <button 
                      type="button"
                      onClick={() => setShowIOSInstallGuide(false)}
                      className="text-[#70798C] hover:text-[#000004] text-[10px] font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[#342A21]">
                    <span className="w-4 h-4 rounded-full bg-[#000004] text-white font-bold text-[9px] flex items-center justify-center shrink-0">1</span>
                    <span>Tap <strong>Share</strong> <Share2 className="w-3 h-3 inline text-[#342A21] mx-0.5" /> in Safari's bottom toolbar.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#342A21]">
                    <span className="w-4 h-4 rounded-full bg-[#000004] text-white font-bold text-[9px] flex items-center justify-center shrink-0">2</span>
                    <span>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare className="w-3 h-3 inline text-[#342A21] mx-0.5" />.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Switch View Option */}
          {currentRole === 'agent' ? (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004]">Agent Portal Active</div>
                  <div className="text-[11px] text-[#70798C]">
                    Preview platform in Tenant View
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onChangeRole('tenant');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                Switch to Tenant View
              </button>
            </div>
          ) : isAgent ? (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004]">Tenant View Active</div>
                  <div className="text-[11px] text-[#70798C]">
                    Return to your Agent Portal
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onChangeRole('agent');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-amber-300 text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                Back to Agent Portal
              </button>
            </div>
          ) : null}

          {/* Super Admin Console Access */}
          {(currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.email === 'admin@setlla.com') ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004]">Super Admin Authority</div>
                  <div className="text-[11px] text-amber-900">
                    Master control over agents, tenants, listings & escrow
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onChangeRole('admin');
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-amber-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                Admin Console
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#70798C]" />
                <span className="text-[11px] text-[#70798C]">Platform Administration</span>
              </div>
              <button
                onClick={() => {
                  if (onUpdateProfile) {
                    onUpdateProfile({ ...currentUser, isAdmin: true, isSuperAdmin: true });
                  }
                  onChangeRole('admin');
                  onClose();
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                Access Admin Mode
              </button>
            </div>
          )}

          {/* Collapsible Architecture Guide */}
          <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
              className="w-full p-3.5 text-left bg-[#FCF9F5] flex items-center justify-between font-bold text-xs text-[#000004] hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span>Platform Flow & Architecture Guide</span>
              <ChevronRight className={`w-4 h-4 text-[#70798C] transition-transform ${showArchitectureGuide ? 'rotate-90' : ''}`} />
            </button>

            {showArchitectureGuide && (
              <div className="p-3.5 bg-white space-y-3 border-t border-[#E5E7EB] text-xs">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Zero-Conflict Time Slotting (Max 5/Agent)</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Tenants enjoy unlimited bookings. Agents are capped at 5 bookings per window to prevent overcrowding and ensure agents never waste your time.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Fair First-Come Standby Queue</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">If a slot fills up, applicants queue. Declining automatically advances next-in-line.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Free Inspection Access</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Booking is 100% free with zero fees. Paystack payment checkout is dedicated solely for advert sponsorships.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between gap-2">
          {onSignOut ? (
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <span className="text-[11px] text-[#70798C]">Delta State Marketplace Engine</span>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
