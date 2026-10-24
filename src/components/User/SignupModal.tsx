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
  Lock,
  FileText,
  CalendarCheck,
  LogIn,
  Check,
  Info,
  Download,
  Share2,
  PlusSquare,
  AlertCircle,
  AlertTriangle,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DeltaCity, UserProfile, UserRole } from '../../types/marketplace';
import { StateDropdown } from '../UI/StateDropdown';
import { CustomDropdown } from '../UI/CustomDropdown';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { DELTA_CITY_OPTIONS } from '../../data/deltaCities';
import { usePWA } from '../../utils/pwa';
import { isLocalUrl } from '../../utils/environment';
import { 
  checkUserExists, 
  checkUserExistsAsync,
  findUserByCredential, 
  findUserByCredentialAsync,
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
        setShowOptionalTenantFields(false);
        setShowOptionalAgentFields(false);
      }
    }
  }, [isOpen, initialRole, initialMode, isAuthenticated]);

  // Collapsible optional sections for mobile simplification
  const [showOptionalTenantFields, setShowOptionalTenantFields] = useState(false);
  const [showOptionalAgentFields, setShowOptionalAgentFields] = useState(false);

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  const handleSeekerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seekerFullName.trim() || !seekerPhone.trim()) return;

    // Strict duplicate check: prevent signing up twice with same phone number or email across local & shared DB
    const localDupCheck = checkUserExists(seekerPhone, seekerEmail);
    if (localDupCheck.exists) {
      setDuplicateError(localDupCheck);
      return;
    }
    const dupCheck = await checkUserExistsAsync(seekerPhone, seekerEmail);
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

    // Save immediately to local storage AND Supabase platform_users database
    saveRegisteredUser(updated);

    if (isStandalone) {
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
  const handleAgentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFullName.trim() || !agencyName.trim() || !agentPhone.trim()) return;

    // Strict duplicate check: prevent signing up twice with same phone number or email across local & shared DB
    const localDupCheck = checkUserExists(agentPhone, agentEmail);
    if (localDupCheck.exists) {
      setDuplicateError(localDupCheck);
      return;
    }
    const dupCheck = await checkUserExistsAsync(agentPhone, agentEmail);
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

    // Save immediately to local storage AND Supabase platform_users database
    saveRegisteredUser(updated);

    if (isStandalone) {
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginPhoneOrEmail.trim();
    if (!query) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // 1. Check local registry first for fast response
      let registeredMatch = findUserByCredential(query);

      // 2. If not found in local cache, query central Supabase platform_users database across mobile & desktop!
      if (!registeredMatch) {
        registeredMatch = await findUserByCredentialAsync(query);
      }

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
          onUpdateUser(registeredMatch!, isAgent ? 'agent' : 'seeker');
          setIsSuccess(false);
          setIsLoggingIn(false);
          onClose();
        }, 1000);
        return;
      }

      // On deployed environments, reject unknown credentials so fake accounts are not generated
      if (!isLocalUrl()) {
        setLoginError('No registered account was found with this phone number or email. Please check your credentials or create an account.');
        setIsLoggingIn(false);
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
            isDemoAdmin: false,
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
        setIsLoggingIn(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.warn('[SignupModal] Login error:', err);
      setLoginError('An unexpected error occurred while verifying your account. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
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

  const isTenantOptionalOpen = showOptionalTenantFields || Boolean(seekerEmail);
  const isAgentOptionalOpen = showOptionalAgentFields || Boolean(agentEmail) || Boolean(agentCac);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto animate-fade-in">
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
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#F95700] hover:bg-[#E65100] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>{installStatus === 'installing' ? 'Adding to Home Screen...' : 'Add to Home Screen'}</span>
              </button>
            )}

            {installStatus === 'ios_guide' ? (
              <button
                type="button"
                onClick={handleFinishSignup}
                className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#F95700] hover:bg-[#E65100] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
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
          className="w-full max-w-4xl bg-white rounded-[24px] sm:rounded-[28px] md:rounded-[32px] shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col md:flex-row my-auto max-h-[min(94dvh,780px)] animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* LEFT COLUMN: Visual Brand Banner with Warm Vertical Glows (Desktop & Tablet) */}
          <div className="hidden md:flex flex-col justify-between w-72 lg:w-84 bg-[#000004] text-white p-6 lg:p-7 relative overflow-hidden shrink-0">
            {/* Warm vertical gradient beams strictly using Setlla palette tokens */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#E65100]/45 via-[#F95700]/15 to-transparent pointer-events-none" />
            <div className="absolute -bottom-12 left-4 right-4 h-56 bg-gradient-to-t from-[#F95700]/40 via-[#E65100]/25 to-transparent blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-6 w-14 h-48 bg-gradient-to-t from-[#F95700]/30 via-[#342A21]/30 to-transparent blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-24 w-16 h-60 bg-gradient-to-t from-[#E65100]/35 via-[#F95700]/20 to-transparent blur-xl pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-14 h-44 bg-gradient-to-t from-[#F95700]/25 via-[#342A21]/30 to-transparent blur-xl pointer-events-none" />

            {/* Top Headline Section */}
            <div className="relative z-10 space-y-3">
              <h2 className="font-display text-xl lg:text-2xl font-extrabold text-white leading-tight tracking-tight">
                {authMode === 'signup' && activeRoleTab === 'agent'
                  ? 'List verified rentals and close deals faster.'
                  : 'Find, inspect, and secure verified apartments.'}
              </h2>

              <p className="text-xs text-white/70 leading-relaxed">
                {authMode === 'signup' && activeRoleTab === 'agent'
                  ? 'Direct connection with serious pre-screened tenants. Manage inspection slots and close leases with zero hassle.'
                  : 'Direct access to video-verified apartments, scam-free inspections, and secure booking passes.'}
              </p>
            </div>

            {/* Bottom Trust Hallmark */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
              <span>Setlla • Verified Homes</span>
              <span>Nigeria</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Authentication Form (Responsive & Streamlined for Mobile) */}
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-7 lg:p-8 bg-white overflow-y-auto max-h-[min(94dvh,780px)] no-scrollbar">
            <div>
              {/* Notice Banner (If triggered by attempting to book inspection) */}
              {notice && (
                <div className="mb-2.5 sm:mb-3 bg-[#342A21]/5 border border-[#342A21]/15 rounded-xl sm:rounded-2xl px-3 py-2 flex items-center gap-2 text-[#342A21]">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#342A21]/10 text-[#F95700] flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-bold leading-tight">{notice.title}</p>
                    <p className="text-[10px] sm:text-[11px] text-amber-800 leading-tight mt-0.5 truncate sm:whitespace-normal">
                      {notice.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Header Bar: Brand Logo & Close Button */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
                <div className="flex items-center gap-2">
                  <img 
                    src="/images/setlla-logo.png" 
                    alt="Setlla" 
                    className="h-6 sm:h-7 w-auto object-contain" 
                  />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] hover:text-[#000004] flex items-center justify-center cursor-pointer transition-colors"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Unified 3-Way Segmented Switcher (Consolidated 1-Row Navigation) */}
              <div className="p-1 bg-[#F4F5F7] rounded-xl grid grid-cols-3 gap-1 mb-2.5 sm:mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setActiveRoleTab('seeker');
                    setDuplicateError(null);
                  }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    authMode === 'signup' && activeRoleTab === 'seeker'
                      ? 'bg-white text-[#000004] shadow-xs'
                      : 'text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${authMode === 'signup' && activeRoleTab === 'seeker' ? 'text-[#F95700]' : ''}`} />
                  <span>Tenant</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setActiveRoleTab('agent');
                    setDuplicateError(null);
                  }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    authMode === 'signup' && activeRoleTab === 'agent'
                      ? 'bg-white text-[#000004] shadow-xs'
                      : 'text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${authMode === 'signup' && activeRoleTab === 'agent' ? 'text-[#F95700]' : ''}`} />
                  <span>Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setDuplicateError(null);
                  }}
                  className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-[#000004] shadow-xs'
                      : 'text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  <LogIn className={`w-3.5 h-3.5 ${authMode === 'login' ? 'text-[#F95700]' : ''}`} />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Single Clear Headline & Subtitle */}
              <div className="mb-2.5 sm:mb-3">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#000004] tracking-tight">
                  {authMode === 'login'
                    ? 'Welcome back'
                    : activeRoleTab === 'seeker'
                      ? 'Create Tenant Account'
                      : 'Agent Partner Registration'}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#70798C] mt-0.5">
                  {authMode === 'login'
                    ? 'Sign in to access your bookings, passes, and account.'
                    : activeRoleTab === 'seeker'
                      ? 'Direct access to verified homes & scam-free inspections.'
                      : 'List verified rentals and connect directly with tenants.'}
                </p>
              </div>

              {/* Content Area */}
              <div>
                {isSuccess ? (
                  <div className="py-8 sm:py-10 px-4 text-center space-y-3.5 my-auto animate-fade-in">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                      <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h4 className="font-display text-lg sm:text-xl font-bold text-[#000004]">
                      {successMessage.title}
                    </h4>
                    <p className="text-xs text-[#70798C] max-w-sm mx-auto leading-relaxed">
                      {successMessage.subtitle}
                    </p>
                  </div>
                ) : authMode === 'login' ? (
                  /* --- 1. SIGN IN FORM --- */
                  <form onSubmit={handleLogin} className="space-y-3 py-1 text-xs">
                    {loginError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] flex items-start gap-2 animate-fade-in shadow-2xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-[#000004]">{loginError}</p>
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthMode('signup');
                                setActiveRoleTab('seeker');
                                setLoginError(null);
                              }}
                              className="font-bold underline text-[#F0544F] hover:text-[#000004] cursor-pointer"
                            >
                              Create an account now →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#70798C] mb-1">
                        Phone number or email <span className="text-[#F0544F]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                          className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : activeRoleTab === 'seeker' ? (
                  /* --- 2. TENANT SIGNUP FORM --- */
                  <form onSubmit={handleSeekerSignup} className="space-y-2.5 sm:space-y-3 text-xs">
                    {/* Duplicate Account Alert Banner */}
                    {duplicateError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#000004] space-y-1.5 animate-fade-in shadow-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FEECEB] text-[#F0544F] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-[#000004] leading-tight">Account Already Exists</h5>
                            <p className="text-[11px] text-[#70798C] leading-relaxed mt-0.5">
                              {duplicateError.message} You cannot register twice with the same phone number or email address.
                            </p>
                          </div>
                        </div>
                        <div className="pt-0.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSwitchToLoginWithDuplicate(duplicateError)}
                            className="px-3 py-1 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                          >
                            <LogIn className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Sign In With This Account</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full Name & Phone Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#70798C] mb-1">
                          Full Name <span className="text-[#F0544F]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Chinedu Okafor"
                            value={seekerFullName}
                            onChange={(e) => setSeekerFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#70798C] mb-1">
                          Phone Number <span className="text-[#F0544F]">*</span>
                        </label>
                        <div className="relative">
                          <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                            duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                              ? 'text-[#F0544F]'
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
                            className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all ${
                              duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                                ? 'border-[#F0544F] ring-2 ring-[#F0544F]/20 bg-[#FEECEB]/30'
                                : 'border-[#E5E7EB]'
                            }`}
                          />
                        </div>
                        {duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both') && (
                          <p className="text-[10px] sm:text-[11px] font-semibold text-[#F0544F] mt-1 flex items-center gap-1 animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Phone already registered.</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* State & Preferred City (Both Compulsory - NEVER Hidden) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div>
                        <StateDropdown
                          value={seekerState}
                          onChange={(val) => {
                            setSeekerState(val);
                            if (val !== 'Delta State' && seekerCity === 'Asaba') {
                              setSeekerCity('');
                            }
                          }}
                          label="Choose State"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-[#70798C]">
                            {seekerState === 'Delta State' ? 'Preferred City' : 'Preferred City / Town'} <span className="text-[#F0544F]">*</span>
                          </label>
                          {seekerCity && (
                            <span className="text-[10px] text-[#342A21] font-semibold bg-[#342A21]/5 px-1.5 py-0.5 rounded">
                              {seekerCity}
                            </span>
                          )}
                        </div>
                        {seekerState === 'Delta State' ? (
                          <CustomDropdown
                            options={DELTA_CITY_OPTIONS}
                            value={seekerCity}
                            onChange={(c) => setSeekerCity(c)}
                            headerTitle="Cities & Towns"
                            placeholder="Select City (e.g. Asaba, Warri, Ughelli)"
                            icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
                            variant="form"
                            allowCustomInput={true}
                          />
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder={`e.g. City in ${seekerState}`}
                            value={seekerCity}
                            onChange={(e) => setSeekerCity(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                          />
                        )}
                      </div>
                    </div>

                    {/* Email Address (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#70798C]">
                          Email Address
                        </label>
                        <span className="text-[10px] text-[#70798C] font-normal">(Optional)</span>
                      </div>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                          duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                            ? 'text-[#F0544F]'
                            : 'text-[#70798C]'
                        }`} />
                        <input
                          type="email"
                          placeholder="name@email.com"
                          value={seekerEmail}
                          onChange={(e) => {
                            setSeekerEmail(e.target.value);
                            if (duplicateError) setDuplicateError(null);
                          }}
                          className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all ${
                            duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                              ? 'border-[#F0544F] ring-2 ring-[#F0544F]/20 bg-[#FEECEB]/30'
                              : 'border-[#E5E7EB]'
                          }`}
                        />
                      </div>
                      {duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both') && (
                        <p className="text-[10px] sm:text-[11px] font-semibold text-[#F0544F] mt-1 flex items-center gap-1 animate-fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Email already registered.</span>
                        </p>
                      )}
                    </div>

                    {/* Quick 1-line Info Notice */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E5E7EB] flex items-center gap-2 text-[11px] text-[#70798C]">
                      <Info className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span>Zero inspection fees are charged until booking acceptance.</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <span>Create Tenant Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* --- 3. AGENT SIGNUP FORM --- */
                  <form onSubmit={handleAgentSignup} className="space-y-2.5 sm:space-y-3 text-xs">
                    {/* Duplicate Account Alert Banner */}
                    {duplicateError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#000004] space-y-1.5 animate-fade-in shadow-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FEECEB] text-[#F0544F] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-[#000004] leading-tight">Account Already Exists</h5>
                            <p className="text-[11px] text-[#70798C] leading-relaxed mt-0.5">
                              {duplicateError.message} You cannot register twice with the same phone number or email address.
                            </p>
                          </div>
                        </div>
                        <div className="pt-0.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSwitchToLoginWithDuplicate(duplicateError)}
                            className="px-3 py-1 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                          >
                            <LogIn className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Sign In With This Account</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Account Type Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#70798C] mb-1">
                        Listing Category <span className="text-[#F0544F]">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAgentType('agency')}
                          className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer truncate ${
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
                          className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer truncate ${
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
                          className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer truncate ${
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#70798C] mb-1">
                          Agent Full Name <span className="text-[#F0544F]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Victor Ossai"
                            value={agentFullName}
                            onChange={(e) => setAgentFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#70798C] mb-1">
                          Agency / Business Name <span className="text-[#F0544F]">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apex Real Estate Ltd"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Direct Phone & WhatsApp Toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#70798C]">
                          Direct Phone Number <span className="text-[#F0544F]">*</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-[#70798C] hover:text-[#000004]">
                          <input
                            type="checkbox"
                            checked={sameAsPhone}
                            onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-[#F95700]"
                          />
                          <span>WhatsApp is same</span>
                        </label>
                      </div>
                      <div className="relative">
                        <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                          duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                            ? 'text-[#F0544F]'
                            : 'text-[#70798C]'
                        }`} />
                        <input
                          type="tel"
                          required
                          placeholder="0803 123 4567"
                          value={agentPhone}
                          onChange={(e) => handleAgentPhoneChange(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all ${
                            duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both')
                              ? 'border-[#F0544F] ring-2 ring-[#F0544F]/20 bg-[#FEECEB]/30'
                              : 'border-[#E5E7EB]'
                          }`}
                        />
                      </div>
                      {duplicateError && (duplicateError.field === 'phone' || duplicateError.field === 'both') && (
                        <p className="text-[10px] sm:text-[11px] font-semibold text-[#F0544F] mt-1 flex items-center gap-1 animate-fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Phone already registered.</span>
                        </p>
                      )}

                      {/* Display separate WhatsApp input ONLY when unchecked */}
                      {!sameAsPhone && (
                        <div className="mt-2 animate-fade-in">
                          <label className="block text-[11px] font-semibold text-[#70798C] mb-1">
                            WhatsApp Number <span className="text-[#F0544F]">*</span>
                          </label>
                          <div className="relative">
                            <WhatsAppIcon className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="tel"
                              required={!sameAsPhone}
                              placeholder="0803 000 0000"
                              value={agentWhatsapp}
                              onChange={(e) => setAgentWhatsapp(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operating State & City (Both Compulsory - NEVER Hidden) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div>
                        <StateDropdown
                          value={agentState}
                          onChange={(val) => {
                            setAgentState(val);
                            if (val !== 'Delta State') {
                              setAgentCitySelection('');
                              setAgentCity('');
                            }
                          }}
                          label="Operating State"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-[#70798C]">
                            {agentState === 'Delta State' ? 'Operating City' : 'Operating City / Town'} <span className="text-[#F0544F]">*</span>
                          </label>
                          {agentCitySelection && agentCitySelection !== 'Others' && (
                            <span className="text-[10px] text-[#70798C] font-semibold">
                              {agentCitySelection}
                            </span>
                          )}
                        </div>
                        {agentState === 'Delta State' ? (
                          <div className="space-y-1.5">
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
                              headerTitle="Cities & Towns"
                              placeholder="Select Operating City (e.g. Asaba, Warri)"
                              icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
                              variant="form"
                              allowCustomInput={true}
                            />
                            {agentCitySelection === 'Others' && (
                              <div className="animate-fade-in">
                                <input
                                  type="text"
                                  required
                                  placeholder="Enter town or community name"
                                  value={customAgentCity}
                                  onChange={(e) => {
                                    setCustomAgentCity(e.target.value);
                                    setAgentCity(e.target.value);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#F95700] text-xs sm:text-sm text-[#000004] outline-none bg-[#F95700]/5 focus:bg-white"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder={`e.g. City in ${agentState}`}
                            value={agentCity}
                            onChange={(e) => setAgentCity(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#F95700] text-xs sm:text-sm text-[#000004] outline-none bg-[#F9FAFB] focus:bg-white"
                          />
                        )}
                      </div>
                    </div>

                    {/* Optional CAC & Email Section (Only Truly Optional Details) */}
                    <div className="pt-0.5">
                      {!isAgentOptionalOpen ? (
                        <button
                          type="button"
                          onClick={() => setShowOptionalAgentFields(true)}
                          className="text-xs font-semibold text-[#F95700] hover:text-[#E65100] inline-flex items-center gap-1 cursor-pointer py-1"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Add CAC / Reg No. & Email (Optional)</span>
                        </button>
                      ) : (
                        <div className="space-y-2 p-2.5 sm:p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#000004]">Business Verification (Optional)</span>
                            <button
                              type="button"
                              onClick={() => setShowOptionalAgentFields(false)}
                              className="text-[11px] text-[#70798C] hover:text-[#000004] inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                              <span>Hide</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-[#70798C]">
                                  CAC / License No.
                                </label>
                                <span className="text-[10px] text-[#342A21] bg-[#342A21]/5 px-1 py-0.5 rounded font-semibold">
                                  Badge
                                </span>
                              </div>
                              <div className="relative">
                                <FileText className="w-4 h-4 text-[#F95700] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="e.g. RC-182903"
                                  value={agentCac}
                                  onChange={(e) => setAgentCac(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#70798C] mb-1">
                                Email Address
                              </label>
                              <div className="relative">
                                <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                                  duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                                    ? 'text-[#F0544F]'
                                    : 'text-[#70798C]'
                                }`} />
                                <input
                                  type="email"
                                  placeholder="agency@domain.com"
                                  value={agentEmail}
                                  onChange={(e) => {
                                    setAgentEmail(e.target.value);
                                    if (duplicateError) setDuplicateError(null);
                                  }}
                                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs sm:text-sm text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all ${
                                    duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                                      ? 'border-[#F0544F] ring-2 ring-[#F0544F]/20'
                                      : 'border-[#E5E7EB]'
                                  }`}
                                />
                              </div>
                              {duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both') && (
                                <p className="text-[10px] sm:text-[11px] font-semibold text-[#F0544F] mt-1 flex items-center gap-1 animate-fade-in">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Email already registered.</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Register as Agent</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Bottom Footer Switcher */}
            <div className="pt-3 border-t border-[#E5E7EB] text-center text-xs text-[#70798C] mt-3 space-y-1">
              {authMode === 'login' ? (
                <p>
                  No account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setActiveRoleTab('seeker');
                      setLoginError(null);
                    }}
                    className="font-bold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setDuplicateError(null);
                    }}
                    className="font-bold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </p>
              )}

              <p className="text-[11px] text-[#70798C]/80">
                Just browsing?{' '}
                <button
                  type="button"
                  onClick={handleSkipClick}
                  className="font-medium hover:text-[#000004] hover:underline cursor-pointer"
                >
                  Explore live feed →
                </button>
              </p>
            </div>
          </div>
        </div>
    )}
    </div>
  );
};
