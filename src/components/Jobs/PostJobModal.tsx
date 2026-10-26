import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Layers,
  HelpCircle,
  CreditCard,
  Check
} from 'lucide-react';
import { JobListing, JobRoleType, JobWorkplaceType } from '../../types/jobs';
import { UserProfile } from '../../types/marketplace';
import { createJobListing } from '../../services/jobService';
import { PaystackModal } from '../Booking/PaystackModal';
import { formatNaira } from '../../utils/formatters';
import { AdminCustomSelect, AdminSelectOption } from '../UI/AdminCustomSelect';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onJobCreated: (newJob: JobListing) => void;
}

const DELTA_CITIES = ['Asaba', 'Warri', 'Effurun', 'Sapele', 'Ughelli', 'Agbor', 'Abraka', 'Kwale', 'Oghara'];

const CATEGORY_OPTIONS: AdminSelectOption[] = [
  { value: 'Technology & Software', label: 'Technology & Software' },
  { value: 'Healthcare & Medical', label: 'Healthcare & Medical' },
  { value: 'Oil & Gas / Energy', label: 'Oil & Gas / Energy' },
  { value: 'Finance & Accounting', label: 'Finance & Accounting' },
  { value: 'Logistics & Operations', label: 'Logistics & Operations' },
  { 
    value: 'Education & NYSC PPA', 
    label: 'Education & NYSC PPA',
    badge: 'NYSC PPA',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  { value: 'Sales & Marketing', label: 'Sales & Marketing' },
  { value: 'Hospitality & Tourism', label: 'Hospitality & Tourism' },
  { value: 'Administrative & Office', label: 'Administrative & Office' },
  { value: 'Construction & Engineering', label: 'Construction & Engineering' },
];

const CATEGORIES = CATEGORY_OPTIONS.map((c) => c.value);

const ROLE_TYPE_OPTIONS: AdminSelectOption[] = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
  { 
    value: 'PPA (Corpers)', 
    label: 'PPA (Corpers)',
    badge: 'NYSC',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  { value: 'Part-Time', label: 'Part-Time' },
];

const ROLE_TYPES: JobRoleType[] = [
  'Full-Time',
  'Contract',
  'Internship',
  'PPA (Corpers)',
  'Part-Time'
];

const CITY_OPTIONS: AdminSelectOption[] = DELTA_CITIES.map((c) => ({
  value: c,
  label: `${c}, Delta State`,
}));

const WORKPLACE_TYPES: JobWorkplaceType[] = ['On-Site', 'Hybrid', 'Remote'];

const JOB_LISTING_FEE = 2000; // ₦2,000 Fair Pricing

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onJobCreated,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(currentUser.fullName ? `${currentUser.fullName} & Partners` : 'Delta Enterprise');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [roleType, setRoleType] = useState<JobRoleType>('Full-Time');
  const [workplaceType, setWorkplaceType] = useState<JobWorkplaceType>('On-Site');
  const [city, setCity] = useState(currentUser.operatingCity || 'Asaba');
  const [address, setAddress] = useState('');
  const [salaryRange, setSalaryRange] = useState('₦180,000 – ₦250,000 / month');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('Competitive remuneration, career growth, verified partner employer');
  const [contactEmail, setContactEmail] = useState(currentUser.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!title.trim()) errs.title = 'Job title is required';
      if (!companyName.trim()) errs.companyName = 'Company / Agency name is required';
    } else if (step === 2) {
      if (!city) errs.city = 'Please select a Delta State city';
      if (!address.trim()) errs.address = 'Office address or landmark is required';
      if (!salaryRange.trim()) errs.salaryRange = 'Salary or compensation range is required';
    } else if (step === 3) {
      if (!summary.trim()) errs.summary = 'A short 2-line summary is required for feed preview';
      if (!description.trim()) errs.description = 'Detailed job description is required';
      if (!contactEmail.trim() || !contactEmail.includes('@')) errs.contactEmail = 'Valid contact email is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as any);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleInitiatePayment = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setCurrentStep(1);
      return;
    }
    setShowPaystackModal(true);
  };

  const handlePaymentSuccess = async (paymentReference: string) => {
    setShowPaystackModal(false);
    setIsSubmitting(true);

    try {
      const responsibilities = responsibilitiesText
        .split('\n')
        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);

      const requirements = requirementsText
        .split('\n')
        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);

      const benefits = benefitsText
        .split('\n')
        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);

      const created = await createJobListing({
        title,
        companyName,
        city,
        address,
        workplaceType,
        roleType,
        salaryRange,
        summary,
        description,
        responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute core responsibilities aligned with company targets.'],
        requirements: requirements.length > 0 ? requirements : ['Relevant qualifications and experience in this field.'],
        benefits,
        category,
        contactEmail,
        contactPhone,
        posterId: currentUser.id,
        posterEmail: currentUser.email,
        posterName: currentUser.fullName,
        paymentReference,
        listingFeePaid: JOB_LISTING_FEE,
      });

      onJobCreated(created);
      onClose();
    } catch (e) {
      console.error('Failed to publish job:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#342A21]/15 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#000004] text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-[#000004]">
                  Post a Job Vacancy
                </h3>
              </div>
              <p className="text-xs text-[#70798C]">
                Delta State Employer & Recruiter Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-[#E5E7EB] flex items-center justify-center text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Step Progress Pill Indicator */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 text-xs">
          {[
            { step: 1, label: 'Role Basics' },
            { step: 2, label: 'Location & Pay' },
            { step: 3, label: 'Details' },
            { step: 4, label: 'Review & Publish' },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div 
                key={item.step} 
                className={`flex items-center gap-1.5 font-bold ${
                  isCurrent ? 'text-[#000004]' : isCompleted ? 'text-emerald-700' : 'text-[#70798C]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? 'bg-[#000004] text-white shadow-xs' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-[#70798C]'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : item.step}
                </span>
                <span className="hidden sm:inline text-[11px]">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: ROLE BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Web Developer, Branch Accountant, PPA Math Teacher"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.title ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                  } focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004]`}
                />
                {errors.title && <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Company / Agency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Delta Heritage Tech Labs, Novena Energy Systems"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.companyName ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                  } focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004]`}
                />
                {errors.companyName && <p className="text-[11px] text-red-600 mt-1">{errors.companyName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    Industry Category
                  </label>
                  <AdminCustomSelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={CATEGORY_OPTIONS}
                    variant="form"
                    placeholder="Select industry..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    Employment Type
                  </label>
                  <AdminCustomSelect
                    value={roleType}
                    onChange={(val) => setRoleType(val as JobRoleType)}
                    options={ROLE_TYPE_OPTIONS}
                    variant="form"
                    placeholder="Select employment type..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Workplace Arrangement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORKPLACE_TYPES.map((wt) => (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => setWorkplaceType(wt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        workplaceType === wt
                          ? 'bg-[#000004] text-white border-[#000004] shadow-xs'
                          : 'bg-[#FCF9F5] text-[#70798C] border-[#E5E7EB] hover:bg-slate-100'
                      }`}
                    >
                      {wt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & PAY */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    Delta State City <span className="text-red-500">*</span>
                  </label>
                  <AdminCustomSelect
                    value={city}
                    onChange={(val) => setCity(val)}
                    options={CITY_OPTIONS}
                    variant="form"
                    placeholder="Select Delta city..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    Salary / Compensation Range <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. ₦200,000 – ₦300,000 / month, or Negotiable"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                      errors.salaryRange ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                    } focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004]`}
                  />
                  {errors.salaryRange && <p className="text-[11px] text-red-600 mt-1">{errors.salaryRange}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Office / Workplace Address or Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Okpanam Road, Near Zenith Bank, Asaba"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.address ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                  } focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004]`}
                />
                {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    Contact Email for Submissions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="recruitment@yourcompany.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] focus:outline-none focus:border-[#000004]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#000004] mb-1">
                    WhatsApp Hotline for Applicants (Optional)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] focus:outline-none focus:border-[#000004]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & REQUIREMENTS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Short Feed Summary (1–2 sentences) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Fast preview shown to candidates on mobile feed before expanding details..."
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.summary ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                  } focus:outline-none focus:border-[#000004]`}
                />
                {errors.summary && <p className="text-[11px] text-red-600 mt-1">{errors.summary}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Full Role Overview <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the role, daily work context, and company vision..."
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                    errors.description ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] bg-[#FCF9F5]'
                  } focus:outline-none focus:border-[#000004]`}
                />
                {errors.description && <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  placeholder="• Manage daily customer inquiries&#10;• Prepare weekly reports&#10;• Collaborate with technical team"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] focus:outline-none focus:border-[#000004]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#000004] mb-1">
                  Candidate Requirements (One per line)
                </label>
                <textarea
                  rows={3}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  placeholder="• B.Sc / HND in relevant field&#10;• Minimum 1-2 years experience&#10;• Strong communication and organizational skills"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] focus:outline-none focus:border-[#000004]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: FAIR PRICING & PAYMENT (₦2,000) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Fair Pricing Explainer Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-amber-50/70 border border-amber-300/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#342A21]">
                      Fair Listing Fee Notice
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-2xs">
                    ₦2,000 Only
                  </span>
                </div>

                <p className="text-xs text-[#342A21] leading-relaxed">
                  Unlike free property rentals, <strong>job postings are strictly verified and require a fair fee of ₦2,000 per vacancy</strong>. This ensures real, legitimate job offers, deters recruitment spam, and gives your listing prioritized reach across Delta State.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#342A21] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>30 days active placement in feed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#342A21] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct candidate CV submissions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#342A21] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant WhatsApp & phone reach</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#342A21] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Official Verified Partner badge</span>
                  </div>
                </div>
              </div>

              {/* Vacancy Summary Card */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C]">
                  Listing Preview Summary
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#000004]">{title}</h4>
                    <p className="text-xs text-[#70798C]">{companyName} • {city}, Delta State ({workplaceType})</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#000004] text-[11px] font-bold shrink-0">
                    {roleType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[#70798C]">Salary:</span>
                  <span className="font-bold text-[#000004]">{salaryRange}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#70798C]">Publishing & Placement Fee:</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatNaira(JOB_LISTING_FEE)}</span>
                </div>
              </div>

              {/* Security Seal */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#70798C]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Secured via Paystack Gateway • Cards, Bank Transfer, USSD</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#000004] text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInitiatePayment}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#251E17] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Pay ₦2,000 & Publish Vacancy</span>
            </button>
          )}
        </div>
      </div>

      {/* Paystack Checkout Gateway Modal */}
      <PaystackModal
        isOpen={showPaystackModal}
        onClose={() => setShowPaystackModal(false)}
        amount={JOB_LISTING_FEE}
        applicantEmail={contactEmail || currentUser.email || 'employer@setlla.com'}
        applicantPhone={contactPhone || currentUser.phone}
        applicantName={companyName || currentUser.fullName}
        merchantName="Setlla Jobs Employer Portal"
        purposeTitle={`Listing Fee: ${title} (₦2,000 / 30 Days)`}
        buttonText="Pay ₦2,000 & Publish Vacancy"
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
