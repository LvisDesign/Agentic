import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Globe,
  Briefcase
} from 'lucide-react';
import { 
  loginAdvertiser, 
  signupAdvertiser, 
  AdvertiserUser,
  AdvertiserSignupPayload 
} from '../../services/advertiserAuthService';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';

interface AdvertiserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AdvertiserUser) => void;
  initialMode?: 'login' | 'signup';
}

export const AdvertiserAuthModal: React.FC<AdvertiserAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [industry, setIndustry] = useState('Real Estate & Properties');
  const [operatingCity, setOperatingCity] = useState('Asaba');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim()) {
          setErrorMsg('Please enter your registered corporate email.');
          setIsLoading(false);
          return;
        }
        const user = await loginAdvertiser(email, password);
        onAuthSuccess(user);
        onClose();
      } else {
        if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim()) {
          setErrorMsg('Please complete company name, contact person, email, and phone number.');
          setIsLoading(false);
          return;
        }
        const payload: AdvertiserSignupPayload = {
          companyName,
          contactName,
          email,
          phone,
          whatsapp: whatsapp || phone,
          industry,
          operatingCity,
          websiteUrl,
          password,
        };
        const user = await signupAdvertiser(payload);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSeedLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await loginAdvertiser('partners@asabasolar.ng');
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
        <div className="bg-[#FCF9F5] p-6 sm:p-7 border-b border-[#342A21]/10 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Setlla Advertiser Console</span>
          </div>

          <h2 className="font-display text-2xl text-[#342A21] font-normal tracking-tight">
            {mode === 'login' ? 'Advertiser Account Log In' : 'Register Corporate Advertiser Account'}
          </h2>
          <p className="text-xs text-[#70798C] mt-1 leading-relaxed">
            {mode === 'login'
              ? 'Access your private ad dashboard, view campaign impressions, lead routing, and manage flights.'
              : 'Create a dedicated brand partner account to manage sponsored flights and receive direct tenant leads.'}
          </p>

          {/* Mode Switcher Tabs */}
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
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4 max-h-[65vh] overflow-y-auto">
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
                    placeholder="e.g. Asaba Royal Suites & Residences"
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
                    placeholder="e.g. Engr. Emeka Nwosu"
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
                      { value: 'All Delta State', label: 'Delta Wide' },
                    ]}
                    variant="form"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-[#342A21] block mb-1">Corporate Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partners@yourbrand.ng"
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
                    placeholder="0801 234 5678"
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
                  placeholder="0801 234 5678"
                  className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#342A21] block mb-1">
              Password {mode === 'login' ? '(Optional)' : '*'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#70798C] absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Ads Dashboard' : 'Complete Account Registration'}</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#70798C]">
            <span>Testing with registered brand?</span>
            <button
              type="button"
              onClick={handleQuickSeedLogin}
              className="text-[#342A21] font-semibold hover:underline cursor-pointer"
            >
              Demo: Asaba Solar Ltd
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
