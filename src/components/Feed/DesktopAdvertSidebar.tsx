import React from 'react';
import { Plus, MapPin, ChevronRight, Zap } from 'lucide-react';
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
      {/* 1. Header Section: General Tag & Post Ad CTA */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#342A21]/10 border border-[#342A21]/25 text-[#342A21] text-[11px] font-bold uppercase tracking-wider">
            Sponsored Ads
          </span>
        </div>

        <button
          onClick={onOpenPostAd}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Post Ad</span>
        </button>
      </div>

      {/* 2. Top Stories Squircle Row (Squared with rounded edges, brand color border) */}
      <div className="pt-3 pb-2 shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] mb-2 px-1 flex items-center justify-between">
          <span>Active Story Ads</span>
          <span className="text-[10px] font-semibold text-[#342A21]">{adverts.length} Live</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {/* "+ Post" squircle avatar */}
          <button
            onClick={onOpenPostAd}
            className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none cursor-pointer"
            title="Post a rental story advert"
          >
            <div className="w-[52px] h-[52px] rounded-[15px] border-2 border-dashed border-[#342A21]/50 group-hover:border-[#342A21] bg-white group-hover:bg-[#342A21]/5 flex items-center justify-center transition-all shadow-xs">
              <Plus className="w-4 h-4 text-[#342A21] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold text-[#000004] group-hover:text-[#342A21] transition-colors">
              Add Ad
            </span>
          </button>

          {/* Advert squircle avatars (Brand color decoration, no black labels) */}
          {adverts.map((ad) => {
            const isActive = activeStoryId === ad.id;

            return (
              <button
                key={`story-top-${ad.id}`}
                onClick={() => onSelectAdvert(ad)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none cursor-pointer"
                title={ad.title}
              >
                {/* Squircle border decoration in brand color */}
                <div
                  className={`w-[52px] h-[52px] rounded-[15px] p-[2px] transition-all duration-200 shadow-xs ${
                    isActive
                      ? 'bg-[#000004] ring-2 ring-[#342A21] scale-105'
                      : 'bg-gradient-to-tr from-[#342A21] via-[#524436] to-[#251E17] group-hover:from-[#251E17] group-hover:to-[#342A21] group-hover:scale-105'
                  }`}
                >
                  <div className="w-full h-full p-[1.5px] bg-white rounded-[13px] overflow-hidden">
                    <img
                      src={ad.thumbnailUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover rounded-[11.5px] group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#000004] max-w-[52px] truncate group-hover:text-[#342A21] transition-colors">
                  {ad.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-[#E5E7EB] my-1 shrink-0" />

      {/* 3. Featured Sponsored Listings Feed (Scrollable without visible scrollbars) */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-2 pr-0.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] mb-1.5 px-1">
          Featured Promotions
        </div>

        {adverts.map((ad) => {
          const isActive = activeStoryId === ad.id;

          return (
            <div
              key={`list-${ad.id}`}
              onClick={() => onSelectAdvert(ad)}
              className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 group ${
                isActive
                  ? 'border-[#342A21] bg-[#342A21]/5 shadow-xs'
                  : 'border-[#E5E7EB] hover:border-[#342A21]/50 hover:bg-slate-50/80 hover:shadow-xs bg-white'
              }`}
            >
              {/* Squared thumbnail with rounded edges in brand color decoration (NO black labels) */}
              <div className="w-14 h-14 shrink-0 rounded-[14px] p-[2px] bg-gradient-to-tr from-[#342A21] via-[#524436] to-[#251E17] group-hover:from-[#251E17] group-hover:to-[#342A21] transition-all shadow-xs">
                <div className="w-full h-full p-[1.5px] bg-white rounded-[12px] overflow-hidden">
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover rounded-[10.5px] group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Advert Content Details */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#000004] group-hover:text-[#342A21] transition-colors truncate">
                  <span className="truncate">{ad.title}</span>
                </div>

                <p className="text-[11px] text-[#70798C] truncate mt-0.5">
                  {ad.advertiserName}
                </p>

                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="font-semibold text-[#000004]">
                    {ad.price || 'Active Listing'}
                  </span>
                  <span className="text-[#342A21] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Promotion Callout Banner */}
      <div className="pt-2 border-t border-[#E5E7EB] shrink-0">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FCF9F5] to-[#342A21]/5 border border-[#342A21]/15 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#000004]">
              <Zap className="w-3 h-3 text-[#342A21]" />
              <span>Reach Delta Renters</span>
            </div>
            <p className="text-[9px] text-[#70798C] truncate">
              Instant story ads on Asaba, Warri & more
            </p>
          </div>
          <button
            onClick={onOpenPostAd}
            className="px-2 py-1 rounded-lg bg-[#342A21] hover:bg-[#251E17] text-white text-[10px] font-bold shrink-0 transition-colors shadow-xs"
          >
            Promote
          </button>
        </div>
      </div>
    </aside>
  );
};
