import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Navigation,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { PropertyListing, BookingRecord } from '../../types/marketplace';
import { formatNigerianPhone } from '../../utils/formatters';

interface UnlockedContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listing: PropertyListing;
  booking: BookingRecord;
}

export const UnlockedContactSheet: React.FC<UnlockedContactSheetProps> = ({
  isOpen,
  onClose,
  listing,
  booking,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!isOpen) return null;

  const rawPhone = listing.agent.phone || '08034928172';
  const formattedPhone = formatNigerianPhone(rawPhone);
  
  // Format international number for WhatsApp link
  const digits = rawPhone.replace(/[^0-9]/g, '');
  let intlNumber = digits;
  if (digits.startsWith('0')) {
    intlNumber = `234${digits.slice(1)}`;
  } else if (!digits.startsWith('234')) {
    intlNumber = `234${digits}`;
  }

  // Pre-filled WhatsApp message as requested in specifications
  const agentShortName = listing.agent.fullName.includes('Macaulay') 
    ? 'Chief Macaulay' 
    : listing.agent.fullName.split(' ')[0] || 'Agent';

  const startTime = booking.slotTimeWindow.includes('–')
    ? booking.slotTimeWindow.split('–')[0].trim()
    : booking.slotTimeWindow.includes('-')
    ? booking.slotTimeWindow.split('-')[0].trim()
    : booking.slotTimeWindow;

  const whatsappMessage = encodeURIComponent(
    `Hello ${agentShortName}, I booked an inspection for your ${listing.propertyType} in ${listing.neighborhood}, ${listing.city} via the platform for ${booking.slotDate} at ${startTime}.`
  );

  const whatsappUrl = `https://wa.me/${intlNumber}?text=${whatsappMessage}`;
  const passCode = `PASS #${booking.id.replace('DT-', '')}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(listing.fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(passCode);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Container: 16px top corners on mobile, 12px modal on desktop */}
      <div 
        className="w-full max-w-lg bg-[#FFFFFF] rounded-t-[16px] sm:rounded-[12px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up border border-[rgba(112,121,140,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle Bar for mobile */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden bg-[#FCF9F5]">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Top Header */}
        <div className="px-5 pt-3 sm:pt-4 pb-3 border-b border-[rgba(112,121,140,0.15)] flex items-start justify-between gap-3 bg-[#FCF9F5]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Inspection Confirmed
              </span>
              <span className="text-[10px] font-bold text-[#342A21] bg-[#342A21]/10 px-2 py-0.5 rounded-full">
                100% Free Access
              </span>
            </div>
            <h3 className="font-display font-serif text-lg sm:text-xl font-bold text-[#000004] leading-tight">
              Agent Contact Unlocked
            </h3>
            <p className="text-xs text-[#70798C] truncate mt-0.5" title={listing.title}>
              {listing.neighborhood}, {listing.city}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close contact sheet"
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
          {/* Confirmed Slot Summary Card */}
          <div className="p-4 rounded-[12px] bg-gradient-to-br from-emerald-50 via-[#FCF9F5] to-amber-50/40 border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-[#70798C]">Inspection Window:</div>
                  <div className="text-xs sm:text-sm font-bold text-[#000004]">
                    {booking.slotDate}, {booking.slotTimeWindow}
                  </div>
                </div>
              </div>

              {/* Slot Badge */}
              <span className="px-2.5 py-1 rounded-[8px] bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                Confirmed for {startTime}
              </span>
            </div>
          </div>

          {/* Agent Identity Card */}
          <div className="p-4 rounded-[12px] bg-white border border-[rgba(112,121,140,0.22)] shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img
                    src={listing.agent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={listing.agent.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-[#342A21]/20"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-[#000004] truncate">
                      {listing.agent.fullName}
                    </h4>
                  </div>
                  <p className="text-xs text-[#70798C] truncate">
                    {listing.agent.agencyName || 'Independent Property Agent'}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    • {listing.agent.responseTime || 'Usually responds in <15 mins'}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Phone & WhatsApp CTA Buttons */}
            <div className="mt-4 pt-3 border-t border-[rgba(112,121,140,0.15)] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Direct Phone Call Button */}
              <a
                href={`tel:${rawPhone}`}
                className="py-2.5 px-3 rounded-[8px] bg-[#000004] hover:bg-[#1f2937] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call {formattedPhone}</span>
              </a>

              {/* One-Click WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-[8px] bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Copy phone option */}
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="text-[11px] text-[#70798C] hover:text-[#000004] flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Phone Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Phone Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Exact Meeting / Property Physical Address */}
          <div className="p-4 rounded-[12px] bg-[#FCF9F5] border border-[rgba(112,121,140,0.22)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
                Exact Meeting & Property Address
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="text-[11px] text-[#342A21] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#000004] leading-relaxed bg-white p-3 rounded-[8px] border border-[rgba(112,121,140,0.18)]">
              {listing.fullAddress}
            </p>

            <p className="text-[11px] text-[#70798C] leading-snug">
              Landmark instructions: Inform the estate security at the barrier gate that you are scheduled for inspection with {listing.agent.fullName}.
            </p>
          </div>

          {/* Digital Inspection Pass Code */}
          <div className="p-3.5 rounded-[12px] bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Digital Pass Reference Code
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                  {passCode}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyPass}
              className="px-3 py-1.5 rounded-[8px] bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPass ? 'Copied' : 'Copy Pass'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(112,121,140,0.15)] bg-[#FCF9F5] flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-[#70798C]">
            Zero inspection charges guaranteed.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-[8px] bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
