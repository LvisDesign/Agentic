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

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = media[currentIndex] || media[0];

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-900 group">
      {/* Native House Video or Image Rendering based on Agent Upload */}
      {currentMedia.type === 'video' ? (
        <video
          key={currentMedia.url}
          src={currentMedia.url}
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={currentMedia.url}
          alt={currentMedia.caption || title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Light Edge Gradients for carousel arrow & indicator contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/35 pointer-events-none" />

      {/* Floating Media Badge (House Video vs Image Gallery) */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium">
        {currentMedia.type === 'video' ? (
          <>
            <Film className="w-3 h-3 text-white/90" />
            <span>Video ({currentIndex + 1}/{media.length})</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-3 h-3 text-white/90" />
            <span>
              {currentIndex + 1} / {media.length}
            </span>
          </>
        )}
      </div>

      {/* Left / Right Carousel Navigation */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous media"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next media"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            {media.map((item, idx) => (
              <span
                key={idx}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/60'
                }`}
                title={item.type === 'video' ? 'Video' : 'Photo'}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
