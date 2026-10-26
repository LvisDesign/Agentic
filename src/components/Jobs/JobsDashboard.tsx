import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  Search, 
  ArrowUpRight, 
  Plus, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  Check, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Megaphone
} from 'lucide-react';
import { JobListing, JobApplication } from '../../types/jobs';
import { UserProfile } from '../../types/marketplace';
import { 
  getAllJobs, 
  getSavedApplications, 
  getSavedCandidateCV, 
  saveCandidateCV,
  SavedCandidateCV
} from '../../services/jobService';

interface JobsDashboardProps {
  currentUser: UserProfile;
  onSwitchToFeed: () => void;
  onOpenSignup?: () => void;
  onOpenPostAd?: () => void;
  onSelectJob?: (job: JobListing) => void;
  isAuthenticated: boolean;
}

export const JobsDashboard: React.FC<JobsDashboardProps> = ({
  currentUser,
  onSwitchToFeed,
  onOpenSignup,
  onOpenPostAd,
  onSelectJob,
  isAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'resume' | 'recommended'>('applications');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedCV, setSavedCV] = useState<SavedCandidateCV | null>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load jobs and applications
  useEffect(() => {
    let isMounted = true;
    getAllJobs().then((fetched) => {
      if (isMounted) setJobs(fetched);
    });

    const apps = getSavedApplications();
    const userApps = apps.filter((a) => {
      if (currentUser?.id && a.applicantId === currentUser.id) return true;
      if (currentUser?.email && a.applicantEmail && a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (currentUser?.phone && a.applicantPhone && a.applicantPhone === currentUser.phone) return true;
      return true;
    });
    setApplications(userApps);

    const cv = getSavedCandidateCV(currentUser);
    if (cv) {
      setSavedCV(cv);
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCV(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      saveCandidateCV(file.name, dataUrl, currentUser);
      setSavedCV({ fileName: file.name, dataUrl, uploadedAt: new Date().toISOString() });
      setIsUploadingCV(false);
      setToastMessage('Resume updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadCV = () => {
    if (!savedCV || !savedCV.dataUrl) return;
    const a = document.createElement('a');
    a.href = savedCV.dataUrl;
    a.download = savedCV.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // KPIs
  const totalApplied = applications.length;
  const inReview = applications.filter((a) => a.status === 'submitted' || a.status === 'reviewed').length;
  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;

  return (
    <div className="w-full min-h-screen bg-[#FCF9F5] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#000004] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Header */}
      <section className="w-full bg-white border-b border-[#E5E7EB] pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#000004] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'JS'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#000004]">
                  {currentUser.fullName || 'Job Seeker Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-300">
                  Setlla Jobs
                </span>
              </div>
              <p className="text-xs text-[#70798C] mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
                  <span>{currentUser.operatingCity || 'Delta State, Nigeria'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#70798C]" />
                  <span>{currentUser.email || 'Email registered'}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={onSwitchToFeed}
              className="px-4 py-2.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Vacancies</span>
            </button>
            {onOpenPostAd && (
              <button
                type="button"
                onClick={onOpenPostAd}
                className="px-3.5 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Post Ad</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
              Applications
            </span>
            <div className="text-2xl font-display font-extrabold text-[#000004]">
              {totalApplied}
            </div>
            <p className="text-[10px] text-[#70798C]">Submitted to employers</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
              In Review
            </span>
            <div className="text-2xl font-display font-extrabold text-amber-700">
              {inReview}
            </div>
            <p className="text-[10px] text-[#70798C]">Being evaluated</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
              Shortlisted
            </span>
            <div className="text-2xl font-display font-extrabold text-emerald-600">
              {shortlisted}
            </div>
            <p className="text-[10px] text-[#70798C]">Interview stage</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
              Resume Status
            </span>
            <div className="text-sm font-extrabold text-[#000004] flex items-center gap-1.5 pt-1">
              {savedCV ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Attached & Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No CV Attached</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-[#70798C]">One-tap Quick Apply</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'applications'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]'
            }`}
          >
            My Applications ({totalApplied})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'resume'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]'
            }`}
          >
            Resume & CV Manager
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recommended'
                ? 'bg-[#000004] text-white shadow-xs'
                : 'bg-white text-[#70798C] hover:text-[#000004] border border-[#E5E7EB]'
            }`}
          >
            Recommended Opportunities ({jobs.length})
          </button>
        </div>

        {/* TAB 1: Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#70798C] shadow-2xs">
                  <Briefcase className="w-7 h-7 text-[#342A21]" />
                </div>
                <h3 className="font-display font-bold text-base text-[#000004]">
                  No job applications submitted yet
                </h3>
                <p className="text-xs text-[#70798C] max-w-sm mx-auto leading-relaxed">
                  Start applying for open roles across Asaba, Warri, Sapele and other Delta State hubs. Your submitted applications and employer reviews will appear right here.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToFeed}
                  className="mt-2 py-2.5 px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Browse Vacancies in Delta State
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app) => (
                  <article
                    key={app.id}
                    className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#70798C] uppercase tracking-wider">
                          {app.companyName}
                        </span>
                        <h4 className="font-display font-bold text-base text-[#000004] mt-0.5">
                          {app.jobTitle}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        app.status === 'shortlisted'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.status === 'reviewed'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {app.status === 'shortlisted'
                          ? 'Shortlisted'
                          : app.status === 'reviewed'
                          ? 'Viewed'
                          : 'Submitted'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#342A21] shrink-0" />
                        <span className="truncate font-semibold text-[#000004]">
                          {app.cvFileName}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#70798C] shrink-0 ml-2">
                        Attached CV
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#70798C] pt-1">
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={onSwitchToFeed}
                        className="font-bold text-[#000004] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Vacancy</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Resume & Profile Hub */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-display font-bold text-base text-[#000004]">
                    Curriculum Vitae (CV) & Resume
                  </h3>
                  <p className="text-xs text-[#70798C] mt-0.5">
                    Your attached CV is submitted directly to verified Delta State employers when you tap Quick Apply.
                  </p>
                </div>
              </div>

              {savedCV ? (
                <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#342A21]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#342A21] shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5 text-[#342A21]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#000004] truncate">
                        {savedCV.fileName}
                      </h4>
                      <p className="text-[11px] text-[#70798C]">
                        Ready for 1-tap application • PDF / DOCX
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadCV}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#000004] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <label className="px-3.5 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingCV ? 'Uploading...' : 'Replace CV'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FCF9F5] rounded-2xl border-2 border-dashed border-[#E5E7EB] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#70798C] shadow-2xs">
                    <Upload className="w-6 h-6 text-[#342A21]" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#000004]">
                    Upload your candidate CV / Resume
                  </h4>
                  <p className="text-xs text-[#70798C] max-w-sm mx-auto">
                    Supported formats: PDF, DOCX (Max 10MB). Upload once and apply to multiple jobs instantly.
                  </p>
                  <label className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Resume</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Profile Details Summary */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[#000004] uppercase tracking-wider mb-2">
                  Candidate Profile Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                    <span className="text-[#70798C]">Official Email:</span>
                    <span className="font-bold text-[#000004]">{currentUser.email || 'Not provided'}</span>
                  </div>
                  <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                    <span className="text-[#70798C]">Phone Number:</span>
                    <span className="font-bold text-[#000004]">{currentUser.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Recommended Jobs */}
        {activeTab === 'recommended' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.slice(0, 6).map((job) => (
                <article
                  key={job.id}
                  className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#000004] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {job.companyInitial}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#000004]">
                          {job.title}
                        </h4>
                        <p className="text-[11px] text-[#70798C]">{job.companyName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F5F7] text-[#000004] border border-[#E5E7EB]">
                      {job.roleType}
                    </span>
                  </div>

                  <p className="text-xs text-[#70798C] line-clamp-2 leading-relaxed">
                    {job.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                    <span className="font-bold text-emerald-800">
                      {job.salaryRange}
                    </span>
                    <button
                      type="button"
                      onClick={onSwitchToFeed}
                      className="px-3 py-1.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Quick Apply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
