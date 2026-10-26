import React from 'react';
import { Plus, ChevronRight, Play, Megaphone } from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';

interface DesktopAdvertSidebarProps {
  adverts: AdvertStory[];
  onSelectAdvert: (ad: AdvertStory) => void;
  onOpenPostAd: () => void;
  activeStoryId?: string | null;
}


export const DesktopAdvertSidebar: React.FC<DesktopAdvertSidebarProps> = ({
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
}) => {
  return (
    <aside 
      className="hidden lg:flex flex-col w-[300px] xl:w-[320px] shrink-0 h-full max-h-[820px] bg-white rounded-3xl border border-[#342A21]/15 shadow-card p-4 overflow-hidden relative"
      aria-label="Sponsored Advertisements"
    >
      {/* 1. Header Section: Title & Post Ad CTA */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
            Featured Promotions
          </span>
          <span className="text-[10px] font-semibold text-[#342A21] bg-[#342A21]/10 px-1.5 py-0.5 rounded-full">
            {adverts.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenPostAd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Post Ad</span>
          </button>
        </div>
      </div>

      {/* 2. Vertically Listed Full-Bleed Showcase Cards or Empty Promotion State */}
      {adverts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center my-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FCF9F5] border border-[#342A21]/15 flex items-center justify-center text-[#342A21] shadow-2xs">
            <Megaphone className="w-5 h-5 text-[#342A21]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#000004]">No Active Promotions Yet</h4>
            <p className="text-[11px] text-[#70798C] mt-1 leading-relaxed">
              Showcase your properties, agency services, or home moving business to active renters.
            </p>
          </div>
          <button
            onClick={onOpenPostAd}
            className="py-2 px-3.5 rounded-xl bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Post First Ad</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 py-3 pr-0.5">
        {adverts.map((ad) => {
          const isActive = activeStoryId === ad.id;

          return (
            <div
              key={`showcase-${ad.id}`}
              onClick={() => onSelectAdvert(ad)}
              className={`group relative w-full h-[180px] rounded-2xl overflow-hidden cursor-pointer select-none bg-[#121214] border transition-all duration-300 shadow-xs hover:shadow-md ${
                isActive
                  ? 'border-[#342A21] ring-2 ring-[#342A21] ring-offset-2 ring-offset-white scale-[1.01]'
                  : 'border-black/10 hover:border-black/30'
              }`}
            >
              {/* Full-bleed background image */}
              <img
                src={ad.thumbnailUrl}
                alt={ad.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient overlays: subtle vignette at top, deep cinematic fade at bottom */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 via-50% to-transparent pointer-events-none" />

              {/* Top Bar: Category/Deal Pill Badge & Media Type Indicator */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-xs">
                  {ad.badgeText || ad.category}
                </span>

                {ad.mediaType === 'video' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-black/45 backdrop-blur-md text-white/95 border border-white/20 flex items-center gap-1 shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-white text-white" />
                    <span>Video</span>
                  </span>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 group-hover:bg-[#000004] group-hover:text-white group-hover:scale-110 transition-all shadow-xs">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-3 pt-6 flex flex-col justify-end z-10">
                {/* Title */}
                <div className="flex items-center gap-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-white tracking-tight truncate leading-tight group-hover:text-white/95">
                    {ad.title}
                  </h4>
                </div>

                {/* Secondary details: Advertiser name & Floor/Price */}
                <div className="flex items-center justify-between text-[11px] text-white/80 mt-1">
                  <span className="truncate max-w-[55%] text-white/75 font-medium">
                    {ad.advertiserName}
                  </span>
                  {ad.price && (
                    <span className="font-semibold text-white tracking-tight shrink-0 ml-1">
                      {ad.price}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 3. Bottom Promotion Callout Banner */}
      <div className="pt-2 border-t border-[#E5E7EB] shrink-0">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-[#342A21]/5 border border-[#342A21]/15 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#000004]">
              Reach Active Renters
            </div>
            <p className="text-[9px] text-[#70798C] truncate">
              Instant story ads on trending property feeds
            </p>
          </div>
          <button
            onClick={onOpenPostAd}
            className="px-2 py-1 rounded-lg bg-[#342A21] hover:bg-[#251E17] text-white text-[10px] font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Promote
          </button>
        </div>
      </div>
    </aside>
  );
};
