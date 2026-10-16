import React, { useState, useRef } from 'react';
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
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  // Mobile Touch Swipe Handlers (allows sliding through images with finger)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (media.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - endX;
    const deltaY = touchStartY.current - endY;

    // Detect horizontal swipe (at least 35px threshold and distinctly horizontal)
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      if (deltaX > 0) {
        // Swiped Left -> go Next
        nextSlide();
      } else {
        // Swiped Right -> go Prev
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentMedia = media[currentIndex] || media[0];

  return (
    <div 
      className="relative w-full h-full select-none overflow-hidden bg-slate-900 group touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Property Media Carousel"
    >
      {/* Sliding Track for smooth physical transition when sliding through images */}
      <div 
        className="flex w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, idx) => (
          <div 
            key={`${item.url}-${idx}`} 
            className="w-full h-full shrink-0 relative overflow-hidden bg-slate-900"
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls
                autoPlay={idx === currentIndex}
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={item.url}
                alt={item.caption || title}
                className="w-full h-full object-cover pointer-events-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* Light Edge Gradients for carousel arrow & indicator contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/35 pointer-events-none" />

      {/* Floating Media Badge (House Video vs Image Gallery) */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-medium pointer-events-none">
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

      {/* Mobile Swipe Hint Pill (fades away after interaction) */}
      {media.length > 1 && (
        <div className="sm:hidden absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-white/80 text-[9px] pointer-events-none">
          Swipe ⇆
        </div>
      )}

      {/* Left / Right Carousel Navigation (visible on desktop or optional click) */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous media"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next media"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 active:scale-95 shadow-md cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
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

