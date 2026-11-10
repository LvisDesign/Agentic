import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Building2, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Eye, 
  FileText, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  ReceiptText, 
  Filter, 
  Share2, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  ChevronRight,
  RotateCcw,
  Radio,
  Megaphone,
  X
} from 'lucide-react';
import { JobListing, JobApplication } from '../../types/jobs';
import { UserProfile } from '../../types/marketplace';
import { AdvertiserDashboard } from '../Advertiser/AdvertiserDashboard';
import { ensureAdvertiserForUser } from '../../services/advertiserAuthService';
import { 
  getEmployerJobs, 
  getEmployerApplications,
  toggleJobStatus,
  confirmJobFreshness,
  updateApplicationReviewStatus,
  sponsorJobListing,
  downloadOrOpenCandidateCV,
} from '../../services/jobService';
import { isSupabaseConfigured, getSupabaseClient } from '../../utils/supabaseClient';
import { getListingLifecycleInfo } from '../../utils/listingLifecycle';
import { PostJobModal } from './PostJobModal';
import { JobDetailsSheet } from './JobDetailsSheet';
import { PaystackModal } from '../Booking/PaystackModal';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { formatNaira } from '../../utils/formatters';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { getAdPricing, fetchPlatformSettingsAsync } from '../../services/adminService';
import { ShareSheetModal, SharePayload } from '../UI/ShareSheetModal';
import { useInfiniteScroll, InfiniteScrollSentinel } from '../UI/Pagination';

const EMPLOYER_JOBS_BATCH = 4;
const EMPLOYER_APPS_BATCH = 4;
const INVOICES_BATCH = 6;

interface JobAgentDashboardProps {
  currentUser: UserProfile;
  onSwitchToFeed: () => void;
  onSwitchToRentals?: () => void;
  isAuthenticated: boolean;
}

