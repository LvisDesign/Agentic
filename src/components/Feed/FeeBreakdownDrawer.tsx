import React from 'react';
import { X, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { FeeBreakdown } from '../../types/marketplace';
import { formatNaira } from '../../utils/formatters';

interface FeeBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fees: FeeBreakdown;
  title: string;
  neighborhood: string;
  city: string;
}

export const FeeBreakdownDrawer: React.FC<FeeBreakdownDrawerProps> = ({
  isOpen,
  onClose,
  fees,
  title,
  neighborhood,
  city,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FFFFFF] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#275DAD]/10 text-[#275DAD]">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Transparent Fee Guarantee
            </span>
            <h3 className="font-display text-xl font-bold text-[#000004] mt-1.5 line-clamp-1">
              Move-in Cost Breakdown
            </h3>
            <p className="text-xs text-[#70798C] mt-0.5">
              {neighborhood}, {city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E5E7EB]/50 hover:bg-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Line Items */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Prominent Move-in Total Hero */}
          <div className="p-5 rounded-xl bg-[#FCF9F5] border border-[#275DAD]/15 text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#70798C]">
              Total Certified Move-in Package
            </span>
            <div className="font-display text-3xl sm:text-4xl font-bold text-[#000004] mt-1">
              {formatNaira(fees.totalMoveInPackage)}
            </div>
            <p className="text-xs text-[#70798C] mt-1">
              All statutory & estate fees included. Landlord/agent cannot demand more.
            </p>
          </div>

          {/* Line Item Schedule */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
              Itemized Cost Schedule
            </h4>

            {/* Base Rent */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#275DAD]/40 transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#000004] flex items-center gap-1.5">
                  Base Rent ({fees.rentPeriod})
                </div>
                <div className="text-xs text-[#70798C]">
                  Official agreed tenancy rental fee
                </div>
              </div>
              <div className="font-display text-base font-bold text-[#000004]">
                {formatNaira(fees.baseRent)}
              </div>
            </div>

            {/* Caution Deposit */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#275DAD]/40 transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#000004] flex items-center gap-1.5">
                  Caution Deposit
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                    Refundable
                  </span>
                </div>
                <div className="text-xs text-[#70798C]">
                  Held against damages; fully returned at tenancy exit
                </div>
              </div>
              <div className="font-display text-base font-bold text-[#000004]">
                {formatNaira(fees.cautionFee)}
              </div>
            </div>

            {/* Legal & Agency */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#275DAD]/40 transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#000004]">
                  Legal & Agency Agreement Fee
                </div>
                <div className="text-xs text-[#70798C]">
                  Tenancy agreement drafting + statutory commission
                </div>
              </div>
              <div className="font-display text-base font-bold text-[#000004]">
                {formatNaira(fees.legalAndAgencyFee)}
              </div>
            </div>

            {/* Service Charge */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#275DAD]/40 transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#000004]">
                  Estate Service Charge
                </div>
                <div className="text-xs text-[#70798C]">
                  Compound security, borehole pump energy & sanitation
                </div>
              </div>
              <div className="font-display text-base font-bold text-[#000004]">
                {formatNaira(fees.serviceCharge)}
              </div>
            </div>
          </div>

          {/* Nigerian Market Protection Notice */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-[#275DAD]/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#275DAD] shrink-0 mt-0.5" />
            <div className="text-xs text-[#000004]/80 leading-relaxed">
              <span className="font-semibold text-[#275DAD]">Delta State Tenancy Protection: </span>
              In accordance with regional fair rental practices, DeltaRent locks this exact fee schedule. If an agent attempts to introduce impromptu "gate fees", "landlord agreement top-ups", or unlisted surcharges during inspection, report immediately for an instant refund of your clearance fee.
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF9F5]">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-sm font-semibold transition-colors shadow-sm"
          >
            I Understand the Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
