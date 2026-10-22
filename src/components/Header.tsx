import React from 'react';
import { 
  Hourglass, 
  ShieldCheck, 
  ShieldAlert,
  User, 
  Compass, 
  LayoutDashboard, 
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
  isAdminAuthenticated?: boolean;
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
  isAdminAuthenticated = false,
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
      alert("To install Setlla on iOS:\n1. Tap the Safari Share button (⎋)\n2. Tap 'Add to Home Screen' (➕)");
      return;
    }
    await installApp();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity & Active User Role indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onChangeRole('tenant');
              onChangeUserView('feed');
            }}
            className="flex items-center gap-2 focus:outline-none group cursor-pointer text-left"
            title="Setlla - Direct Rentals & Inspections"
            aria-label="Setlla Home"
          >
            <img 
              src="/images/setlla-logo.png" 
              alt="Setlla" 
              className="h-[18px] sm:h-[20px] w-auto object-contain transition-transform group-hover:scale-[1.02]" 
            />
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#B45309] border border-[#F59E0B]/30 hidden xs:inline-block">
              Delta State
            </span>
          </button>
        </div>

        {/* Center / Right: Squircle Navigation Island */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-[22px] bg-[#FCF9F5] border border-[#E5E7EB] shadow-xs">
          {/* TAB 1: User Dashboard (Only rendered for non-agents / seekers / tenants when authenticated) */}
          {isAuthenticated && currentRole !== 'agent' && !currentUser.isAgent && (
            <button
              onClick={() => {
                onChangeRole('tenant');
                onChangeUserView('dashboard');
              }}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                (currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard'
                  ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03]'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
              }`}
              aria-label="User Dashboard"
              title="User Dashboard"
            >
              <LayoutDashboard className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${(currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard' ? 'text-white' : ''}`} />
              
              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                My Dashboard
              </span>

              {(currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard' && (
                <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
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
              onChangeRole('tenant');
              onChangeUserView('feed');
            }}
            className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
              ((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || !isAuthenticated
                ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03]'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
            }`}
            aria-label="Explore"
            title="Explore"
          >
            <Compass className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || !isAuthenticated ? 'text-white' : ''}`} />
            
            {/* Desktop Label */}
            <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
              Explore
            </span>

            {(((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || !isAuthenticated) && (
              <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            )}

            {/* Mobile Tooltip */}
            <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Explore
            </span>
          </button>

          {/* TAB 3: Inspections (CalendarCheck with Badge) - Only rendered for seekers/tenants when authenticated */}
          {isAuthenticated && currentRole !== 'agent' && !currentUser.isAgent && (
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
          {isAuthenticated && (currentRole === 'agent' || currentUser.isAgent) && (
            <button
              onClick={() => onChangeRole('agent')}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                currentRole === 'agent'
                  ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.03]'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
              }`}
              aria-label="Agent Portal"
              title="Agent Portal"
            >
              <ShieldCheck className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${currentRole === 'agent' ? 'text-amber-300' : 'text-[#70798C]'}`} />
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                Agent Portal
              </span>
              {currentRole === 'agent' && (
                <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
              )}
            </button>
          )}

          {/* TAB 4.5: Super Admin Console (Rendered when user is Admin or currentRole === 'admin') */}
          {(currentUser.isAdmin || currentUser.isSuperAdmin || currentRole === 'admin') && (
            <button
              onClick={() => onChangeRole('admin')}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-[#000004] to-[#1f2937] text-white shadow-md border-2 border-amber-400/50 ring-2 ring-amber-400/20 z-10 scale-[1.03]'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 hover:shadow-xs'
              }`}
              aria-label="Super Admin Console"
              title="Super Admin Console"
            >
              <ShieldAlert className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${currentRole === 'admin' ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className="hidden md:inline font-bold text-xs whitespace-nowrap">
                Super Admin
              </span>
              {currentRole === 'admin' && (
                <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
              )}
            </button>
          )}

          {/* TAB 5: User Profile (when authenticated) or Sign In + Signup (when unauthenticated) */}
          {!isAuthenticated && currentRole !== 'admin' ? (
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
          ) : currentRole === 'admin' && !isAdminAuthenticated ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-[14px] sm:rounded-[16px] bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Admin Portal</span>
            </div>
          ) : (
            <button
              onClick={onOpenProfile}
              className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 transition-all duration-200 active:scale-95 group cursor-pointer shrink-0"
              aria-label={currentRole === 'admin' ? 'Super Admin' : (currentUser.isAgent || currentRole === 'agent') ? 'Agent Portal' : 'Profile'}
              title={currentRole === 'admin' ? 'Super Admin' : (currentUser.isAgent || currentRole === 'agent') ? 'Agent Portal' : 'Profile'}
            >
              {currentRole === 'admin' ? (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                  SA
                </div>
              ) : currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#342A21]/20"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#342A21] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {currentUser.fullName
                    ? currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'SA'}
                </div>
              )}

              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                {currentRole === 'admin' ? 'Super Admin' : currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Admin'}
              </span>

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {currentRole === 'admin' ? 'Super Admin' : (currentUser.isAgent || currentRole === 'agent') ? `Agent Portal (${currentUser.fullName})` : currentUser.fullName || 'Admin'}
              </span>
            </button>
          )}

          {/* TAB 6: Quiet Unobtrusive Install App (Only shown on large desktop screens when not installed) */}
          {!isStandalone && (
            <button
              onClick={handleHeaderInstall}
              className="hidden lg:flex relative md:px-3 md:h-11 rounded-[18px] items-center justify-center gap-1.5 bg-[#342A21]/5 hover:bg-[#342A21]/10 text-[#342A21] border border-[#342A21]/20 transition-all duration-200 active:scale-95 group cursor-pointer shadow-2xs shrink-0"
              aria-label="Install App"
              title="Install Setlla App (PWA)"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#342A21] shrink-0" />
              <span className="hidden md:inline font-bold text-xs whitespace-nowrap text-[#342A21]">
                Install App
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
