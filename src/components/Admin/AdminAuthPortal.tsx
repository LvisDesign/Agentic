import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../../types/marketplace';
import { 
  OFFICIAL_ADMIN_EMAIL, 
  generateAndSendAdminOTP, 
  verifyAdminOTP
} from '../../services/adminAuthService';
import { recordAuditLog } from '../../services/adminService';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';

interface AdminAuthPortalProps {
  onSuccess: (adminUser: UserProfile) => void;
  onSwitchToExplore: () => void;
  initialMode?: 'login' | 'create-account';
}

export const AdminAuthPortal: React.FC<AdminAuthPortalProps> = ({
  onSuccess,
  onSwitchToExplore,
}) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Administrator Profile Details (Passwordless - empty by default)
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // OTP Verification States (8-digit code)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Input refs for auto-focusing OTP boxes
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  // Listen for Supabase email confirmation link clicks while Admin portal is open
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const checkAndAuth = (confirmedEmail?: string | null) => {
      const activeAdminEmail = (email.trim() || OFFICIAL_ADMIN_EMAIL).toLowerCase();
      if (confirmedEmail?.toLowerCase().includes('admin') || confirmedEmail?.toLowerCase() === activeAdminEmail) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        const adminProfile: UserProfile = {
          id: 'DT-ADMIN-001',
          fullName: fullName.trim() || 'Platform Administrator',
          email: email.trim() || OFFICIAL_ADMIN_EMAIL,
          phone: phone.trim() || '0800 000 0001',
          state: 'Delta State',
          city: 'Asaba',
          isVerifiedTenant: false,
          isAgent: false,
          isAdmin: true,
          isSuperAdmin: true,
          savedListingIds: [],
          createdAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('setlla_admin_auth', 'true');
          localStorage.setItem('setlla_admin_user', JSON.stringify(adminProfile));
          localStorage.removeItem('setlla_admin_accounts');
        }

        onSuccess(adminProfile);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) checkAndAuth(session.user.email);
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
        checkAndAuth(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fullName, phone, onSuccess]);

  // Handle Request OTP Submission (Passwordless)
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSendError(null);
    setSendLoading(true);

    const targetEmail = email.trim() || OFFICIAL_ADMIN_EMAIL;

    try {
      const result = await generateAndSendAdminOTP(targetEmail, 'login', {
        fullName: fullName.trim() || 'Platform Administrator',
        phone: phone.trim() || '0800 000 0001',
      });
      setSendLoading(false);

      if (result.error) {
        setSendError(result.error);
        return;
      }

      setOtpDigits(['', '', '', '', '', '', '', '']);
      setStep('otp');
      setResendCooldown(60);
      setOtpError(null);

      // Focus first input box
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setSendLoading(false);
      setSendError(err?.message || 'Failed to dispatch verification code.');
    }
  };

  // Handle OTP Input Change & Auto-Focus (Supports up to 8 digits)
  const handleDigitChange = (index: number, value: string) => {
    const cleanChar = value.slice(-1).replace(/[^0-9a-zA-Z]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto move to next input if character entered
    if (cleanChar && index < 7) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 8 digits entered
    const completeCode = newDigits.join('');
    if (completeCode.length === 8) {
      executeVerifyOTP(completeCode);
    }
  };

  // Handle Backspace Key Navigation & Enter to Submit
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const code = otpDigits.join('');
      if (code.length >= 6) {
        executeVerifyOTP(code);
      }
    }
  };

  // Handle Pasting Full Code (Supports 8 or 6 digits)
  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9a-zA-Z]/g, '').slice(0, 8);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    if (pastedData.length >= 6) {
      digitInputRefs.current[Math.min(pastedData.length - 1, 7)]?.focus();
      executeVerifyOTP(pastedData);
    } else {
      digitInputRefs.current[pastedData.length]?.focus();
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    setOtpError(null);
    const targetEmail = email.trim() || OFFICIAL_ADMIN_EMAIL;
    const result = await generateAndSendAdminOTP(targetEmail, 'login', {
      fullName,
      phone,
    });
    setOtpLoading(false);
    if (result.error) {
      setOtpError(result.error);
      return;
    }
    setResendCooldown(60);
    setOtpError(null);
  };

  // Execute OTP Verification
  const executeVerifyOTP = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpDigits.join('')).trim();
    if (code.length < 6) {
      setOtpError('Please enter the authorization code received in your email.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    try {
      const verifyResult = await verifyAdminOTP(code);
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

      const targetEmail = email.trim() || OFFICIAL_ADMIN_EMAIL;
      const adminProfile: UserProfile = {
        id: 'DT-ADMIN-001',
        fullName: fullName.trim() || 'Platform Administrator',
        email: targetEmail,
        phone: phone.trim() || '0800 000 0001',
        state: 'Delta State',
        city: 'Asaba',
        isVerifiedTenant: false,
        isAgent: false,
        isAdmin: true,
        isSuperAdmin: true,
        savedListingIds: [],
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('setlla_admin_auth', 'true');
        localStorage.setItem('setlla_admin_user', JSON.stringify(adminProfile));
        localStorage.removeItem('setlla_admin_accounts'); // Clear any stored legacy passwords
      }

      recordAuditLog(
        'ADMIN_OTP_VERIFIED',
        'system',
        adminProfile.id,
        adminProfile.fullName,
        adminProfile.fullName,
        `Super Admin session authenticated via OTP verification.`
      );

      onSuccess(adminProfile);
    } catch (err: any) {
      setOtpLoading(false);
      setOtpError(err?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FCF9F5] text-[#000004] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Split Two-Column Card matching sample design */}
      <div className="w-full max-w-4xl bg-white rounded-[24px] sm:rounded-[28px] md:rounded-[32px] shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col md:flex-row my-auto max-h-[min(94vh,760px)] animate-scale-up">
        
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
              Direct oversight across Delta State rentals and escrow.
            </h2>

            <p className="text-xs text-white/70 leading-relaxed">
              Super Admin authority over verified agents, tenant inspection passes, and platform governance.
            </p>
          </div>

          {/* Bottom Trust Hallmark */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
            <span>Setlla • Platform Authority</span>
            <span>Delta State</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Passwordless Authentication Form */}
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 md:p-7 lg:p-8 bg-white overflow-y-auto max-h-[min(94vh,760px)] no-scrollbar">
          <div>
            {/* Header: Brand Logo & Back to Live Marketplace */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
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
                className="text-xs text-[#70798C] hover:text-[#000004] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors py-1 px-2.5 rounded-lg hover:bg-[#F4F5F7]"
              >
                <Globe className="w-3.5 h-3.5 text-[#F95700]" />
                <span className="hidden sm:inline">Explore Feed</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-3">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#000004] tracking-tight">
                {step === 'otp' ? 'Verify Authorization' : 'Super Admin Access'}
              </h1>
              <p className="text-xs sm:text-sm text-[#70798C] mt-0.5">
                {step === 'otp'
                  ? 'Enter the 8-digit authorization code sent to your email'
                  : 'Passwordless authentication via One-Time Passcode (OTP)'}
              </p>
            </div>

            <div className="w-full h-px bg-[#E5E7EB] mb-4" />

            {/* 1. STEP 1: PASSWORDLESS OTP REQUEST FORM */}
            {step === 'form' && (
              <form onSubmit={handleRequestOTP} className="space-y-3.5">
                {/* Administrator Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#70798C] mb-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@setlla.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all"
                    />
                  </div>
                </div>

                {/* Administrator Profile Details (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#70798C] mb-1">
                      Administrator Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#70798C] mb-1">
                      Direct Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#000004] placeholder:text-[#70798C]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {sendError && (
                  <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-xs text-[#F0544F] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={sendLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-2"
                >
                  {sendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending authorization code...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Send Authorization Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. STEP 2: OTP VERIFICATION VIEW */}
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

                {/* Discreet Verification Status Notice */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#000004] text-white flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#000004]">
                        Authorization code dispatched
                      </p>
                      <p className="text-[11px] text-[#70798C]">
                        Check your inbox or spam folder for the 8-digit passcode.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#70798C] text-[10px] font-semibold shrink-0">
                    Expires in 10m
                  </span>
                </div>

                {/* 8-Digit OTP Inputs (4-4 Grouped with Visual Divider) */}
                <div>
                  <label className="block text-center text-xs font-semibold text-[#70798C] mb-2.5">
                    Input OTP Verification Code
                  </label>
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {/* First 4 digits */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            digitInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpDigits[idx]}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={handleDigitPaste}
                          className="w-8 sm:w-10 h-11 sm:h-13 text-center text-base sm:text-lg font-mono font-black text-[#000004] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/15 focus:outline-none transition-all"
                        />
                      ))}
                    </div>

                    {/* Divider Dash */}
                    <span className="text-[#70798C] font-black text-sm sm:text-base select-none px-0.5">
                      –
                    </span>

                    {/* Second 4 digits */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[4, 5, 6, 7].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            digitInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpDigits[idx]}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={handleDigitPaste}
                          className="w-8 sm:w-10 h-11 sm:h-13 text-center text-base sm:text-lg font-mono font-black text-[#000004] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/15 focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {otpError && (
                  <div className="p-3 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-xs text-[#F0544F] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#F0544F] shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={otpLoading || otpDigits.join('').length < 6}
                  onClick={() => executeVerifyOTP()}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                      Resend authorization code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Assurance Footnote */}
          <div className="pt-3.5 border-t border-[#E5E7EB] text-center text-xs text-[#70798C] mt-3.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#70798C]">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Passwordless Security Standard • Authorized Delta State Operators Only</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
