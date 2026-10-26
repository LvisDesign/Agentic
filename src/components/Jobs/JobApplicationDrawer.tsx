import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  ArrowRight,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { JobListing } from '../../types/jobs';
import { UserProfile } from '../../types/marketplace';
import { 
  getSavedCandidateCV, 
  uploadCandidateCVFile, 
  submitJobApplication,
  SavedCandidateCV
} from '../../services/jobService';

interface JobApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing | null;
  currentUser: UserProfile;
  onApplicationSuccess: (jobId: string) => void;
  onTriggerSignup?: () => void;
}

export const JobApplicationDrawer: React.FC<JobApplicationDrawerProps> = ({
  isOpen,
  onClose,
  job,
  currentUser,
  onApplicationSuccess,
  onTriggerSignup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Applicant details pre-populated from profile
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [coverNote, setCoverNote] = useState('');

  // CV Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedCV, setSavedCV] = useState<SavedCandidateCV | null>(null);
  const [isUsingSavedCV, setIsUsingSavedCV] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      setApplicantName(currentUser?.fullName || '');
      setApplicantEmail(currentUser?.email || '');
      setApplicantPhone(currentUser?.phone || '');
      setCoverNote('');
      setErrorMessage(null);
      setSuccessToast(null);
      setSelectedFile(null);

      // Check for previously saved candidate CV
      const cached = getSavedCandidateCV(currentUser);
      if (cached && cached.fileName && cached.dataUrl) {
        setSavedCV(cached);
        setIsUsingSavedCV(true);
      } else {
        setSavedCV(null);
        setIsUsingSavedCV(false);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !job) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
    // Always reset input value so re-selecting same file works
    e.target.value = '';
  };

  const validateAndSetFile = (file?: File) => {
    setErrorMessage(null);
    if (!file) return;

    // Validate extension (.pdf, .doc, .docx, .png, .jpg, .jpeg, .webp)
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
    const isAllowedExt = allowedExts.includes(ext);

    const isAllowedMime = 
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isAllowedExt && !isAllowedMime) {
      setErrorMessage('Please upload a valid CV file in PDF, Word (.doc, .docx), or image format.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
    setIsUsingSavedCV(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    if (!applicantName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 9) {
      setErrorMessage('Please enter a valid Nigerian mobile phone number.');
      return;
    }

    // CV requirement
    if (!selectedFile && (!isUsingSavedCV || !savedCV)) {
      setErrorMessage('Please upload your CV/Resume (.pdf or .docx) to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCvUrl = '';
      let finalCvName = '';

      if (isUsingSavedCV && savedCV?.dataUrl) {
        finalCvUrl = savedCV.dataUrl;
        finalCvName = savedCV.fileName;
      } else if (selectedFile) {
        const uploadResult = await uploadCandidateCVFile(selectedFile, currentUser?.id);
        finalCvUrl = uploadResult.url;
        finalCvName = uploadResult.fileName;
      }

      await submitJobApplication({
        job,
        user: currentUser,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantPhone: applicantPhone.trim(),
        cvFileName: finalCvName,
        cvUrl: finalCvUrl,
        coverNote: coverNote.trim() || undefined
      });

      // Show success toast
      setSuccessToast(`Application sent successfully to ${job.companyName}!`);
      onApplicationSuccess(job.id);

      // Close drawer after short visual confirmation
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[JobApplication] Submission error:', err);
      setErrorMessage(err?.message || 'Failed to submit application. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#000004] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {job.companyInitial}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#70798C] uppercase tracking-wider block">
                Quick Apply
              </span>
              <h3 className="font-display font-bold text-sm sm:text-base text-[#000004] truncate">
                {job.title}
              </h3>
              <p className="text-[11px] text-[#70798C] truncate">
                {job.companyName} • {job.city}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#70798C] hover:text-[#000004] border border-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-[#000004]">
          {/* Applicant Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#000004] uppercase tracking-wider">
              1. Candidate Information
            </h4>

            <div>
              <label className="block text-xs font-medium text-[#70798C] mb-1">
                Full Legal Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798C]" />
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Dolapo Adebayo"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004] bg-[#FCF9F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#70798C] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798C]" />
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004] bg-[#FCF9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#70798C] mb-1">
                  Mobile Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798C]" />
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="0803 123 4567"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004] bg-[#FCF9F5]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CV / Resume Upload Section */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#000004] uppercase tracking-wider">
                2. Curriculum Vitae (CV) *
              </h4>
              <span className="text-[10px] text-[#70798C]">.pdf, .doc, .docx, images (Max 10MB)</span>
            </div>

            {/* Persistent file input (sr-only instead of hidden so all browsers allow clicking/triggering) */}
            <input
              id="cv-file-upload"
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            {/* If user has saved CV and is choosing to use it */}
            {isUsingSavedCV && savedCV ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                      Using saved CV
                    </span>
                    <p className="text-xs font-bold text-[#000004] truncate">
                      {savedCV.fileName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUsingSavedCV(false);
                    fileInputRef.current?.click();
                  }}
                  className="py-1 px-2.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/60 transition-colors cursor-pointer shrink-0"
                >
                  Replace
                </button>
              </div>
            ) : selectedFile ? (
              /* User selected a new file */
              <div className="p-3.5 rounded-2xl bg-[#F4F5F7] border border-[#E5E7EB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#000004] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#70798C] font-bold uppercase tracking-wider block">
                      Ready to attach
                    </span>
                    <p className="text-xs font-bold text-[#000004] truncate">
                      {selectedFile.name}
                    </p>
                    <span className="text-[10px] text-[#70798C]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#000004] hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Change file"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag-and-drop / Tap-to-upload accessible label */
              <label
                htmlFor="cv-file-upload"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative block p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  isDragOver
                    ? 'border-[#000004] bg-[#F4F5F7]'
                    : 'border-[#E5E7EB] hover:border-[#000004] bg-[#FCF9F5]/70 hover:bg-white'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white text-[#000004] flex items-center justify-center border border-[#E5E7EB] shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#000004]">
                      Tap to upload or drag & drop your CV
                    </p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Accepted formats: PDF, Word, or image (Max 10MB)
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#000004] text-white text-xs font-bold shadow-2xs mt-1">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choose File from Device</span>
                  </span>
                </div>

                {savedCV && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsUsingSavedCV(true);
                    }}
                    className="relative z-20 mt-3 text-[11px] text-[#000004] font-bold hover:underline cursor-pointer block mx-auto"
                  >
                    Use saved CV ({savedCV.fileName})
                  </button>
                )}
              </label>
            )}
          </div>

          {/* Optional Short Note */}
          <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
            <label className="block text-xs font-medium text-[#70798C]">
              Brief Note to Employer / Portfolio Link (Optional)
            </label>
            <input
              type="text"
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="e.g. 4 years logistics experience in Delta State • github.com/myprofile"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#000004] focus:ring-1 focus:ring-[#000004] bg-[#FCF9F5]"
            />
          </div>

          {/* Submit Action Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || Boolean(successToast)}
              className="w-full py-3 px-5 rounded-xl bg-[#000004] hover:bg-[#1f2937] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : successToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submitted Successfully!</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
