import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Building2,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  LogIn,
  Check,
  Info,
  Download,
  Share2,
  PlusSquare,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { DeltaCity, UserProfile, UserRole } from '../../types/marketplace';
import { StateDropdown } from '../UI/StateDropdown';
import { CustomDropdown } from '../UI/CustomDropdown';
import { DELTA_CITY_OPTIONS } from '../../data/deltaCities';
import { usePWA } from '../../utils/pwa';
import { isLocalUrl } from '../../utils/environment';
import { 
  checkUserExists, 
  findUserByCredential, 
  saveRegisteredUser, 
  DuplicateCheckResult 
} from '../../utils/userRegistry';

export const NIGERIAN_STATES = [
  'Delta State',
  'Lagos State',
  'Abuja (FCT)',
  'Rivers State',
  'Edo State',
  'Anambra State',
  'Enugu State',
  'Ogun State',
  'Oyo State',
  'Akwa Ibom State',
  'Abia State',
  'Imo State',
  'Bayelsa State',
  'Cross River State',
  'Kano State',
  'Kaduna State',
  'Plateau State',
  'Kwara State',
  'Ondo State',
  'Osun State',
  'Ekiti State',
  'Benue State',
  'Kogi State',
  'Nasarawa State',
  'Niger State',
  'Adamawa State',
  'Bauchi State',
  'Borno State',
  'Gombe State',
  'Taraba State',
  'Yobe State',
  'Jigawa State',
  'Katsina State',
  'Kebbi State',
  'Sokoto State',
  'Zamfara State',
  'Ebonyi State'
];



interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile, role?: UserRole) => void;
  onSkip?: () => void;
  initialRole?: 'seeker' | 'agent';
  initialMode?: 'signup' | 'login';
  notice?: { title: string; message: string } | null;
  isAuthenticated?: boolean;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSkip,
  initialRole = 'seeker',
  initialMode = 'signup',
  notice = null,
  isAuthenticated = false,
}) => {
  // Navigation & mode state
  const [activeRoleTab, setActiveRoleTab] = useState<'seeker' | 'agent'>(initialRole);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>(initialMode);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialRole) setActiveRoleTab(initialRole);
      if (initialMode) setAuthMode(initialMode);
      setDuplicateError(null);

      // Ensure all registration fields start blank for new signups
      if (initialMode === 'signup' || !isAuthenticated) {
        setSeekerFullName('');
        setSeekerPhone('');
        setSeekerEmail('');
        setSeekerCity('');
        setSeekerState('Delta State');

        setAgentFullName('');
        setAgencyName('');
        setAgentPhone('');
        setAgentWhatsapp('');
        setAgentEmail('');
        setAgentCitySelection('');
        setAgentCity('');
        setCustomAgentCity('');
        setAgentCac('');
      }
    }
  }, [isOpen, initialRole, initialMode, isAuthenticated]);

  // Seeker / Tenant Form Fields - Start completely blank for new tenants
  const [seekerFullName, setSeekerFullName] = useState('');
  const [seekerPhone, setSeekerPhone] = useState('');
  const [seekerEmail, setSeekerEmail] = useState('');
  const [seekerState, setSeekerState] = useState('Delta State');
  const [seekerCity, setSeekerCity] = useState<string>('');

  // Agent Form Fields - Start completely blank for new agents
  const [agentFullName, setAgentFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agentType, setAgentType] = useState<'agency' | 'individual' | 'landlord'>('agency');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentWhatsapp, setAgentWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [agentEmail, setAgentEmail] = useState('');
  const [agentState, setAgentState] = useState('Delta State');
  const [agentCity, setAgentCity] = useState('');
  const [agentCitySelection, setAgentCitySelection] = useState('');
  const [customAgentCity, setCustomAgentCity] = useState('');
  const [agentCac, setAgentCac] = useState('');

  // Login Form Fields
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginRole, setLoginRole] = useState<'seeker' | 'agent'>('seeker');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });

  // PWA & Post-Signup Onboarding State
  const { isStandalone, isIOS, installApp } = usePWA();
  const [pendingRegistration, setPendingRegistration] = useState<{
    user: UserProfile;
    role: 'seeker' | 'agent';
  } | null>(null);
  const [showPostSignupPrompt, setShowPostSignupPrompt] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'ios_guide'>('idle');

  // Duplicate Account Prevention State
  const [duplicateError, setDuplicateError] = useState<DuplicateCheckResult | null>(null);

  const handleFinishSignup = () => {
    if (pendingRegistration) {
      saveRegisteredUser(pendingRegistration.user);
      onUpdateUser(pendingRegistration.user, pendingRegistration.role);
    }
    setPendingRegistration(null);
    setShowPostSignupPrompt(false);
    setInstallStatus('idle');
    setDuplicateError(null);
    onClose();
  };

  const handleSwitchToLoginWithDuplicate = (dup: DuplicateCheckResult) => {
    setAuthMode('login');
    const prefill = dup.field === 'email'
      ? (activeRoleTab === 'seeker' ? seekerEmail : agentEmail)
      : (activeRoleTab === 'seeker' ? seekerPhone : agentPhone);
    setLoginPhoneOrEmail(prefill);
    if (dup.matchedUser) {
      setLoginRole(dup.matchedUser.isAgent ? 'agent' : 'seeker');
    }
    setDuplicateError(null);
  };

  const handleTriggerInstall = async () => {
    if (isIOS) {
      setInstallStatus('ios_guide');
      return;
    }

    setInstallStatus('installing');
    const outcome = await installApp();

    if (outcome === 'accepted') {
      setInstallStatus('installed');
      setTimeout(() => {
        handleFinishSignup();
      }, 1300);
    } else if (outcome === 'dismissed') {
      setInstallStatus('idle');
    } else {
      // Unavailable (e.g. browser already handled or desktop)
      handleFinishSignup();
    }
  };

  if (!isOpen || isAuthenticated) return null;

  // Handle phone changes to sync WhatsApp if checked
  const handleAgentPhoneChange = (val: string) => {
    setAgentPhone(val);
    if (duplicateError) setDuplicateError(null);
    if (sameAsPhone) {
      setAgentWhatsapp(val);
    }
  };

  const handleToggleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setAgentWhatsapp(agentPhone);
    }
  };

  // Submission for Tenant Signup
  const handleSeekerSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seekerFullName.trim() || !seekerPhone.trim()) return;

    // Strict duplicate check: prevent signing up twice with same phone number or email
    const dupCheck = checkUserExists(seekerPhone, seekerEmail);
    if (dupCheck.exists) {
      setDuplicateError(dupCheck);
      return;
    }
    setDuplicateError(null);

    const resolvedCity = seekerState === 'Delta State'
      ? (seekerCity.trim() || 'Asaba')
      : (seekerCity.trim() || 'Capital City');

    const updated: UserProfile = {
      id: `DT-USR-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: seekerFullName.trim(),
      phone: seekerPhone.trim(),
      email: seekerEmail.trim() || undefined,
      state: seekerState,
      city: resolvedCity,
      preferredPropertyType: 'Bedseater',
      isVerifiedTenant: true,
      isAgent: false,
      savedListingIds: [],
      createdAt: new Date().toISOString(),
    };

    if (isStandalone) {
      // If already installed/standalone, save user and bypass directly
      saveRegisteredUser(updated);
      setSuccessMessage({
        title: `Welcome, ${seekerFullName.trim()}!`,
        subtitle: `Your tenant profile is active for ${seekerState}. Inspection bookings are now unlocked!`,
      });
      setIsSuccess(true);

      setTimeout(() => {
        onUpdateUser(updated, 'seeker');
        setIsSuccess(false);
        onClose();
      }, 1000);
    } else {
      // Trigger post-signup "Welcome & Add App" step!
      setPendingRegistration({ user: updated, role: 'seeker' });
      setShowPostSignupPrompt(true);
    }
  };

  // Submission for Agent Signup
  const handleAgentSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFullName.trim() || !agencyName.trim() || !agentPhone.trim()) return;

    // Strict duplicate check: prevent signing up twice with same phone number or email
    const dupCheck = checkUserExists(agentPhone, agentEmail);
    if (dupCheck.exists) {
      setDuplicateError(dupCheck);
      return;
    }
    setDuplicateError(null);

    const resolvedCity = agentState === 'Delta State'
      ? (agentCitySelection === 'Others' ? (customAgentCity.trim() || 'Others') : (agentCitySelection || agentCity || 'Asaba'))
      : (agentCity.trim() || 'Asaba');

    const finalWhatsapp = sameAsPhone ? agentPhone.trim() : (agentWhatsapp.trim() || agentPhone.trim());

    const updated: UserProfile = {
      id: `DT-AGT-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: agentFullName.trim(),
      agencyName: agencyName.trim(),
      agentType: agentType,
      phone: agentPhone.trim(),
      whatsapp: finalWhatsapp,
      email: agentEmail.trim() || undefined,
      operatingState: agentState,
      operatingCity: resolvedCity,
      state: agentState,
      city: resolvedCity,
      cacNumber: agentCac.trim() || 'VERIFIED-REG',
      isVerifiedTenant: false,
      isAgent: true,
      savedListingIds: [],
      createdAt: new Date().toISOString(),
    };

    if (isStandalone) {
      // If already installed/standalone, save user and bypass directly
      saveRegisteredUser(updated);
      setSuccessMessage({
        title: `Welcome, ${agentFullName.trim()}!`,
        subtitle: `${agencyName.trim()} is now registered. Redirecting to your Agent Listing Portal...`,
      });
      setIsSuccess(true);

      setTimeout(() => {
        onUpdateUser(updated, 'agent');
        setIsSuccess(false);
        onClose();
      }, 1000);
    } else {
      // Trigger post-signup "Welcome & Add App" step!
      setPendingRegistration({ user: updated, role: 'agent' });
      setShowPostSignupPrompt(true);
    }
  };

  // Submission for Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginPhoneOrEmail.trim();
    if (!query) return;

    // Check registry for exact match first
    const registeredMatch = findUserByCredential(query);
    if (registeredMatch) {
      setLoginError(null);
      const isAgent = registeredMatch.isAgent;
      setSuccessMessage({
        title: `Welcome back, ${registeredMatch.fullName}!`,
        subtitle: isAgent
          ? 'Signed in as Agent. Loading your listings and inspection requests...'
          : 'Signed in as Tenant. Your saved inspections and passes are ready!',
      });
      setIsSuccess(true);

      setTimeout(() => {
        onUpdateUser(registeredMatch, isAgent ? 'agent' : 'seeker');
        setIsSuccess(false);
        onClose();
      }, 1000);
      return;
    }

    // On deployed environments, reject unknown credentials so fake accounts are not generated
    if (!isLocalUrl()) {
      setLoginError('No registered account was found with this phone number or email. Please check your credentials or create an account.');
      return;
    }

    // Demo fallback (Local development only)
    const isSystemAdmin =
      query.toLowerCase().includes('admin') ||
      query === 'admin@setlla.com' ||
      query === 'admin@deltarent.ng';

    const isAgentLogin =
      isSystemAdmin ||
      loginRole === 'agent' ||
      query === '0803 555 1234' ||
      query.toLowerCase().includes('agent') ||
      query.toLowerCase().includes('apex') ||
      (currentUser.isAgent && (query === currentUser.phone || query === currentUser.email));

    const updated: UserProfile = isAgentLogin
      ? {
          id: isSystemAdmin ? 'DT-ADMIN-001' : 'DT-AGT-9012',
          fullName: isSystemAdmin ? 'Platform Administrator' : 'Victor Ossai',
          agencyName: isSystemAdmin ? 'Setlla Administration' : 'Apex Real Estate Ltd',
          agentType: 'agency',
          phone: query.includes('@') ? (isSystemAdmin ? '0800 000 0001' : '0803 555 1234') : query,
          whatsapp: isSystemAdmin ? '0800 000 0001' : '0803 555 1234',
          email: query.includes('@') ? query : (isSystemAdmin ? 'admin@setlla.com' : 'victor@apexrealty.ng'),
          operatingState: 'Delta State',
          operatingCity: 'Asaba',
          state: 'Delta State',
          city: 'Asaba',
          cacNumber: 'RC-1849204',
          isVerifiedTenant: false,
          isAgent: !isSystemAdmin,
          isAdmin: isSystemAdmin,
          isSuperAdmin: isSystemAdmin,
          isDemoAdmin: true,
          savedListingIds: [],
        }
      : {
          id: 'DT-USR-8492',
          fullName: 'Chinedu Okafor',
          phone: query.includes('@') ? '0803 891 0293' : query,
          email: query.includes('@') ? query : 'chinedu.okafor@gmail.com',
          state: 'Delta State',
          city: 'Asaba',
          preferredPropertyType: 'Bedseater',
          isVerifiedTenant: true,
          isAgent: false,
          savedListingIds: ['prop-asaba-01'],
        };

    setSuccessMessage({
      title: `Welcome back, ${updated.fullName}!`,
      subtitle: isSystemAdmin
        ? 'Signed in as Super Admin. Opening master control console...'
        : isAgentLogin
        ? 'Signed in as Agent. Loading your listings and inspection requests...'
        : 'Signed in as Tenant. Your saved inspections and passes are ready!',
    });
    setIsSuccess(true);

    setTimeout(() => {
      onUpdateUser(updated, isSystemAdmin ? 'admin' : isAgentLogin ? 'agent' : 'seeker');
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  // Demo Quick-fill helpers for easy testing
  const handleFillDemoTenant = () => {
    setLoginPhoneOrEmail('0803 891 0293');
    setLoginRole('seeker');
  };

  const handleFillDemoAgent = () => {
    setLoginPhoneOrEmail('0803 555 1234');
    setLoginRole('agent');
  };

  const handleFillDemoAdmin = () => {
    setLoginPhoneOrEmail('admin@setlla.com');
    setLoginRole('agent');
  };

  const handleSkipClick = () => {
    if (onSkip) {
      onSkip();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      {showPostSignupPrompt ? (
        /* --- POST-SIGNUP SCREEN CARD LAYOUT --- */
        <div 
          className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[rgba(112,121,140,0.22)] overflow-hidden flex flex-col text-center space-y-6 animate-slide-up relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dismiss button */}
          <button
            onClick={handleFinishSignup}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] hover:text-[#000004] flex items-center justify-center cursor-pointer transition-colors"
            title="Continue to feed"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App icon rounded badge with primary color (#000004) */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#000004] text-white flex items-center justify-center mx-auto shadow-lg shadow-black/25 ring-4 ring-black/10 transition-transform p-3">
            {installStatus === 'installed' ? (
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 animate-bounce" />
            ) : (
              <img src="/images/setlla-logo-white.png" alt="Setlla" className="w-full h-auto object-contain" />
            )}
          </div>

          {/* Heading & Description */}
          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-[26px] font-bold text-[#000004] leading-tight">
              {installStatus === 'installed'
                ? 'Welcome aboard! App Added'
                : 'Welcome aboard! Add to your home screen'}
            </h3>
            <p className="font-body text-xs sm:text-sm text-[#70798C] leading-relaxed max-w-sm mx-auto">
              {installStatus === 'installed'
                ? 'Your registration is complete. Redirecting to your Setlla property feed...'
                : 'Get fast mobile access, instant Agent notifications, and inspection booking updates without downloading any APK.'}
            </p>
          </div>

          {/* Value highlights */}
          {installStatus !== 'installed' && installStatus !== 'ios_guide' && (
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-2.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#342A21]/10 text-[#342A21] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-[#000004]">Instant Agent alerts</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#342A21]/10 text-[#342A21] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-[#000004]">Zero APK downloads</span>
              </div>
            </div>
          )}

          {/* iOS Safari Guide State (if on iOS) */}
          {installStatus === 'ios_guide' && (
            <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[rgba(112,121,140,0.22)] text-left space-y-2.5 animate-fade-in text-xs">
              <p className="font-bold text-[#000004] text-center">To install on iOS Safari:</p>
              <div className="flex items-center gap-2.5 text-[#342A21]">
                <span className="w-6 h-6 rounded-full bg-[#000004] text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-[#342A21] mx-0.5" /> in Safari's bottom bar.</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#342A21]">
                <span className="w-6 h-6 rounded-full bg-[#000004] text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#342A21] mx-0.5" />.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {installStatus !== 'installed' && installStatus !== 'ios_guide' && (
              <button
                type="button"
                onClick={handleTriggerInstall}
                disabled={installStatus === 'installing'}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>{installStatus === 'installing' ? 'Adding to Home Screen...' : 'Add to Home Screen'}</span>
              </button>
            )}

            {installStatus === 'ios_guide' ? (
              <button
                type="button"
                onClick={handleFinishSignup}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Got It, Continue to Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : installStatus !== 'installed' ? (
              <button
                type="button"
                onClick={handleFinishSignup}
                className="w-full py-2.5 px-4 rounded-xl text-[#70798C] hover:text-[#000004] hover:bg-slate-100/70 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue to Feed
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div 
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Notice Alert (When prompted by trying to book an inspection) */}
        {notice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2.5 text-amber-950">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">{notice.title}</p>
              <p className="text-[11px] text-amber-800 leading-tight mt-0.5 truncate sm:whitespace-normal">
                {notice.message}
              </p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#000004] text-white flex items-center justify-center shadow-xs">
              {authMode === 'login' ? (
                <LogIn className="w-5 h-5 text-emerald-400" />
              ) : activeRoleTab === 'seeker' ? (
                <User className="w-5 h-5 text-emerald-400" />
              ) : (
                <Building2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-[#000004]">
                  {authMode === 'login'
                    ? 'Sign In'
                    : activeRoleTab === 'seeker'
                      ? 'Tenant Registration'
                      : 'Agent Registration'}
                </h3>
              </div>
              <p className="text-xs text-[#70798C]">
                {authMode === 'login'
                  ? 'Enter your phone number or email to access your account'
                  : activeRoleTab === 'seeker'
                    ? 'Find, inspect, and secure apartments across Delta State'
                    : 'List rentals and connect with verified tenants across Delta State'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PRIMARY MODE SWITCH: Sign In vs Create Account */}
        <div className="px-5 pt-3 pb-0 flex border-b border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setDuplicateError(null);
            }}
            className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              authMode === 'login'
                ? 'border-[#000004] text-[#000004]'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setDuplicateError(null);
            }}
            className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'border-[#000004] text-[#000004]'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* 2. ROLE SWITCH TABS: Tenant vs Agent (ONLY shown during Create Account) */}
        {authMode === 'signup' && (
          <div className="p-2 sm:px-5 sm:pt-3 sm:pb-2 bg-[#FCF9F5]/60 border-b border-[#E5E7EB]">
            <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('seeker');
                  setDuplicateError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeRoleTab === 'seeker'
                    ? 'bg-white text-[#000004] shadow-xs'
                    : 'text-[#70798C] hover:text-[#000004]'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${activeRoleTab === 'seeker' ? 'text-emerald-600' : ''}`} />
                <span>Tenant</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('agent');
                  setDuplicateError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeRoleTab === 'agent'
                    ? 'bg-white text-[#000004] shadow-xs'
                    : 'text-[#70798C] hover:text-[#000004]'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${activeRoleTab === 'agent' ? 'text-amber-600' : ''}`} />
                <span>Agent</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          {isSuccess ? (
            <div className="py-10 px-4 text-center space-y-3.5 my-auto animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-display text-xl font-bold text-[#000004]">
                {successMessage.title}
              </h4>
              <p className="text-xs text-[#70798C] max-w-sm mx-auto leading-relaxed">
                {successMessage.subtitle}
              </p>
            </div>
          ) : authMode === 'login' ? (
            /* --- SIMPLE, CLEAN SIGN IN FORM --- */
            <form onSubmit={handleLogin} className="space-y-4 py-2 text-xs">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2 animate-fade-in shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-950">{loginError}</p>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setLoginError(null);
                        }}
                        className="font-bold underline text-rose-900 hover:text-rose-700 cursor-pointer"
                      >
                        Create an account now →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1.5">
                  Phone Number or Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#70798C] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="0803 000 0000 or email@domain.com"
                    value={loginPhoneOrEmail}
                    onChange={(e) => {
                      setLoginPhoneOrEmail(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none shadow-xs transition-colors bg-white font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Demo quick sign-in triggers - ONLY visible on local developer environment */}
              {isLocalUrl() && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                  <span className="text-[#70798C] font-medium">Quick Demo Test:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleFillDemoTenant}
                      className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#000004] font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      👤 Tenant
                    </button>
                    <button
                      type="button"
                      onClick={handleFillDemoAgent}
                      className="py-1 px-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      🏢 Agent
                    </button>
                    <button
                      type="button"
                      onClick={handleFillDemoAdmin}
                      className="py-1 px-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      🛡️ Super Admin
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Sign In</span>
                </button>
              </div>

              <div className="text-center pt-1 text-xs text-[#70798C]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="font-bold text-[#000004] hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          ) : activeRoleTab === 'seeker' ? (
            /* --- 1. FIRST-TIME TENANT SIGNUP FORM --- */
            <form onSubmit={handleSeekerSignup} className="space-y-3.5 text-xs">
              {/* Duplicate Account Alert Banner */}
              {duplicateError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 animate-fade-in shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-rose-900 leading-tight">Account Already Exists</h5>
                      <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                        {duplicateError.message} You cannot register twice with the same phone number or email address.
                      </p>
                    </div>
                  </div>
                  <div className="pt-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSwitchToLoginWithDuplicate(duplicateError)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sign In With This Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={seekerFullName}
                    onChange={(e) => setSeekerFullName(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                    duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                      ? 'text-rose-600'
                      : 'text-[#70798C]'
                  }`} />
                  <input
                    type="tel"
                    required
                    placeholder="0803 000 0000"
                    value={seekerPhone}
                    onChange={(e) => {
                      setSeekerPhone(e.target.value);
                      if (duplicateError) setDuplicateError(null);
                    }}
                    className={`w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border text-xs text-[#000004] outline-none transition-all ${
                      duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-[#E5E7EB] focus:border-[#000004]'
                    }`}
                  />
                </div>
                {duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both') && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Phone number already registered. Please sign in instead.</span>
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#000004]">
                    Email Address
                  </label>
                  <span className="text-[10px] text-[#70798C] font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                    duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                      ? 'text-rose-600'
                      : 'text-[#70798C]'
                  }`} />
                  <input
                    type="email"
                    placeholder="name@email.com (optional)"
                    value={seekerEmail}
                    onChange={(e) => {
                      setSeekerEmail(e.target.value);
                      if (duplicateError) setDuplicateError(null);
                    }}
                    className={`w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border text-xs text-[#000004] outline-none transition-all ${
                      duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-[#E5E7EB] focus:border-[#000004]'
                    }`}
                  />
                </div>
                {duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both') && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Email address already registered. Please sign in instead.</span>
                  </p>
                )}
              </div>

              {/* Choose State looking for apartment with custom dropdown & greyed out states */}
              <div>
                <StateDropdown
                  value={seekerState}
                  onChange={(val) => setSeekerState(val)}
                  label="Choose State Looking For Apartment"
                  required
                />
              </div>

              {/* If Delta State selected, provide city option */}
              {seekerState === 'Delta State' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#70798C] mb-1 flex items-center justify-between">
                    <span>Preferred City in Delta State</span>
                    {seekerCity ? (
                      <span className="text-[10px] text-[#342A21] font-semibold">{seekerCity}, Delta</span>
                    ) : null}
                  </label>
                  <CustomDropdown
                    options={DELTA_CITY_OPTIONS}
                    value={seekerCity}
                    onChange={(c) => setSeekerCity(c)}
                    headerTitle="Delta State Cities & Towns"
                    placeholder="Select City / Town"
                    icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
                    variant="form"
                    allowCustomInput={true}
                  />
                </div>
              )}

              {/* Quick Info Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-[11px] text-[#70798C]">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Signing up unlocks instant booking for verified inspection slots. No inspection fees are charged until your booking is officially accepted.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <span>Complete Signup & Unlock Inspections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-1 text-xs text-[#70798C]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-bold text-[#000004] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* --- 2. AGENT / LANDLORD SIGNUP FORM --- */
            <form onSubmit={handleAgentSignup} className="space-y-3.5 text-xs">
              {/* Duplicate Account Alert Banner */}
              {duplicateError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 animate-fade-in shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-rose-900 leading-tight">Account Already Exists</h5>
                      <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                        {duplicateError.message} You cannot register twice with the same phone number or email address.
                      </p>
                    </div>
                  </div>
                  <div className="pt-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSwitchToLoginWithDuplicate(duplicateError)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sign In With This Account</span>
                    </button>
                  </div>
                </div>
              )}
              {/* Account Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Agent / Listing Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAgentType('agency')}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      agentType === 'agency'
                        ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                        : 'bg-white text-[#70798C] border-[#E5E7EB] hover:text-[#000004]'
                    }`}
                  >
                    Agency / Firm
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentType('individual')}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      agentType === 'individual'
                        ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                        : 'bg-white text-[#70798C] border-[#E5E7EB] hover:text-[#000004]'
                    }`}
                  >
                    Realtor / Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentType('landlord')}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      agentType === 'landlord'
                        ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                        : 'bg-white text-[#70798C] border-[#E5E7EB] hover:text-[#000004]'
                    }`}
                  >
                    Direct Landlord
                  </button>
                </div>
              </div>

              {/* Full Name & Agency Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#000004] mb-1">
                    Agent Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Victor Ossai"
                      value={agentFullName}
                      onChange={(e) => setAgentFullName(e.target.value)}
                      className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#000004] mb-1">
                    Agency / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Real Estate Ltd"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Phone & WhatsApp */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#000004] mb-1">
                      Direct Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                        duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                          ? 'text-rose-600'
                          : 'text-[#70798C]'
                      }`} />
                      <input
                        type="tel"
                        required
                        placeholder="0803 123 4567"
                        value={agentPhone}
                        onChange={(e) => handleAgentPhoneChange(e.target.value)}
                        className={`w-full pl-9.5 pr-3 py-2 rounded-xl border text-xs text-[#000004] outline-none transition-all ${
                          duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                            ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                            : 'border-[#E5E7EB] focus:border-[#000004]'
                        }`}
                      />
                    </div>
                    {duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both') && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Phone number already registered. Please sign in instead.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#000004]">
                        WhatsApp Number
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsPhone}
                          onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                          className="w-3 h-3 rounded accent-[#000004]"
                        />
                        <span className="text-[10px] text-[#70798C] font-semibold">
                          Same as phone
                        </span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      disabled={sameAsPhone}
                      placeholder={sameAsPhone ? (agentPhone || 'Synced with phone') : '0803 000 0000'}
                      value={sameAsPhone ? agentPhone : agentWhatsapp}
                      onChange={(e) => setAgentWhatsapp(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] outline-none ${
                        sameAsPhone ? 'bg-slate-50 text-[#70798C]' : 'bg-white focus:border-[#000004]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Operating State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <StateDropdown
                    value={agentState}
                    onChange={(val) => setAgentState(val)}
                    label="Operating State"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#000004]">
                      Operating City / Towns <span className="text-rose-500">*</span>
                    </label>
                    {agentState === 'Delta State' && agentCitySelection && agentCitySelection !== 'Others' && (
                      <span className="text-[10px] text-[#70798C] font-semibold">
                        {agentCitySelection}, Delta
                      </span>
                    )}
                  </div>
                  {agentState === 'Delta State' ? (
                    <div className="space-y-2">
                      <CustomDropdown
                        options={[
                          ...DELTA_CITY_OPTIONS.filter((opt) => opt.value !== 'Others'),
                          {
                            value: 'Others',
                            label: 'Others (Enter City Manually)',
                            subtitle: 'If your town or community is not listed above',
                            badge: 'Manual Entry',
                          },
                        ]}
                        value={agentCitySelection}
                        onChange={(val) => {
                          setAgentCitySelection(val);
                          if (val !== 'Others') {
                            setAgentCity(val);
                          } else {
                            setAgentCity(customAgentCity || '');
                          }
                        }}
                        headerTitle="Delta State Cities & Towns"
                        placeholder="Select City / Town"
                        icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
                        variant="form"
                        allowCustomInput={true}
                      />
                      {agentCitySelection === 'Others' && (
                        <div className="animate-fade-in">
                          <label className="block text-[10px] font-bold text-[#70798C] mb-1">
                            Enter Your City / Town Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Effurun, Oghara, Jesse, Kwale"
                            value={customAgentCity}
                            onChange={(e) => {
                              setCustomAgentCity(e.target.value);
                              setAgentCity(e.target.value);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none bg-amber-50/20 focus:bg-white"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ikeja, Benin City, Port Harcourt"
                      value={agentCity}
                      onChange={(e) => setAgentCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Optional Email & CAC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#000004]">
                      Email Address
                    </label>
                    <span className="text-[10px] text-[#70798C] font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                      Optional
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="agency@domain.com"
                    value={agentEmail}
                    onChange={(e) => {
                      setAgentEmail(e.target.value);
                      if (duplicateError) setDuplicateError(null);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-[#000004] outline-none transition-all ${
                      duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-[#E5E7EB] focus:border-[#000004]'
                    }`}
                  />
                  {duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both') && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Email address already registered. Please sign in instead.</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#000004]">
                      CAC / License No.
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                      Verified Badge
                    </span>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. RC-182903 or Reg No."
                      value={agentCac}
                      onChange={(e) => setAgentCac(e.target.value)}
                      className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-950">
                <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  As an Agent, you will receive real-time inspection requests from pre-screened tenants directly in your Agent Portal.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Register as Agent & Open Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-1 text-xs text-[#70798C]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-bold text-[#000004] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* 4. FOOTER: Skip for Now CTA */}
        <div className="px-5 py-3 bg-[#FCF9F5] border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[11px] text-[#70798C] text-center sm:text-left">
            Just browsing? You can explore the live video feed without an account.
          </p>
          <button
            type="button"
            onClick={handleSkipClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#000004] border border-[#E5E7EB] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <span>Skip for now & explore feed</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#342A21]" />
          </button>
        </div>
      </div>
    )}
    </div>
  );
};
