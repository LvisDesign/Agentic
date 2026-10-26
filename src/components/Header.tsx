import React, { useState, useMemo } from 'react';
import { 
  Hourglass, 
  User, 
  Compass, 
  LayoutDashboard, 
  Bell, 
  UserPlus, 
  Download,
  Briefcase
} from 'lucide-react';
import { UserRole, BookingRecord, UserProfile } from '../types/marketplace';
import { usePWA } from '../utils/pwa';
import { CustomConfirmModal } from './UI/CustomConfirmModal';
import { getActiveAdvertiser } from '../services/advertiserAuthService';
import { getSavedApplications } from '../services/jobService';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  userView: 'dashboard' | 'feed' | 'partner';
  onChangeUserView: (view: 'dashboard' | 'feed' | 'partner') => void;
  activeBookings: BookingRecord[];
  onOpenMyPasses: () => void;
  onOpenProfile: () => void;
  currentUser: UserProfile;
  onOpenBecomeAgent: () => void;
  onOpenSignup: () => void;
  onOpenLogin?: () => void;
  isAuthenticated: boolean;
  onOpenAgentSignup?: () => void;
  activeRoom?: 'rentals' | 'jobs';
  onChangeRoom?: (room: 'rentals' | 'jobs') => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
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
  activeRoom = 'rentals',
  onChangeRoom = () => {},
  notificationCount,
  onOpenNotifications,
}) => {
  // Inspections count
  const confirmedPassesCount = activeBookings.filter(
    (b) => b.status === 'CONFIRMED_UNLOCKED'
  ).length;

  const pendingCount = activeBookings.filter(
    (b) => b.status === 'REQUEST_SUBMITTED' || b.status === 'QUEUED' || b.status === 'ACCEPTED_PENDING_PAYMENT'
  ).length;

  // Job applications count
  const jobApplicationsCount = useMemo(() => {
    try {
      const apps = getSavedApplications();
      if (!currentUser?.id && !currentUser?.email) return apps.length;
      return apps.filter((a) => {
        if (currentUser.id && a.applicantId === currentUser.id) return true;
        if (currentUser.email && a.applicantEmail && a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
        if (currentUser.phone && a.applicantPhone && a.applicantPhone === currentUser.phone) return true;
        return false;
      }).length;
    } catch (_) {
      return 0;
    }
  }, [currentUser]);

  const totalNotificationsCount = (notificationCount !== undefined)
    ? notificationCount
    : (confirmedPassesCount + pendingCount + jobApplicationsCount);

  // Retrieve active logged in advertiser (Customer Ads Account)
  const activeAdvertiser = getActiveAdvertiser();

  // Unobtrusive Header PWA Install hook
  const { isStandalone, isIOS, installApp } = usePWA();
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  const handleHeaderInstall = async () => {
    if (isIOS) {
      setShowIosPrompt(true);
      return;
    }
    await installApp();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-6xl mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Left: Brand Identity & Global Room Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => {
              onChangeRole('tenant');
              onChangeUserView('feed');
            }}
            className="flex items-center gap-1.5 focus:outline-none group cursor-pointer text-left shrink-0"
            title="Setlla - Direct Rentals & Jobs"
            aria-label="Setlla Home"
          >
            <img 
              src="/images/setlla-logo.png" 
              alt="Setlla" 
              className="h-[17px] sm:h-[20px] w-auto object-contain transition-transform group-hover:scale-[1.02]" 
            />
          </button>

          {/* Segmented Pill-Style Global Room Switcher (Auto-fits on small screens) */}
          <div className="flex items-center p-0.5 sm:p-1 bg-[#F4F5F7] rounded-full border border-[#E5E7EB] shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => onChangeRoom('rentals')}
              className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer select-none ${
                activeRoom === 'rentals'
                  ? 'bg-[#000004] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#000004]'
              }`}
              title="Accommodations & Rental Inspections"
              aria-label="Rentals Room"
            >
              Rentals
            </button>

            <button
              type="button"
              onClick={() => onChangeRoom('jobs')}
              className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer select-none ${
                activeRoom === 'jobs'
                  ? 'bg-[#000004] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#000004]'
              }`}
              title="Setlla Jobs - Careers & Vacancies"
              aria-label="Setlla Jobs Room"
            >
              <span className="sm:hidden">Jobs</span>
              <span className="hidden sm:inline">Setlla Jobs</span>
            </button>
          </div>
        </div>

        {/* Center / Right: Squircle Navigation Island (Zero Overflow on Mobile) */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-1 rounded-[16px] sm:rounded-[22px] bg-[#FCF9F5] border border-[#E5E7EB] shadow-xs shrink-0 max-w-full">
          {/* TAB 1: User Dashboard (Based on active room) */}
          {isAuthenticated && currentRole !== 'agent' && !currentUser.isAgent && (
            <button
              onClick={() => {
                onChangeRole('tenant');
                onChangeUserView('dashboard');
              }}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                (currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard'
                  ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
              }`}
              aria-label={activeRoom === 'jobs' ? 'Jobs Dashboard' : 'User Dashboard'}
              title={activeRoom === 'jobs' ? 'Jobs Dashboard' : 'User Dashboard'}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${(currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard' ? 'text-white' : ''}`} />
              
              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                {activeRoom === 'jobs' ? 'Jobs Dashboard' : 'My Dashboard'}
              </span>

              {(currentRole === 'seeker' || currentRole === 'tenant') && userView === 'dashboard' && (
                <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
              )}

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {activeRoom === 'jobs' ? 'Jobs Dashboard' : 'Dashboard'}
              </span>
            </button>
          )}

          {/* TAB 2: Seeker Live Snap Feed */}
          <button
            onClick={() => {
              onChangeRole('tenant');
              onChangeUserView('feed');
            }}
            className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
              ((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || (!isAuthenticated && userView !== 'dashboard')
                ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
            }`}
            aria-label="Explore"
            title="Explore"
          >
            <Compass className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${(((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || (!isAuthenticated && userView !== 'dashboard')) ? 'text-white' : ''}`} />
            
            {/* Desktop Label */}
            <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
              Explore
            </span>

            {(((currentRole === 'seeker' || currentRole === 'tenant') && userView === 'feed') || (!isAuthenticated && userView !== 'dashboard')) && (
              <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
            )}

            {/* Mobile Tooltip */}
            <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
              Explore
            </span>
          </button>

          {/* TAB 3: General Notifications (Bell with Unread Badge) - Captures Inspections, Jobs & System Updates */}
          {isAuthenticated && (
            <button
              onClick={onOpenNotifications || onOpenMyPasses}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-auto md:px-3.5 md:h-11 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                totalNotificationsCount > 0
                  ? 'bg-white hover:bg-emerald-50/50 text-[#000004] border border-emerald-200 shadow-xs'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80'
              }`}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${totalNotificationsCount > 0 ? 'text-emerald-700' : ''}`} />

              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                Notifications
              </span>

              {/* Notification Badge */}
              {totalNotificationsCount > 0 && (
                <>
                  <span className="md:hidden absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-1.5 sm:ring-2 ring-white shadow-xs animate-pulse-subtle">
                    {totalNotificationsCount}
                  </span>
                  <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs animate-pulse-subtle ml-0.5">
                    {totalNotificationsCount}
                  </span>
                </>
              )}

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {totalNotificationsCount > 0 ? `${totalNotificationsCount} Notifications` : 'Notifications'}
              </span>
            </button>
          )}

          {/* TAB 4: Agent Management Portal (Only visible when logged in as an Agent) */}
          {isAuthenticated && (currentRole === 'agent' || currentUser.isAgent) && (
            <button
              onClick={() => onChangeRole('agent')}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shrink-0 ${
                currentRole === 'agent'
                  ? 'bg-[#000004] text-white shadow-md border-2 border-white ring-2 ring-[#000004]/10 z-10 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 hover:shadow-xs'
              }`}
              aria-label="Agent Portal"
              title="Agent Portal"
            >
              <Briefcase className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${currentRole === 'agent' ? 'text-amber-300' : 'text-[#70798C]'}`} />
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                Agent Portal
              </span>
              {currentRole === 'agent' && (
                <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#000004] rotate-45 rounded-[1px] pointer-events-none" />
              )}
            </button>
          )}

          {/* TAB 5: User Profile (when authenticated user) OR Advertiser Badge (when ads customer) OR Sign In + Signup (when unauthenticated guest) */}
          {isAuthenticated ? (
            <button
              onClick={onOpenProfile}
              className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-auto md:px-3 md:h-11 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]/80 transition-all duration-200 active:scale-95 group cursor-pointer shrink-0"
              aria-label={(currentUser.isAgent || currentRole === 'agent') ? 'Agent Portal' : 'Profile'}
              title={(currentUser.isAgent || currentRole === 'agent') ? 'Agent Portal' : 'Profile'}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full object-cover shrink-0 border border-[#342A21]/20"
                />
              ) : (
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#342A21] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0">
                  {currentUser.fullName
                    ? currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'U'}
                </div>
              )}

              {/* Desktop Label */}
              <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">
                {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Profile'}
              </span>

              {/* Mobile Tooltip */}
              <span className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#000004] text-white text-[10px] font-semibold py-0.5 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
                {(currentUser.isAgent || currentRole === 'agent') ? `Agent Portal (${currentUser.fullName})` : currentUser.fullName || 'Profile'}
              </span>
            </button>
          ) : activeAdvertiser ? (
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/partner';
              }}
              className="relative h-8 sm:h-10 md:h-11 px-2 sm:px-3.5 md:px-4 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-[#342A21] hover:bg-[#201914] text-white transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs shrink-0"
              aria-label="Partner Portal"
              title={activeAdvertiser.companyName}
            >
              <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400 text-[#342A21] text-[9px] sm:text-[10px] font-black flex items-center justify-center shrink-0">
                {activeAdvertiser.companyName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-bold text-xs whitespace-nowrap max-w-[120px] truncate">
                {activeAdvertiser.companyName}
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={onOpenLogin || onOpenSignup}
                className="relative h-8 sm:h-10 md:h-11 px-2 sm:px-3 md:px-3.5 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-[#000004] hover:bg-[#1f2937] text-white transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs shrink-0"
                aria-label="Sign In"
                title="Sign In"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-[11px] sm:text-xs whitespace-nowrap">
                  Sign In
                </span>
              </button>

              <button
                onClick={onOpenSignup}
                className="relative h-8 sm:h-10 md:h-11 px-2 sm:px-3.5 md:px-4 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs shrink-0"
                aria-label="Signup"
                title="Signup"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-bold text-[11px] sm:text-xs whitespace-nowrap">
                  Signup
                </span>
              </button>
            </>
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

      {showIosPrompt && (
        <CustomConfirmModal
          isOpen={showIosPrompt}
          title="Install Setlla on iPhone / iPad"
          message="To install Setlla on iOS Safari: Tap the Safari Share icon (⎋) at the bottom bar of your screen, scroll down the share menu, and tap 'Add to Home Screen' (➕) for instant full-screen app access."
          badge="IOS WEB APP"
          confirmText="Got it!"
          variant="info"
          isAlertOnly={true}
          onConfirm={() => setShowIosPrompt(false)}
          onCancel={() => setShowIosPrompt(false)}
        />
      )}
    </header>
  );
};

