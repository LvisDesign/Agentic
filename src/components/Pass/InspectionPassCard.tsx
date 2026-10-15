import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  KeyRound,
  Download
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
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const formattedPhone = formatNigerianPhone(listing.agent.phone);
  const whatsappUrl = getWhatsAppUrl(
    listing.agent.whatsapp, 
    listing.title, 
    booking.paymentReference || booking.id
  );

  const handleCopyPass = () => {
    navigator.clipboard.writeText(booking.id);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(listing.fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#275DAD]/20 shadow-xl overflow-hidden animate-slide-up">
      {/* Top Banner: Unlocked Clearance Pass */}
      <div className="bg-[#275DAD] p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-300" />
              Verified Inspection Pass
            </span>
          </div>
          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
            {booking.id}
          </span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 text-white">
          Access Granted & Contact Unlocked
        </h3>
        <p className="text-xs text-white/80 mt-1 line-clamp-1">
          {listing.title}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Unlocked Agent Contact Box */}
        <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={listing.agent.avatarUrl}
              alt={listing.agent.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#275DAD]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#000004]">
                  {listing.agent.fullName}
                </span>
                <ShieldCheck className="w-4 h-4 text-[#275DAD]" />
              </div>
              <div className="text-xs text-[#70798C]">
                {listing.agent.agencyName} • {listing.agent.cacNumber}
              </div>
              <div className="text-xs font-mono font-semibold text-[#275DAD] mt-0.5">
                {formattedPhone}
              </div>
            </div>
          </div>

          {/* Quick Contact Deep Links */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Agent
            </a>
            <a
              href={`tel:${listing.agent.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Agent Directly
            </a>
          </div>
        </div>

        {/* Unlocked Physical Street Address */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#275DAD]" />
              Physical Inspection Address
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-[11px] text-[#275DAD] hover:underline flex items-center gap-1"
            >
              {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copiedAddress ? 'Copied' : 'Copy Address'}
            </button>
          </div>
          <div className="text-sm font-semibold text-[#000004] leading-snug">
            {listing.fullAddress}
          </div>
          <div className="text-xs text-[#70798C] flex items-center gap-2 pt-1">
            <span className="bg-blue-50 text-[#275DAD] px-2 py-0.5 rounded text-[11px] font-medium">
              Landmark: {listing.neighborhood}
            </span>
          </div>
        </div>

        {/* Digital Inspection Pass Details & Gate Code */}
        <div className="p-4 rounded-xl bg-[#FCF9F5] border-2 border-dashed border-[#275DAD]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="text-xs font-bold text-[#70798C] uppercase tracking-wider">
              Confirmed Inspection Window
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#000004]">
              <Calendar className="w-4 h-4 text-[#275DAD]" />
              <span>{booking.slotDate}</span>
              <span className="text-[#70798C]">•</span>
              <Clock className="w-4 h-4 text-[#275DAD]" />
              <span>{booking.slotTimeWindow}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#000004] pt-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Estate Gate Security Code: </span>
              <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                GATE-8821
              </span>
            </div>
          </div>

          {/* Simulated QR Code for Gate Security */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E5E7EB] shadow-xs">
            <div className="w-20 h-20 bg-slate-100 flex items-center justify-center rounded border border-slate-200">
              <QrCode className="w-16 h-16 text-[#000004]" />
            </div>
            <span className="text-[10px] font-mono text-[#70798C] mt-1">
              SCAN AT GATE
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyPass}
            className="flex-1 py-2.5 px-3 rounded-lg border border-[#E5E7EB] hover:bg-[#FCF9F5] text-xs font-semibold text-[#000004] flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPass ? 'Pass Code Copied' : 'Copy Pass Reference'}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
