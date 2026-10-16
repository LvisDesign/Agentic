import React, { useState, useRef } from 'react';

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
  const mouseStartX = useRef<number | null>(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  // Mobile Touch Swipe Handlers (slide with finger gestures)
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
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Desktop Mouse Drag Handlers (slide with click & drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (media.length <= 1) return;
    // Don't intercept if clicking native video controls
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'video') return;
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const deltaX = mouseStartX.current - e.clientX;

    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    mouseStartX.current = null;
  };

  const handleMouseLeave = () => {
    mouseStartX.current = null;
  };

  return (
    <div 
      className="relative w-full h-full select-none overflow-hidden bg-slate-900 group touch-pan-y cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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

      {/* Subtle Bottom Edge Gradient for dot indicator contrast */}
      {media.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      )}

      {/* Dot Indicators (clean, minimal slide pagination) */}
      {media.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
          {media.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer p-0 border-none outline-none ${
                idx === currentIndex
                  ? 'w-4 h-1.5 bg-white shadow-xs'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
              title={item.type === 'video' ? 'Video' : 'Photo'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
