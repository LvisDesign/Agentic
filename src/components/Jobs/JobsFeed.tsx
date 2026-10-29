import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  SlidersHorizontal, 
  RefreshCw,
  X,
  Building2,
  CheckCircle2,
  Share2,
  Plus,
  Megaphone,
  ArrowUpRight
} from 'lucide-react';
import { JobListing } from '../../types/jobs';
import { AdvertStory } from '../../data/mockAdverts';
import { UserProfile } from '../../types/marketplace';
import { JobListingCard } from './JobListingCard';
import { JobDetailsSheet } from './JobDetailsSheet';
import { JobApplicationDrawer } from './JobApplicationDrawer';
import { NativeBillboardAdCard } from './NativeBillboardAdCard';
import { InFeedSponsoredCarousel } from '../Feed/InFeedSponsoredCarousel';
import { DesktopAdvertSidebar } from '../Feed/DesktopAdvertSidebar';
import { AdvertStoriesTray } from '../Feed/AdvertStoriesTray';
import { 
  getAllJobs, 
  hasUserApplied, 
  injectNativeBillboardAds, 
  JobsFeedItem,
  isDemoOrTestJob 
} from '../../services/jobService';
import { CustomDropdown } from '../UI/CustomDropdown';

interface JobsFeedProps {
  currentUser: UserProfile;
  adverts?: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  onTriggerSignup?: () => void;
  onOpenEmployerPortal?: () => void;
  isAuthenticated: boolean;
}

const DELTA_JOB_CITIES = ['All Delta Cities', 'Asaba', 'Warri', 'Effurun', 'Sapele', 'Ughelli'];
const ROLE_TYPES = ['All Types', 'Full-Time', 'Contract', 'Internship', 'PPA (Corpers)'];

