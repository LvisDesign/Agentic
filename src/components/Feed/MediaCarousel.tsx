import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Film, RotateCcw } from 'lucide-react';
import { DEFAULT_FALLBACK_IMAGE, DEFAULT_WALKTHROUGH_VIDEO } from '../../utils/mediaStorage';

interface MediaItem {
  id?: string;
  type: 'image' | 'video';
  url: string;
  poster?: string;
  caption: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  title: string;
}

interface CarouselVideoItemProps {
  url: string;
  poster?: string;
  caption: string;
  isActive: boolean;
  isInView: boolean;
}

function resolveVideoSource(src?: string): string {
  if (!src || typeof src !== 'string') return DEFAULT_WALKTHROUGH_VIDEO;
  // If it's a static image Data URL, it cannot be decoded as a video stream
  if (src.startsWith('data:image/')) return DEFAULT_WALKTHROUGH_VIDEO;
  // If it points to the blocked mixkit domain which returns 403 Forbidden
  if (src.includes('mixkit.co')) return DEFAULT_WALKTHROUGH_VIDEO;
  return src;
}

/**
 * Dedicated Video item that plays automatically when scrolled into the viewport
 * and pauses when scrolled away or navigated to another slide.
 * Provides active mute/unmute controls so users can freely choose whether to mute or play sound.
 */
const CarouselVideoItem: React.FC<CarouselVideoItemProps> = ({
  url,
  poster,
  caption,
  isActive,
  isInView,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoSource, setVideoSource] = useState(() => resolveVideoSource(url));
  const isInitialMount = useRef(true);

  // Synchronize URL changes
  useEffect(() => {
    setVideoSource(resolveVideoSource(url));
    setHasError(false);
  }, [url]);

  // Set initial muted state on mount for browser autoplay compliance without overriding user changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playsInline = true;
    video.defaultMuted = true;
    if (isInitialMount.current) {
      video.muted = true;
      setIsMuted(true);
      isInitialMount.current = false;
    }
  }, []);

  // Synchronize playback with scroll visibility & active slide state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isInView && isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser restricted playback (e.g. unmuted attempt without prior interaction), mute and retry
          if (video && !video.muted) {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          }
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isInView, isActive, hasError, videoSource]);

  // Synchronize native volume and mute changes with state
  const handleVolumeChange = () => {
    const video = videoRef.current;
    if (video) {
      setIsMuted(video.muted || video.volume === 0);
    }
  };

  // Toggle mute state directly
  const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (!nextMuted) {
      if (video.volume === 0) video.volume = 1;
      video.play().catch(() => {});
    }
    setIsMuted(nextMuted);
  };

  // Toggle play/pause when user clicks the video area
  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  // Pause playback when the user switches browser tabs or minimizes window
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video || hasError) return;

      if (document.hidden) {
        if (!video.paused) {
          video.pause();
        }
      } else if (isInView && isActive) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInView, isActive, hasError]);

  const handleVideoError = () => {
    console.warn('[DeltaRent Video] Video source failed to play:', videoSource);
    // If the failed source is not the local default walkthrough video, seamlessly fall back!
    if (videoSource !== DEFAULT_WALKTHROUGH_VIDEO) {
      console.log('[DeltaRent Video] Automatically falling back to verified local walkthrough video');
      setVideoSource(DEFAULT_WALKTHROUGH_VIDEO);
      setHasError(false);
    } else {
      // If even the default failed, show the fallback UI
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <img
          src={poster || DEFAULT_FALLBACK_IMAGE}
          alt={caption}
          onError={(e) => {
            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
          }}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-11 h-11 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-amber-300 mb-2 shadow-lg">
            <Film className="w-5 h-5" />
          </div>
          <span className="text-white text-xs font-bold tracking-tight">Verified Property Walkthrough</span>
          <span className="text-white/70 text-[11px] mt-0.5 max-w-xs truncate">{caption}</span>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setVideoSource(DEFAULT_WALKTHROUGH_VIDEO);
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }, 60);
            }}
            className="mt-3 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Play Walkthrough Tour</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-slate-950 cursor-pointer"
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        src={videoSource}
        poster={poster || DEFAULT_FALLBACK_IMAGE}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        title={caption}
        onError={handleVideoError}
        onVolumeChange={handleVolumeChange}
        onCanPlay={() => {
          // If ready and currently active in view, ensure playback starts immediately
          if (isInView && isActive && videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Floating Sound Toggle Pill Button (Active Mute / Unmute Control) */}
      <button
        type="button"
        onClick={toggleMute}
        onTouchEnd={toggleMute}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
        className="absolute top-2.5 right-2.5 z-25 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 group/sound"
        title={isMuted ? 'Click to unmute sound' : 'Click to mute sound'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-white/90" />
            <span className="text-[11px] font-semibold text-white/90">
              Unmute
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300">
              Sound On
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  // Monitor when this carousel scrolls into or out of the user's viewport
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // When at least 20% of the video section is visible in the viewport, start playing.
        // When it drops below 10%, pause playback to conserve resources.
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          setIsInView(true);
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          setIsInView(false);
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1.0],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!media || media.length === 0) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
        No media available
      </div>
    );
  }

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
      ref={containerRef}
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
              <CarouselVideoItem
                url={item.url}
                poster={item.poster}
                caption={item.caption || title}
                isActive={idx === currentIndex}
                isInView={isInView}
              />
            ) : (
              <img
                src={item.url || DEFAULT_FALLBACK_IMAGE}
                alt={item.caption || title}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                }}
                className="w-full h-full object-cover pointer-events-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* Desktop & Larger Screens: Left & Right Navigation Arrow Buttons */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              prevSlide();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Previous media slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-25 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md hover:shadow-lg backdrop-blur-xs items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 border border-black/10 opacity-80 hover:opacity-100"
            title="Previous media"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-800 -ml-0.5" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              nextSlide();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Next media slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-25 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md hover:shadow-lg backdrop-blur-xs items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 border border-black/10 opacity-80 hover:opacity-100"
            title="Next media"
          >
            <ChevronRight className="w-5 h-5 text-zinc-800 -mr-0.5" strokeWidth={2.5} />
          </button>
        </>
      )}

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
