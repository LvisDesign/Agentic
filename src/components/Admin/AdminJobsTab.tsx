import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Star, 
  Plus, 
  ExternalLink, 
  MapPin, 
  Clock, 
  FileText, 
  Check, 
  X, 
  Building, 
  Users, 
  DollarSign, 
  Globe, 
  Phone, 
  Mail,
  UserCheck,
  LayoutGrid,
  List,
  Info
} from 'lucide-react';
import { JobListing, JobApplication, JobRoleType, JobWorkplaceType } from '../../types/jobs';
import { UserProfile } from '../../types/marketplace';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { formatNaira, formatNigerianPhone } from '../../utils/formatters';
import { 
  deleteJobListing, 
  toggleJobStatus, 
  toggleJobFeatured, 
  updateApplicationReviewStatus, 
  createJobListing, 
  getAllJobs, 
  getSavedApplications 
} from '../../services/jobService';

export interface AdminJobsTabProps {
  currentUser: UserProfile;
  jobsList: JobListing[];
  jobApplications: JobApplication[];
  setJobsList: React.Dispatch<React.SetStateAction<JobListing[]>>;
  setJobApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  openConfirmDialog: (options: {
    title: string;
    message: string;
    itemTitle?: string;
    itemSubtitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  }) => void;
  showToast: (msg: string) => void;
  onRecordAuditLog: (action: string, targetType: string, targetName: string, details: string) => void;
}

const DELTA_CITIES = ['All Cities', 'Asaba', 'Warri', 'Abraka', 'Ughelli', 'Sapele', 'Effurun', 'Agbor'];

const JOB_CATEGORIES = [
  'All Categories',
  'Technology',
  'Logistics',
  'Healthcare',
  'Real Estate',
  'Hospitality',
  'Education',
  'Banking & Finance',
  'Retail & Sales',
  'Engineering',
  'Security',
  'PPA (Corpers)'
];

