import React, { useState, useEffect, useRef } from 'react';
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
  ChevronUp,
  Briefcase,
  Home,
  Key,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Clipboard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DeltaCity, UserProfile, UserRole } from '../../types/marketplace';
import { UserPersona } from '../../types/jobs';
import { StateDropdown } from '../UI/StateDropdown';
import { CustomDropdown } from '../UI/CustomDropdown';
import { ModalPortal } from '../UI/ModalPortal';
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
  saveRegisteredUserAsync,
  normalizeEmail,
  DuplicateCheckResult 
} from '../../utils/userRegistry';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import { 
  sendEmailOTP, 
  verifyEmailOTP, 
  resetUserPassword,
  EmailOTPPurpose
} from '../../services/emailVerificationService';
import { isElvisSuperAdmin } from '../../services/adminAuthService';

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

export const SIGNUP_DELTA_CITIES: string[] = [
  'Asaba',
  'Warri',
  'Effurun',
  'Ughelli',
  'Sapele',
  'Abraka',
  'Agbor',
  'Ogwashi-Uku',
  'Kwale',
  'Ozoro',
  'Oghara',
  'Udu',
  'Ibusa',
  'Okpanam',
  'Issele-Uku',
  'Ekpan',
  'Osubi',
  'Aladja',
  'Patani',
  'Bomadi',
  'Koko',
  'Burutu',
  'Others'
];

