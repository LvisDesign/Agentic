import React, { useState } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  CreditCard, 
  ChevronRight, 
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserRole, BookingRecord } from '../../types/marketplace';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  activeBookings,
  onOpenMyPasses,
}) => {
  const [showArchitectureGuide, setShowArchitectureGuide] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#000004] text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#000004]">
                User Profile
              </h3>
              <p className="text-xs text-[#70798C]">
                DeltaRent Member
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs no-scrollbar">
          {/* User Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-blue-50/30 border border-[#275DAD]/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#275DAD] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                CO
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#000004]">Chinedu Okafor</span>
                </div>
                <div className="text-[11px] text-[#70798C] flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#275DAD]" /> Asaba, Delta</span>
                  <span>•</span>
                  <span>Tenant Tier 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#70798C]">
              Member Credentials
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#275DAD]" /> Phone
              </span>
              <span className="font-semibold text-[#000004]">+234 803 891 0293</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#275DAD]" /> Email
              </span>
              <span className="font-semibold text-[#000004]">chinedu.okafor@gmail.com</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#275DAD]" /> NIN / Identity
              </span>
              <span className="font-semibold text-[#000004]">NIN-2910-***-9021</span>
            </div>
          </div>

          {/* Active Inspection Passes Quick View */}
          <div 
            onClick={() => {
              onClose();
              onOpenMyPasses();
            }}
            className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#275DAD] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#275DAD]/10 text-[#275DAD] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#000004] group-hover:text-[#275DAD] transition-colors">
                  My Inspection Passes
                </div>
                <div className="text-[11px] text-[#70798C]">
                  {activeBookings.length} booking records on file
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#70798C] group-hover:translate-x-0.5 group-hover:text-[#275DAD] transition-all" />
          </div>

          {/* Role Switching */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#000004]">Active Role</div>
                <div className="text-[11px] text-[#70798C]">
                  Currently in <span className="font-semibold capitalize text-[#000004]">{currentRole} Mode</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onChangeRole(currentRole === 'seeker' ? 'agent' : 'seeker');
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
            >
              Switch to {currentRole === 'seeker' ? 'Agent' : 'Seeker'}
            </button>
          </div>

          {/* Collapsible Architecture Guide */}
          <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
              className="w-full p-3.5 text-left bg-[#FCF9F5] flex items-center justify-between font-bold text-xs text-[#000004] hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span>Platform Flow & Architecture Guide</span>
              <ChevronRight className={`w-4 h-4 text-[#70798C] transition-transform ${showArchitectureGuide ? 'rotate-90' : ''}`} />
            </button>

            {showArchitectureGuide && (
              <div className="p-3.5 bg-white space-y-3 border-t border-[#E5E7EB] text-xs">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#275DAD] text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Zero-Conflict Time Slotting</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Strict capacity limits per property prevent overcrowding and agent exhaustion.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#275DAD] text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Fair First-Come Standby Queue</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">If a slot fills up, applicants queue. Declining automatically advances next-in-line.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#275DAD] text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Paystack Inspection Lock</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Commitment fees lock the inspection pass and reveal agent coordinates & phone.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between">
          <span className="text-[11px] text-[#70798C]">Delta State Marketplace Engine</span>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
