import React from 'react';
import { 
  Building2, 
  UserCheck, 
  Smartphone, 
  Monitor, 
  Ticket, 
  HelpCircle, 
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import { UserRole, BookingRecord } from '../types/marketplace';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  activeBookings,
  onOpenMyPasses,
  isMobileFrame,
  onToggleMobileFrame,
  onOpenGuide,
}) => {
  const confirmedPassesCount = activeBookings.filter(
    (b) => b.status === 'CONFIRMED_UNLOCKED'
  ).length;

  const pendingCount = activeBookings.filter(
    (b) => b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED' || b.status === 'ACCEPTED_PENDING_PAYMENT'
  ).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo & Delta State Tag */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#000004] flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-[#000004] tracking-tight">
                DeltaRent
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#275DAD]/10 text-[#275DAD]">
                Delta State
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Guide Trigger */}
          <button
            onClick={onOpenGuide}
            className="p-1.5 rounded-lg text-[#70798C] hover:text-[#000004] hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1 text-xs"
            title="Marketplace & Inspection Rules Guide"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[11px] font-medium">Flow Guide</span>
          </button>

          {/* Desktop Emulator Frame Toggle (hidden on mobile screen) */}
          <button
            onClick={onToggleMobileFrame}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#70798C] hover:text-[#000004] hover:bg-slate-50 transition-colors"
            title={isMobileFrame ? "Switch to Fullscreen Feed" : "Switch to Mobile Device Frame"}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#275DAD]" />
                <span className="text-[11px]">Fullscreen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#275DAD]" />
                <span className="text-[11px]">Mobile Frame</span>
              </>
            )}
          </button>

          {/* Active Passes Indicator (for Seekers) */}
          {activeBookings.length > 0 && currentRole === 'seeker' && (
            <button
              onClick={onOpenMyPasses}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors animate-pulse-subtle"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {confirmedPassesCount > 0
                  ? `${confirmedPassesCount} Unlocked Pass`
                  : `${pendingCount} In Queue`}
              </span>
            </button>
          )}

          {/* Role Toggle Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB]">
            <button
              onClick={() => onChangeRole('seeker')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'seeker'
                  ? 'bg-[#000004] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#000004]'
              }`}
            >
              Seeker Feed
            </button>

            <button
              onClick={() => onChangeRole('agent')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                currentRole === 'agent'
                  ? 'bg-[#000004] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#000004]'
              }`}
            >
              <span>Agent Portal</span>
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
