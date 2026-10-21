import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Lock, 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#342A21] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#000004]">
                Setlla Architecture Guide
              </h3>
              <p className="text-xs text-[#70798C]">
                How the Nigerian Property & Inspection Engine Works
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#342A21] text-white font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <h4 className="font-bold text-[#000004] text-sm">
                Continuous Speed-Based Rental Feed
              </h4>
              <p className="text-[#70798C] mt-1 leading-relaxed">
                Browse properties in Asaba, Warri, Abraka, Ughelli, and Sapele. Every listing displays high-aspect media, native house walkthrough videos and photos uploaded by verified agents, and a 100% transparent fee breakdown schedule.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#342A21] text-white font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <h4 className="font-bold text-[#000004] text-sm flex items-center gap-1.5">
                <span>Agent Concurrency Cap & Queue Engine</span>
                <span className="text-[10px] bg-[#F0544F]/10 text-[#F0544F] px-1.5 py-0.2 rounded font-bold">
                  Agents Capped at 5/hr
                </span>
              </h4>
              <p className="text-[#70798C] mt-1 leading-relaxed">
                Tenants can book as many property inspections as they want. Only <strong>agents are restricted to 5 bookings per time window</strong> to ensure agents don't overcrowd showings or waste the valuable time of tenants.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#342A21] text-white font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <h4 className="font-bold text-[#000004] text-sm">
                Agent Acceptance Gate & Auto-Advancement
              </h4>
              <p className="text-[#70798C] mt-1 leading-relaxed">
                Agents review incoming bookings via the <strong>Agent Portal</strong>. Once an agent accepts (or if an active slot drops), queued applicants auto-advance to payment clearance.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#342A21] text-white font-bold flex items-center justify-center shrink-0">
              4
            </span>
            <div>
              <h4 className="font-bold text-[#000004] text-sm">
                100% Free & Unlimited Bookings for Tenants
              </h4>
              <p className="text-[#70798C] mt-1 leading-relaxed">
                Tenants reserve physical property inspection slots completely free of charge with zero booking fees and no quota limits. The 5-tenant cap is strictly enforced on agents to prevent crowded showings and schedule delays.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
              5
            </span>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Confirmed Passes & Paid Advert Sponsorships
              </h4>
              <p className="text-emerald-800 mt-1 leading-relaxed">
                Confirmed passes instantly reveal the agent's direct phone number so you can call directly or copy their number to coordinate the showing meeting point. Paystack payment checkout is dedicated exclusively for promoting sponsored adverts.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF9F5]">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs shadow-xs"
          >
            Start Exploring Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};
