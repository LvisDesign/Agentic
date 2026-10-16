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
    <div className="w-full bg-[#FCF9F5]/95 border-b border-[#275DAD]/20 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-2">
        {/* General Section Tag: Sponsored Ads */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#275DAD]/10 border border-[#275DAD]/25 text-[#275DAD] text-[10px] font-bold uppercase tracking-wider">
              Sponsored Ads
            </span>
          </div>
          <button
            onClick={onOpenPostAd}
            className="text-[10px] font-semibold text-[#70798C] hover:text-[#275DAD] transition-colors flex items-center gap-0.5"
          >
            <span>Post an Ad</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-0.5">
          {/* 1. First Item: "+ Post Ad" (Squared with rounded edges) */}
          <button
            onClick={onOpenPostAd}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            aria-label="Post Rental Advert"
          >
            {/* Squared Container with Rounded Edges */}
            <div className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-[18px] border-2 border-dashed border-[#275DAD]/50 group-hover:border-[#275DAD] bg-white group-hover:bg-[#275DAD]/5 transition-all flex flex-col items-center justify-center shadow-xs active:scale-95">
              <div className="w-8 h-8 rounded-[12px] bg-[#000004] text-white flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </div>

              {/* Plus Badge at Bottom Right */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#275DAD] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                <Plus className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Label Underneath */}
            <span className="text-[11px] font-bold text-[#000004] tracking-tight group-hover:text-[#275DAD] transition-colors">
              Post Ad
            </span>
          </button>

          {/* 2. Advert Stories Items (Squared with Rounded Edges, Brand Color Ring) */}
          {adverts.map((ad) => {
            const isActive = activeStoryId === ad.id;

            return (
              <button
                key={ad.id}
                onClick={() => onSelectAdvert(ad)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none active:scale-95 transition-transform"
                aria-label={`View advert: ${ad.title}`}
              >
                {/* Outer Brand Decoration Ring: Squared with Rounded Edges in Brand Colors */}
                <div 
                  className={`w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-[18px] p-[2.5px] transition-all duration-300 shadow-xs ${
                    isActive
                      ? 'bg-[#000004] ring-2 ring-[#275DAD] scale-105'
                      : 'bg-gradient-to-tr from-[#275DAD] via-[#3B82F6] to-[#1E4B8F] group-hover:from-[#1E4B8F] group-hover:to-[#275DAD] group-hover:scale-105 group-hover:shadow-md'
                  }`}
                >
                  {/* Inner White Separator (Squared with Rounded Edges) */}
                  <div className="w-full h-full p-[2px] bg-white rounded-[15.5px] flex items-center justify-center overflow-hidden relative">
                    <img
                      src={ad.thumbnailUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover rounded-[13.5px] group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Advertiser Label Underneath (Squared story name) */}
                <div className="max-w-[68px] truncate">
                  <span className="text-[11px] font-medium text-[#000004] truncate group-hover:text-[#275DAD] transition-colors block text-center">
                    {ad.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
