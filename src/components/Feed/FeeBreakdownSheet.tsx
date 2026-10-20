import React from 'react';
import { X, ShieldCheck, Info } from 'lucide-react';
import { FeeBreakdown } from '../../types/marketplace';
import { formatNaira } from '../../utils/formatters';

interface FeeBreakdownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  fees: FeeBreakdown;
  title: string;
  onProceedToBooking?: () => void;
}

export const FeeBreakdownSheet: React.FC<FeeBreakdownSheetProps> = ({
  isOpen,
  onClose,
  fees,
  title,
  onProceedToBooking,
}) => {
  if (!isOpen) return null;

  // Resolve legal and agency split
  const legalFee = fees.legalFee ?? (fees.legalAndAgencyFee ? Math.round(fees.legalAndAgencyFee / 2) : Math.round(fees.baseRent * 0.1));
  const agencyCommission = fees.agencyFee ?? (fees.legalAndAgencyFee ? (fees.legalAndAgencyFee - legalFee) : Math.round(fees.baseRent * 0.1));

  const handleProceed = () => {
    onClose();
    if (onProceedToBooking) {
      onProceedToBooking();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      {/* Sheet Container: Mobile bottom sheet (rounded-t-[16px]) / Desktop centered modal (sm:rounded-[12px]) */}
      <div 
        className="w-full max-w-lg bg-[#FFFFFF] rounded-t-[16px] sm:rounded-[12px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slide-up border border-[rgba(112,121,140,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle Pill (Mobile affordance) */}
        <div className="pt-3 px-4 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />
        </div>

        {/* Header Section */}
        <div className="px-5 pt-3 sm:pt-5 pb-3 border-b border-[rgba(112,121,140,0.15)] flex items-start justify-between gap-3 bg-[#FCF9F5]">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004] leading-tight">
              Total Move-in Breakdown
            </h3>
            <p className="text-xs text-[#70798C] truncate mt-0.5" title={title}>
              {title}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close fee breakdown sheet"
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Itemized List Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
          {/* Trust Banner */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#342A21]/10 text-[#342A21] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Guaranteed zero surprise charges at inspection</span>
          </div>

          {/* Itemized Rows */}
          <div className="space-y-2.5">
            {/* 1. Base Rent */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.12)]">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#000004]">
                  Base Rent ({fees.rentPeriod === 'per month' ? 'Per Month' : 'Per Annum'})
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Official agreed tenancy rate
                </div>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#000004]">
                {formatNaira(fees.baseRent)}
              </div>
            </div>

            {/* 2. Caution Fee */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.12)]">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#000004] flex items-center gap-1.5">
                  <span>Caution Fee (Refundable Deposit)</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                    Refundable
                  </span>
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Returned in full at lease conclusion
                </div>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#000004]">
                {formatNaira(fees.cautionFee)}
              </div>
            </div>

            {/* 3. Legal & Agreement Fee */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.12)]">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#000004]">
                  Legal & Agreement Fee
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Tenancy deed drafted by accredited legal practitioner
                </div>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#000004]">
                {formatNaira(legalFee)}
              </div>
            </div>

            {/* 4. Agency Commission */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.12)]">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#000004]">
                  Agency Commission
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Registered agent handling inspection & key handoff
                </div>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#000004]">
                {formatNaira(agencyCommission)}
              </div>
            </div>

            {/* 5. Service Charge */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.12)]">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-[#000004]">
                  Service Charge (Security, Water, Solar Backup)
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Estate gates, water filtration & common power
                </div>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#000004]">
                {formatNaira(fees.serviceCharge)}
              </div>
            </div>
          </div>

          {/* Separator Divider */}
          <div className="border-t border-[rgba(112,121,140,0.2)] my-4" />

          {/* Total Row */}
          <div className="p-4 rounded-[12px] bg-[#FCF9F5] border border-[#342A21]/20 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#70798C] block">
                Total Move-in Package
              </span>
              <span className="text-xs text-[#70798C] mt-0.5 block">
                Total required to secure the keys.
              </span>
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#000004]">
              {formatNaira(fees.totalMoveInPackage)}
            </div>
          </div>

          {/* Consumer Notice */}
          <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#70798C] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#70798C] leading-relaxed">
              DeltaRent policy forbids impromptu charges (such as unauthorized gate levies or unexpected agreement top-ups). All statutory items are locked to this schedule.
            </p>
          </div>
        </div>

        {/* Pinned Action Button */}
        <div className="p-4 sm:p-5 border-t border-[rgba(112,121,140,0.15)] bg-[#FCF9F5] shrink-0">
          <button
            onClick={handleProceed}
            className="w-full py-3.5 px-4 rounded-[12px] bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            Proceed to Book Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
