import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  RefreshCw,
  X,
  Building2,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { JobListing } from '../../types/jobs';
import { AdvertStory } from '../../data/mockAdverts';
import { UserProfile } from '../../types/marketplace';
import { JobListingCard } from './JobListingCard';
import { JobDetailsSheet } from './JobDetailsSheet';
import { JobApplicationDrawer } from './JobApplicationDrawer';
import { NativeBillboardAdCard } from './NativeBillboardAdCard';
import { 
  getAllJobs, 
  hasUserApplied, 
  injectNativeBillboardAds, 
  JobsFeedItem 
} from '../../services/jobService';
import { CustomDropdown } from '../UI/CustomDropdown';

interface JobsFeedProps {
  currentUser: UserProfile;
  adverts?: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onTriggerSignup?: () => void;
  isAuthenticated: boolean;
}

const DELTA_JOB_CITIES = ['All Delta Cities', 'Asaba', 'Warri', 'Effurun', 'Sapele', 'Ughelli'];
const ROLE_TYPES = ['All Types', 'Full-Time', 'Contract', 'Internship'];

export const JobsFeed: React.FC<JobsFeedProps> = ({
  currentUser,
  adverts = [],
  onSelectAdvert = () => {},
  onTriggerSignup,
  isAuthenticated,
}) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Delta Cities');
  const [selectedRoleType, setSelectedRoleType] = useState('All Types');

  // Modals & Drawers
  const [activeJobDetails, setActiveJobDetails] = useState<JobListing | null>(null);
  const [activeQuickApplyJob, setActiveQuickApplyJob] = useState<JobListing | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load jobs on mount
  useEffect(() => {
    let isMounted = true;
    getAllJobs().then((fetched) => {
      if (isMounted) {
        setJobs(fetched);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update applied job IDs whenever user changes or application is submitted
  useEffect(() => {
    if (jobs.length > 0) {
      const applied = new Set<string>();
      jobs.forEach((j) => {
        if (hasUserApplied(j.id, currentUser)) {
          applied.add(j.id);
        }
      });
      setAppliedJobIds(applied);
    }
  }, [jobs, currentUser]);

  const handleApplicationSuccess = (jobId: string) => {
    setAppliedJobIds((prev) => new Set(prev).add(jobId));
    setToastMessage('Application sent successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleShareJob = (job: JobListing) => {
    const shareUrl = `${window.location.origin}/#/jobs?id=${job.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setToastMessage('Job link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Filter jobs based on search query, city, and role type
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search text (title, company, description, category, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          job.title.toLowerCase().includes(q) ||
          job.companyName.toLowerCase().includes(q) ||
          job.category.toLowerCase().includes(q) ||
          job.city.toLowerCase().includes(q) ||
          job.summary.toLowerCase().includes(q);

        if (!matchesQuery) return false;
      }

      // City filter
      if (selectedCity !== 'All Delta Cities') {
        if (!job.city.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Role type filter
      if (selectedRoleType !== 'All Types') {
        if (job.roleType !== selectedRoleType) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, selectedCity, selectedRoleType]);

  // Inject Native Billboard Ads every 6th card
  const feedItems = useMemo(() => {
    return injectNativeBillboardAds(filteredJobs, adverts);
  }, [filteredJobs, adverts]);

  return (
    <div className="w-full flex-1 flex flex-col items-center bg-[#FCF9F5]">
      {/* Sticky Top Filter & Search Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] sticky top-16 z-30 py-3 px-3 sm:px-6 shadow-2xs">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70798C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job titles, skills, or companies in Delta State..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-[#E5E7EB] focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004] bg-[#FCF9F5]/70 placeholder:text-[#70798C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798C] hover:text-[#000004] cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Simplified Filter Controls: 2 Dropdown Pills + Clear */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Location Dropdown */}
              <CustomDropdown
                options={[
                  { value: 'All Delta Cities', label: 'All Cities', subtitle: 'All Delta State locations' },
                  { value: 'Asaba', label: 'Asaba', subtitle: 'Capital City & Tech Hub' },
                  { value: 'Warri', label: 'Warri', subtitle: 'Commercial & Oil Center' },
                  { value: 'Effurun', label: 'Effurun', subtitle: 'Commercial District' },
                  { value: 'Sapele', label: 'Sapele', subtitle: 'Industrial Corridor' },
                  { value: 'Ughelli', label: 'Ughelli', subtitle: 'Delta Central' },
                ]}
                value={selectedCity}
                onChange={setSelectedCity}
                onClear={() => setSelectedCity('All Delta Cities')}
                headerTitle="Filter by Location"
                icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
                variant="pill"
                allowCustomInput={false}
              />

              {/* Role Type Dropdown */}
              <CustomDropdown
                options={[
                  { value: 'All Types', label: 'All Types', subtitle: 'All employment arrangements' },
                  { value: 'Full-Time', label: 'Full-Time', subtitle: 'Permanent positions' },
                  { value: 'Contract', label: 'Contract', subtitle: 'Contractual & freelance' },
                  { value: 'Internship', label: 'Internship', subtitle: 'Entry-level & internships' },
                ]}
                value={selectedRoleType}
                onChange={setSelectedRoleType}
                onClear={() => setSelectedRoleType('All Types')}
                headerTitle="Employment Type"
                icon={<Briefcase className="w-3.5 h-3.5 text-[#70798C]" />}
                variant="pill"
                allowCustomInput={false}
              />

              {/* Clear active filters button */}
              {(selectedCity !== 'All Delta Cities' || selectedRoleType !== 'All Types' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('All Delta Cities');
                    setSelectedRoleType('All Types');
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F4F5F7] hover:bg-slate-200 text-[#000004] text-xs font-semibold transition-colors cursor-pointer border border-[#E5E7EB]"
                  title="Clear All Filters"
                >
                  <X className="w-3 h-3 text-[#70798C]" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Live Count Pill */}
            <div className="text-[11px] font-semibold text-[#70798C] shrink-0 hidden sm:block">
              <span className="font-bold text-[#000004]">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'vacancy' : 'vacancies'}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#000004] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Jobs Feed Container */}
      <main className="w-full max-w-2xl px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Results Counter / Active Filter Bar Summary */}
        <div className="flex items-center justify-between px-1 text-xs text-[#70798C]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#000004]">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'Career Opportunity' : 'Career Opportunities'}
            </span>
            <span>in Delta State</span>
          </div>

          {(searchQuery || selectedCity !== 'All Delta Cities' || selectedRoleType !== 'All Types') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('All Delta Cities');
                setSelectedRoleType('All Types');
              }}
              className="text-[#000004] hover:underline font-bold text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4 py-10">
            {[1, 2, 3].map((n) => (
              <div key={n} className="w-full h-48 rounded-3xl bg-white border border-[#E5E7EB] p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/2 h-4 bg-slate-200 rounded-md" />
                    <div className="w-1/3 h-3 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="w-full h-10 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          /* Empty Search Results */
          <div className="py-16 text-center bg-white rounded-3xl border border-[#E5E7EB] p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F5F7] text-[#000004] flex items-center justify-center mx-auto border border-[#E5E7EB]">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-base text-[#000004]">
              No jobs matching your search criteria
            </h3>
            <p className="text-xs text-[#70798C] max-w-sm mx-auto">
              Try adjusting your city filter or searching for broader terms like "developer", "logistics", or "manager".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('All Delta Cities');
                setSelectedRoleType('All Types');
              }}
              className="mt-2 py-2 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              View All Open Vacancies
            </button>
          </div>
        ) : (
          /* Stream of Jobs + Native Billboard Ads */
          feedItems.map((item) => {
            if (item.type === 'job') {
              const hasApplied = appliedJobIds.has(item.job.id);
              return (
                <JobListingCard
                  key={item.key}
                  job={item.job}
                  hasApplied={hasApplied}
                  onViewDetails={(j) => setActiveJobDetails(j)}
                  onQuickApply={(j) => {
                    if (!isAuthenticated && onTriggerSignup) {
                      onTriggerSignup();
                      return;
                    }
                    setActiveQuickApplyJob(j);
                  }}
                  onShareJob={handleShareJob}
                />
              );
            } else {
              return (
                <NativeBillboardAdCard
                  key={item.key}
                  advert={item.advert}
                  onSelectAdvert={onSelectAdvert}
                />
              );
            }
          })
        )}
      </main>

      {/* Slide-Up Job Details Sheet */}
      <JobDetailsSheet
        isOpen={Boolean(activeJobDetails)}
        onClose={() => setActiveJobDetails(null)}
        job={activeJobDetails}
        hasApplied={activeJobDetails ? appliedJobIds.has(activeJobDetails.id) : false}
        onQuickApply={(j) => {
          if (!isAuthenticated && onTriggerSignup) {
            onTriggerSignup();
            return;
          }
          setActiveQuickApplyJob(j);
        }}
      />

      {/* Slide-Up Quick Apply & CV Upload Drawer */}
      <JobApplicationDrawer
        isOpen={Boolean(activeQuickApplyJob)}
        onClose={() => setActiveQuickApplyJob(null)}
        job={activeQuickApplyJob}
        currentUser={currentUser}
        onApplicationSuccess={handleApplicationSuccess}
        onTriggerSignup={onTriggerSignup}
      />
    </div>
  );
};