const SIGNUP_DELTA_CITY_OPTIONS = SIGNUP_DELTA_CITIES.map((city) => ({
  value: city,
  label: city === 'Others' ? 'Others (Enter City Manually)' : city,
}));

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile, role?: UserRole, targetRoom?: 'rentals' | 'jobs') => void;
  onSkip?: () => void;
  initialRole?: 'seeker' | 'agent';
  initialMode?: 'signup' | 'login';
  initialPersona?: UserPersona;
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
  initialPersona,
}) => {
  // Navigation & mode state
  const [activeRoleTab, setActiveRoleTab] = useState<'seeker' | 'agent'>(initialRole);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'verify_email' | 'forgot_password' | 'reset_password'>(initialMode);
  const [signupStep, setSignupStep] = useState<'persona' | 'form'>(initialMode === 'login' ? 'form' : 'persona');
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(initialPersona || (initialRole === 'agent' ? 'lister' : 'job_seeker'));

  // Email OTP Verification State (Agents, Employers, Password Recovery)
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const [otpPurpose, setOtpPurpose] = useState<EmailOTPPurpose>('agent_signup');
  const [otpPendingUser, setOtpPendingUser] = useState<UserProfile | null>(null);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Forgot Password State
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpResendSeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendSeconds]);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialRole) setActiveRoleTab(initialRole);
      if (initialMode) {
        setAuthMode(initialMode);
        setSignupStep(initialMode === 'login' ? 'form' : 'persona');
      }
      if (initialPersona) {
        setSelectedPersona(initialPersona);
      } else if (initialRole === 'agent') {
        setSelectedPersona('lister');
      }
      setFormStep(1);
      setDuplicateError(null);
      setSignupError(null);

      // Ensure all registration fields start blank for new signups
      if (initialMode === 'signup' || !isAuthenticated) {
        setSeekerFullName('');
        setSeekerPhone('');
        setSeekerEmail('');
        setSeekerPassword('');
        setShowSeekerPassword(false);
        setSeekerCity('');
        setSeekerState('Delta State');

        setAgentFullName('');
        setAgencyName('');
        setAgentPhone('');
        setAgentWhatsapp('');
        setAgentEmail('');
        setAgentPassword('');
        setShowAgentPassword(false);
        setAgentCitySelection('');
        setAgentCity('');
        setCustomAgentCity('');
        setAgentCac('');
        setShowOptionalTenantFields(false);
        setShowOptionalAgentFields(false);
        setLoginPassword('');
        setShowLoginPassword(false);
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
  const [seekerPassword, setSeekerPassword] = useState('');
  const [showSeekerPassword, setShowSeekerPassword] = useState(false);
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
  const [agentPassword, setAgentPassword] = useState('');
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [agentState, setAgentState] = useState('Delta State');
  const [agentCity, setAgentCity] = useState('');
  const [agentCitySelection, setAgentCitySelection] = useState('');
  const [customAgentCity, setCustomAgentCity] = useState('');
  const [agentCac, setAgentCac] = useState('');

  // Login Form Fields
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<'seeker' | 'agent'>('seeker');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmittingAgent, setIsSubmittingAgent] = useState(false);
  const [isSubmittingSeeker, setIsSubmittingSeeker] = useState(false);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });

  // PWA & Post-Signup Onboarding State
  const { isStandalone, isInstalled, isIOS, installApp } = usePWA();
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
      saveRegisteredUser(pendingRegistration.user, { allowReRegistration: true });
      const targetRoom: 'rentals' | 'jobs' = 
        (pendingRegistration.user.persona === 'job_seeker' || pendingRegistration.user.persona === 'employer')
          ? 'jobs'
          : 'rentals';
      onUpdateUser(pendingRegistration.user, pendingRegistration.role, targetRoom);
    }
    setPendingRegistration(null);
    setShowPostSignupPrompt(false);
    setInstallStatus('idle');
    setDuplicateError(null);
    onClose();
  };

  const handleSwitchToLoginWithDuplicate = (dup: DuplicateCheckResult) => {
    setAuthMode('login');
    setSignupError(null);
    setLoginError(null);
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

  if (!isOpen || (isAuthenticated && authMode !== 'verify_email' && !isSuccess && !showPostSignupPrompt)) return null;

  // Handle phone changes to sync WhatsApp if checked
  const handleAgentPhoneChange = (val: string) => {
    setAgentPhone(val);
    if (duplicateError) setDuplicateError(null);
    if (signupError) setSignupError(null);
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

  // Step 1 -> Step 2 validation for Tenant / Seeker
  const handleSeekerNextStep = () => {
    setSignupError(null);
    setDuplicateError(null);

    if (!seekerFullName.trim()) {
      setSignupError('Please enter your full name to proceed.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!seekerState.trim()) {
      setSignupError('Please select your state.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const resolvedCity = seekerCity.trim();
    if (!resolvedCity) {
      setSignupError(seekerState === 'Delta State' ? 'Please select or enter your preferred city in Delta State.' : 'Please enter your preferred city or town.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormStep(2);
    formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submission for Tenant / Job Seeker Signup
  const handleSeekerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep === 1) {
      handleSeekerNextStep();
      return;
    }
    setSignupError(null);
    setDuplicateError(null);

    if (!seekerFullName.trim() || !seekerPhone.trim()) {
      setSignupError('Please enter your full name and phone number.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Compulsory email and password for all accounts (tenants, job seekers, and employers)
    if (!seekerEmail.trim()) {
      setSignupError('Please enter your email address to continue.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!seekerPassword.trim() || seekerPassword.trim().length < 6) {
      setSignupError('Please create a secure password (minimum 6 characters).');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmittingSeeker(true);

    try {
      // Strict duplicate check: prevent signing up twice with same phone number or email across local & shared DB
      const localDupCheck = checkUserExists(seekerPhone, seekerEmail);
      if (localDupCheck.exists) {
        setDuplicateError(localDupCheck);
        formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmittingSeeker(false);
        return;
      }
      const dupCheck = await checkUserExistsAsync(seekerPhone, seekerEmail);
      if (dupCheck.exists) {
        setDuplicateError(dupCheck);
        formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmittingSeeker(false);
        return;
      }
      setDuplicateError(null);

      const resolvedCity = seekerState === 'Delta State'
        ? (seekerCity.trim() || 'Asaba')
        : (seekerCity.trim() || 'Capital City');

      const resolvedPersona: UserPersona = selectedPersona === 'lister' ? 'tenant' : (selectedPersona || 'job_seeker');
      const updated: UserProfile = {
        id: `DT-USR-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: seekerFullName.trim(),
        phone: seekerPhone.trim(),
        email: seekerEmail.trim().toLowerCase(),
        password: seekerPassword.trim(),
        state: seekerState,
        city: resolvedCity,
        preferredPropertyType: 'Bedseater',
        isVerifiedTenant: true,
        isAgent: false,
        persona: resolvedPersona,
        savedListingIds: [],
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
      };

      const otpPurpose: EmailOTPPurpose =
        resolvedPersona === 'tenant' ? 'tenant_signup' :
        resolvedPersona === 'employer' ? 'employer_signup' :
        'job_seeker_signup';

      // Send OTP to email and transition to verify_email screen for ALL signups
      try {
        await sendEmailOTP(seekerEmail.trim(), otpPurpose, updated);
        setOtpEmail(seekerEmail.trim());
        setOtpPurpose(otpPurpose);
        setOtpPendingUser(updated);
        setOtpDigits(['', '', '', '', '', '', '', '']);
        setOtpResendSeconds(60);
        setOtpError(null);
        setAuthMode('verify_email');
        setIsSubmittingSeeker(false);
        return;
      } catch (err: any) {
        console.error('[SignupModal] Email verification dispatch failed:', err);
        setSignupError(err.message || 'Failed to dispatch verification code. Please check your email.');
        setIsSubmittingSeeker(false);
        return;
      }
    } catch (err: any) {
      console.error('[SignupModal] Seeker registration error:', err);
      setSignupError('An unexpected error occurred while creating your account. Please try again.');
      setIsSubmittingSeeker(false);
    }
  };

  // Step 1 -> Step 2 validation for Agent / Employer
  const handleAgentNextStep = () => {
    setSignupError(null);
    setDuplicateError(null);

    if (!agentFullName.trim()) {
      setSignupError(selectedPersona === 'employer' ? 'Please enter the contact person name.' : 'Please enter your full name.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!agencyName.trim()) {
      setSignupError(selectedPersona === 'employer' ? 'Please enter your company or business name.' : 'Please enter your agency or business name.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!agentState.trim()) {
      setSignupError('Please select your operating state.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const resolvedCity = agentState === 'Delta State'
      ? (agentCitySelection === 'Others' ? customAgentCity.trim() : (agentCitySelection || agentCity))
      : agentCity.trim();
    if (!resolvedCity) {
      setSignupError(agentCitySelection === 'Others' ? 'Please enter your custom city or town name.' : 'Please select or enter your operating city.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormStep(2);
    formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submission for Agent / Employer Signup
  const handleAgentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep === 1) {
      handleAgentNextStep();
      return;
    }
    setSignupError(null);
    setDuplicateError(null);

    if (!agentFullName.trim() || !agencyName.trim() || !agentPhone.trim()) {
      setSignupError('Please enter your full name, organization name, and phone number.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // All users except tenants must provide compulsory email and password
    if (!agentEmail.trim()) {
      setSignupError('Please enter your official email address to continue.');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!agentPassword.trim() || agentPassword.trim().length < 6) {
      setSignupError('Please create a secure password (minimum 6 characters).');
      formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmittingAgent(true);

    try {
      // Strict duplicate check: prevent signing up twice with same phone number or email across local & shared DB
      const localDupCheck = checkUserExists(agentPhone, agentEmail);
      if (localDupCheck.exists) {
        setDuplicateError(localDupCheck);
        formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmittingAgent(false);
        return;
      }
      const dupCheck = await checkUserExistsAsync(agentPhone, agentEmail);
      if (dupCheck.exists) {
        setDuplicateError(dupCheck);
        formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmittingAgent(false);
        return;
      }
      setDuplicateError(null);

      const resolvedCity = agentState === 'Delta State'
        ? (agentCitySelection === 'Others' ? (customAgentCity.trim() || 'Others') : (agentCitySelection || agentCity || 'Asaba'))
        : (agentCity.trim() || 'Asaba');

      const finalWhatsapp = sameAsPhone ? agentPhone.trim() : (agentWhatsapp.trim() || agentPhone.trim());

      const resolvedPersona: UserPersona = selectedPersona === 'employer' ? 'employer' : 'lister';
      const updated: UserProfile = {
        id: `DT-AGT-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: agentFullName.trim(),
        agencyName: agencyName.trim(),
        agentType: agentType,
        phone: agentPhone.trim(),
        whatsapp: finalWhatsapp,
        email: agentEmail.trim() || undefined,
        password: agentPassword.trim(),
        operatingState: agentState,
        operatingCity: resolvedCity,
        state: agentState,
        city: resolvedCity,
        cacNumber: agentCac.trim() || 'VERIFIED-REG',
        isVerifiedTenant: false,
        isAgent: true,
        persona: resolvedPersona,
        savedListingIds: [],
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
      };

      // Enforce email verification for Agents and Employers
      const otpPurpose: EmailOTPPurpose = resolvedPersona === 'employer' ? 'employer_signup' : 'agent_signup';
      try {
        await sendEmailOTP(agentEmail.trim(), otpPurpose, updated);
        setOtpEmail(agentEmail.trim());
        setOtpPurpose(otpPurpose);
        setOtpPendingUser(updated);
        setOtpDigits(['', '', '', '', '', '', '', '']);
        setOtpResendSeconds(60);
        setOtpError(null);
        setAuthMode('verify_email');
        setIsSubmittingAgent(false);
        return;
      } catch (err: any) {
        console.error('[SignupModal] Agent verification dispatch failed:', err);
        setSignupError(err.message || 'Failed to dispatch verification code. Please check your email.');
        setIsSubmittingAgent(false);
        return;
      }
    } catch (err: any) {
      console.error('[SignupModal] Agent registration error:', err);
      setSignupError('An unexpected error occurred while setting up your account. Please try again.');
      setIsSubmittingAgent(false);
    }
  };

  // --- OTP Input & Verification Handlers (Supports both 6-digit & 8-digit OTPs + Instant Paste) ---
  const applyPastedCode = (rawText: string) => {
    const cleaned = (rawText || '').replace(/\D/g, '');
    if (!cleaned) return;
    const chars = cleaned.slice(0, 8).split('');
    const newDigits = Array(8).fill('');
    chars.forEach((c, idx) => {
      if (idx < 8) newDigits[idx] = c;
    });
    setOtpDigits(newDigits);
    if (otpError) setOtpError(null);
    const nextIdx = Math.min(chars.length, 7);
    const nextInput = document.getElementById(`otp-box-${nextIdx}`);
    if (nextInput) nextInput.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData ? e.clipboardData.getData('text') : '';
    if (pasted) {
      applyPastedCode(pasted);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          applyPastedCode(text);
          return;
        }
      }
    } catch (_) {}
    const firstInput = document.getElementById('otp-box-0');
    if (firstInput) firstInput.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      applyPastedCode(cleaned);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);
    if (otpError) setOtpError(null);

    if (cleaned && index < 7) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpResendSeconds > 0 || !otpEmail) return;
    try {
      await sendEmailOTP(otpEmail, otpPurpose, otpPendingUser || undefined);
      setOtpResendSeconds(60);
      setOtpError(null);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setOtpError('Please enter the verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await verifyEmailOTP(otpEmail, code);
      if (res.purpose === 'forgot_password') {
        setAuthMode('reset_password');
        setIsVerifyingOtp(false);
        return;
      }

      // Signup verified
      const user = res.user || otpPendingUser;
      if (user) {
        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#342A21', '#10B981', '#FCF9F5', '#000004']
          });
        } catch (_) {}

        const targetRoom: 'rentals' | 'jobs' =
          (user.persona === 'job_seeker' || user.persona === 'employer') ? 'jobs' : 'rentals';

        const roleTitle = user.persona === 'tenant'
          ? 'Tenant profile'
          : user.persona === 'job_seeker'
          ? 'Career profile'
          : user.isAgent
          ? 'Agent portal'
          : 'Employer portal';

        setSuccessMessage({
          title: `Email Verified! Welcome, ${user.fullName}`,
          subtitle: `Your ${roleTitle} is active. Loading...`
        });
        setIsSuccess(true);

        setTimeout(() => {
          onUpdateUser(user, user.isAgent ? 'agent' : 'seeker', targetRoom);
          setIsSuccess(false);
          setIsVerifyingOtp(false);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired code. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  // Instant Magic Link Listener:
  // If the user clicks "Confirm email address" in their email, Supabase emits SIGNED_IN.
  // We automatically detect this in real-time, mark the account verified, and log them in!
  useEffect(() => {
    if (authMode !== 'verify_email' || !otpEmail || !isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionEmail = session?.user?.email ? normalizeEmail(session.user.email) : '';
      const targetEmail = normalizeEmail(otpEmail);

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && sessionEmail && sessionEmail === targetEmail) {
        console.log('[SignupModal] Detected instant email confirmation for:', sessionEmail);
        setIsVerifyingOtp(true);
        try {
          const user = otpPendingUser;
          if (user) {
            user.isEmailVerified = true;
            await saveRegisteredUserAsync(user, { allowReRegistration: true });

            try {
              confetti({
                particleCount: 75,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#342A21', '#10B981', '#FCF9F5', '#000004']
              });
            } catch (_) {}

            const targetRoom: 'rentals' | 'jobs' =
              (user.persona === 'job_seeker' || user.persona === 'employer') ? 'jobs' : 'rentals';

            const roleTitle = user.persona === 'tenant'
              ? 'Tenant profile'
              : user.persona === 'job_seeker'
              ? 'Career profile'
              : user.isAgent
              ? 'Agent portal'
              : 'Employer portal';

            setSuccessMessage({
              title: `Email Verified! Welcome, ${user.fullName}`,
              subtitle: `Your ${roleTitle} is active. Loading...`
            });
            setIsSuccess(true);

            setTimeout(() => {
              onUpdateUser(user, user.isAgent ? 'agent' : 'seeker', targetRoom);
              setIsSuccess(false);
              setIsVerifyingOtp(false);
              onClose();
            }, 1200);
          }
        } catch (err) {
          console.error('[SignupModal] Activation error after email link click:', err);
        } finally {
          setIsVerifyingOtp(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authMode, otpEmail, otpPendingUser, onUpdateUser, onClose]);

  // Auto-Paste on App Resume / Tab Focus:
  // When a user copies the code from Gmail and switches back to Setlla,
  // we automatically read the clipboard and populate all boxes instantly!
  useEffect(() => {
    if (authMode !== 'verify_email') return;

    const checkClipboardAutoPaste = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          const cleaned = (text || '').trim();
          // If clipboard contains 6 or 8 pure digits, auto-fill it!
          if (/^\d{6}$/.test(cleaned) || /^\d{8}$/.test(cleaned)) {
            applyPastedCode(cleaned);
          }
        }
      } catch (_) {
        // Browser requires explicit gesture; fallback cleanly to manual/button paste
      }
    };

    const handleFocus = () => {
      checkClipboardAutoPaste();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkClipboardAutoPaste();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check on mount
    checkClipboardAutoPaste();

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authMode]);

  // --- Password Recovery Handlers ---
  const handleSendForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your registered email address.');
      return;
    }
    setIsSendingResetOtp(true);
    setForgotPasswordError(null);
    try {
      const res = await sendEmailOTP(forgotPasswordEmail.trim(), 'forgot_password');
      setOtpEmail(forgotPasswordEmail.trim());
      setOtpPurpose('forgot_password');
      setOtpDigits(['', '', '', '', '', '', '', '']);
      setOtpResendSeconds(60);
      setOtpError(null);
      setAuthMode('verify_email');
    } catch (err: any) {
      setForgotPasswordError(err.message || 'Failed to dispatch recovery code.');
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setResetPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setResetPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);
    try {
      const updatedUser = await resetUserPassword(otpEmail, newPassword.trim());
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) {}
      setSuccessMessage({
        title: 'Password Updated Successfully!',
        subtitle: 'Signing you in with your new credentials...'
      });
      setIsSuccess(true);
      setTimeout(() => {
        const targetRoom: 'rentals' | 'jobs' =
          (updatedUser.persona === 'job_seeker' || updatedUser.persona === 'employer') ? 'jobs' : 'rentals';
        onUpdateUser(updatedUser, updatedUser.isAgent ? 'agent' : 'seeker', targetRoom);
        setIsSuccess(false);
        setIsResettingPassword(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setResetPasswordError(err.message || 'Failed to update password.');
      setIsResettingPassword(false);
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
        // If user created a password, verify it upon login
        if (registeredMatch.password) {
          if (!loginPassword.trim()) {
            setLoginError('Please enter your account password to sign in.');
            setIsLoggingIn(false);
            return;
          }
          if (loginPassword.trim() !== registeredMatch.password) {
            setLoginError('Incorrect password. Please verify your password and try again.');
            setIsLoggingIn(false);
            return;
          }
        }

        setLoginError(null);
        const isElvis = isElvisSuperAdmin(registeredMatch);
        if (isElvis) {
          registeredMatch.isAdmin = true;
          registeredMatch.isSuperAdmin = true;
          registeredMatch.persona = 'admin';
        }
        const isAgent = !isElvis && registeredMatch.isAgent;
        setSuccessMessage({
          title: `Welcome back, ${registeredMatch.fullName}!`,
          subtitle: isElvis
            ? 'Signed in as Administrator. Loading management portal...'
            : isAgent
            ? 'Signed in as Agent. Loading your listings and inspection requests...'
            : 'Signed in as Tenant. Your saved inspections and passes are ready!',
        });
        setIsSuccess(true);

        const targetRoom: 'rentals' | 'jobs' =
          (registeredMatch.persona === 'job_seeker' || registeredMatch.persona === 'employer') ? 'jobs' : 'rentals';
        setTimeout(() => {
          onUpdateUser(registeredMatch!, isElvis ? 'admin' : isAgent ? 'agent' : 'seeker', targetRoom);
          setIsSuccess(false);
          setIsLoggingIn(false);
          onClose();
        }, 1000);
        return;
      }

      // If credentials do not match any registered account in Supabase or local registry, reject
      setLoginError('No registered account was found with this phone number or email. Please check your credentials or create an account.');
      setIsLoggingIn(false);
      return;
    } catch (err) {
      console.warn('[SignupModal] Login error:', err);
      setLoginError('An unexpected error occurred while verifying your account. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSkipClick = () => {
    if (onSkip) {
      onSkip();
    } else {
      onClose();
    }
  };

  const isTenantOptionalOpen = showOptionalTenantFields || Boolean(seekerEmail);
  const isAgentOptionalOpen = showOptionalAgentFields || Boolean(agentCac);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto animate-fade-in">
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
                {authMode === 'verify_email'
                  ? 'Verify your email address'
                  : authMode === 'forgot_password' || authMode === 'reset_password'
                  ? 'Reset your password'
                  : authMode === 'signup' && activeRoleTab === 'agent'
                  ? 'List verified rentals and close deals faster.'
                  : 'Find, inspect, and secure verified apartments.'}
              </h2>

              <p className="text-xs text-white/70 leading-relaxed">
                {authMode === 'verify_email'
                  ? 'We send a 6-digit confirmation code to activate and safeguard your Setlla account.'
                  : authMode === 'forgot_password' || authMode === 'reset_password'
                  ? 'Securely restore access to your account and continue managing your listings or applications.'
                  : authMode === 'signup' && activeRoleTab === 'agent'
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
          <div ref={formScrollRef} className="flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-7 lg:p-8 bg-white overflow-y-auto max-h-[min(94dvh,780px)] no-scrollbar">
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

              {/* Persona Selection (Step 1) vs Form View (Step 2) vs Login View vs Email OTP / Reset Password */}
              {authMode === 'verify_email' ? (
                /* VERIFY EMAIL HEADER */
                <>
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => {
                        if (otpPurpose === 'forgot_password') {
                          setAuthMode('forgot_password');
                        } else {
                          setAuthMode('signup');
                          setSignupStep('form');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000004] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{otpPurpose === 'forgot_password' ? 'Back to password reset' : 'Back to registration form'}</span>
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Step 2 of 2
                    </span>
                  </div>

                  <div className="mb-2.5 sm:mb-3">
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#000004] tracking-tight">
                      Confirm your email
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#70798C] mt-0.5">
                      Enter the 6-digit verification code sent to <strong className="text-[#000004]">{otpEmail}</strong>
                    </p>
                  </div>
                </>
              ) : authMode === 'forgot_password' ? (
                /* FORGOT PASSWORD HEADER */
                <>
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setForgotPasswordError(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000004] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F5F7] text-[#000004] border border-[#E5E7EB]">
                      Account Recovery
                    </span>
                  </div>

                  <div className="mb-2.5 sm:mb-3">
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#000004] tracking-tight">
                      Forgot Password?
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#70798C] mt-0.5">
                      Enter your account email to receive a 6-digit recovery code.
                    </p>
                  </div>
                </>
              ) : authMode === 'reset_password' ? (
                /* RESET PASSWORD HEADER */
                <>
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot_password')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000004] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to code entry</span>
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Final Step
                    </span>
                  </div>

                  <div className="mb-2.5 sm:mb-3">
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#000004] tracking-tight">
                      Set New Password
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#70798C] mt-0.5">
                      Enter your new secure password for <strong className="text-[#000004]">{otpEmail}</strong>
                    </p>
                  </div>
                </>
              ) : authMode === 'login' ? (
                <>
                  <div className="p-1 bg-[#F4F5F7] rounded-xl grid grid-cols-2 gap-1 mb-2.5 sm:mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setSignupStep('persona');
                        setDuplicateError(null);
                      }}
                      className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-[#70798C] hover:text-[#000004]"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </button>
                    <button
                      type="button"
                      className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 bg-white text-[#000004] shadow-xs cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#000004]" />
                      <span>Sign In</span>
                    </button>
                  </div>

                  <div className="mb-2.5 sm:mb-3">
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#000004] tracking-tight">
                      Welcome back
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#70798C] mt-0.5">
                      Sign in to access your jobs, applications, bookings, and passes.
                    </p>
                  </div>
                </>
              ) : signupStep === 'persona' ? (
                /* STEP 1: Persona Selector */
                <div className="mb-2.5 sm:mb-3">
                  <div className="mb-3.5 sm:mb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-black text-[#000004] tracking-tight leading-snug">
                      Welcome to Setlla. What brings you here today?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#70798C] mt-1">
                      Select your primary focus (you can switch anytime).
                    </p>
                  </div>

                  {/* 4 Beautiful Selectable Persona Cards */}
                  <div className="space-y-2.5 mb-4 sm:mb-5">
                    {[
                      {
                        id: 'job_seeker' as UserPersona,
                        title: 'Job Seeker',
                        tagline: 'Find career opportunities & apply with your CV',
                        room: 'Setlla Jobs',
                        activeRole: 'seeker' as const,
                      },
                      {
                        id: 'employer' as UserPersona,
                        title: 'Employer / Hiring Partner',
                        tagline: 'Post open vacancies & discover local talent',
                        room: 'Setlla Jobs',
                        activeRole: 'agent' as const,
                      },
                      {
                        id: 'tenant' as UserPersona,
                        title: 'Tenant / House Hunter',
                        tagline: 'Find verified apartments & schedule viewings',
                        room: 'Rentals',
                        activeRole: 'seeker' as const,
                      },
                      {
                        id: 'lister' as UserPersona,
                        title: 'Property Lister / Real Estate Agent',
                        tagline: 'List properties & manage inspection bookings',
                        room: 'Rentals',
                        activeRole: 'agent' as const,
                      },
                    ].map((persona) => {
                      const isSelected = selectedPersona === persona.id;
                      return (
                        <div
                          key={persona.id}
                          onClick={() => {
                            setSelectedPersona(persona.id);
                            setActiveRoleTab(persona.activeRole);
                          }}
                          className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3.5 select-none ${
                            isSelected
                              ? 'border-2 border-[#000004] bg-[#FCF9F5] ring-2 ring-[#000004]/5 shadow-xs'
                              : 'border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF9F6]/80'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-[#000004] tracking-tight">
                                {persona.title}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                                  isSelected
                                    ? 'bg-[#000004] text-white'
                                    : 'bg-[#F4F5F7] text-[#70798C] border border-[#E5E7EB]'
                                }`}
                              >
                                {persona.room}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-[#70798C] leading-snug">
                              {persona.tagline}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center justify-center">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[#000004] bg-white'
                                  : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#000004] animate-scale-in" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Primary CTA to continue to Form */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPersona === 'job_seeker' || selectedPersona === 'tenant') {
                        setActiveRoleTab('seeker');
                      } else {
                        setActiveRoleTab('agent');
                      }
                      setFormStep(1);
                      setSignupStep('form');
                    }}
                    className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-[#000004] hover:bg-[#18181B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>Continue to Account Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* PROFILE FORM HEADER (2 Steps) */
                <>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 2) {
                          setFormStep(1);
                          setSignupError(null);
                          setDuplicateError(null);
                          formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          setSignupStep('persona');
                          setFormStep(1);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000004] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{formStep === 2 ? 'Back to Step 1' : 'Back to focus selection'}</span>
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F5F7] text-[#000004] border border-[#E5E7EB]">
                      <span>Step {formStep} of 2</span>
                      <span className="text-[#70798C] font-normal">•</span>
                      <span>
                        {selectedPersona === 'job_seeker' && 'Job Seeker'}
                        {selectedPersona === 'employer' && 'Employer'}
                        {selectedPersona === 'tenant' && 'Tenant'}
                        {selectedPersona === 'lister' && 'Property Lister'}
                      </span>
                    </span>
                  </div>

                  {/* 2-Step Progress Indicator */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${formStep >= 1 ? 'bg-[#000004]' : 'bg-[#E5E7EB]'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${formStep >= 2 ? 'bg-[#000004]' : 'bg-[#E5E7EB]'}`} />
                  </div>

                  <div className="mb-2.5">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#000004] tracking-tight">
                      {formStep === 1
                        ? (selectedPersona === 'employer'
                            ? 'Company & Location'
                            : selectedPersona === 'lister'
                            ? 'Agency & Location'
                            : 'Personal Profile')
                        : 'Contact & Security'}
                    </h2>
                  </div>
                </>
              )}

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
                ) : authMode === 'verify_email' ? (
                  /* --- 6-DIGIT EMAIL OTP VERIFICATION SCREEN --- */
                  <form onSubmit={handleVerifyOtp} className="space-y-4 py-1 text-xs">
                    {otpError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] flex items-start gap-2 animate-fade-in shadow-2xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                        <span className="flex-1 font-semibold">{otpError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#70798C] text-center">
                        Enter verification code
                      </label>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 my-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus={idx === 0}
                            value={digit}
                            onPaste={handlePaste}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            className="w-8 h-11 sm:w-10 sm:h-12 text-center text-base sm:text-lg font-black rounded-lg sm:rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#000004] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/20 focus:border-[#F95700] transition-all"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F5F7] hover:bg-[#E5E7EB] active:scale-95 text-[#000004] text-[11px] font-bold transition-all cursor-pointer shadow-2xs border border-[#E5E7EB]"
                          title="Paste code directly from clipboard"
                        >
                          <Clipboard className="w-3.5 h-3.5 text-[#F95700]" />
                          <span>Paste code from clipboard</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-[#70798C] text-center pt-0.5">
                        Enter the code from your email (6 or 8 digits), or tap the confirmation link to activate instantly.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || (otpDigits.filter(Boolean).length !== 6 && otpDigits.filter(Boolean).length !== 8)}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying Code...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{otpPurpose === 'forgot_password' ? 'Confirm Code & Continue' : 'Confirm & Activate Account'}</span>
                          </>
                        )}
                      </button>

                      <div className="text-center pt-1">
                        {otpResendSeconds > 0 ? (
                          <span className="text-[11px] text-[#70798C]">
                            Resend code in <strong className="text-[#000004]">{otpResendSeconds}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-[11px] font-bold text-[#F95700] hover:text-[#E65100] hover:underline cursor-pointer"
                          >
                            Didn't receive the code? Resend Code
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                ) : authMode === 'forgot_password' ? (
                  /* --- FORGOT PASSWORD EMAIL SCREEN --- */
                  <form onSubmit={handleSendForgotPasswordOtp} className="space-y-3 py-1 text-xs">
                    {forgotPasswordError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] flex items-start gap-2 animate-fade-in shadow-2xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                        <span className="flex-1 font-semibold">{forgotPasswordError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#70798C] mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          autoFocus
                          autoComplete="email"
                          placeholder="e.g. name@domain.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => {
                            setForgotPasswordEmail(e.target.value);
                            if (forgotPasswordError) setForgotPasswordError(null);
                          }}
                          className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-[#70798C] mt-1.5 leading-snug">
                        We'll send an instant 6-digit security code to this email to reset your password.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSendingResetOtp || !forgotPasswordEmail.trim()}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                      >
                        {isSendingResetOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Sending Security Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Recovery Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : authMode === 'reset_password' ? (
                  /* --- SET NEW PASSWORD SCREEN --- */
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3 py-1 text-xs">
                    {resetPasswordError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] flex items-start gap-2 animate-fade-in shadow-2xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                        <span className="flex-1 font-semibold">{resetPasswordError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#70798C] mb-1">
                        New Password (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          autoFocus
                          minLength={6}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (resetPasswordError) setResetPasswordError(null);
                          }}
                          className="w-full pl-9 pr-10 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] p-1 cursor-pointer transition-colors"
                          tabIndex={-1}
                          title={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#70798C] mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Re-enter new password"
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            if (resetPasswordError) setResetPasswordError(null);
                          }}
                          className="w-full pl-9 pr-10 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isResettingPassword || !newPassword.trim() || !confirmNewPassword.trim()}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                      >
                        {isResettingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Save Password & Sign In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
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
                        Email address or Phone number
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          autoFocus
                          autoComplete="username"
                          name="username"
                          spellCheck={false}
                          placeholder="e.g. name@domain.com or 0803 000 0000"
                          value={loginPhoneOrEmail}
                          onChange={(e) => {
                            setLoginPhoneOrEmail(e.target.value);
                            if (loginError) setLoginError(null);
                          }}
                          className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#70798C]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordEmail(loginPhoneOrEmail.includes('@') ? loginPhoneOrEmail.trim() : '');
                            setForgotPasswordError(null);
                            setAuthMode('forgot_password');
                          }}
                          className="text-[11px] font-bold text-[#F95700] hover:text-[#E65100] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginError) setLoginError(null);
                          }}
                          className="w-full pl-9 pr-10 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] p-1 cursor-pointer transition-colors"
                          tabIndex={-1}
                          title={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
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
                ) : signupStep === 'persona' ? null : activeRoleTab === 'seeker' ? (
                  /* --- 2. TENANT / JOB SEEKER SIGNUP FORM (2 STEPS) --- */
                  <form onSubmit={handleSeekerSignup} className="space-y-2.5 sm:space-y-3 text-xs">
                    {/* Form Validation Alert Banner */}
                    {signupError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#000004] flex items-center gap-2 animate-fade-in shadow-xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0" />
                        <span className="text-xs font-semibold text-[#F0544F]">{signupError}</span>
                      </div>
                    )}

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

                    {formStep === 1 ? (
                      /* --- STEP 1: Personal Profile & Location --- */
                      <div className="space-y-3 animate-fade-in">
                        {/* Full Name */}
                        <div>
                          <label className="block text-xs font-semibold text-[#70798C] mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              required
                              autoFocus
                              autoComplete="name"
                              placeholder="e.g. Chinedu Okafor"
                              value={seekerFullName}
                              onChange={(e) => {
                                setSeekerFullName(e.target.value);
                                if (signupError) setSignupError(null);
                              }}
                              className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                            />
                          </div>
                        </div>

                        {/* State & Preferred City */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          <div>
                            <StateDropdown
                              value={seekerState}
                              onChange={(val) => {
                                setSeekerState(val);
                                if (val !== 'Delta State' && seekerCity === 'Asaba') {
                                  setSeekerCity('');
                                }
                                if (signupError) setSignupError(null);
                              }}
                              label={selectedPersona === 'job_seeker' ? 'Target State' : 'State'}
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-[#70798C]">
                                {selectedPersona === 'job_seeker' ? 'Preferred Job Location' : 'City'}
                              </label>
                              {seekerCity && (
                                <span className="text-[10px] text-[#70798C] font-semibold">
                                  {seekerCity}
                                </span>
                              )}
                            </div>
                            {seekerState === 'Delta State' ? (
                              <CustomDropdown
                                options={SIGNUP_DELTA_CITY_OPTIONS}
                                value={seekerCity}
                                onChange={(c) => {
                                  setSeekerCity(c);
                                  if (signupError) setSignupError(null);
                                }}
                                placeholder="Select City"
                                icon={<MapPin className="w-3.5 h-3.5 text-[#70798C]" />}
                                variant="form"
                                allowCustomInput={false}
                              />
                            ) : (
                              <input
                                type="text"
                                required
                                placeholder={`e.g. City in ${seekerState}`}
                                value={seekerCity}
                                onChange={(e) => {
                                  setSeekerCity(e.target.value);
                                  if (signupError) setSignupError(null);
                                }}
                                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                              />
                            )}
                          </div>
                        </div>

                        {/* Step 1 Next Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSeekerNextStep}
                            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-[0.99] cursor-pointer"
                          >
                            <span>Next: Contact & Security</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* --- STEP 2: Contact Details & Security --- */
                      <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
                        {/* Phone Number */}
                        <div>
                          <label className="block text-xs font-semibold text-[#70798C] mb-1">
                            Phone Number
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
                              autoFocus
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="0803 000 0000"
                              value={seekerPhone}
                              onChange={(e) => {
                                setSeekerPhone(e.target.value);
                                if (duplicateError) setDuplicateError(null);
                                if (signupError) setSignupError(null);
                              }}
                              className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium ${
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

                        {/* Email Address */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#70798C]">
                              Email Address
                            </label>
                            <span className="text-[10px] text-[#70798C] font-medium">Required</span>
                          </div>
                          <div className="relative">
                            <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                              duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                                ? 'text-[#F0544F]'
                                : 'text-[#70798C]'
                            }`} />
                            <input
                              type="email"
                              required
                              autoComplete="email"
                              inputMode="email"
                              spellCheck={false}
                              placeholder="name@email.com"
                              value={seekerEmail}
                              onChange={(e) => {
                                setSeekerEmail(e.target.value);
                                if (duplicateError) setDuplicateError(null);
                                if (signupError) setSignupError(null);
                              }}
                              className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium ${
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

                        {/* Password - Mandatory for all personas */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#70798C]">
                              Create Password
                            </label>
                            <span className="text-[10px] text-[#70798C]">
                              Min. 6 characters
                            </span>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type={showSeekerPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              autoComplete="new-password"
                              placeholder="Create password (min 6 characters)"
                              value={seekerPassword}
                              onChange={(e) => {
                                setSeekerPassword(e.target.value);
                                if (signupError) setSignupError(null);
                              }}
                              className="w-full pl-9 pr-10 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSeekerPassword(!showSeekerPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] p-1 cursor-pointer transition-colors"
                              tabIndex={-1}
                              title={showSeekerPassword ? "Hide password" : "Show password"}
                            >
                              {showSeekerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Step 2 Back & Submit Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormStep(1);
                              setSignupError(null);
                              formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#000004] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>

                          <button
                            type="submit"
                            disabled={isSubmittingSeeker}
                            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                          >
                            {isSubmittingSeeker ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Setting Up Account...</span>
                              </>
                            ) : selectedPersona === 'job_seeker' ? (
                              <>
                                <Briefcase className="w-4 h-4 text-white" />
                                <span>Create Job Seeker Account</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <User className="w-4 h-4 text-[#F95700]" />
                                <span>Create Tenant Account</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                ) : (
                  /* --- 3. AGENT SIGNUP FORM (2 STEPS) --- */
                  <form onSubmit={handleAgentSignup} className="space-y-2.5 sm:space-y-3 text-xs">
                    {/* Form Validation Alert Banner */}
                    {signupError && (
                      <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#000004] flex items-center gap-2 animate-fade-in shadow-xs">
                        <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0" />
                        <span className="text-xs font-semibold text-[#F0544F]">{signupError}</span>
                      </div>
                    )}

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

                    {formStep === 1 ? (
                      /* --- STEP 1: Organization & Operating Location --- */
                      <div className="space-y-3 animate-fade-in">
                        {/* Account Type Selector */}
                        <div>
                          <label className="block text-xs font-semibold text-[#70798C] mb-1">
                            {selectedPersona === 'employer' ? 'Organization Category' : 'Listing Category'}
                          </label>
                          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F4F5F7] rounded-xl border border-[#E5E7EB]">
                            <button
                              type="button"
                              onClick={() => setAgentType('agency')}
                              className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer truncate ${
                                agentType === 'agency'
                                  ? 'bg-white text-[#000004] shadow-xs font-semibold'
                                  : 'text-[#70798C] hover:text-[#000004]'
                              }`}
                            >
                              {selectedPersona === 'employer' ? 'Corporate / Firm' : 'Agency / Firm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAgentType('individual')}
                              className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer truncate ${
                                agentType === 'individual'
                                  ? 'bg-white text-[#000004] shadow-xs font-semibold'
                                  : 'text-[#70798C] hover:text-[#000004]'
                              }`}
                            >
                              {selectedPersona === 'employer' ? 'Recruiter / HR' : 'Realtor / Agent'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAgentType('landlord')}
                              className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer truncate ${
                                agentType === 'landlord'
                                  ? 'bg-white text-[#000004] shadow-xs font-semibold'
                                  : 'text-[#70798C] hover:text-[#000004]'
                              }`}
                            >
                              {selectedPersona === 'employer' ? 'Business Owner' : 'Direct Landlord'}
                            </button>
                          </div>
                        </div>

                        {/* Full Name & Agency / Company Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-[#70798C] mb-1">
                              {selectedPersona === 'employer' ? 'Contact Person Name' : 'Agent Full Name'}
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                autoFocus
                                autoComplete="name"
                                placeholder="e.g. Victor Ossai"
                                value={agentFullName}
                                onChange={(e) => {
                                  setAgentFullName(e.target.value);
                                  if (signupError) setSignupError(null);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#70798C] mb-1">
                              {selectedPersona === 'employer' ? 'Company / Business Name' : 'Agency / Business Name'}
                            </label>
                            <div className="relative">
                              <Building2 className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                autoComplete="organization"
                                placeholder={selectedPersona === 'employer' ? 'e.g. Apex Tech Solutions Ltd' : 'e.g. Apex Real Estate Ltd'}
                                value={agencyName}
                                onChange={(e) => {
                                  setAgencyName(e.target.value);
                                  if (signupError) setSignupError(null);
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Operating State & City */}
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
                                if (signupError) setSignupError(null);
                              }}
                              label={selectedPersona === 'employer' ? 'Office State' : 'Operating State'}
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-[#70798C]">
                                {selectedPersona === 'employer'
                                  ? 'Office City'
                                  : 'Operating City'}
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
                                  options={SIGNUP_DELTA_CITY_OPTIONS}
                                  value={agentCitySelection}
                                  onChange={(val) => {
                                    setAgentCitySelection(val);
                                    if (val !== 'Others') {
                                      setAgentCity(val);
                                    } else {
                                      setAgentCity(customAgentCity || '');
                                    }
                                    if (signupError) setSignupError(null);
                                  }}
                                  placeholder="Select City"
                                  icon={<MapPin className="w-3.5 h-3.5 text-[#70798C]" />}
                                  variant="form"
                                  allowCustomInput={false}
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
                                        if (signupError) setSignupError(null);
                                      }}
                                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs sm:text-sm text-[#000004] outline-none bg-[#F9FAFB] focus:bg-white font-medium"
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
                                onChange={(e) => {
                                  setAgentCity(e.target.value);
                                  if (signupError) setSignupError(null);
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs sm:text-sm text-[#000004] outline-none bg-[#F9FAFB] focus:bg-white font-medium"
                              />
                            )}
                          </div>
                        </div>

                        {/* Step 1 Next Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleAgentNextStep}
                            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-[0.99] cursor-pointer"
                          >
                            <span>Next: Contact & Security</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* --- STEP 2: Contact Details & Security --- */
                      <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
                        {/* Official Email */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#70798C]">
                              {selectedPersona === 'employer' ? 'Official Work Email' : 'Official Agent Email'}
                            </label>
                            <span className="text-[10px] text-[#70798C]">
                              {selectedPersona === 'employer' ? 'For alerts & sign-in' : 'For notifications & sign-in'}
                            </span>
                          </div>
                          <div className="relative">
                            <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                              duplicateError && (duplicateError.field === 'email' || duplicateError.field === 'both')
                                ? 'text-[#F0544F]'
                                : 'text-[#70798C]'
                            }`} />
                            <input
                              type="email"
                              required
                              autoFocus
                              autoComplete="email"
                              inputMode="email"
                              spellCheck={false}
                              placeholder={selectedPersona === 'employer' ? 'e.g. hr@company.com' : 'e.g. agent@agency.ng'}
                              value={agentEmail}
                              onChange={(e) => {
                                setAgentEmail(e.target.value);
                                if (duplicateError) setDuplicateError(null);
                                if (signupError) setSignupError(null);
                              }}
                              className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium ${
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

                        {/* Create Password */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#70798C]">
                              Create Password
                            </label>
                            <span className="text-[10px] text-[#70798C]">
                              Min. 6 characters
                            </span>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type={showAgentPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              autoComplete="new-password"
                              placeholder="Create password (min 6 characters)"
                              value={agentPassword}
                              onChange={(e) => {
                                setAgentPassword(e.target.value);
                                if (signupError) setSignupError(null);
                              }}
                              className="w-full pl-9 pr-10 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAgentPassword(!showAgentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] p-1 cursor-pointer transition-colors"
                              tabIndex={-1}
                              title={showAgentPassword ? "Hide password" : "Show password"}
                            >
                              {showAgentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Direct Phone & WhatsApp Toggle */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#70798C]">
                              {selectedPersona === 'employer' ? 'Contact Phone Number' : 'Direct Phone Number'}
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-[#70798C] hover:text-[#000004]">
                              <input
                                type="checkbox"
                                checked={sameAsPhone}
                                onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                                className="w-3.5 h-3.5 rounded accent-[#000004]"
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
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="0803 123 4567"
                              value={agentPhone}
                              onChange={(e) => handleAgentPhoneChange(e.target.value)}
                              className={`w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all font-medium ${
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
                                WhatsApp Number
                              </label>
                              <div className="relative">
                                <WhatsAppIcon className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="tel"
                                  required={!sameAsPhone}
                                  inputMode="tel"
                                  autoComplete="tel"
                                  placeholder="0803 000 0000"
                                  value={agentWhatsapp}
                                  onChange={(e) => setAgentWhatsapp(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] font-medium"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Optional CAC / Business Verification Section */}
                        <div className="pt-0.5">
                          {!showOptionalAgentFields ? (
                            <button
                              type="button"
                              onClick={() => setShowOptionalAgentFields(true)}
                              className="text-xs font-semibold text-[#70798C] hover:text-[#000004] inline-flex items-center gap-1 cursor-pointer py-1"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>
                                {selectedPersona === 'employer'
                                  ? 'Add Business Registration / CAC Number (Optional)'
                                  : 'Add CAC / License / Reg Number (Optional)'}
                              </span>
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
                              <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-semibold text-[#70798C]">
                                      {selectedPersona === 'employer' ? 'CAC / RC Number (Optional)' : 'CAC / License No. (Optional)'}
                                    </label>
                                    <span className="text-[10px] text-[#342A21] bg-[#342A21]/5 px-1 py-0.5 rounded font-semibold">
                                      {selectedPersona === 'employer' ? 'Verified Employer' : 'Badge'}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <FileText className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      type="text"
                                      placeholder="e.g. RC-182903 or BN-293810"
                                      value={agentCac}
                                      onChange={(e) => setAgentCac(e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Step 2 Back & Submit Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormStep(1);
                              setSignupError(null);
                              formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#000004] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>

                          <button
                            type="submit"
                            disabled={isSubmittingAgent}
                            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                          >
                            {isSubmittingAgent ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Processing Registration...</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-4 h-4 text-white" />
                                <span>{selectedPersona === 'employer' ? 'Register as Employer & Post Jobs' : 'Register as Agent'}</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Bottom Footer Switcher */}
            <div className="pt-3 border-t border-[#E5E7EB] text-center text-xs text-[#70798C] mt-3 space-y-1">
              {authMode === 'verify_email' ? (
                <p>
                  Entered the wrong email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (otpPurpose === 'forgot_password') {
                        setAuthMode('forgot_password');
                      } else {
                        setAuthMode('signup');
                        setSignupStep('form');
                      }
                    }}
                    className="font-bold text-[#000004] hover:underline cursor-pointer ml-1"
                  >
                    Change Email
                  </button>
                </p>
              ) : authMode === 'forgot_password' || authMode === 'reset_password' ? (
                <p>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setForgotPasswordError(null);
                      setResetPasswordError(null);
                    }}
                    className="font-bold text-[#000004] hover:underline cursor-pointer ml-1"
                  >
                    Back to Sign In
                  </button>
                </p>
              ) : authMode === 'login' ? (
                <p>
                  No account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupStep('persona');
                      setDuplicateError(null);
                    }}
                    className="font-bold text-[#000004] hover:underline cursor-pointer ml-1"
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
                    className="font-bold text-[#000004] hover:underline cursor-pointer ml-1"
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
    </ModalPortal>
  );
};
