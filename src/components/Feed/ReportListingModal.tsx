import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ModalPortal } from '../UI/ModalPortal';

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  onSubmitReport: (propertyId: string, reason: string, additionalNotes?: string) => void;
}

export const REPORT_REASONS = [
  'House already rented out / no longer vacant',
  'Pictures do not match the actual property',
  'Agent quoted a different price',
  'Suspected fraudulent listing',
] as const;

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReport(propertyId, selectedReason, additionalNotes);
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none"
        onClick={onClose}
      >
      <div 
        className="w-full max-w-md bg-[#FFFFFF] rounded-[12px] shadow-2xl border border-[rgba(112,121,140,0.2)] overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[rgba(112,121,140,0.15)] bg-[#FCF9F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F0544F]/10 text-[#F0544F] flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#000004]">
                Report Listing
              </h3>
              <p className="text-[11px] text-[#70798C] truncate max-w-[240px] sm:max-w-[280px]" title={propertyTitle}>
                {propertyTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close report modal"
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
              Why are you reporting this listing?
            </label>

            {/* Radio Group */}
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    className={`flex items-start gap-3 p-3 rounded-[12px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#F0544F] bg-[#F0544F]/5 ring-1 ring-[#F0544F]/30'
                        : 'border-[rgba(112,121,140,0.2)] bg-[#FFFFFF] hover:bg-[#FCF9F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason)}
                      className="mt-0.5 accent-[#F0544F] text-[#F0544F] focus:ring-[#F0544F]"
                    />
                    <span className="text-xs font-medium text-[#000004] leading-snug">
                      {reason}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional Additional Context */}
          <div>
            <label className="text-xs font-medium text-[#70798C] block mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Agent said the unit was taken yesterday or asked for unlisted fee..."
              className="w-full p-2.5 rounded-[12px] border border-[rgba(112,121,140,0.25)] bg-[#FCF9F5] text-xs text-[#000004] placeholder:text-[#70798C]/70 focus:outline-none focus:border-[#342A21] focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[12px] text-xs font-bold text-[#70798C] hover:text-[#000004] hover:bg-black/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="px-4 py-2.5 rounded-[12px] bg-[#F0544F] hover:bg-[#d9433e] text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
