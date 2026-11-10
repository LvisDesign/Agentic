import React, { useState } from 'react';
import {
  ArrowUpRight,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';
import { isVideoMediaUrl } from '../../services/adService';

interface NativeBillboardAdCardProps {
  advert: AdvertStory;
  onSelectAdvert: (ad: AdvertStory) => void;
}

function formatCleanAdCopy(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const NativeBillboardAdCard: React.FC<NativeBillboardAdCardProps> = ({
  advert,
  onSelectAdvert,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const handleClick = () => {
    if (advert.actionType === 'website' && advert.websiteUrl) {
      window.open(advert.websiteUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelectAdvert(advert);
    }
  };

  const validAvatarUrl =
    advert.avatarUrl && !isVideoMediaUrl(advert.avatarUrl) && !avatarError
      ? advert.avatarUrl
      : '';

  const cleanHeadline = formatCleanAdCopy(advert.headline || advert.title);
  const cleanDescription =
    advert.description &&
    String(advert.description).trim() !== 'NaN' &&
    String(advert.description).trim() !== 'undefined'
      ? formatCleanAdCopy(advert.description)
      : '';

  const safePoster =
    advert.thumbnailUrl && !isVideoMediaUrl(advert.thumbnailUrl)
      ? advert.thumbnailUrl
      : undefined;

  return (
    <article
      onClick={handleClick}
      className="w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E5D3A7] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      {/* Promoted / Sponsored Banner Pill */}
      <div className="absolute top-0 right-0 bg-gradient-to-l from-[#342A21] to-[#231C16] text-[#FFAD05] text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-bl-xl flex items-center gap-1 shadow-2xs">
        <span>Sponsored</span>
      </div>

      <div className="space-y-3">
        {/* Header: Brand Name & Subtle Tag */}
        <div className="flex items-center gap-3 pr-20">
          {validAvatarUrl ? (
            <img
              src={validAvatarUrl}
              alt={advert.advertiserName}
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-xl object-cover border border-[#E5D3A7] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#342A21] to-[#1A1410] text-[#FFAD05] border border-[#E5D3A7] flex items-center justify-center font-display font-extrabold text-xs tracking-wider shrink-0 shadow-2xs">
              {(advert.advertiserName || 'SP').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-[#1A1410] truncate">
                {advert.advertiserName}
              </span>
              {advert.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
            </div>
            <span className="text-[11px] text-[#70798C] truncate block">
              {advert.location || 'Delta State Business Network'}
            </span>
          </div>
        </div>

        {/* Media Preview (Media-First Visual Hierarchy) */}
        {advert.mediaUrl && (
          <div className="w-full h-44 sm:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-[#18130F] relative border border-[#EDE3CC]">
            {advert.mediaType === 'video' || isVideoMediaUrl(advert.mediaUrl) ? (
              <video
                src={advert.mediaUrl.includes('#') ? advert.mediaUrl : `${advert.mediaUrl}#t=0.1`}
                poster={safePoster}
                className="w-full h-full object-contain"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <img
                src={advert.mediaUrl}
                alt={cleanHeadline}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>
        )}

        {/* Headline */}
        <h3 className="font-display font-bold text-base sm:text-lg text-[#1A1410] group-hover:text-[#342A21] transition-colors line-clamp-2 leading-snug">
          {cleanHeadline}
        </h3>

        {/* Description snapshot */}
        {cleanDescription && (
          <p className="text-xs sm:text-[13px] text-[#5C6474] line-clamp-2 leading-relaxed">
            {cleanDescription}
          </p>
        )}
      </div>

      {/* Bottom CTA Bar */}
      <div className="pt-3.5 mt-3 border-t border-[#F0E7D5] flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#6E5634] font-semibold flex items-center gap-1">
          <Megaphone className="w-3.5 h-3.5 text-[#C68400]" />
          <span>Setlla Verified Partner</span>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="py-2 px-4 rounded-xl bg-[#342A21] group-hover:bg-[#231C16] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <span>{advert.ctaText || 'Learn More'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#FFAD05]" />
        </button>
      </div>
    </article>
  );
};
