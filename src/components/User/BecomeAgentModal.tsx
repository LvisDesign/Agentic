import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import { DeltaCity } from '../../types/marketplace';
import { DELTA_CITIES } from '../../data/deltaCities';

interface BecomeAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    fullName: string;
    email?: string;
    phone: string;
    city: string;
  };
  onBecomeAgent: (agentData: {
    agencyName: string;
    cacNumber: string;
    phone: string;
    cities: string[];
  }) => void;
}

const AVAILABLE_CITIES: string[] = DELTA_CITIES.filter((c) => c !== 'All Delta Cities');

export const BecomeAgentModal: React.FC<BecomeAgentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBecomeAgent,
}) => {
  const [agencyName, setAgencyName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [businessPhone, setBusinessPhone] = useState(currentUser.phone || '');
  const [selectedCities, setSelectedCities] = useState<string[]>([currentUser.city || 'Asaba']);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? (prev.length > 1 ? prev.filter((c) => c !== city) : prev) : [...prev, city]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        onBecomeAgent({
          agencyName: agencyName.trim(),
          cacNumber: cacNumber.trim() || 'RC-APPLYING',
          phone: businessPhone.trim(),
          cities: selectedCities,
        });
        setSubmittedSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#000004] to-[#1a2332] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white">
                  Become a Partner Agent
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#000004]">
                  Partner
                </span>
              </div>
              <p className="text-xs text-white/70">
                Unlock property uploading and inspection dispatching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-display text-xl font-bold text-[#000004]">
              Account Upgraded to Partner Agent!
            </h4>
            <p className="text-xs text-[#70798C] max-w-sm mx-auto">
              Welcome, Agent {currentUser.fullName}! Your agency profile is now live. Redirecting to your Agent Management Portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs no-scrollbar">
            {/* Value Proposition Box */}
            <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-amber-200/80 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-[#000004] text-xs">
                  Why Register as a Setlla Partner Agent?
                </span>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  Tenants on Setlla have access to apartments uploaded exclusively by registered agents. As an agent, you can post apartments, set inspection time-slots, and receive direct tenant bookings.
                </p>
              </div>
            </div>

            {/* Applicant Name (Readonly) */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={currentUser.fullName}
                readOnly
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-[#70798C] text-xs font-semibold cursor-not-allowed"
              />
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1">
                Agency / Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#70798C] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Premier Properties Ltd"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#000004] focus:ring-1 focus:ring-[#000004] text-xs text-[#000004] outline-none"
                />
              </div>
            </div>

            {/* CAC Number & Business Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  CAC Number <span className="text-[10px] text-[#70798C] font-normal">(Optional / Pending)</span>
                </label>
                <div className="relative">
                  <FileCheck2 className="w-4 h-4 text-[#70798C] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. RC-1849204"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#000004] focus:ring-1 focus:ring-[#000004] text-xs text-[#000004] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#000004] mb-1">
                  Dispatch Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#70798C] absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="0803..."
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#000004] focus:ring-1 focus:ring-[#000004] text-xs text-[#000004] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Coverage Cities */}
            <div>
              <label className="block text-[11px] font-bold text-[#000004] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
                <span>Operating Cities & Hubs</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_CITIES.map((city) => {
                  const isSelected = selectedCities.includes(city);
                  return (
                    <button
                      type="button"
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#000004] text-white shadow-xs'
                          : 'bg-white border border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="agentTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#000004] focus:ring-[#000004] cursor-pointer"
              />
              <label htmlFor="agentTerms" className="text-[11px] text-[#70798C] cursor-pointer leading-tight">
                I agree to only post genuine, verified apartments with accurate pricing, honor the 5-booking cap per time window so I never waste tenants' time, and charge zero inspection booking fees.
              </label>
            </div>

            {/* Action Buttons */}
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
                disabled={isSubmitting || !agencyName.trim() || !agreedToTerms}
                className="w-2/3 py-2.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Registering Agent Profile...</span>
                ) : (
                  <>
                    <span>Submit & Upgrade to Agent</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
