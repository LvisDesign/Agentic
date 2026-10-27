import React from 'react';
import { 
  ExternalLink, 
  ArrowUpRight, 
  Building2, 
  Phone, 
  MessageSquare,
  ShieldCheck,
  Megaphone
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';

interface NativeBillboardAdCardProps {
  advert: AdvertStory;
  onSelectAdvert: (ad: AdvertStory) => void;
}

export const NativeBillboardAdCard: React.FC<NativeBillboardAdCardProps> = ({
  advert,
  onSelectAdvert,
}) => {
  const handleClick = () => {
    if (advert.actionType === 'website' && advert.websiteUrl) {
      window.open(advert.websiteUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelectAdvert(advert);
    }
  };

  return (
    <article 
      onClick={handleClick}
      className="w-full bg-white rounded-2xl sm:rounded-3xl border border-amber-300/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      {/* Subtle Promoted / Sponsored Banner Stripe */}
      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-bl-xl flex items-center gap-1 shadow-2xs">
        <span>Sponsored</span>
      </div>

      <div className="space-y-3">
        {/* Header: Brand Name & Subtle Tag */}
        <div className="flex items-center gap-3 pr-20">
          {advert.avatarUrl ? (
            <img
              src={advert.avatarUrl}
              alt={advert.advertiserName}
              className="w-10 h-10 rounded-xl object-cover border border-amber-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-2xs">
              {advert.advertiserName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-[#000004] truncate">
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

        {/* Headline */}
        <h3 className="font-display font-bold text-base sm:text-lg text-[#000004] group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
          {advert.headline}
        </h3>

        {/* Media Preview (if available) */}
        {advert.mediaUrl && (
          <div className="w-full h-40 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 relative border border-[#E5E7EB]">
            {advert.mediaType === 'video' ? (
              <video
                src={advert.mediaUrl}
                poster={advert.thumbnailUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : (
              <img
                src={advert.mediaUrl}
                alt={advert.headline}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Description snapshot */}
        <p className="text-xs sm:text-[13px] text-[#70798C] line-clamp-2 leading-relaxed">
          {advert.description}
        </p>
      </div>

      {/* Bottom CTA Bar */}
      <div className="pt-4 mt-3 border-t border-amber-200/80 flex items-center justify-between gap-3">
        <span className="text-[11px] text-amber-900 font-semibold flex items-center gap-1">
          <Megaphone className="w-3 h-3 text-amber-600" />
          <span>Setlla Verified Partner Billboard</span>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="py-2 px-4 rounded-xl bg-[#000004] group-hover:bg-[#201914] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <span>{advert.ctaText || 'Learn More'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    </article>
  );
};
