import React from 'react';
import { 
  Building2, 
  Hourglass, 
  ShieldCheck, 
  User, 
  Compass, 
  LayoutDashboard, 
  UserCheck, 
  CalendarCheck, 
  UserPlus, 
  Download 
} from 'lucide-react';
import { UserRole, BookingRecord, UserProfile } from '../types/marketplace';
import { usePWA } from '../utils/pwa';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  userView: 'dashboard' | 'feed';
  onChangeUserView: (view: 'dashboard' | 'feed') => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
  onOpenProfile: () => void;
  currentUser: UserProfile;
  onOpenBecomeAgent: () => void;
  onOpenSignup: () => void;
  onOpenLogin?: () => void;
  isAuthenticated: boolean;
  onOpenAgentSignup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  userView,
  onChangeUserView,
  activeBookings,
  onOpenMyPasses,
  onOpenProfile,
  currentUser,
  onOpenBecomeAgent,
  onOpenSignup,
  onOpenLogin,
  isAuthenticated,
  onOpenAgentSignup,
}) => {
  const confirmedPassesCount = activeBookings.filter(
    (b) => b.status === 'CONFIRMED_UNLOCKED'
  ).length;

  const pendingCount = activeBookings.filter(
    (b) => b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED' || b.status === 'ACCEPTED_PENDING_PAYMENT'
  ).length;

  const totalActivePasses = confirmedPassesCount + pendingCount;

  // Unobtrusive Header PWA Install hook
  const { isStandalone, isIOS, installApp } = usePWA();

  const handleHeaderInstall = async () => {
    if (isIOS) {
      alert("To install DeltaRent on iOS:\n1. Tap the Safari Share button (⎋)\n2. Tap 'Add to Home Screen' (➕)");
      return;
    }
    await installApp();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity & Active User Role indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-[14px] bg-[#000004] flex items-center justify-center text-white shadow-xs border border-white/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-[#000004] tracking-tight">
                DeltaRent
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#342A21]/10 text-[#342A21] hidden xs:inline-block">
                Delta State
              </span>
              {!isAuthenticated ? (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-[#70798C] border border-slate-200 hidden sm:inline-flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  Guest Mode
                </span>
              ) : currentRole === 'seeker' ? (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5" />
                  Tenant Mode
                </span>
              ) : (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#000004] text-amber-300 border border-amber-400/30 hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Agent Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Squircle Navigation Island */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-[22px] bg-[#FCF9F5] border border-[#E5E7EB] shadow-xs">
          {/* TAB 1: User Dashboard (Only rendered when authenticated) */}
          {isAuthenticated && (
            <button
              onClick={() => {
                onChangeRole('seeker');
                onChangeUserView('dashboard');
              }}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                currentRole === 'seeker' && userView === 'dashboard'
                  ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03]'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
              }`}
              aria-label="User Dashboard"
              title="User Dashboard"
            >
              <LayoutDashboard className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${currentRole === 'seeker' && userView === 'dashboard' ? 'text-white' : ''}`} />
              
              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                My Dashboard
              </span>

              {currentRole === 'seeker' && userView === 'dashboard' && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
              )}

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                Dashboard
              </span>
            </button>
          )}

          {/* TAB 2: Seeker Live Snap Feed */}
          <button
            onClick={() => {
              onChangeRole('seeker');
              onChangeUserView('feed');
            }}
            className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
              (currentRole === 'seeker' && userView === 'feed') || !isAuthenticated
                ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03]'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
            }`}
            aria-label="Seeker Feed"
            title="Seeker Feed"
          >
            <Compass className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${(currentRole === 'seeker' && userView === 'feed') || !isAuthenticated ? 'text-white' : ''}`} />
            
            {/* Desktop Label */}
            <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
              Live Feed
            </span>

            {((currentRole === 'seeker' && userView === 'feed') || !isAuthenticated) && (
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            )}

            {/* Mobile Tooltip */}
            <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Live Feed
            </span>
          </button>

          {/* TAB 3: Inspections (CalendarCheck with Badge) - Only rendered when authenticated */}
          {isAuthenticated && (
            <button
              onClick={onOpenMyPasses}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3.5 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                totalActivePasses > 0
                  ? 'bg-white hover:bg-emerald-50/50 text-[#000004] border border-emerald-200 shadow-xs'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80'
              }`}
              aria-label="My Inspections"
              title="My Inspections"
            >
              <CalendarCheck className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${totalActivePasses > 0 ? 'text-emerald-700' : ''}`} />

              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                Inspections
              </span>

              {/* Notification Badge */}
              {totalActivePasses > 0 && (
                <>
                  <span className="md:hidden absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse-subtle">
                    {totalActivePasses}
                  </span>
                  <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs animate-pulse-subtle ml-0.5">
                    {totalActivePasses}
                  </span>
                </>
              )}

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {totalActivePasses > 0 ? `${totalActivePasses} Inspections` : 'My Inspections'}
              </span>
            </button>
          )}

          {/* TAB 4: Agent Management Portal (Only visible when logged in as an Agent) */}
          {isAuthenticated && currentRole === 'agent' && (
            <button
              onClick={() => onChangeRole('agent')}
              className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03] shrink-0"
              aria-label="Agent Portal"
              title="Agent Portal"
            >
              <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 text-amber-300" />
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                Agent Portal
              </span>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            </button>
          )}

          {/* TAB 5: User Profile (when authenticated) or Sign In + Signup (when unauthenticated) */}
          {!isAuthenticated ? (
            <>
              <button
                onClick={onOpenLogin || onOpenSignup}
                className="relative h-9 sm:h-10 md:h-11 px-2.5 sm:px-3 md:px-3.5 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-[#000004] hover:bg-[#1f2937] text-white transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs shrink-0"
                aria-label="Sign In"
                title="Sign In"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-xs whitespace-nowrap">
                  Sign In
                </span>
              </button>

              <button
                onClick={onOpenSignup}
                className="relative h-9 sm:h-10 md:h-11 px-2.5 sm:px-3.5 md:px-4 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs shrink-0"
                aria-label="Signup"
                title="Signup"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-bold text-xs whitespace-nowrap">
                  Signup
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenProfile}
              className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 transition-all duration-200 active:scale-95 group cursor-pointer shrink-0"
              aria-label="Profile"
              title="Profile"
            >
              <div className="w-5 h-5 rounded-full bg-[#342A21] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {currentUser.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                {currentUser.fullName.split(' ')[0]}
              </span>

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {currentUser.fullName}
              </span>
            </button>
          )}

          {/* TAB 6: Quiet Unobtrusive Install App (Only shown on large desktop screens when not installed) */}
          {!isStandalone && (
            <button
              onClick={handleHeaderInstall}
              className="hidden lg:flex relative md:px-3 md:h-11 rounded-[18px] items-center justify-center gap-1.5 bg-[#275DAD]/10 hover:bg-[#275DAD]/20 text-[#275DAD] border border-[#275DAD]/30 transition-all duration-200 active:scale-95 group cursor-pointer shadow-2xs shrink-0"
              aria-label="Install App"
              title="Install DeltaRent App (PWA)"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#275DAD] shrink-0" />
              <span className="hidden md:inline font-bold text-xs whitespace-nowrap text-[#275DAD]">
                Install App
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