export const JobsFeed: React.FC<JobsFeedProps> = ({
  currentUser,
  adverts = [],
  onSelectAdvert = () => {},
  onOpenPostAd = () => {},
  onTriggerSignup,
  onOpenEmployerPortal,
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
      // Exclude any test or demo postings
      if (isDemoOrTestJob(job)) return false;

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
          const isPpaFilter = selectedRoleType.toLowerCase().includes('ppa') || selectedRoleType.toLowerCase().includes('corper');
          const isJobPpa = 
            job.roleType.toLowerCase().includes('ppa') || 
            job.roleType.toLowerCase().includes('corper') || 
            job.title.toLowerCase().includes('ppa') || 
            job.title.toLowerCase().includes('nysc') || 
            job.title.toLowerCase().includes('corper');
          if (!isPpaFilter || !isJobPpa) {
            return false;
          }
        }
      }

      return true;
    });
  }, [jobs, searchQuery, selectedCity, selectedRoleType]);

  // Indeed-style ranking: Sponsored Spotlight listings pinned to top, followed by recent organic listings
  const sortedAndRankedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      // 1. Sponsored spotlight listings pinned to top
      const aFeatured = Boolean(a.isFeatured);
      const bFeatured = Boolean(b.isFeatured);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      // 2. Newer listings first
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredJobs]);

  // Inject Native Billboard Ads among ranked job offers
  const feedItems = useMemo(() => {
    return injectNativeBillboardAds(sortedAndRankedJobs, adverts);
  }, [sortedAndRankedJobs, adverts]);

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#FCF9F5] overflow-hidden">
      {/* Pinned Top Filter & Search Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shrink-0 z-30 py-2.5 px-3 sm:px-6 shadow-2xs">
        <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto space-y-2.5">
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

          {/* Simplified Filter Controls: 2 Dropdown Pills + Clear + Live Count + Quick Post Ad */}
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
                  { value: 'PPA (Corpers)', label: 'PPA (Corpers)', subtitle: 'NYSC primary assignment' },
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

            {/* Live Count Pill & Post Ad Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-[11px] font-semibold text-[#70798C] shrink-0 hidden sm:block">
                <span className="font-bold text-[#000004]">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'vacancy' : 'vacancies'}
              </div>
              <button
                type="button"
                onClick={onOpenPostAd}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Post an advert on Setlla"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Post Ad</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FCF9F5] text-[#342A21] px-4 py-2.5 rounded-2xl shadow-xl border border-[#E5E7EB] flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#342A21] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Responsive Main Layout Container: Left Ad Sidebar (Fixed) + Center Jobs Stream (Scrollable) + Right Ad & Employer Hub (Fixed) */}
      <div className="w-full max-w-6xl xl:max-w-7xl mx-auto flex-1 min-h-0 flex items-start justify-center gap-5 xl:gap-6 px-3 sm:px-6 py-3 overflow-hidden">
        {/* Desktop Left Side Sponsored Ads - Fixed/anchored, does NOT scroll along as user scrolls */}
        <div className="hidden lg:flex flex-col shrink-0 h-full max-h-full w-[300px] xl:w-[320px] overflow-hidden">
          <DesktopAdvertSidebar
            adverts={adverts}
            onSelectAdvert={onSelectAdvert}
            onOpenPostAd={onOpenPostAd}
          />
        </div>

        {/* Center Main Jobs Feed Container - The ONLY scrolling column on desktop */}
        <main className="w-full max-w-2xl flex-1 min-w-0 h-full overflow-y-auto feed-scroll-container no-scrollbar space-y-4 sm:space-y-5 px-1 pb-16 overscroll-contain">
          {/* Mobile Ad Stories Tray (Visible only on < lg screens) */}
          {adverts && adverts.length > 0 && (
            <div className="lg:hidden w-full pb-2">
              <div className="flex items-center justify-between px-1 pb-1.5">
                <span className="text-[11px] font-bold text-[#70798C] uppercase tracking-wider">
                  Sponsored Promotions
                </span>
                <button
                  type="button"
                  onClick={onOpenPostAd}
                  className="text-[11px] font-bold text-[#342A21] hover:underline cursor-pointer"
                >
                  + Post Ad
                </button>
              </div>
              <AdvertStoriesTray
                adverts={adverts}
                onSelectAdvert={onSelectAdvert}
                onOpenPostAd={onOpenPostAd}
              />
            </div>
          )}

          {/* Active Filter Reset */}
          {(searchQuery || selectedCity !== 'All Delta Cities' || selectedRoleType !== 'All Types') && (
            <div className="flex items-center justify-end px-1 text-xs text-[#70798C]">
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
            </div>
          )}

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
            /* Stream of Jobs + In-Feed Ads Seated Directly Among Offers */
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
              } else if (item.type === 'carousel') {
                return (
                  <InFeedSponsoredCarousel
                    key={item.key}
                    adverts={item.adverts}
                    onSelectAdvert={onSelectAdvert}
                    onOpenPostAd={onOpenPostAd}
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

        {/* Extra-Wide Desktop Right Column: Sponsored Spotlight & Employer Hub - Fixed/anchored, does NOT scroll along */}
        <aside className="hidden xl:flex flex-col w-[290px] shrink-0 h-full max-h-full overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
          {/* 1. Featured Advert / Partner Spotlight (if adverts available) */}
          {adverts.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#342A21]/15 shadow-card p-4 overflow-hidden relative group">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#70798C]">
                    Partner Spotlight
                  </span>
                </div>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Featured
                </span>
              </div>

              {/* Advert Visual & Info */}
              <div 
                onClick={() => onSelectAdvert(adverts[0])}
                className="mt-3 cursor-pointer select-none space-y-2.5"
              >
                <div className="w-full h-[140px] rounded-2xl overflow-hidden relative bg-black/10">
                  <img
                    src={adverts[0].thumbnailUrl || adverts[0].mediaUrl}
                    alt={adverts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20">
                    {adverts[0].badgeText || adverts[0].category}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#000004]">
                    <span className="truncate">{adverts[0].advertiserName}</span>
                    {adverts[0].price && (
                      <span className="text-[#342A21] shrink-0 ml-1">{adverts[0].price}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#70798C] line-clamp-2 mt-0.5 leading-snug">
                    {adverts[0].headline || adverts[0].title}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Promote on Setlla Card */}
          <div className="bg-white rounded-3xl border border-[#342A21]/15 shadow-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FCF9F5] border border-[#342A21]/15 flex items-center justify-center text-[#342A21] shrink-0">
                <Megaphone className="w-4 h-4 text-[#342A21]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#000004]">Advertise on Setlla</h4>
                <p className="text-[10px] text-[#70798C]">Delta State Marketplace</p>
              </div>
            </div>

            <p className="text-xs text-[#70798C] leading-relaxed">
              Put your company, agency services, or products in front of thousands of active residents and job seekers daily.
            </p>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2 text-[11px] text-[#342A21]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Targeted Asaba, Warri & Delta reach</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#342A21]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified partner business badge</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#342A21]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Direct WhatsApp & web inquiries</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPostAd}
              className="w-full py-2.5 rounded-xl bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Create An Advert</span>
            </button>
          </div>

          {/* 3. Employer Hiring Spotlight */}
          <div className="bg-gradient-to-br from-[#FCF9F5] to-[#EFE8DF] rounded-3xl border border-[#342A21]/15 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C]">
                For Employers
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Fast Hiring
              </span>
            </div>
            <h4 className="text-xs font-bold text-[#000004]">
              Hiring in Delta State?
            </h4>
            <p className="text-[11px] text-[#70798C] leading-relaxed">
              Reach 10,000+ local professionals and get direct CV submissions delivered straight to your inbox.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated && onTriggerSignup) {
                  onTriggerSignup();
                } else if (onOpenEmployerPortal) {
                  onOpenEmployerPortal();
                } else {
                  setToastMessage('Employer vacancy portal is active. Contact support or post an ad.');
                  setTimeout(() => setToastMessage(null), 3500);
                }
              }}
              className="w-full py-2 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Post a Vacancy</span>
            </button>
          </div>
        </aside>
      </div>

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
