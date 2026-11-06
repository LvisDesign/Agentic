import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

export interface SharePayload {
  title: string;
  subtitle?: string;
  text: string;
  url: string;
}

interface ShareSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload | null;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !payload) return null;

  const { title, subtitle, text, url } = payload;
  const fullMessage = `${text}\n${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedFull = encodeURIComponent(fullMessage);
  const encodedTitle = encodeURIComponent(title);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      onClose();
    } catch (_) {}
  };

  const shareDestinations = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedFull}`,
      icon: <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />,
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
    {
      id: 'x',
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-[#000004]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: <Send className="w-4 h-4 text-[#229ED9]" />,
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedFull}`,
      icon: <Mail className="w-4 h-4 text-[#342A21]" />,
      bg: 'bg-[#FAF8F5] hover:bg-[#F0ECE1] border-[#E5E7EB]',
    },
  ];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Top Handle on Mobile + Header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#000004] text-white flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm sm:text-base text-[#000004] truncate">
                Share Options
              </h3>
              <p className="text-[11px] text-[#70798C] truncate">
                Choose where you want to share this listing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#F0ECE1] border border-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close share options"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview Summary Box */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E7EB] space-y-0.5">
            <div className="font-display font-bold text-xs sm:text-sm text-[#000004] line-clamp-1">
              {title}
            </div>
            {subtitle && (
              <div className="text-[11px] text-[#70798C] line-clamp-1">
                {subtitle}
              </div>
            )}
          </div>

          {/* Share Destinations Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {shareDestinations.map((dest) => (
              <a
                key={dest.id}
                href={dest.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setTimeout(onClose, 250);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 no-underline cursor-pointer ${dest.bg}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-2xs">
                  {dest.icon}
                </div>
                <span className="text-[11px] font-bold text-[#000004] text-center">
                  {dest.label}
                </span>
              </a>
            ))}
          </div>

          {/* Native System Share Option (when supported on device) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#F0ECE1] border border-[#E5E7EB] text-[#000004] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#342A21]" />
              <span>More Apps on Your Device...</span>
            </button>
          )}

          {/* Direct Copy Link Bar */}
          <div className="pt-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#70798C] mb-1.5">
              Or Copy Direct Link
            </label>
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-[#FAF8F5] border border-[#E5E7EB]">
              <span className="text-xs text-[#342A21] font-mono truncate flex-1 select-all">
                {url}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

