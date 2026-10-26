import React from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Briefcase, 
  Banknote, 
  Clock, 
  CheckCircle2, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Share2,
  AlertCircle
} from 'lucide-react';
import { JobListing } from '../../types/jobs';

interface JobDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing | null;
  hasApplied: boolean;
  onQuickApply: (job: JobListing) => void;
}

export const JobDetailsSheet: React.FC<JobDetailsSheetProps> = ({
  isOpen,
  onClose,
  job,
  hasApplied,
  onQuickApply,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-3 min-w-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#000004] text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-2xs">
                {job.companyInitial}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider block">
                {job.category}
              </span>
              <h3 className="font-display font-bold text-sm sm:text-base text-[#000004] truncate">
                {job.companyName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#70798C] hover:text-[#000004] border border-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close Job Details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#000004]">
          {/* Main Title & Key Meta Cards */}
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#000004] tracking-tight leading-snug">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#F4F5F7] border border-[#E5E7EB] text-[#000004] font-semibold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#70798C]" />
                <span>{job.roleType}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>{job.salaryRange}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] text-[#70798C] font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#70798C]" />
                <span>{job.postedDate}</span>
              </span>
            </div>
          </div>

          {/* Workplace Setting & Landmark Location Card */}
          <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#000004]">
              <MapPin className="w-4 h-4 text-[#70798C] shrink-0" />
              <span>Workplace Setting & Office Landmark</span>
            </div>
            <p className="text-xs sm:text-sm text-[#70798C] pl-6 font-medium">
              {job.address ? `${job.address} • ` : ''}{job.city}, {job.state} ({job.workplaceType})
            </p>
          </div>

          {/* Role Overview & Full Description */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold text-sm sm:text-base text-[#000004]">
              About the Role
            </h4>
            <p className="text-xs sm:text-sm text-[#70798C] leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Key Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#000004]">
                Key Responsibilities
              </h4>
              <ul className="space-y-2.5">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#70798C] leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-[#F4F5F7] text-[#000004] flex items-center justify-center shrink-0 mt-0.5 border border-[#E5E7EB]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements & Qualifications */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#000004]">
                Qualifications & Requirements
              </h4>
              <ul className="space-y-2.5">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#70798C] leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#000004]">
                Perks & Benefits
              </h4>
              <ul className="space-y-2.5">
                {job.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#70798C] leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#70798C] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Setlla Verified Employer: Application is free with zero recruitment agency charges.</span>
          </div>
        </div>

        {/* Sticky Bottom Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-white sticky bottom-0 flex items-center justify-between gap-3 shadow-lg">
          <div className="hidden sm:block">
            <span className="text-[11px] text-[#70798C] block">Compensation</span>
            <span className="font-display font-bold text-sm text-[#000004]">
              {job.salaryRange}
            </span>
          </div>

          <div className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#000004] text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>

            {hasApplied ? (
              <div className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Application Submitted ✓</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuickApply(job);
                }}
                className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <span>Quick Apply Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