export const JobAgentDashboard: React.FC<JobAgentDashboardProps> = ({
  currentUser,
  onSwitchToFeed,
  onSwitchToRentals,
  isAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'applicants' | 'ads' | 'invoices'>('listings');
  const [adsInitialTab, setAdsInitialTab] = useState<'campaigns' | 'new-campaign'>('campaigns');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Sheets
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobListing | null>(null);
  const [jobToSponsor, setJobToSponsor] = useState<JobListing | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [jobBoostFee, setJobBoostFee] = useState<number>(() => getAdPricing().jobPromotionFee);

  useEffect(() => {
    const handleUpdate = () => setJobBoostFee(getAdPricing().jobPromotionFee);
    window.addEventListener('setlla:platform_settings_updated', handleUpdate);
    fetchPlatformSettingsAsync().then(() => setJobBoostFee(getAdPricing().jobPromotionFee)).catch(() => {});
    return () => window.removeEventListener('setlla:platform_settings_updated', handleUpdate);
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedJobFilterForApps, setSelectedJobFilterForApps] = useState<string>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const employerJobs = await getEmployerJobs(currentUser);
      setJobs(employerJobs);

      const employerApps = await getEmployerApplications(currentUser, employerJobs);
      setApplications(employerApps);
    } catch (e) {
      console.error('Failed to load employer jobs & applications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAppsUpdated = () => {
      loadData();
    };
    window.addEventListener('setlla:job-applications-updated', handleAppsUpdated);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const channel = client
          .channel('employer-job-applications-sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'listings' },
            (payload) => {
              const row = (payload.new || payload.old) as any;
              if (
                row &&
                (row.property_type === '__JOB_APPLICATION__' ||
                  row.property_type === '__JOB_LISTING__' ||
                  String(row.id || '').startsWith('job-'))
              ) {
                loadData();
              }
            }
          )
          .subscribe();

        return () => {
          window.removeEventListener('setlla:job-applications-updated', handleAppsUpdated);
          client.removeChannel(channel);
        };
      }
    }

    return () => {
      window.removeEventListener('setlla:job-applications-updated', handleAppsUpdated);
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.phone]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleJobCreated = (newJob: JobListing) => {
    setJobs((prev) => [newJob, ...prev]);
    if (newJob.isFeatured) {
      showToast(`Vacancy "${newJob.title}" published as Sponsored Spotlight!`);
    } else {
      showToast(`Vacancy "${newJob.title}" published for free! You can sponsor it anytime.`);
    }
  };

  const handleSponsorSuccess = async (paymentReference: string) => {
    if (!jobToSponsor) return;
    const updated = await sponsorJobListing(jobToSponsor.id, paymentReference);
    if (updated) {
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      showToast(`🎉 Vacancy "${updated.title}" boosted to Sponsored Spotlight!`);
    }
    setJobToSponsor(null);
  };

  const handleToggleStatus = async (job: JobListing) => {
    const nextStatus = job.status === 'closed' ? 'active' : 'closed';
    await toggleJobStatus(job.id, nextStatus);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j)));
    showToast(`Job status changed to ${nextStatus}.`);
  };

  const handleConfirmFreshness = async (job: JobListing) => {
    await confirmJobFreshness(job.id);
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, lastConfirmedAt: now, status: 'active', takenAt: undefined } : j))
    );
    showToast('Job vacancy availability confirmed! Retained live on Setlla Jobs.');
  };

  const handleUpdateAppStatus = (appId: string, newStatus: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected') => {
    updateApplicationReviewStatus(appId, newStatus);
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    showToast(`Applicant status marked as ${newStatus}.`);
  };

  const handleShareJob = (job: JobListing) => {
    const shareUrl = `${window.location.origin}/#/jobs?id=${encodeURIComponent(job.id)}`;
    setSharePayload({
      title: job.title,
      subtitle: `${job.companyName} • ${job.city} (${job.workplaceType})`,
      text: `Hiring: ${job.title} at ${job.companyName} (${job.salaryRange}) on Setlla Jobs`,
      url: shareUrl,
    });
  };

  // KPIs
  const activeJobsCount = jobs.filter((j) => j.status !== 'closed').length;
  const totalApplicantsCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted').length;
  const totalInvestment = jobs.reduce((acc, j) => acc + (j.listingFeePaid !== undefined ? j.listingFeePaid : (j.isFeatured ? 2000 : 0)), 0);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter !== 'all') {
        const isActive = j.status !== 'closed';
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'closed' && isActive) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.city.toLowerCase().includes(q) ||
          j.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [jobs, statusFilter, searchQuery]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      if (selectedJobFilterForApps !== 'all' && a.jobId !== selectedJobFilterForApps) {
        return false;
      }
      if (appStatusFilter !== 'all' && a.status !== appStatusFilter) {
        return false;
      }
      return true;
    });
  }, [applications, selectedJobFilterForApps, appStatusFilter]);

  const jobsScroll = useInfiniteScroll(filteredJobs, {
    initialBatchSize: EMPLOYER_JOBS_BATCH,
    batchSize: EMPLOYER_JOBS_BATCH,
    resetKey: `${activeTab}-jobs-${searchQuery}-${statusFilter}`,
  });

  const appsScroll = useInfiniteScroll(filteredApplications, {
    initialBatchSize: EMPLOYER_APPS_BATCH,
    batchSize: EMPLOYER_APPS_BATCH,
    resetKey: `${activeTab}-apps-${selectedJobFilterForApps}-${appStatusFilter}`,
  });

  const invoicesScroll = useInfiniteScroll(jobs, {
    initialBatchSize: INVOICES_BATCH,
    batchSize: INVOICES_BATCH,
    resetKey: `${activeTab}-invoices`,
  });

  return (
    <div className="w-full min-h-screen bg-[#FCF9F5] pb-24 font-body">
      {/* Setlla Design System Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] w-[92vw] max-w-md animate-slide-up">
          <div className="w-full bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF7E2] text-[#000004] rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_40px_-10px_rgba(52,42,33,0.24)] border border-[#EDDAA6] flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#342A21] via-[#FFAD05] to-[#342A21]" />
            <div className="relative shrink-0 mt-0.5">
              <div className="w-9 h-9 rounded-xl bg-[#000004] border border-[#FFAD05]/45 flex items-center justify-center overflow-hidden shadow-xs p-1.5">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Setlla"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FFFDF9] border border-[#EDDAA6] flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              </span>
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border text-[#342A21] bg-[#FFF8E6] border-[#EDD595] inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Setlla Jobs Update</span>
                </span>
                <span className="text-[10px] font-medium text-[#70798C]">• Just now</span>
              </div>
              <p className="font-display font-bold text-xs sm:text-sm text-[#1A1410] leading-snug mt-0.5">
                {toastMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="w-6 h-6 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] text-[#342A21] flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-[#EDD595]"
              aria-label="Dismiss notification"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Employer Profile Banner */}
      <section className="w-full bg-white border-b border-[#E5E7EB] pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Employer Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#000004] text-white flex items-center justify-center font-display font-extrabold text-lg sm:text-xl shadow-md border-2 border-white ring-2 ring-[#000004]/10 shrink-0">
              {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'JA'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#000004]">
                  {currentUser.fullName || 'Job Agent'} &bull; Hiring Portal
                </h1>
              </div>
              <p className="text-xs text-[#70798C] mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-[#342A21]">
                  <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
                  <span>{currentUser.operatingCity || 'Delta State, Nigeria'}</span>
                </span>
                <span>&bull;</span>
                <span className="font-medium text-[#70798C]">
                  Delta State Talent & Recruitment Network
                </span>
              </p>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAdsInitialTab('new-campaign');
                setActiveTab('ads');
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#342A21]/15 bg-[#F6F3EF] hover:bg-[#342A21] text-[#342A21] hover:text-[#FCF9F5] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap group"
              title="Post and manage adverts directly inside your Hiring Portal"
            >
              <Megaphone className="w-4 h-4 text-[#342A21] group-hover:text-[#FCF9F5] transition-colors shrink-0" />
              <span>Promote</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPostJobModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FCF9F5] text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-95 whitespace-nowrap group"
            >
              <Plus className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>Job</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Dashboard Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Active Listings */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#70798C]">
              <span className="text-xs font-bold uppercase tracking-wider">Active Vacancies</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#000004]">
              {activeJobsCount}
            </div>
            <p className="text-[11px] text-[#70798C] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Published across Setlla feed</span>
            </p>
          </div>

          {/* Card 2: Total Candidates */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#70798C]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Applicants</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#000004]">
              {totalApplicantsCount}
            </div>
            <p className="text-[11px] text-[#70798C]">
              CVs submitted to your roles
            </p>
          </div>

          {/* Card 3: Shortlisted */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#70798C]">
              <span className="text-xs font-bold uppercase tracking-wider">Shortlisted</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E5E7EB] text-[#342A21] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#000004]">
              {shortlistedCount}
            </div>
            <p className="text-[11px] text-[#70798C]">
              Top candidate prospects
            </p>
          </div>

          {/* Card 4: Fair Pricing Investment */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#70798C]">
              <span className="text-xs font-bold uppercase tracking-wider">Listing Investment</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#000004]">
              {formatNaira(totalInvestment)}
            </div>
            <p className="text-[11px] text-[#70798C]">
              Fair ₦2,000 / verified post
            </p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-1.5 flex items-center gap-1.5 shadow-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'listings'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>My Listed Jobs ({jobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'applicants'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Applications ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdsInitialTab('campaigns');
              setActiveTab('ads');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ads'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Promotions & Ads</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'text-[#70798C] hover:text-[#000004] hover:bg-slate-50'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Fair Pricing & Receipts</span>
          </button>
        </div>

        {/* TAB 1: MY LISTED JOBS */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798C]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your listed jobs..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#000004]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {(['all', 'active', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer border ${
                      statusFilter === st
                        ? 'bg-[#000004] text-white border-[#000004]'
                        : 'bg-white text-[#70798C] border-[#E5E7EB] hover:bg-slate-50'
                    }`}
                  >
                    {st === 'all' ? 'All Roles' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FCF9F5] text-[#342A21] flex items-center justify-center mx-auto border border-[#E5E7EB]">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-[#000004]">
                  No job postings found
                </h3>
                <p className="text-xs text-[#70798C] max-w-sm mx-auto">
                  {searchQuery 
                    ? 'No jobs match your search query. Try searching for a different title.'
                    : 'Put your open vacancies in front of thousands of qualified Delta State professionals.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsPostJobModalOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Post Your First Job</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {jobsScroll.visibleItems.map((job) => {
                  const jobApps = applications.filter((a) => a.jobId === job.id);
                  const isClosed = job.status === 'closed';
                  const lifecycle = getListingLifecycleInfo(job);
                  const isRawOrganicRef =
                    !job.paymentReference || job.paymentReference === 'FREE_ORGANIC_POST';

                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5 ${
                        lifecycle.stage === 'expired'
                          ? 'border-rose-300'
                          : lifecycle.stage === 'needs_confirmation'
                          ? 'border-amber-300'
                          : 'border-[#E5E7EB]'
                      }`}
                    >
                      {/* Top Row: Avatar, Full Role Title, Company + Location, and Compact Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#000004] text-white flex items-center justify-center font-display font-bold text-sm sm:text-base shrink-0 shadow-2xs">
                            {job.companyInitial || 'SJ'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-bold text-base sm:text-lg text-[#000004] leading-snug break-words">
                                {job.title}
                              </h3>
                              {lifecycle.stage === 'expired' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Delisted (72h)
                                </span>
                              )}
                              {lifecycle.stage === 'needs_confirmation' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Check Required ({Math.ceil(lifecycle.hoursUntilDelist)}h left)
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-[#70798C] mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#342A21]">{job.companyName}</span>
                              <span className="text-[#D1D5DB]">&bull;</span>
                              <span className="inline-flex items-center gap-1 text-[#70798C] whitespace-nowrap">
                                <MapPin className="w-3 h-3 text-[#70798C] shrink-0" />
                                <span>{job.city} ({job.workplaceType})</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Compact Editorial Status Pill */}
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              isClosed
                                ? 'bg-[#F4F5F7] text-[#70798C] border-[#E5E7EB]'
                                : 'bg-[#FAF8F5] text-[#000004] border-[#E5E7EB]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isClosed ? 'bg-[#70798C]' : 'bg-[#000004]'
                              }`}
                            />
                            <span>{isClosed ? 'Closed' : 'Published'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Role Type, Compensation & Plan Details */}
                      <div className="bg-[#FAF8F5] rounded-xl px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#342A21] text-[11px] font-semibold">
                            {job.roleType}
                          </span>
                          <div>
                            <span className="text-[#70798C]">Pay: </span>
                            <span className="font-bold text-[#000004]">{job.salaryRange}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          {job.isFeatured ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                              Sponsored &bull; {job.paymentReference || `SET-JOB-${job.id.slice(-6)}`}
                            </span>
                          ) : (
                            <span className="text-[#70798C] font-medium">
                              {isRawOrganicRef ? 'Standard Listing (Free)' : `Ref: ${job.paymentReference}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 48-Hour Availability Check & 72-Hour Lifecycle Bar (Editorial Warm Neutral) */}
                      <div
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs px-3.5 py-2.5 rounded-xl border transition-colors ${
                          lifecycle.stage === 'expired'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : lifecycle.stage === 'needs_confirmation'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-[#FAF8F5] border-[#E5E7EB] text-[#342A21]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {lifecycle.stage === 'expired' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="font-semibold text-rose-800 text-[11px]">
                                Delisted from public job feed (72h unconfirmed)
                              </span>
                            </>
                          ) : lifecycle.stage === 'needs_confirmation' ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="font-semibold text-amber-900 text-[11px]">
                                48h Check: Is this role still open? ({Math.ceil(lifecycle.hoursUntilDelist)}h left)
                              </span>
                            </>
                          ) : lifecycle.stage === 'taken_grace' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#70798C] shrink-0" />
                              <span className="font-medium text-[#70798C] text-[11px]">
                                Closed role ({Math.ceil(lifecycle.hoursUntilTakenCleanup || 24)}h display left)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#342A21] shrink-0" />
                              <span className="font-medium text-[#342A21] text-[11px]">
                                Active on Setlla Jobs &bull; Next check in {Math.ceil(48 - lifecycle.hoursSinceConfirmed)}h
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmFreshness(job)}
                          className={`w-full sm:w-auto text-center px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                            lifecycle.stage === 'expired'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                              : lifecycle.stage === 'needs_confirmation'
                              ? 'bg-[#000004] hover:bg-[#1f2937] text-white shadow-2xs'
                              : 'bg-white hover:bg-[#F0ECE1] text-[#000004] border border-[#E5E7EB] shadow-2xs'
                          }`}
                        >
                          {lifecycle.stage === 'expired'
                            ? 'Relist & Renew'
                            : lifecycle.stage === 'needs_confirmation'
                            ? 'Yes, Still Open'
                            : 'Confirm Still Open'}
                        </button>
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] gap-2 flex-wrap">
                        {/* Applicants Counter with link to view */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobFilterForApps(job.id);
                            setActiveTab('applicants');
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#342A21] hover:text-[#000004] hover:underline cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#342A21]" />
                          <span>{jobApps.length} {jobApps.length === 1 ? 'Applicant' : 'Applicants'}</span>
                          <ChevronRight className="w-3 h-3 text-[#70798C]" />
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          {!job.isFeatured && !isClosed && (
                            <button
                              type="button"
                              onClick={() => setJobToSponsor(job)}
                              className="px-3 py-1.5 rounded-lg bg-[#342A21] hover:bg-[#000004] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Pin this vacancy to the top of Setlla Jobs with 5x reach"
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                              <span>Boost ({formatNaira(jobBoostFee)})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleShareJob(job)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#FAF8F5] text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
                            title="Share vacancy"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedJobForDetails(job)}
                            className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF8F5] text-[#000004] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-[#70798C]" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(job)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isClosed
                                ? 'bg-[#000004] hover:bg-[#1f2937] text-white shadow-2xs'
                                : 'bg-[#FAF8F5] hover:bg-[#F0ECE1] text-[#000004] border border-[#E5E7EB]'
                            }`}
                          >
                            {isClosed ? 'Reopen Vacancy' : 'Close Vacancy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <InfiniteScrollSentinel
                  sentinelRef={jobsScroll.sentinelRef}
                  hasMore={jobsScroll.hasMore}
                  isLoadingMore={jobsScroll.isLoadingMore}
                  totalItems={filteredJobs.length}
                  minItemsForCaughtUp={3}
                  caughtUpText="You're all caught up on your listed jobs"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE APPLICATIONS */}
        {activeTab === 'applicants' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-bold text-[#70798C] shrink-0">Filter by Role:</label>
                <AdminCustomSelect
                  value={selectedJobFilterForApps}
                  onChange={(val) => setSelectedJobFilterForApps(val)}
                  options={[
                    { value: 'all', label: `All Jobs (${applications.length})` },
                    ...jobs.map((j) => ({ value: j.id, label: j.title })),
                  ]}
                  variant="filter"
                  placeholder="Filter by role..."
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                {(['all', 'submitted', 'shortlisted', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAppStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer border ${
                      appStatusFilter === st
                        ? 'bg-[#000004] text-white border-[#000004]'
                        : 'bg-white text-[#70798C] border-[#E5E7EB] hover:bg-slate-50'
                    }`}
                  >
                    {st === 'submitted' ? 'In Review' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-[#70798C] mx-auto" />
                <h4 className="font-display font-bold text-sm text-[#000004]">
                  No candidate applications found
                </h4>
                <p className="text-xs text-[#70798C] max-w-sm mx-auto">
                  When job seekers in Delta State apply to your listings, their CVs and contact details will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appsScroll.visibleItems.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-sm sm:text-base text-[#000004]">
                            {app.applicantName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'shortlisted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : app.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'reviewed' ? 'Viewed' : app.status === 'submitted' ? 'In Review' : app.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#70798C] mt-0.5">
                          Applied for: <span className="font-bold text-[#000004]">{app.jobTitle}</span> &bull; {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Status Action Selector */}
                      <AdminCustomSelect
                        value={app.status}
                        onChange={(val) => handleUpdateAppStatus(app.id, val as any)}
                        options={[
                          { value: 'submitted', label: 'In Review', dotColor: '#F59E0B' },
                          { value: 'reviewed', label: 'Viewed CV', dotColor: '#3B82F6' },
                          { value: 'shortlisted', label: 'Shortlist Candidate', dotColor: '#10B981' },
                          { value: 'rejected', label: 'Decline', dotColor: '#EF4444' },
                        ]}
                        variant="table"
                        placeholder="Status..."
                      />
                    </div>

                    {app.coverNote && (
                      <div className="p-3 rounded-xl bg-[#FCF9F5] border border-[#EFE3C6] text-xs text-[#342A21] leading-relaxed">
                        <span className="font-bold text-[#000004]">Cover Note: </span>
                        {app.coverNote}
                      </div>
                    )}

                    {/* Candidate Contact & CV Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#E5E7EB] text-xs">
                      <div className="flex items-center gap-3 flex-wrap text-[#70798C]">
                        <span>Email: <strong className="text-[#000004]">{app.applicantEmail || 'Not provided'}</strong></span>
                        <span>Phone: <strong className="text-[#000004]">{app.applicantPhone || 'Not provided'}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View / Download CV (Automatically marks application as Viewed & notifies candidate) */}
                        {app.cvUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              if (app.status === 'submitted') {
                                handleUpdateAppStatus(app.id, 'reviewed');
                              }
                              downloadOrOpenCandidateCV(app.cvUrl, app.cvFileName || 'Candidate_Resume.pdf');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#000004] font-bold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{app.cvFileName || 'Download CV'}</span>
                          </button>
                        )}

                        {/* Call Candidate */}
                        {app.applicantPhone && (
                          <a
                            href={`tel:${app.applicantPhone}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#342A21] hover:bg-[#000004] text-white font-bold transition-colors shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#FFAD05]" />
                            <span>Call</span>
                          </a>
                        )}

                        {/* WhatsApp Candidate */}
                        {app.applicantPhone && (
                          <a
                            href={`https://wa.me/234${app.applicantPhone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${app.applicantName}, this is ${currentUser.fullName || 'the hiring team'} regarding your application for ${app.jobTitle} on Setlla Jobs.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <InfiniteScrollSentinel
                  sentinelRef={appsScroll.sentinelRef}
                  hasMore={appsScroll.hasMore}
                  isLoadingMore={appsScroll.isLoadingMore}
                  totalItems={filteredApplications.length}
                  minItemsForCaughtUp={3}
                  caughtUpText="You're all caught up on candidate applications"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FAIR PRICING & RECEIPTS */}
        {activeTab === 'invoices' && (
          <div className="space-y-5">
            {/* Explainer Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  ₦
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#000004]">
                    Setlla Jobs Freemium & Fair Pricing Model
                  </h3>
                  <p className="text-xs text-[#70798C]">
                    Free Organic Listings + Flat ₦2,000 Sponsored Spotlight Boosts
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#342A21] leading-relaxed">
                Like Indeed, Setlla Jobs allows employers to <strong>post standard vacancies for free (₦0)</strong> to build candidate pipelines. Employers seeking immediate placement or 5x candidate volume can <strong>sponsor openings for a flat ₦2,000 boost</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#000004]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <h5>1. Free Organic Listings</h5>
                  </div>
                  <p className="text-[11px] text-[#70798C] leading-snug">Post authentic job openings at ₦0. Visible in standard search results and candidate category feeds.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#000004]">
                    <h5>2. Sponsored Spotlight (₦2,000)</h5>
                  </div>
                  <p className="text-[11px] text-[#70798C] leading-snug">Pin openings to the top of Setlla Jobs with a gold "Sponsored" badge and 5x candidate reach across Delta State.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#000004]">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <h5>3. Direct Smart Sourcing</h5>
                  </div>
                  <p className="text-[11px] text-[#70798C] leading-snug">Direct candidate CV downloads, instant WhatsApp messaging, and phone contact with zero recruitment fees.</p>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#000004]">
                    Posting Ledger & Settlement Receipts
                  </h4>
                  <p className="text-xs text-[#70798C]">
                    All active, free, and sponsored listings registered under your account.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#70798C] bg-slate-100 px-2.5 py-1 rounded-lg">
                  {jobs.length} Listings
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCF9F5] text-[#70798C] font-bold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Role Title</th>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {invoicesScroll.visibleItems.map((job) => {
                      const isSponsored = job.isFeatured || (job.listingFeePaid && job.listingFeePaid > 0);
                      return (
                        <tr key={job.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 text-[#70798C]">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#000004]">
                            {job.title}
                          </td>
                          <td className="py-3.5 px-4">
                            {isSponsored ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <span>Sponsored</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Organic Free
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#342A21]">
                            {job.paymentReference || (isSponsored ? `SET-JOB-${job.id.slice(-6)}` : 'FREE_ORGANIC_POST')}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-[#000004]">
                            {isSponsored ? formatNaira(job.listingFeePaid || 2000) : '₦0 Free'}
                          </td>
                          <td className="py-3.5 px-4">
                            {isSponsored ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Paid / Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                Active (₦0)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <InfiniteScrollSentinel
                sentinelRef={invoicesScroll.sentinelRef}
                hasMore={invoicesScroll.hasMore}
                isLoadingMore={invoicesScroll.isLoadingMore}
                totalItems={jobs.length}
                minItemsForCaughtUp={INVOICES_BATCH + 1}
              />
            </div>
          </div>
        )}

        {/* TAB 4: EMBEDDED PROMOTIONS & ADS MANAGEMENT */}
        {activeTab === 'ads' && (
          <AdvertiserDashboard
            advertiser={ensureAdvertiserForUser(currentUser)}
            embedded
            initialTab={adsInitialTab}
            onLogout={() => setActiveTab('listings')}
          />
        )}

        {/* Platform Support & Contact Footer */}
        <div className="mt-10 pt-5 border-t border-[#E5E7EB]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#70798C]">
          <span>Need help or have questions about Setlla?</span>
          <a
            href="mailto:contact@setlla.com"
            className="inline-flex items-center gap-1.5 font-semibold text-[#342A21] hover:text-[#000004] bg-white hover:bg-[#FAF8F5] px-3.5 py-1.5 rounded-full border border-[#E5E7EB] shadow-2xs transition-colors"
          >
            <span>contact@setlla.com</span>
          </a>
        </div>
      </div>

      {/* Post a Job Modal (Supports Free & ₦2,000 Sponsored) */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
        currentUser={currentUser}
        onJobCreated={handleJobCreated}
      />

      {/* Paystack Boost/Sponsor Checkout Gateway */}
      {jobToSponsor && (
        <PaystackModal
          isOpen={Boolean(jobToSponsor)}
          onClose={() => setJobToSponsor(null)}
          amount={jobBoostFee}
          applicantEmail={jobToSponsor.contactEmail || currentUser.email || 'employer@setlla.com'}
          applicantPhone={jobToSponsor.contactPhone || currentUser.phone}
          applicantName={jobToSponsor.companyName || currentUser.fullName}
          merchantName="Setlla Jobs Employer Portal"
          purposeTitle={`Spotlight Boost: ${jobToSponsor.title} (${formatNaira(jobBoostFee)} / 30 Days)`}
          buttonText={`Pay ${formatNaira(jobBoostFee)} & Boost to Spotlight`}
          onSuccess={handleSponsorSuccess}
        />
      )}

      {/* Live Job Details Preview Sheet */}
      <JobDetailsSheet
        isOpen={Boolean(selectedJobForDetails)}
        onClose={() => setSelectedJobForDetails(null)}
        job={selectedJobForDetails}
        hasApplied={false}
        onQuickApply={() => {}}
      />

      <ShareSheetModal
        isOpen={Boolean(sharePayload)}
        onClose={() => setSharePayload(null)}
        payload={sharePayload}
      />
    </div>
  );
};
