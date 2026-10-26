import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  RotateCw,
  KeyRound,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  loginAdvertiser, 
  signupAdvertiser, 
  AdvertiserUser,
  AdvertiserSignupPayload,
  sendAdvertiserEmailOTP,
  verifyAdvertiserEmailOTP
} from '../../services/advertiserAuthService';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';

interface AdvertiserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AdvertiserUser) => void;
  initialMode?: 'login' | 'signup';
  initialEmail?: string;
  initialName?: string;
  initialPhone?: string;
  initialCompanyName?: string;
}

export const AdvertiserAuthModal: React.FC<AdvertiserAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  initialEmail = '',
  initialName = '',
  initialPhone = '',
  initialCompanyName = '',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  
  // Credentials
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  
  // Signup fields (pre-filled with registered user data if available)
  const [companyName, setCompanyName] = useState(initialCompanyName || initialName);
  const [contactName, setContactName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [whatsapp, setWhatsapp] = useState(initialPhone);
  const [industry, setIndustry] = useState('Real Estate & Properties');
  const [operatingCity, setOperatingCity] = useState('Asaba');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('credentials');
      setOtpCode('');
      setErrorMsg(null);
      setSuccessNotice(null);
      if (initialEmail) setEmail(initialEmail);
      if (initialName) {
        setContactName(initialName);
        if (!companyName) setCompanyName(initialCompanyName || initialName);
      }
      if (initialPhone) {
        setPhone(initialPhone);
        if (!whatsapp) setWhatsapp(initialPhone);
      }
    }
  }, [isOpen, initialMode, initialEmail, initialName, initialPhone, initialCompanyName]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // STEP 1: Validate email + password and dispatch Email OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please provide a valid corporate or registered email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    if (mode === 'signup') {
      if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
        setErrorMsg('Please complete company / brand name, contact person, and phone number.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: AdvertiserSignupPayload = {
        companyName: companyName.trim() || cleanEmail.split('@')[0],
        contactName: contactName.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone.trim() || '0800 000 0000',
        whatsapp: whatsapp.trim() || phone.trim(),
        industry,
        operatingCity,
        websiteUrl: websiteUrl.trim() || undefined,
        password: password.trim(),
      };

      const result = await sendAdvertiserEmailOTP(cleanEmail, mode, password.trim(), payload);
      setDispatchedOtp(result.testOtp);
      setStep('otp');
      setCountdown(30);
      setSuccessNotice(`Verification code sent to ${cleanEmail}. Check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification code. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const payload: AdvertiserSignupPayload = {
        companyName: companyName.trim() || email.split('@')[0],
        contactName: contactName.trim() || email.split('@')[0],
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '0800 000 0000',
        whatsapp: whatsapp.trim() || phone.trim(),
        industry,
        operatingCity,
        websiteUrl: websiteUrl.trim() || undefined,
        password: password.trim(),
      };
      const result = await sendAdvertiserEmailOTP(email.trim().toLowerCase(), mode, password.trim(), payload);
      setDispatchedOtp(result.testOtp);
      setCountdown(30);
      setSuccessNotice(`New verification code sent to ${email.trim()}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and grant Customer Ads Dashboard access
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await verifyAdvertiserEmailOTP(email.trim().toLowerCase(), cleanOtp);
      
      // Celebrate successful verification
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#342A21', '#F95700', '#10B981', '#FCF9F5']
        });
      } catch (_) {}

      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSeedLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await loginAdvertiser('partners@asabasolar.ng', 'solar123');
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto font-body">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-card border border-[#342A21]/15 overflow-hidden my-auto animate-scale-up">
        
        {/* Header Bar */}
        <div className="bg-[#FCF9F5] p-5 sm:p-7 border-b border-[#342A21]/10 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Customer Ads Portal</span>
          </div>

          <h2 className="font-display text-2xl text-[#342A21] font-normal tracking-tight">
            {step === 'otp'
              ? 'Verify Your Email OTP'
              : mode === 'login'
              ? 'Customer Ads Dashboard Sign In'
              : 'Register Customer Ads Account'}
          </h2>
          <p className="text-xs text-[#70798C] mt-1 leading-relaxed">
            {step === 'otp'
              ? `We sent a 6-digit verification code to ${email}. Enter it below to unlock your dashboard.`
              : mode === 'login'
              ? 'Access your dedicated advertiser dashboard to create campaigns, fund your wallet, track leads, and manage ads.'
              : 'Available for all registered agents, landlords, and brand partners to promote rentals and businesses.'}
          </p>

          {/* Mode Switcher Tabs (Only visible on credentials step) */}
          {step === 'credentials' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#342A21]/10">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#342A21] text-white shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#342A21] text-white shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Demo OTP Broadcast Banner */}
        {dispatchedOtp && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Simulated Email OTP: <strong className="font-mono text-sm tracking-wider text-[#342A21] bg-amber-200/70 px-2 py-0.5 rounded">{dispatchedOtp}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(dispatchedOtp)}
              className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* STEP 1 FORM: Email + Password & Signup Details */}
        {step === 'credentials' ? (
          <form onSubmit={handleSendOTP} className="p-4 sm:p-7 space-y-4 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Company / Brand Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Realty or Solar Hub"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Contact Person Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Victor Ossai"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Industry Sector</label>
                    <AdminCustomSelect
                      value={industry}
                      onChange={(val) => setIndustry(val)}
                      options={[
                        { value: 'Real Estate & Properties', label: 'Real Estate & Properties' },
                        { value: 'Clean Energy & Solar Power', label: 'Solar & Energy Solutions' },
                        { value: 'Interior Decor & Furnishing', label: 'Interior Decor & Furnishing' },
                        { value: 'Hospitality & Shortlets', label: 'Hospitality & Shortlets' },
                        { value: 'Logistics & Moving', label: 'Logistics & Moving' },
                        { value: 'Corporate Services', label: 'Corporate Brand' },
                      ]}
                      variant="form"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Primary Operating City</label>
                    <AdminCustomSelect
                      value={operatingCity}
                      onChange={(val) => setOperatingCity(val)}
                      options={[
                        { value: 'Asaba', label: 'Asaba' },
                        { value: 'Warri', label: 'Warri' },
                        { value: 'Abraka', label: 'Abraka' },
                        { value: 'Network Wide', label: 'Network Wide' },
                      ]}
                      variant="form"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-[#342A21] block mb-1">Account Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Official Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0803 555 1234"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">WhatsApp Business</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0803 555 1234"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#342A21] block mb-1">
                {mode === 'signup' ? 'Create Password *' : 'Account Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
              <p className="text-[10px] text-[#70798C] mt-1">
                An email verification OTP will be sent to confirm your identity before dashboard access.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Generating Verification OTP...</span>
                ) : (
                  <>
                    <span>Send Email Verification OTP</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#70798C]">
              <span>Testing with pre-configured partner?</span>
              <button
                type="button"
                onClick={handleQuickSeedLogin}
                className="text-[#342A21] font-semibold hover:underline cursor-pointer text-left sm:text-right"
              >
                Demo: Asaba Solar Ltd
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2 FORM: 6-Digit Email OTP Verification */
          <form onSubmit={handleVerifyOTP} className="p-4 sm:p-7 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <div className="text-center py-2 space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-[#342A21] font-semibold">
                Enter 6-Digit Verification Code
              </h3>
              <p className="text-xs text-[#70798C] max-w-xs mx-auto">
                Check your email inbox for the verification OTP sent to <strong className="text-[#342A21]">{email}</strong>.
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full py-3.5 px-4 bg-[#FCF9F5] border-2 border-[#342A21]/30 rounded-2xl text-center text-2xl font-mono font-bold tracking-[0.5em] text-[#000004] focus:outline-none focus:border-[#342A21] transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setErrorMsg(null); }}
                className="text-[#70798C] hover:text-[#342A21] flex items-center gap-1 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isLoading}
                className="text-amber-800 hover:text-amber-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying Code & Unlocking Dashboard...</span>
                ) : (
                  <>
                    <span>Verify & Access Ads Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
