import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  title: string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingReel, setIsPlayingReel] = useState(false);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    setIsPlayingReel(false);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    setIsPlayingReel(false);
  };

  const currentMedia = media[currentIndex] || media[0];

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-900 group">
      {/* Background Media Image / Reel */}
      <img
        src={currentMedia.url}
        alt={currentMedia.caption || title}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
          isPlayingReel ? 'scale-105 filter brightness-105' : 'scale-100 group-hover:scale-[1.02]'
        }`}
        loading="lazy"
      />

      {/* Light Edge Gradients for media control contrast without obscuring the property photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/35 pointer-events-none" />

      {/* Floating Media Counter Pill */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium">
        <ImageIcon className="w-3 h-3 text-white/90" />
        <span>
          {currentIndex + 1} / {media.length}
        </span>
      </div>

      {/* Video Reel Simulation Indicator */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlayingReel(!isPlayingReel);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md transition-all shadow-md ${
            isPlayingReel
              ? 'bg-[#275DAD] text-white ring-2 ring-white/50'
              : 'bg-black/60 text-white/90 hover:bg-black/80 border border-white/20'
          }`}
          title="Toggle Property Reel View"
        >
          {isPlayingReel ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>Playing Reel</span>
            </>
          ) : (
            <>
              <Film className="w-3 h-3 text-white" />
              <span>Video Reel</span>
            </>
          )}
        </button>
      </div>

      {/* Media Caption Snippet (when active) */}
      {currentMedia.caption && (
        <div className="absolute bottom-6 left-3 right-3 z-20 pointer-events-none">
          <p className="text-white/90 text-[11px] italic drop-shadow-md truncate text-center">
            {currentMedia.caption}
          </p>
        </div>
      )}

      {/* Left / Right Carousel Controls */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous photo"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next photo"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            {media.map((_, idx) => (
              <span
                key={idx}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-4 h-1.5 bg-[#275DAD]'
                    : 'w-1.5 h-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Simulated Reel Ambient Audio Wave when playing */}
      {isPlayingReel && (
        <div className="absolute top-11 right-3 z-20 flex items-end gap-0.5 h-3.5 bg-black/50 px-1.5 py-0.5 rounded-md border border-white/10">
          <span className="w-0.5 bg-[#275DAD] h-full animate-pulse" />
          <span className="w-0.5 bg-white h-2 animate-bounce" />
          <span className="w-0.5 bg-[#275DAD] h-2.5 animate-pulse" />
          <span className="w-0.5 bg-white h-1 animate-bounce" />
        </div>
      )}
    </div>
  );
};