export const AdminJobsTab: React.FC<AdminJobsTabProps> = ({
  currentUser,
  jobsList,
  jobApplications,
  setJobsList,
  setJobApplications,
  openConfirmDialog,
  showToast,
  onRecordAuditLog,
}) => {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inspector & Modal States
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<JobListing | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobListing | null>(null);
  const [applicantSearchQuery, setApplicantSearchQuery] = useState('');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'shortlisted' | 'rejected'>('all');

  // Super Admin New Vacancy Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [createJobForm, setCreateJobForm] = useState({
    title: '',
    companyName: '',
    city: 'Asaba',
    address: '',
    category: 'Technology',
    workplaceType: 'On-Site' as JobWorkplaceType,
    roleType: 'Full-Time' as JobRoleType,
    salaryRange: '₦180,000 – ₦250,000 / month',
    summary: '',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    contactEmail: '',
    contactPhone: '',
    slotsAvailable: 1,
  });

  // Reload data from storage/backend
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshJobs = await getAllJobs();
      setJobsList(freshJobs);
      const freshApps = getSavedApplications();
      setJobApplications(freshApps);
      showToast('Jobs registry synchronized with cloud storage');
    } catch (_) {
      showToast('Failed to refresh jobs registry');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Job Listings
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.companyName.toLowerCase().includes(q);
        const matchesCity = job.city.toLowerCase().includes(q);
        const matchesCategory = job.category.toLowerCase().includes(q);
        const matchesEmail = job.contactEmail?.toLowerCase().includes(q) || false;
        const matchesPoster = job.posterName?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesCompany && !matchesCity && !matchesCategory && !matchesEmail && !matchesPoster) {
          return false;
        }
      }

      if (categoryFilter !== 'All Categories') {
        if (categoryFilter === 'PPA (Corpers)') {
          if (!job.roleType.toLowerCase().includes('corpers') && !job.title.toLowerCase().includes('ppa')) return false;
        } else if (job.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      if (cityFilter !== 'All Cities' && !job.city.toLowerCase().includes(cityFilter.toLowerCase())) {
        return false;
      }

      if (statusFilter !== 'all') {
        const s = job.status || 'active';
        if (s !== statusFilter) return false;
      }

      if (roleTypeFilter !== 'all' && job.roleType !== roleTypeFilter) {
        return false;
      }

      return true;
    });
  }, [jobsList, searchQuery, categoryFilter, cityFilter, statusFilter, roleTypeFilter]);

  // Derived Metrics
  const activeJobsCount = useMemo(() => jobsList.filter((j) => (j.status || 'active') === 'active').length, [jobsList]);
  const closedJobsCount = useMemo(() => jobsList.filter((j) => j.status === 'closed').length, [jobsList]);
  const totalApplicantsCount = useMemo(() => jobApplications.length, [jobApplications]);
  const shortlistedCount = useMemo(() => jobApplications.filter((a) => a.status === 'shortlisted').length, [jobApplications]);
  const totalFeesCollected = useMemo(() => {
    return jobsList.reduce((sum, j) => sum + (j.listingFeePaid || 2000), 0);
  }, [jobsList]);

  // Get applications for a specific job
  const getJobApplications = (jobId: string) => {
    return jobApplications.filter((app) => app.jobId === jobId);
  };

  // Toggle Status Handler
  const handleToggleJobStatus = async (job: JobListing) => {
    const currentStatus = job.status || 'active';
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    
    // Optimistic update
    setJobsList((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
    
    try {
      await toggleJobStatus(job.id, newStatus);
      showToast(`Vacancy marked as ${newStatus.toUpperCase()}`);
      onRecordAuditLog(
        'SETLLA_JOB_STATUS_TOGGLED',
        'job_listing',
        job.title,
        `Changed operational status of "${job.title}" (${job.companyName}) to ${newStatus}.`
      );
    } catch (err) {
      // Revert on failure
      setJobsList((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: currentStatus } : j)));
      showToast('Failed to update vacancy status');
    }
  };

  // Toggle Featured Spotlight Handler
  const handleToggleJobFeatured = async (job: JobListing) => {
    const newFeatured = !job.isFeatured;
    setJobsList((prev) => prev.map((j) => (j.id === job.id ? { ...j, isFeatured: newFeatured } : j)));
    
    try {
      await toggleJobFeatured(job.id, newFeatured);
      showToast(newFeatured ? 'Job added to Spotlight Featured' : 'Job removed from Spotlight');
      onRecordAuditLog(
        'SETLLA_JOB_FEATURED_TOGGLED',
        'job_listing',
        job.title,
        `Toggled featured spotlight to ${newFeatured} for "${job.title}".`
      );
    } catch (_) {
      showToast('Failed to toggle featured status');
    }
  };

  // Delete Job Handler
  const handleDeleteJob = (job: JobListing) => {
    openConfirmDialog({
      title: 'Delete Job Vacancy?',
      message: `Permanently remove this vacancy from the Setlla live jobs feed? Candidate applications will also be archived.`,
      itemTitle: job.title,
      itemSubtitle: `${job.companyName} • ${job.city} • ${job.roleType}`,
      badge: 'Irreversible Action',
      confirmText: 'Delete Vacancy',
      cancelText: 'Keep Active',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteJobListing(job.id);
          setJobsList((prev) => prev.filter((j) => j.id !== job.id));
          showToast('Job listing permanently deleted');
          onRecordAuditLog(
            'SETLLA_JOB_DELETED',
            'job_listing',
            job.title,
            `Super Admin deleted job listing "${job.title}" by ${job.companyName}.`
          );
        } catch (_) {
          showToast('Failed to delete job listing');
        }
      },
    });
  };

  // Update Candidate Review Status
  const handleUpdateAppStatus = (appId: string, newStatus: JobApplication['status']) => {
    updateApplicationReviewStatus(appId, newStatus);
    setJobApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    showToast(`Candidate status updated to: ${newStatus.toUpperCase()}`);
    onRecordAuditLog(
      'SETLLA_CANDIDATE_STATUS_UPDATED',
      'job_application',
      appId,
      `Candidate application ${appId} status updated to ${newStatus}.`
    );
  };

  // Create Job Submit
  const handleCreateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createJobForm.title.trim() || !createJobForm.companyName.trim() || !createJobForm.address.trim()) {
      showToast('Please fill in required job title, company name, and address.');
      return;
    }

    setIsSubmittingJob(true);
    try {
      const respLines = createJobForm.responsibilities
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const reqLines = createJobForm.requirements
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const benLines = createJobForm.benefits
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createJobListing({
        title: createJobForm.title.trim(),
        companyName: createJobForm.companyName.trim(),
        city: createJobForm.city,
        address: createJobForm.address.trim(),
        workplaceType: createJobForm.workplaceType,
        roleType: createJobForm.roleType,
        salaryRange: createJobForm.salaryRange.trim() || 'Negotiable',
        summary: createJobForm.summary.trim() || createJobForm.description.slice(0, 140),
        description: createJobForm.description.trim() || createJobForm.summary.trim(),
        responsibilities: respLines.length > 0 ? respLines : ['Execute core operational duties with excellence.'],
        requirements: reqLines.length > 0 ? reqLines : ['Demonstrated relevant experience and strong communication skills.'],
        benefits: benLines,
        category: createJobForm.category,
        contactEmail: createJobForm.contactEmail.trim() || currentUser.email,
        contactPhone: createJobForm.contactPhone.trim() || currentUser.phone,
        posterId: currentUser.id,
        posterEmail: currentUser.email,
        posterName: `${currentUser.fullName} (Super Admin)`,
        paymentReference: `SET-ADM-JOB-${Date.now().toString().slice(-6)}`,
        listingFeePaid: 2000,
      });

      setJobsList((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      showToast('Official vacancy published live across Setlla Jobs Feed!');
      onRecordAuditLog(
        'SUPERADMIN_JOB_PUBLISHED',
        'job_listing',
        created.title,
        `Super Admin published new enterprise vacancy "${created.title}" for ${created.companyName}.`
      );

      // Reset form
      setCreateJobForm({
        title: '',
        companyName: '',
        city: 'Asaba',
        address: '',
        category: 'Technology',
        workplaceType: 'On-Site',
        roleType: 'Full-Time',
        salaryRange: '₦180,000 – ₦250,000 / month',
        summary: '',
        description: '',
        responsibilities: '',
        requirements: '',
        benefits: '',
        contactEmail: '',
        contactPhone: '',
        slotsAvailable: 1,
      });
    } catch (err) {
      showToast('Error publishing vacancy');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Export Jobs Snapshot
  const handleExportData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.fullName,
        summary: {
          totalJobs: jobsList.length,
          activeJobs: activeJobsCount,
          closedJobs: closedJobsCount,
          totalApplications: jobApplications.length,
          shortlistedCandidates: shortlistedCount,
          grossListingFees: totalFeesCollected,
        },
        jobs: jobsList,
        applications: jobApplications,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Setlla_Jobs_Snapshot_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Jobs registry snapshot downloaded');
      onRecordAuditLog(
        'SETLLA_JOBS_SNAPSHOT_EXPORTED',
        'system',
        'Jobs Data',
        `Super Admin exported full jobs and candidate applications registry snapshot.`
      );
    } catch (_) {
      showToast('Failed to export jobs data');
    }
  };

  // Filtered applicants inside Drawer
  const currentJobApplicants = useMemo(() => {
    if (!selectedJobForApplicants) return [];
    return jobApplications
      .filter((app) => app.jobId === selectedJobForApplicants.id)
      .filter((app) => {
        if (applicantStatusFilter !== 'all' && app.status !== applicantStatusFilter) return false;
        if (applicantSearchQuery.trim()) {
          const q = applicantSearchQuery.toLowerCase();
          const matchesName = app.applicantName.toLowerCase().includes(q);
          const matchesEmail = app.applicantEmail.toLowerCase().includes(q);
          const matchesPhone = app.applicantPhone.includes(q);
          if (!matchesName && !matchesEmail && !matchesPhone) return false;
        }
        return true;
      });
  }, [selectedJobForApplicants, jobApplications, applicantStatusFilter, applicantSearchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#342A21] text-amber-400 flex items-center justify-center shadow-xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#000004]">
              Setlla Jobs & Career Vacancies Control
            </h3>
          </div>
          <p className="text-xs text-[#70798C] mt-1 max-w-2xl">
            Moderation center for employer vacancies, candidate CV applications, role statuses, and ₦2,000 listing fee clearance across Delta State.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Jobs Feed link */}
          <a
            href={`${typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/jobs` : '#/jobs'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3.5 rounded-xl border border-[#342A21]/20 bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer no-underline active:scale-95"
            title="Open live Setlla Jobs Feed in new tab"
          >
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>Live Jobs Feed</span>
            <ExternalLink className="w-3 h-3 text-[#70798C]" />
          </a>

          {/* Sync Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Sync latest vacancies and candidate submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#70798C] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Snapshot */}
          <button
            onClick={handleExportData}
            className="py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#342A21] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Export JSON snapshot of all vacancies and applicants"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Data</span>
          </button>

          {/* Post Enterprise Vacancy */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Post Vacancy</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Vacancies */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Job Vacancies</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
            {jobsList.length} Roles
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
            <span className="font-bold text-emerald-600">{activeJobsCount} Active Live</span>
            <span>• {closedJobsCount} Closed</span>
          </div>
        </div>

        {/* Card 2: Candidate Applications */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Candidate CV Submissions</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
            {totalApplicantsCount} Applicants
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
            <span className="font-bold text-blue-600">{shortlistedCount} Shortlisted</span>
            <span>across all vacancies</span>
          </div>
        </div>

        {/* Card 3: Listing Clearance Fees */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Listing Clearance Fees</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
            {formatNaira(totalFeesCollected)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
            <span className="font-bold text-emerald-600">₦2,000 / post</span>
            <span>• 100% Platform Retained</span>
          </div>
        </div>

        {/* Card 4: Geographic Coverage */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#70798C] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Delta State Footprint</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-black text-[#000004]">
            5 Hubs Active
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#70798C]">
            <span>Asaba, Warri, Ughelli, Abraka, Sapele</span>
          </div>
        </div>
      </div>

      {/* 3. FILTERING & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        {/* Search input + Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company name, city, employer email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] text-xs text-[#000004] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 flex-wrap">
            <AdminCustomSelect
              value={cityFilter}
              onChange={setCityFilter}
              options={DELTA_CITIES}
              variant="filter"
            />

            <AdminCustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Live', dotColor: '#10B981' },
                { value: 'closed', label: 'Closed / Paused', dotColor: '#94A3B8' },
              ]}
              variant="filter"
            />

            <AdminCustomSelect
              value={roleTypeFilter}
              onChange={setRoleTypeFilter}
              options={[
                { value: 'all', label: 'All Role Types' },
                { value: 'Full-Time', label: 'Full-Time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Internship', label: 'Internship' },
                { value: 'Part-Time', label: 'Part-Time' },
                { value: 'PPA (Corpers)', label: 'PPA (Corpers)' },
              ]}
              variant="filter"
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#000004] text-white shadow-xs'
                  : 'bg-slate-100 text-[#70798C] hover:bg-slate-200 hover:text-[#000004]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. VACANCIES DATA & CONTROLS */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {/* Table & Grid Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h4 className="font-display font-bold text-base text-[#000004]">
                Delta State Vacancies Ledger
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#70798C] text-xs font-bold">
                {filteredJobs.length} of {jobsList.length} showing
              </span>
            </div>
            <p className="text-xs text-[#70798C]">
              Manage live job postings, candidate submissions, remuneration, and spotlight visibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#70798C] bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Click <strong className="text-[#342A21]">Applicants</strong> to view candidate CVs</span>
            </span>

            {/* View Mode Toggle: Table / Cards */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#000004] shadow-xs'
                    : 'text-[#70798C] hover:text-[#000004]'
                }`}
                title="Switch to Spacious Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#000004] shadow-xs'
                    : 'text-[#70798C] hover:text-[#000004]'
                }`}
                title="Switch to Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#000004]">No Vacancies Match Your Filter</h4>
            <p className="text-xs text-[#70798C] max-w-sm mx-auto">
              Try adjusting your search keywords, category filter, or city selector.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('All Categories');
                setCityFilter('All Cities');
                setStatusFilter('all');
                setRoleTypeFilter('all');
              }}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* ========================================================================= */
          /* CARD GRID VIEW (Ultra-Spacious & Breathable)                               */
          /* ========================================================================= */
          <div className="p-5 bg-slate-50/40">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {filteredJobs.map((job) => {
                const apps = getJobApplications(job.id);
                const isClosed = job.status === 'closed';

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    {/* Top Row: Company & Title */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#342A21] text-amber-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {job.companyInitial || job.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-[#000004] line-clamp-2">{job.title}</span>
                              {job.isFeatured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Spotlight
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#70798C] font-medium block mt-0.5">
                              {job.companyName}
                            </span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <button
                          onClick={() => handleToggleJobStatus(job)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                            !isClosed
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title={`Click to ${!isClosed ? 'Close vacancy' : 'Reactivate vacancy'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${!isClosed ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                          <span>{!isClosed ? 'Active' : 'Closed'}</span>
                        </button>
                      </div>

                      {/* Location & Tags */}
                      <div className="mt-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#000004]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">{job.city}, Delta</span>
                          {job.address && (
                            <span className="text-[#70798C] truncate max-w-[200px]" title={job.address}>
                              • {job.address}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {job.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                            {job.roleType}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                            {job.workplaceType}
                          </span>
                        </div>
                      </div>

                      {/* Remuneration Highlight */}
                      <div className="mt-3.5 p-3 rounded-xl bg-[#FCF9F5] border border-amber-200/50 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#70798C] block">Salary Budget</span>
                          <span className="text-xs font-bold text-[#000004]">{job.salaryRange || 'Negotiable'}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>₦2,000 Paid</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: Applicants & Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedJobForApplicants(job)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          apps.length > 0
                            ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{apps.length} {apps.length === 1 ? 'Applicant' : 'Applicants'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleJobFeatured(job)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            job.isFeatured
                              ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
                          }`}
                          title="Toggle Spotlight"
                        >
                          <Star className={`w-3.5 h-3.5 ${job.isFeatured ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => setSelectedJobForDetails(job)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="View Full Job Specifications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Vacancy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLE VIEW (Clean, Spacious, Un-Cramped 5 Columns)                        */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px] table-auto">
              <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#70798C]">
                <tr>
                  <th className="py-4 px-5 w-[38%]">Role & Organization</th>
                  <th className="py-4 px-4 w-[20%]">Location</th>
                  <th className="py-4 px-4 w-[16%]">Salary & Fee</th>
                  <th className="py-4 px-4 w-[12%]">Applicants</th>
                  <th className="py-4 px-5 w-[14%] text-right">Status & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredJobs.map((job) => {
                  const apps = getJobApplications(job.id);
                  const isClosed = job.status === 'closed';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* 1. Role & Organization */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#342A21] to-[#1C1612] text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-amber-500/20 mt-0.5">
                            {job.companyInitial || job.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#000004] leading-snug group-hover:text-[#342A21] transition-colors">
                                {job.title}
                              </span>
                              {job.isFeatured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Spotlight
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#70798C] flex-wrap">
                              <span className="font-semibold text-[#342A21]">{job.companyName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">{job.category}</span>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {job.workplaceType}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                                {job.roleType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Location */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#000004]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{job.city}, Delta</span>
                        </div>
                        {job.address && (
                          <p className="text-[11px] text-[#70798C] mt-0.5 leading-snug line-clamp-2" title={job.address}>
                            {job.address}
                          </p>
                        )}
                      </td>

                      {/* 3. Salary & Fee Clearance */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <span className="font-bold text-xs sm:text-sm text-[#000004] block">
                          {job.salaryRange || 'Negotiable'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>₦2,000 Verified</span>
                        </span>
                      </td>

                      {/* 4. Applicants (CVs) */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <button
                          onClick={() => setSelectedJobForApplicants(job)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            apps.length > 0
                              ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#000004]'
                          }`}
                          title="Inspect submitted CVs and candidate details"
                        >
                          <Users className={`w-3.5 h-3.5 ${apps.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{apps.length} {apps.length === 1 ? 'Applicant' : 'Applicants'}</span>
                        </button>
                      </td>

                      {/* 5. Status & Actions */}
                      <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleJobStatus(job)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                              !isClosed
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={`Status: ${!isClosed ? 'Active (Live)' : 'Closed'}. Click to toggle.`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${!isClosed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{!isClosed ? 'Live' : 'Closed'}</span>
                          </button>

                          {/* Action Buttons with visual separator */}
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                            {/* Spotlight Star */}
                            <button
                              onClick={() => handleToggleJobFeatured(job)}
                              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                                job.isFeatured
                                  ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100'
                                  : 'bg-white border-[#E5E7EB] text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                              }`}
                              title={job.isFeatured ? 'Remove from Featured Spotlight' : 'Promote to Featured Spotlight'}
                            >
                              <Star className={`w-3.5 h-3.5 ${job.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedJobForDetails(job)}
                              className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="View full job specifications"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Job */}
                            <button
                              onClick={() => handleDeleteJob(job)}
                              className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Permanently remove vacancy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. APPLICANTS INSPECTOR DRAWER / MODAL                                     */}
      {/* ========================================================================= */}
      {selectedJobForApplicants && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-[#FCF9F5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#342A21] text-amber-300 text-[10px] font-bold uppercase">
                    Candidate Pool
                  </span>
                  <span className="text-xs text-[#70798C] font-semibold">
                    {selectedJobForApplicants.companyName} • {selectedJobForApplicants.city}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-[#000004] mt-1">
                  Applicants for: {selectedJobForApplicants.title}
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5">
                  Review submitted resumes, verify candidate phone numbers, and manage application review status.
                </p>
              </div>

              <button
                onClick={() => setSelectedJobForApplicants(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-toolbar inside Drawer */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={applicantSearchQuery}
                  onChange={(e) => setApplicantSearchQuery(e.target.value)}
                  placeholder="Search applicants by name, email, or phone..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-[#000004] focus:outline-none focus:ring-1 focus:ring-[#000004]"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'submitted', 'reviewed', 'shortlisted', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setApplicantStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      applicantStatusFilter === st
                        ? 'bg-[#000004] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'all' ? 'All Applicants' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {currentJobApplicants.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-[#000004]">No Applications Found</h4>
                  <p className="text-xs text-[#70798C] max-w-sm mx-auto">
                    {jobApplications.filter((a) => a.jobId === selectedJobForApplicants.id).length === 0
                      ? 'No candidates have submitted an application for this vacancy yet.'
                      : 'No candidate matches your current applicant filter.'}
                  </p>
                </div>
              ) : (
                currentJobApplicants.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#342A21]/30 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                          {app.applicantName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#000004]">{app.applicantName}</h4>
                          <span className="text-[11px] text-[#70798C]">
                            Applied {new Date(app.appliedAt).toLocaleDateString()} at{' '}
                            {new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Status:</span>
                        <select
                          value={app.status || 'submitted'}
                          onChange={(e) => handleUpdateAppStatus(app.id, e.target.value as any)}
                          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[#000004] focus:outline-none focus:ring-2 focus:ring-[#000004]/10 cursor-pointer"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Under Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Declined</option>
                        </select>
                      </div>
                    </div>

                    {/* Contact & CV details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <a href={`mailto:${app.applicantEmail}`} className="hover:underline truncate">
                          {app.applicantEmail}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-700">
                        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <a
                          href={`https://wa.me/${app.applicantPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline font-medium text-emerald-800"
                        >
                          {app.applicantPhone}
                        </a>
                      </div>

                      <div className="flex items-center justify-end">
                        {app.cvUrl ? (
                          <a
                            href={app.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={app.cvFileName || 'Candidate_CV'}
                            className="px-3 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Download CV ({app.cvFileName || 'Resume'})</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No CV Attached</span>
                        )}
                      </div>
                    </div>

                    {/* Cover Note */}
                    {app.coverNote && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                        <span className="font-bold text-[10px] text-slate-500 uppercase block mb-0.5">
                          Candidate Pitch / Cover Note:
                        </span>
                        <p className="italic">"{app.coverNote}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-[#FCF9F5] flex items-center justify-between">
              <span className="text-xs text-[#70798C]">
                Total: <strong className="text-[#000004]">{currentJobApplicants.length} candidates</strong>
              </span>
              <button
                onClick={() => setSelectedJobForApplicants(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-[#000004] text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. JOB DETAILS MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedJobForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-[#FCF9F5]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#342A21] text-amber-300 font-black text-sm flex items-center justify-center shadow-xs">
                  {selectedJobForDetails.companyInitial || selectedJobForDetails.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold uppercase">
                      {selectedJobForDetails.category}
                    </span>
                    <span className="text-xs text-[#70798C] font-semibold">{selectedJobForDetails.city}, Delta</span>
                  </div>
                  <h3 className="font-display font-black text-lg text-[#000004] mt-0.5">
                    {selectedJobForDetails.title}
                  </h3>
                  <p className="text-xs text-[#70798C]">{selectedJobForDetails.companyName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#000004]">
              {/* Quick Specs Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-[#70798C] block uppercase font-bold">Salary / Pay</span>
                  <span className="font-bold text-[#000004] mt-0.5 block">{selectedJobForDetails.salaryRange}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-[#70798C] block uppercase font-bold">Workplace</span>
                  <span className="font-bold text-[#000004] mt-0.5 block">{selectedJobForDetails.workplaceType}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-[#70798C] block uppercase font-bold">Role Type</span>
                  <span className="font-bold text-[#000004] mt-0.5 block">{selectedJobForDetails.roleType}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-[#70798C] block uppercase font-bold">Fee Status</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">₦2,000 Verified</span>
                </div>
              </div>

              {/* Office Address */}
              <div className="p-3 rounded-xl bg-[#FCF9F5] border border-amber-200/60 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#000004] block">Workplace / Office Address:</span>
                  <span className="text-slate-600">{selectedJobForDetails.address}</span>
                </div>
              </div>

              {/* Summary */}
              {selectedJobForDetails.summary && (
                <div>
                  <h4 className="font-bold text-sm text-[#000004] mb-1">Role Summary</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedJobForDetails.summary}</p>
                </div>
              )}

              {/* Description */}
              {selectedJobForDetails.description && (
                <div>
                  <h4 className="font-bold text-sm text-[#000004] mb-1">Full Description</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedJobForDetails.description}
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJobForDetails.responsibilities?.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-[#000004] mb-2">Key Responsibilities</h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    {selectedJobForDetails.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {selectedJobForDetails.requirements?.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-[#000004] mb-2">Role Requirements</h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    {selectedJobForDetails.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-[#000004] block">Employer / Lister Contact Information</span>
                <div className="flex items-center gap-4 text-slate-600 flex-wrap">
                  {selectedJobForDetails.contactEmail && <span>Email: {selectedJobForDetails.contactEmail}</span>}
                  {selectedJobForDetails.contactPhone && <span>Phone: {selectedJobForDetails.contactPhone}</span>}
                  {selectedJobForDetails.posterName && <span>Lister: {selectedJobForDetails.posterName}</span>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-[#FCF9F5] flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedJobForApplicants(selectedJobForDetails);
                  setSelectedJobForDetails(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View Applicants ({getJobApplications(selectedJobForDetails.id).length})</span>
              </button>

              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-[#000004] text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. POST ENTERPRISE VACANCY MODAL (SUPER ADMIN)                           */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-[#FCF9F5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Super Admin Direct Publishing
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-[#000004] mt-1">
                  Post Verified Career Vacancy
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5">
                  Listing fee is automatically cleared and marked verified for official administrative postings.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateJobSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createJobForm.title}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Company / Employer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createJobForm.companyName}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, companyName: e.target.value })}
                    placeholder="e.g. Zenith Tech Solutions Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000004]/10 focus:border-[#000004] text-xs text-[#000004]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Delta State City</label>
                  <select
                    value={createJobForm.city}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-[#000004]"
                  >
                    {DELTA_CITIES.filter((c) => c !== 'All Cities').map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Workplace Arrangement</label>
                  <select
                    value={createJobForm.workplaceType}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, workplaceType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-[#000004]"
                  >
                    <option value="On-Site">On-Site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Role Type</label>
                  <select
                    value={createJobForm.roleType}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, roleType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-[#000004]"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="PPA (Corpers)">PPA (Corpers)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">
                    Workplace Office / Landmark Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createJobForm.address}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, address: e.target.value })}
                    placeholder="e.g. Okpanam Road, Beside Zenith Bank, Asaba"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000004]/10 text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Salary Range / Budget</label>
                  <input
                    type="text"
                    value={createJobForm.salaryRange}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, salaryRange: e.target.value })}
                    placeholder="e.g. ₦180,000 – ₦250,000 / month"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000004]/10 text-xs text-[#000004]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Industry Category</label>
                  <select
                    value={createJobForm.category}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-[#000004]"
                  >
                    {JOB_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Employer Email</label>
                  <input
                    type="email"
                    value={createJobForm.contactEmail}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, contactEmail: e.target.value })}
                    placeholder="e.g. careers@company.ng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Employer Phone</label>
                  <input
                    type="tel"
                    value={createJobForm.contactPhone}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, contactPhone: e.target.value })}
                    placeholder="e.g. 08031234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#000004]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#000004] block mb-1">
                  Role Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={createJobForm.summary}
                  onChange={(e) => setCreateJobForm({ ...createJobForm, summary: e.target.value })}
                  placeholder="Concise 2-line summary displayed on the card..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#000004] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-[#000004] block mb-1">Responsibilities (1 per line)</label>
                  <textarea
                    rows={3}
                    value={createJobForm.responsibilities}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, responsibilities: e.target.value })}
                    placeholder="Architect responsive UI components&#10;Collaborate with product team&#10;Optimize core web vitals"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#000004] resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#000004] block mb-1">Requirements (1 per line)</label>
                  <textarea
                    rows={3}
                    value={createJobForm.requirements}
                    onChange={(e) => setCreateJobForm({ ...createJobForm, requirements: e.target.value })}
                    placeholder="3+ years React & TypeScript&#10;Strong communication&#10;Based in Delta State"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#000004] resize-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-900 font-medium">
                  Super Admin Privilege: Listing fee (₦2,000) is marked <strong>Verified & Paid</strong>. Vacancy goes live instantly across Setlla feed.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-5 py-2 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingJob ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span>Publish Vacancy Live</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
