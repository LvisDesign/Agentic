import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Copy, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import { BookingRecord, PropertyListing } from '../../types/marketplace';
import { formatNigerianPhone, getWhatsAppUrl } from '../../utils/formatters';

interface InspectionPassCardProps {
  booking: BookingRecord;
  listing: PropertyListing;
  onClose?: () => void;
}

export const InspectionPassCard: React.FC<InspectionPassCardProps> = ({
  booking,
  listing,
  onClose,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const formattedPhone = formatNigerianPhone(listing.agent.phone);
  const rawPhone = listing.agent.phone;
  const whatsappUrl = getWhatsAppUrl(
    listing.agent.whatsapp, 
    listing.title, 
    booking.paymentReference || booking.id
  );

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#342A21]/20 shadow-xl overflow-hidden animate-slide-up">
      {/* Top Banner: Inspection Confirmed */}
      <div className="bg-gradient-to-tr from-[#342A21] via-[#524436] to-[#251E17] p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-300" />
              Inspection Confirmed
            </span>
          </div>
          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
            {booking.id}
          </span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 text-white">
          Agent Contact Revealed
        </h3>
        <p className="text-xs text-white/80 mt-1 line-clamp-2 break-words">
          {listing.agent.fullName} has accepted your inspection request. Connect directly to coordinate your showing.
        </p>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Inspection Schedule & Property Overview */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#342A21]" />
              Confirmed Window
            </span>
            <span className="text-xs font-semibold text-[#000004]">
              {booking.slotDate} • {booking.slotTimeWindow}
            </span>
          </div>
          <div className="text-sm font-bold text-[#000004] line-clamp-2 break-words pt-1">
            {listing.title}
          </div>
          <div className="text-xs text-[#70798C] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
            <span className="line-clamp-1">Landmark / Area: <strong>{listing.neighborhood}, {listing.city}</strong></span>
          </div>
        </div>

        {/* Revealed Agent Contact Box */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[#342A21]/20 shadow-sm space-y-3.5">
          <div className="flex items-center gap-3">
            <img
              src={listing.agent.avatarUrl}
              alt={listing.agent.fullName}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-[#342A21] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-[#000004] truncate">
                  {listing.agent.fullName}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                  Verified
                </span>
              </div>
              <div className="text-xs text-[#70798C] truncate">
                {listing.agent.agencyName} • CAC: {listing.agent.cacNumber}
              </div>
            </div>
          </div>

          {/* Prominent Phone Number Display & Copy Button */}
          <div className="p-3 rounded-xl bg-[#342A21]/5 border border-[#342A21]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 overflow-hidden">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] block truncate">
                Agent Direct Phone Number
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#000004] truncate block">
                {formattedPhone}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#FCF9F5] text-xs font-semibold text-[#000004] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              title="Copy phone number"
            >
              {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#342A21]" />}
              <span>{copiedPhone ? 'Copied!' : 'Copy Number'}</span>
            </button>
          </div>

          {/* Direct Communication Buttons (Initiate Call / WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href={`tel:${rawPhone}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call Agent Directly</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Agent</span>
            </a>
          </div>

          {/* Meeting Coordination Notice */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#70798C] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#342A21] shrink-0 mt-0.5" />
            <span>
              The verified agent will coordinate the exact physical meeting point with you directly via call or WhatsApp. Never make uninspected payments.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {onClose && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
