import React from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Banknote, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  ChevronRight, 
  Share2
} from 'lucide-react';
import { JobListing } from '../../types/jobs';

interface JobListingCardProps {
  job: JobListing;
  hasApplied: boolean;
  onViewDetails: (job: JobListing) => void;
  onQuickApply: (job: JobListing) => void;
  onShareJob?: (job: JobListing) => void;
}

export const JobListingCard: React.FC<JobListingCardProps> = ({
  job,
  hasApplied,
  onViewDetails,
  onQuickApply,
  onShareJob,
}) => {
  return (
    <article className={`w-full bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${
      job.isFeatured ? 'border-amber-300/80 hover:border-amber-400 bg-gradient-to-b from-amber-50/20 to-white' : 'border-[#E5E7EB] hover:border-[#000004]/20'
    }`}>
      {/* 1. Header: Company Logo / Avatar, Job Title, Company & Location */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Company Avatar / Logo */}
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#000004] text-white flex items-center justify-center font-bold text-sm sm:text-base tracking-wider shrink-0 shadow-2xs">
                {job.companyInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onViewDetails(job)}
                className="text-left font-display font-bold text-[#000004] text-base sm:text-lg hover:text-[#342A21] transition-colors line-clamp-1 cursor-pointer"
                title={job.title}
              >
                {job.title}
              </button>

              {/* Company Name & Location Pill */}
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#70798C] flex-wrap">
                <span className="font-semibold text-[#000004] truncate max-w-[180px] sm:max-w-none">
                  {job.companyName}
                </span>
                <span className="text-[#E5E7EB]">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#FCF9F5] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                  <MapPin className="w-3 h-3 text-[#70798C]" />
                  <span>{job.city}, {job.state}</span>
                  <span className="text-[#70798C]">({job.workplaceType})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Optional Share button */}
          {onShareJob && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShareJob(job);
              }}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Share Job Opportunity"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Quick Tags / Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs">
          {/* Sponsored Spotlight Badge */}
          {job.isFeatured && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 font-extrabold flex items-center gap-1 shadow-2xs">
              <span>Sponsored</span>
            </span>
          )}

          {/* Role Type */}
          <span className="px-2.5 py-1 rounded-lg bg-[#F4F5F7] border border-[#E5E7EB] text-[#000004] font-semibold flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-[#70798C]" />
            <span>{job.roleType}</span>
          </span>

          {/* Compensation Range */}
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>{job.salaryRange}</span>
          </span>

          {/* Recency Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] text-[#70798C] font-medium flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-[#70798C]" />
            <span>{job.postedDate}</span>
          </span>

          {/* Category Tag */}
          <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[#70798C] text-[11px]">
            {job.category}
          </span>
        </div>

        {/* 3. Role Snapshot: 2-line truncated key duties */}
        <p className="text-xs sm:text-[13px] text-[#70798C] line-clamp-2 leading-relaxed pt-0.5">
          {job.summary}
        </p>
      </div>

      {/* 4. Bottom Card CTAs */}
      <div className="pt-4 sm:pt-5 mt-3 border-t border-[#E5E7EB]/80 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onViewDetails(job)}
          className="py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#000004] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#70798C]" />
        </button>

        {hasApplied ? (
          <div className="py-2 sm:py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Application Submitted ✓</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onQuickApply(job)}
            className="py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs hover:shadow-sm flex items-center gap-1.5"
          >
            <span>Quick Apply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};
