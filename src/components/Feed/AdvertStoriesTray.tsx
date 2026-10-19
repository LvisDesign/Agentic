import React from 'react';
import { Plus } from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';

interface AdvertStoriesTrayProps {
  adverts: AdvertStory[];
  onSelectAdvert: (ad: AdvertStory) => void;
  onOpenPostAd: () => void;
  activeStoryId?: string | null;
}

export const AdvertStoriesTray: React.FC<AdvertStoriesTrayProps> = ({
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
}) => {
  return (
    <div className="w-full overflow-hidden" aria-label="Sponsored Mobile Advertisements">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-1 py-1">
        {adverts.map((ad) => {
          const isActive = activeStoryId === ad.id;

          return (
            <div
              key={`mobile-ad-${ad.id}`}
              onClick={() => onSelectAdvert(ad)}
              className={`w-[295px] sm:w-[325px] shrink-0 h-[116px] rounded-2xl bg-[#EFE8DF] border p-3 flex items-center justify-between gap-2.5 snap-start cursor-pointer transition-all active:scale-[0.98] select-none shadow-xs group ${
                isActive
                  ? 'border-[#342A21] ring-2 ring-[#342A21]/30'
                  : 'border-[#342A21]/10 hover:border-[#342A21]/30'
              }`}
            >
              {/* Left Side: Brand Logo, Catchy Headline, and Price/Rate */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                {/* Brand / Advertiser Avatar & Label */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-[#342A21]/15 shrink-0 shadow-2xs flex items-center justify-center">
                    {ad.avatarUrl ? (
                      <img
                        src={ad.avatarUrl}
                        alt={ad.advertiserName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-[#342A21]">
                        {ad.advertiserName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#70798C] uppercase tracking-wider truncate">
                    {ad.advertiserName}
                  </span>
                </div>

                {/* Main Headline */}
                <h4 className="text-[12px] sm:text-[13px] font-extrabold text-[#000004] leading-snug line-clamp-2 tracking-tight group-hover:text-[#342A21] transition-colors mt-1">
                  {ad.headline ? ad.headline.split('—')[0].trim() : ad.title}
                </h4>

                {/* Price / Subtext */}
                <div className="mt-auto">
                  <span className="text-[11px] font-bold text-[#342A21] tracking-tight">
                    {ad.price || 'Verified Listing'}
                  </span>
                </div>
              </div>

              {/* Right Side: Product / Property Visual with "Ad" Pill Badge */}
              <div className="w-[100px] sm:w-[108px] h-full shrink-0 relative rounded-xl overflow-hidden bg-black/5">
                <img
                  src={ad.thumbnailUrl || ad.mediaUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* "Ad" Pill Badge in bottom-right corner (Direct match to reference image) */}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/45 backdrop-blur-xs text-[9px] font-semibold text-white/95 shadow-xs pointer-events-none">
                  Ad
                </span>
              </div>
            </div>
          );
        })}

        {/* Quick Post Ad CTA Card at the end of the carousel */}
        <button
          onClick={onOpenPostAd}
          className="w-[110px] shrink-0 h-[116px] rounded-2xl border-2 border-dashed border-[#342A21]/30 hover:border-[#342A21] bg-[#FCF9F5] hover:bg-[#342A21]/5 flex flex-col items-center justify-center gap-1.5 transition-all snap-start cursor-pointer shadow-xs active:scale-95"
          title="Post your advert"
        >
          <div className="w-7 h-7 rounded-full bg-[#000004] text-white flex items-center justify-center shadow-xs">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-[#000004]">Post Ad</span>
        </button>
      </div>
    </div>
  );
};
