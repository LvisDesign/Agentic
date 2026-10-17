import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  CheckCircle2, 
  Building2,
  ArrowRight
} from 'lucide-react';
import { DeltaCity, PropertyType, UserProfile } from '../../types/marketplace';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const DELTA_CITIES: DeltaCity[] = [
  'Asaba',
  'Warri',
  'Ughelli',
  'Sapele',
  'Agbor',
  'Abraka',
  'Effurun',
  'Oleh'
];

const PROPERTY_TYPES: PropertyType[] = [
  'Self-contain',
  'Single Room',
  'Bedseater',
  '2-Bedroom Flat',
  '3-Bedroom Flat',
  'Duplex / Semi-Detached'
];

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [city, setCity] = useState<DeltaCity | string>(currentUser.city || 'Asaba');
  const [propertyType, setPropertyType] = useState<PropertyType | string>(
    currentUser.preferredPropertyType || '2-Bedroom Flat'
  );
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    const updated: UserProfile = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city,
      preferredPropertyType: propertyType,
      isVerifiedTenant: true,
      isAgent: false, // Normal user signup is not an agent!
    };

    setIsSuccess(true);
    setTimeout(() => {
      onUpdateUser(updated);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#000004] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-lg font-bold text-[#000004]">
                  {mode === 'signup' ? 'Tenant Registration' : 'Tenant Sign In'}
                </h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  User Account
                </span>
              </div>
              <p className="text-xs text-[#70798C]">
                Get immediate access to verified agent rentals in Delta State
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

        {/* Tab switch between signup and login */}
        <div className="px-5 pt-4 pb-1 flex border-b border-[#E5E7EB] bg-slate-50/50">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-[#000004] text-[#000004]'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            Create Tenant Account
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-[#000004] text-[#000004]'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            Existing Sign In
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-display text-lg font-bold text-[#000004]">
              Welcome, {fullName}!
            </h4>
            <p className="text-xs text-[#70798C] max-w-xs mx-auto">
              Your tenant profile is active. You have full, unrestricted access to all apartments already uploaded by verified Delta agents!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs no-scrollbar">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Chinedu Okafor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9.5 pr-3.5 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="0803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#70798C] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#000004] text-xs text-[#000004] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
                <span>Primary City in Delta State</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as DeltaCity)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#000004] outline-none"
              >
                {DELTA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}, Delta State</option>
                ))}
              </select>
            </div>

            {/* Property Type preference */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-[#342A21]" />
                <span>Preferred Apartment Type</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#000004] outline-none"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* Notice: Not an agent */}
            <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center gap-2 text-[11px] text-[#70798C]">
              <Building2 className="w-4 h-4 text-[#70798C] shrink-0" />
              <span>
                Standard Tenant Profile. You can browse and book agent listings for free. An option to register as an agent is always available in your profile.
              </span>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#70798C] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <span>{mode === 'signup' ? 'Sign Up & Browse Apartments' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
