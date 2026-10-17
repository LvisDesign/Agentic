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
  ChevronRight, 
  Building2, 
  AlertCircle,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { UserRole, BookingRecord, UserProfile } from '../../types/marketplace';
import { formatNigerianPhone } from '../../utils/formatters';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
  currentUser: UserProfile;
  onOpenBecomeAgent: () => void;
  onOpenSignup: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  activeBookings,
  onOpenMyPasses,
  currentUser,
  onOpenBecomeAgent,
  onOpenSignup,
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
                Tenant Profile
              </h3>
              <p className="text-xs text-[#70798C]">
                DeltaRent Member Account
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-[#342A21]/5 border border-[#342A21]/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#342A21] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                {currentUser.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-sm text-[#000004]">
                    {currentUser.fullName}
                  </span>
                  {/* NOT AN AGENT EXPLICIT BADGE */}
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200/80 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                    Not an Agent
                  </span>
                </div>
                <div className="text-[11px] text-[#70798C] flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#342A21]" /> {currentUser.city}, Delta
                  </span>
                  <span>•</span>
                  <span>Verified Tenant</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenSignup();
              }}
              className="text-[11px] text-[#342A21] font-semibold hover:underline"
            >
              Edit
            </button>
          </div>

          {/* Account Role & Scope Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#000004] text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                Account Type: Tenant / Seeker
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Non-Agent Account
              </span>
            </div>
            <p className="text-[11px] text-[#70798C] leading-relaxed">
              You have full, unrestricted access to browse apartments uploaded by verified Delta State agents and book as many inspections as you want. Only agents are restricted to 5 bookings per window so your time is never wasted.
            </p>
          </div>

          {/* BECOME AN AGENT OPTION CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#000004] to-[#1a2332] text-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-white">
                  Want to List Properties?
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#000004]">
                Upgrade
              </span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Register as a DeltaRent Partner Agent. Upload unlimited apartments across Delta State, set strict 5-capacity inspection time slots, and dispatch directly to tenants.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenBecomeAgent();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#000004] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Apply to Become an Agent</span>
            </button>
          </div>

          {/* Contact Details */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#70798C]">
              Member Credentials
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#342A21]" /> Phone
              </span>
              <span className="font-semibold text-[#000004]">
                {formatNigerianPhone(currentUser.phone)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#F4F5F7]">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#342A21]" /> Email
              </span>
              <span className="font-semibold text-[#000004]">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#70798C] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#342A21]" /> NIN / Identity
              </span>
              <span className="font-semibold text-[#000004]">
                {currentUser.nin || 'NIN-2910-***-9021'}
              </span>
            </div>
          </div>

          {/* Active Inspection Passes Quick View */}
          <div 
            onClick={() => {
              onClose();
              onOpenMyPasses();
            }}
            className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#342A21] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#342A21]/10 text-[#342A21] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#000004] group-hover:text-[#342A21] transition-colors">
                  My Inspections
                </div>
                <div className="text-[11px] text-[#70798C]">
                  {activeBookings.length} inspection records on file
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#70798C] group-hover:translate-x-0.5 group-hover:text-[#342A21] transition-all" />
          </div>

          {/* Switch Account Trigger */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#000004]">Account Switcher</div>
                <div className="text-[11px] text-[#70798C]">
                  Sign up as a new tenant or change profile
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSignup();
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-bold text-[#000004] transition-colors cursor-pointer"
            >
              Sign Up / In
            </button>
          </div>

          {/* Switch back to Tenant View (Only shown if currently in Agent Mode) */}
          {currentRole === 'agent' && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#000004] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#000004]">Agent Mode Active</div>
                  <div className="text-[11px] text-[#70798C]">
                    Preview platform in Tenant View
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onChangeRole('seeker');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                Switch to Tenant View
              </button>
            </div>
          )}

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
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Zero-Conflict Time Slotting (Max 5/Agent)</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Tenants enjoy unlimited bookings. Agents are capped at 5 bookings per window to prevent overcrowding and ensure agents never waste your time.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Fair First-Come Standby Queue</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">If a slot fills up, applicants queue. Declining automatically advances next-in-line.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-[#000004]">Free Inspection Access</h5>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Booking is 100% free with zero fees. Paystack payment checkout is dedicated solely for advert sponsorships.</p>
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
