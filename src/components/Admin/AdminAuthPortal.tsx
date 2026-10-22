import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../../types/marketplace';
import { 
  OFFICIAL_ADMIN_EMAIL, 
  generateAndSendAdminOTP, 
  verifyAdminOTP, 
  completeAdminRegistration, 
  loginAdminWithPassword,
  getPendingAdminOTP
} from '../../services/adminAuthService';

interface AdminAuthPortalProps {
  onSuccess: (adminUser: UserProfile) => void;
  onSwitchToExplore: () => void;
  initialMode?: 'login' | 'create-account';
}

export const AdminAuthPortal: React.FC<AdminAuthPortalProps> = ({
  onSuccess,
  onSwitchToExplore,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'create-account'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState(OFFICIAL_ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Create Account Form States
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState(OFFICIAL_ADMIN_EMAIL);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [masterPin, setMasterPin] = useState('2026');
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Input refs for auto-focusing OTP boxes
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if there is an active pending OTP on mount
  useEffect(() => {
    const pending = getPendingAdminOTP();
    if (pending) {
      setGeneratedOtp(pending.otp);
    }
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your administrator email address.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Please enter your administrator password.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const result = loginAdminWithPassword(loginEmail, loginPassword);
      setLoginLoading(false);

      if (result.success && result.user) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        onSuccess(result.user);
      } else {
        setLoginError(result.error || 'Invalid administrator credentials.');
      }
    }, 400);
  };

  // Quick fill default master demo credentials
  const handleQuickFillMasterAdmin = () => {
    setLoginEmail(OFFICIAL_ADMIN_EMAIL);
    setLoginPassword('SetllaAdmin2026!');
    setLoginError(null);
  };

  // Switch to OTP Passwordless Login
  const handleRequestLoginOTP = () => {
    const { otp } = generateAndSendAdminOTP(OFFICIAL_ADMIN_EMAIL, 'login');
    setGeneratedOtp(otp);
    setOtpDigits(['', '', '', '', '', '']);
    setStep('otp');
    setResendCooldown(60);
    setOtpError(null);
  };

  // Handle Create Account Submission (Dispatches OTP to admin@setlla.com)
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!fullName.trim()) {
      setCreateError('Please enter your full legal name.');
      return;
    }
    if (!phone.trim()) {
      setCreateError('Please enter your direct mobile phone number.');
      return;
    }
    if (!password) {
      setCreateError('Please enter a secure password for your administrator account.');
      return;
    }
    if (password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setCreateError('Passwords do not match. Please re-enter.');
      return;
    }

    setCreateLoading(true);

    setTimeout(() => {
      // Dispatches OTP strictly to admin@setlla.com as required
      const { otp } = generateAndSendAdminOTP(OFFICIAL_ADMIN_EMAIL, 'create_account', {
        fullName,
        phone,
      });

      setGeneratedOtp(otp);
      setOtpDigits(['', '', '', '', '', '']);
      setCreateLoading(false);
      setStep('otp');
      setResendCooldown(60);
      setOtpError(null);

      // Focus first input box
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    }, 500);
  };

  // Handle OTP Input Change & Auto-Focus
  const handleDigitChange = (index: number, value: string) => {
    const cleanChar = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto move to next input if digit entered
    if (cleanChar && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    const completeCode = newDigits.join('');
    if (completeCode.length === 6) {
      executeVerifyOTP(completeCode);
    }
  };

  // Handle Backspace Key Navigation
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Pasting Full 6-digit Code
  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    if (pastedData.length === 6) {
      digitInputRefs.current[5]?.focus();
      executeVerifyOTP(pastedData);
    } else {
      digitInputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  // Quick auto-fill helper for testing
  const handleAutoFillGeneratedOtp = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split('');
    setOtpDigits(digits);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
    executeVerifyOTP(generatedOtp);
  };

  // Resend OTP to admin@setlla.com
  const handleResendOTP = () => {
    if (resendCooldown > 0) return;
    const { otp } = generateAndSendAdminOTP(
      OFFICIAL_ADMIN_EMAIL,
      mode === 'create-account' ? 'create_account' : 'login'
    );
    setGeneratedOtp(otp);
    setResendCooldown(60);
    setOtpError(null);
  };

  // Execute OTP Verification
  const executeVerifyOTP = (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setTimeout(() => {
      const verifyResult = verifyAdminOTP(code);
      setOtpLoading(false);

      if (!verifyResult.success) {
        setOtpError(verifyResult.error || 'Invalid verification code.');
        return;
      }

      // Success!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (mode === 'create-account') {
        const newAdmin = completeAdminRegistration(fullName, phone, password, masterPin);
        onSuccess(newAdmin);
      } else {
        const loginResult = loginAdminWithPassword(OFFICIAL_ADMIN_EMAIL, 'SetllaAdmin2026!');
        if (loginResult.success && loginResult.user) {
          onSuccess(loginResult.user);
        } else {
          onSuccess({
            id: 'DT-ADMIN-001',
            fullName: 'Platform Administrator',
            email: OFFICIAL_ADMIN_EMAIL,
            phone: '0800 000 0001',
            state: 'Delta State',
            city: 'Asaba',
            isVerifiedTenant: false,
            isAgent: false,
            isAdmin: true,
            isSuperAdmin: true,
            savedListingIds: [],
          });
        }
      }
    }, 500);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] w-full bg-[#FCF9F5] text-[#000004] flex items-center justify-center p-3 sm:p-6 md:p-8">
      {/* Split Two-Column Card matching sample design */}
      <div className="w-full max-w-4xl bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col md:flex-row animate-scale-up">
        
        {/* LEFT COLUMN: Visual Brand Banner with Warm Vertical Glows (Desktop & Tablet) */}
        <div className="hidden md:flex flex-col justify-between w-80 lg:w-96 bg-[#000004] text-white p-8 relative overflow-hidden shrink-0">
          {/* Warm vertical gradient beams matching Image 1 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#E65100]/45 via-[#F95700]/15 to-transparent pointer-events-none" />
          <div className="absolute -bottom-12 left-4 right-4 h-56 bg-gradient-to-t from-[#FF6D00]/55 via-[#E65100]/25 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-6 w-14 h-48 bg-gradient-to-t from-orange-500/40 via-amber-500/20 to-transparent blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-24 w-16 h-60 bg-gradient-to-t from-amber-600/45 via-orange-600/25 to-transparent blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-14 h-44 bg-gradient-to-t from-orange-500/35 via-amber-600/15 to-transparent blur-xl pointer-events-none" />

          {/* Top Headline Section */}
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Super Admin Gateway</span>
            </div>

            <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Direct oversight across Delta State rentals and escrow.
            </h2>

            <p className="text-xs text-white/70 leading-relaxed">
              Super Admin authority over verified agents, tenant inspection passes, and platform governance.
            </p>
          </div>

          {/* Bottom Trust Hallmark */}
          <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
            <span>Setlla • Platform Authority</span>
            <span>Delta State</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form (Responsive for Mobile & Desktop) */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white overflow-y-auto max-h-[88vh]">
          <div>
            {/* Header: Brand Logo & Back to Live Marketplace */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/images/setlla-logo.png" 
                  alt="Setlla" 
                  className="h-6 sm:h-7 w-auto object-contain" 
                />
              </div>

              <button
                type="button"
                onClick={onSwitchToExplore}
                className="text-xs text-[#70798C] hover:text-[#000004] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Explore Feed</span>
              </button>
            </div>

            {/* Title & Subtitle matching sample */}
            <div className="mb-4">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#000004] tracking-tight">
                {step === 'otp' 
                  ? 'Verify Authorization'
                  : mode === 'login' 
                    ? 'Welcome back' 
                    : 'Get Started'}
              </h1>
              <p className="text-xs sm:text-sm text-[#70798C] mt-1">
                {step === 'otp'
                  ? 'Enter the 6-digit authorization code sent to admin@setlla.com'
                  : mode === 'login'
                    ? 'Sign in to access your platform dashboard and oversight tools'
                    : 'Welcome to Setlla — Let’s get started'}
              </p>
            </div>

            <div className="w-full h-px bg-[#E5E7EB] mb-5" />

            {/* Segmented Pill Switcher (Matching Image 2) */}
            {step === 'form' && (
              <div className="p-1 bg-[#F4F5F7] rounded-2xl grid grid-cols-2 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLoginError(null);
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#000004] shadow-xs'
                      : 'text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('create-account');
                    setCreateError(null);
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'create-account'
                      ? 'bg-white text-[#000004] shadow-xs'
                      : 'text-[#70798C] hover:text-[#000004]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            {/* Subhead instructions matching mobile sample */}
            {step === 'form' && (
              <div className="mb-4">
                <h3 className="font-bold text-xs sm:text-sm text-[#000004]">
                  {mode === 'login' ? 'Sign in to continue' : 'Admin registration'}
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5">
                  {mode === 'login' 
                    ? 'Access your dashboard, verified partner agents, and store tools.' 
                    : 'Verification OTP will be dispatched to the official mailbox: admin@setlla.com.'}
                </p>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {step === 'form' && mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#70798C] mb-1.5">
                    Your email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@setlla.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#70798C]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleRequestLoginOTP}
                      className="text-[11px] text-[#F95700] hover:underline font-semibold cursor-pointer"
                    >
                      Login with OTP instead?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] p-1 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Primary CTA Button (Matching vibrant orange from Image 1) */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F95700] hover:bg-[#E65100] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Testing helper */}
                <div className="pt-2 flex items-center justify-between text-xs text-[#70798C]">
                  <span>Testing credentials?</span>
                  <button
                    type="button"
                    onClick={handleQuickFillMasterAdmin}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000004] font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
                  >
                    <Key className="w-3 h-3 text-[#F95700]" />
                    <span>Fill Master Admin</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. CREATE ACCOUNT FORM */}
            {step === 'form' && mode === 'create-account' && (
              <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#70798C] mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chief Executive Admin"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#70798C]">
                      Your email <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#F95700] font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Mandatory Mailbox
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={adminEmail}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5F7] border border-[#E5E7EB] text-[#70798C] rounded-xl text-sm font-mono cursor-not-allowed select-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#70798C] mt-1">
                    Verification OTP will be dispatched to <span className="font-mono font-bold text-[#000004]">admin@setlla.com</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#70798C] mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0800 000 0001"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#70798C] mb-1">
                      Create new password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#70798C] mb-1">
                      Confirm password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F95700]/15 focus:border-[#F95700] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Primary CTA Button (Matching Image 1: "Create new account") */}
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#F95700] hover:bg-[#E65100] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP to admin@setlla.com...</span>
                    </>
                  ) : (
                    <>
                      <span>Create new account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. STEP 2: OTP VERIFICATION VIEW */}
            {step === 'otp' && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to details</span>
                </button>

                {/* Live Mailbox Preview Card */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 text-[#70798C]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Mailbox Dispatch:</span>
                      <span className="font-mono text-[#000004] font-bold">admin@setlla.com</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#E65100] text-[10px] font-bold">
                      Expires in 10m
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-[#70798C] uppercase tracking-wider font-bold">
                        Verification Code
                      </div>
                      <div className="text-2xl font-black font-mono tracking-widest text-[#000004]">
                        {generatedOtp || '••••••'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoFillGeneratedOtp}
                      className="py-2 px-3.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      {copiedOtp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Filled!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Auto-Fill Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 6 Digit Inputs */}
                <div>
                  <label className="block text-center text-xs font-semibold text-[#70798C] mb-2.5">
                    Input 6-Digit OTP Code
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleDigitPaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-black text-[#000004] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/15 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                {otpError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={otpLoading || otpDigits.join('').length < 6}
                  onClick={() => executeVerifyOTP()}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F95700] hover:bg-[#E65100] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Super Admin...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize & Access Admin Console</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-[#70798C]">
                      Resend code in{' '}
                      <span className="text-[#000004] font-mono font-bold">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-xs text-[#F95700] hover:underline font-bold cursor-pointer"
                    >
                      Resend code to admin@setlla.com
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Switcher matching samples */}
          {step === 'form' && (
            <div className="pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#70798C] mt-6">
              {mode === 'login' ? (
                <p>
                  No account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('create-account');
                      setCreateError(null);
                    }}
                    className="font-bold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Create one
                  </button>
                </p>
              ) : (
                <p>
                  Already have account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setLoginError(null);
                    }}
                    className="font-bold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
