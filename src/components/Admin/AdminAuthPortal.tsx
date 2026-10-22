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
        // Complete account registration
        const newAdmin = completeAdminRegistration(fullName, phone, password, masterPin);
        onSuccess(newAdmin);
      } else {
        // Login verified via OTP
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
    <div className="min-h-[calc(100dvh-4rem)] w-full bg-[#07090E] text-slate-100 flex flex-col justify-between relative overflow-hidden px-4 py-8 sm:py-12">
      {/* Main Terminal Container */}
      <div className="w-full max-w-md mx-auto relative z-10 my-auto">
        {/* Terminal Header Identity */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-12 px-4 py-2 rounded-2xl bg-[#000004] border border-slate-800 shadow-md flex items-center justify-center">
              <img src="/images/setlla-logo-white.png" alt="Setlla" className="h-6 w-auto object-contain" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Setlla Administrative Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Super Admin Portal • Delta State Escrow & Housing Authority
          </p>
        </div>

        {/* Official Mailbox Notice */}
        <div className="mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 text-left text-xs text-slate-300">
          <Mail className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-white">Official Admin Mailbox:</span> OTP passcodes are dispatched to{' '}
            <span className="font-mono font-bold text-amber-300">
              admin@setlla.com
            </span>
          </div>
        </div>

        {/* Card Frame */}
        <div className="bg-[#0D101A] border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Segmented Mode Switcher (Visible in 'form' step) */}
          {step === 'form' && (
            <div className="grid grid-cols-2 p-1 bg-[#07090E] border border-slate-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('create-account');
                  setCreateError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'create-account'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* STEP 1A: ADMIN LOGIN FORM */}
          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@setlla.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#07090E] border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestLoginOTP}
                    className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Login with OTP instead?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-[#07090E] border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Super Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Fill Demo Helper Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Testing on local/demo?</span>
                <button
                  type="button"
                  onClick={handleQuickFillMasterAdmin}
                  className="py-1 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-amber-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
                >
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Quick-fill Master Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 1B: CREATE SUPER ADMIN ACCOUNT FORM */}
          {step === 'form' && mode === 'create-account' && (
            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Legal Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chief Executive Admin"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[#07090E] border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Official Admin Mailbox <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Mandatory Target
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={adminEmail}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-[#07090E]/60 border border-slate-800 text-slate-300 rounded-xl text-sm font-mono cursor-not-allowed select-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  As requested, verification OTP is dispatched to <span className="text-white font-mono font-bold">admin@setlla.com</span>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Direct Phone Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0800 000 0001"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[#07090E] border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Master Password <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full px-3 py-2 bg-[#07090E] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm Password <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-3 py-2 bg-[#07090E] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-all"
                    />
                  </div>
                </div>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {createLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching OTP to admin@setlla.com...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Generate & Send OTP to admin@setlla.com</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION VIEW */}
          {step === 'otp' && (
            <div className="space-y-5">
              {/* Back to details button */}
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change details</span>
              </button>

              <div className="text-center">
                <div className="w-11 h-11 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-2.5">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-white">
                  Enter 6-Digit Authorization Code
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  A verification code has been dispatched to{' '}
                  <span className="font-mono text-amber-300 font-bold">admin@setlla.com</span>.
                </p>
              </div>

              {/* SIMULATED SETLLA SECURE MAILBOX DISPATCH CARD */}
              <div className="bg-[#07090E] border border-amber-500/30 rounded-2xl p-3.5 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Live Mailbox Dispatch:</span>
                    <span className="font-mono text-white font-bold">admin@setlla.com</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Expires in 10m
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Admin Verification OTP
                    </div>
                    <div className="text-xl font-black font-mono tracking-widest text-amber-400">
                      {generatedOtp || '••••••'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillGeneratedOtp}
                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    {copiedOtp ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
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
                <label className="block text-center text-xs font-bold text-slate-300 mb-2">
                  Input 6-Digit OTP
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
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-black text-amber-400 bg-[#07090E] border border-slate-700 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={otpLoading || otpDigits.join('').length < 6}
                onClick={() => executeVerifyOTP()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Authorization...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Access Admin Console</span>
                  </>
                )}
              </button>

              {/* Resend Controls */}
              <div className="text-center pt-2">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend code in{' '}
                    <span className="text-amber-400 font-mono font-bold">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    Resend code to admin@setlla.com
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exit back to marketplace feed */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSwitchToExplore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-slate-800/50"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Return to Public Marketplace Feed</span>
          </button>
        </div>
      </div>

      {/* Footer Governance Tag */}
      <div className="text-center text-[11px] text-slate-600 mt-6 relative z-10">
        Setlla Real Estate Marketplace • Delta State Digital Registry & Housing Compliance System
      </div>
    </div>
  );
};
