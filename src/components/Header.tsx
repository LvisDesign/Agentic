import React from 'react';
import { 
  Building2, 
  Hourglass, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Compass,
  Ticket
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

  const totalActivePasses = confirmedPassesCount + pendingCount;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-[14px] bg-[#000004] flex items-center justify-center text-white shadow-xs border border-white/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-[#000004] tracking-tight">
                DeltaRent
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#275DAD]/10 text-[#275DAD] hidden xs:inline-block">
                Delta State
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Calendly-Style Squircle Navigation Island */}
        <div className="flex items-center gap-1.5 p-1 rounded-[22px] bg-[#FCF9F5] border border-[#E5E7EB] shadow-xs">
          {/* TAB 1: Seeker Property Feed */}
          <button
            onClick={() => onChangeRole('seeker')}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] flex items-center justify-center transition-all duration-200 active:scale-95 group ${
              currentRole === 'seeker'
                ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.04]'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
            }`}
            aria-label="Seeker Property Feed"
            title="Seeker Property Feed"
          >
            <Compass className={`w-4 h-4 sm:w-5 sm:h-5 ${currentRole === 'seeker' ? 'text-white' : ''}`} />
            
            {/* Calendly Signature Downward Teardrop Indicator when Active */}
            {currentRole === 'seeker' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            )}

            {/* Hover Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Seeker Feed
            </span>
          </button>

          {/* TAB 2: Queue & Passes (Hourglass / Ticket with Badge) */}
          <button
            onClick={onOpenMyPasses}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] flex items-center justify-center transition-all duration-200 active:scale-95 group ${
              totalActivePasses > 0
                ? 'bg-white hover:bg-emerald-50/50 text-[#000004] border border-emerald-200 shadow-xs'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80'
            }`}
            aria-label="Inspection Passes & Queue"
            title="Inspection Passes & Queue"
          >
            <Hourglass className={`w-4 h-4 sm:w-5 sm:h-5 ${totalActivePasses > 0 ? 'text-emerald-700' : ''}`} />

            {/* Notification Badge Pip */}
            {totalActivePasses > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse-subtle">
                {totalActivePasses}
              </span>
            )}

            {/* Hover Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              {totalActivePasses > 0 ? `${totalActivePasses} in Queue/Passes` : 'My Passes'}
            </span>
          </button>

          {/* TAB 3: Agent Management Portal */}
          <button
            onClick={() => onChangeRole('agent')}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] flex items-center justify-center transition-all duration-200 active:scale-95 group ${
              currentRole === 'agent'
                ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.04]'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
            }`}
            aria-label="Agent Portal"
            title="Agent Portal"
          >
            <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${currentRole === 'agent' ? 'text-emerald-300' : ''}`} />

            {/* Calendly Signature Downward Teardrop Indicator when Active */}
            {currentRole === 'agent' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            )}

            {/* Hover Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Agent Portal
            </span>
          </button>

          {/* TAB 4: System Architecture & Concurrency Rules Guide */}
          <button
            onClick={onOpenGuide}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] flex items-center justify-center bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 transition-all duration-200 active:scale-95 group"
            aria-label="Flow Guide"
            title="Flow Guide"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />

            {/* Hover Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Flow Guide
            </span>
          </button>

          {/* TAB 5: Desktop Mobile Frame Emulator Toggle (hidden on small screens) */}
          <button
            onClick={onToggleMobileFrame}
            className={`hidden md:flex relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] items-center justify-center transition-all duration-200 active:scale-95 group ${
              isMobileFrame
                ? 'bg-blue-50 text-[#275DAD] border border-blue-200'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80'
            }`}
            aria-label={isMobileFrame ? "Switch to Fullscreen Feed" : "Switch to Mobile Device Frame"}
            title={isMobileFrame ? "Switch to Fullscreen Feed" : "Switch to Mobile Device Frame"}
          >
            {isMobileFrame ? (
              <Monitor className="w-4 h-4 text-[#275DAD]" />
            ) : (
              <Smartphone className="w-4 h-4 text-[#70798C] group-hover:text-[#000004]" />
            )}

            {/* Hover Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              {isMobileFrame ? 'Fullscreen' : 'Phone Frame'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
