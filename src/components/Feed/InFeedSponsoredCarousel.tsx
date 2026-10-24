import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  MapPin, 
  Phone, 
  Share2,
  ChevronLeft,
  ChevronRight,
  Film,
  Volume2,
  VolumeX,
  MessageCircle,
  Globe,
  RotateCcw
} from 'lucide-react';
import { AdvertStory, getAdvertCtaConfig } from '../../data/mockAdverts';
import { PropertyListing } from '../../types/marketplace';

interface InFeedSponsoredCarouselProps {
  adverts: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  listings?: PropertyListing[];
}

interface InFeedSponsoredVideoProps {
  mediaUrl: string;
}

const InFeedSponsoredVideo: React.FC<InFeedSponsoredVideoProps> = ({ mediaUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const isInitialMount = useRef(true);

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

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          // If already ended while in view, do not auto-replay
          if (hasEnded) return;

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => {
                if (video && !video.muted) {
                  video.muted = true;
                  setIsMuted(true);
                  video.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
                }
              });
          }
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          if (!video.paused) {
            video.pause();
            setIsPlaying(false);
          }
          // When scrolled past (out of view), reset ended state so it plays fresh when returned
          setHasEnded(false);
          video.currentTime = 0;
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasEnded]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (!nextMuted && video.volume === 0) {
      video.volume = 1;
    }
    setIsMuted(nextMuted);
  };

  const handlePlayAgain = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setHasEnded(false);
    video.play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const handleEnded = () => {
    setHasEnded(true);
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-pointer flex items-center justify-center overflow-hidden bg-slate-950" onClick={() => {
      if (hasEnded) handlePlayAgain();
    }}>
      {/* Ambient blurred backdrop so letterboxing (if any) looks seamless */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-30 scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${mediaUrl})` }}
      />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <video
        ref={videoRef}
        src={mediaUrl}
        className="relative z-10 w-full h-full object-contain mx-auto"
        muted={isMuted}
        playsInline
        preload="auto"
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted || e.currentTarget.volume === 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {/* Floating Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        title={isMuted ? 'Click to unmute' : 'Click to mute'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3 h-3 text-white/90" />
            <span className="text-[10px] font-semibold text-white/90">Unmute</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-300">Sound On</span>
          </>
        )}
      </button>

      {/* Replay Overlay when video finishes without scrolling past */}
      {hasEnded ? (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all"
          onClick={handlePlayAgain}
        >
          <button
            type="button"
            onClick={handlePlayAgain}
            className="group/replay px-3 py-1.5 rounded-full bg-black/80 hover:bg-black/95 text-white border border-white/30 shadow-lg flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Replay video"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300 group-hover/replay:-rotate-45 transition-transform duration-300" />
            <span>Replay</span>
          </button>
        </div>
      ) : !isPlaying ? (
        <div className="absolute inset-0 bg-black/20 group-hover/media:bg-transparent transition-colors flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white group-hover/media:scale-110 transition-transform">
            <Film className="w-4 h-4 text-white" />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const InFeedSponsoredCarousel: React.FC<InFeedSponsoredCarouselProps> = ({
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  onOpenBookingModal,
  listings = [],
}) => {
  const [expandedAdIds, setExpandedAdIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carousel track scroll reference and scroll states
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [adverts]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const scrollDistance = card ? card.offsetWidth + 12 : scrollContainerRef.current.clientWidth * 0.88;
      scrollContainerRef.current.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const scrollDistance = card ? card.offsetWidth + 12 : scrollContainerRef.current.clientWidth * 0.88;
      scrollContainerRef.current.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async (e: React.MouseEvent, ad: AdvertStory) => {
    e.stopPropagation();
    const shareData = {
      title: ad.headline,
      text: `${ad.headline} - Sponsored on Setlla`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share dialog
      }
    } else {
      await navigator.clipboard.writeText(`${ad.headline} — Check it on Setlla: ${window.location.href}`);
      showToast('Link copied to clipboard!');
    }
  };

  const handleCTA = (e: React.MouseEvent | React.SyntheticEvent, ad: AdvertStory) => {
    e.stopPropagation();

    // 1. External organization / influencer website link
    if (ad.actionType === 'website' || (ad.websiteUrl && !ad.propertyId)) {
      if (ad.websiteUrl) {
        window.open(ad.websiteUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // 2. Direct property listing on platform
    if (ad.propertyId && onOpenBookingModal) {
      const matchedListing = listings.find((l) => l.id === ad.propertyId);
      if (matchedListing) {
        onOpenBookingModal(matchedListing);
        return;
      }
    }

    // 3. Direct WhatsApp chat
    if (ad.whatsappNumber) {
      const text = encodeURIComponent(
        `Hello ${ad.advertiserName}, I saw your sponsored advert "${ad.headline}" on Setlla.`
      );
      window.open(`https://wa.me/${ad.whatsappNumber}?text=${text}`, '_blank');
      return;
    }

    // 4. Phone call
    if (ad.phone) {
      window.open(`tel:${ad.phone.replace(/\s+/g, '')}`, '_self');
      return;
    }

    // 5. Fallback website link
    if (ad.websiteUrl) {
      window.open(ad.websiteUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (onSelectAdvert) {
      onSelectAdvert(ad);
    }
  };

  if (!adverts || adverts.length === 0) return null;

  return (
    <div 
      className="w-full my-4 sm:my-6 rounded-3xl p-3.5 sm:p-5 shadow-2xl border relative overflow-hidden backdrop-blur-2xl transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(135, 142, 122, 0.70) 0%, rgba(162, 168, 146, 0.60) 38%, rgba(195, 188, 172, 0.65) 72%, rgba(228, 222, 210, 0.80) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.80)',
        boxShadow: '0 20px 50px -10px rgba(52, 42, 33, 0.16), 0 8px 20px -4px rgba(52, 42, 33, 0.08), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.90), inset 0 -1px 2px 0 rgba(100, 95, 80, 0.10)',
      }}
    >
      {/* Specular Ambient Glass Light Sheen (matching sample gradient) */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse 75% 55% at 85% 15%, rgba(255, 255, 255, 0.55) 0%, transparent 65%), linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, transparent 40%)',
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#342A21] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg border border-black/10 animate-fade-in pointer-events-none whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 1. SECTION HEADER */}
      <div className="px-1 pt-1 pb-3 flex items-center justify-between border-b border-[#342A21]/15 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#1C1F18] flex items-center gap-1.5 drop-shadow-2xs">
            <span>Sponsored Promos</span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/70 text-[#1C1F18] border border-white/80 shadow-2xs backdrop-blur-xs">
              Delta
            </span>
          </h3>
        </div>

        {onOpenPostAd && (
          <button
            onClick={onOpenPostAd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#342A21] hover:bg-[#231C16] text-white text-[11px] font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Post Ad</span>
          </button>
        )}
      </div>

      {/* 2. HORIZONTAL SWIPE CAROUSEL (Peeking next card layout with Floating Left/Right Scroll Icons) */}
      <div className="relative mt-3 group/carousel z-10">
        {/* Floating Left Scroll Icon (Only on desktop and larger screens) */}
        {canScrollLeft && (
          <button
            onClick={handleScrollLeft}
            className="hidden md:flex absolute -left-2 lg:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[#342A21] border border-[#E5E7EB] hover:border-[#342A21]/30 shadow-card hover:shadow-elevated items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Scroll left"
            title="Previous adverts"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5 text-[#342A21]" />
          </button>
        )}

        {/* Floating Right Scroll Icon (Only on desktop and larger screens) */}
        {canScrollRight && (
          <button
            onClick={handleScrollRight}
            className="hidden md:flex absolute -right-2 lg:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[#342A21] border border-[#E5E7EB] hover:border-[#342A21]/30 shadow-card hover:shadow-elevated items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Scroll right"
            title="Next adverts"
          >
            <ChevronRight className="w-5 h-5 -mr-0.5 text-[#342A21]" />
          </button>
        )}

        {/* Carousel Track */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 pt-1 overscroll-x-contain scroll-smooth"
        >
        {adverts.map((ad) => {
          const isExpanded = !!expandedAdIds[ad.id];

          return (
            <div
              key={ad.id}
              className="w-[86%] sm:w-[88%] shrink-0 snap-start rounded-[22px] bg-white/95 hover:bg-white border border-[#E5E7EB] hover:border-[#342A21]/20 p-4 flex flex-col justify-between shadow-card hover:shadow-elevated relative group transition-all duration-200 active:scale-[0.99] backdrop-blur-sm"
            >
              {/* Top Row: Author Avatar + Handle + Timestamp + Share */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#F6F3EF] shrink-0 border border-[#E5E7EB]">
                      <img
                        src={ad.avatarUrl || ad.thumbnailUrl}
                        alt={ad.advertiserName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Author Handle & Time */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-[#000004] text-xs sm:text-sm tracking-tight truncate">
                        {ad.advertiserHandle || ad.advertiserName.toLowerCase().replace(/\s+/g, '_')}
                      </span>
                      <span className="text-[#70798C] text-xs shrink-0">•</span>
                      <span className="text-[#70798C] text-xs shrink-0">
                        {ad.timeAgo || '2d'}
                      </span>
                      {ad.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Direct Share Button */}
                  <button
                    onClick={(e) => handleShare(e, ad)}
                    className="w-7 h-7 rounded-full hover:bg-[#F6F3EF] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    aria-label="Share advert"
                    title="Share Advert"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bold Headline */}
                <h4 
                  onClick={(e) => handleCTA(e, ad)}
                  className="font-bold text-[#000004] text-[14px] sm:text-[15px] leading-snug tracking-tight mb-2 hover:text-[#342A21] cursor-pointer transition-colors"
                >
                  {ad.headline}
                </h4>

                {/* Text Body Copy (with ... more toggle) */}
                <div className="text-[#70798C] text-xs leading-relaxed">
                  <p className={isExpanded ? 'whitespace-pre-line text-[#342A21]' : 'line-clamp-3'}>
                    {ad.description}
                  </p>
                  
                  {ad.description.length > 90 && (
                    <button
                      onClick={() => setExpandedAdIds((prev) => ({ ...prev, [ad.id]: !isExpanded }))}
                      className="text-[#342A21] hover:underline font-bold text-xs mt-1 transition-colors cursor-pointer"
                    >
                      {isExpanded ? 'less' : '... more'}
                    </button>
                  )}
                </div>

                {/* Media Preview (Walkthrough Video or High-Res Photo) */}
                {ad.mediaUrl && (
                  <div 
                    onClick={(e) => handleCTA(e, ad)}
                    className="mt-2.5 rounded-xl overflow-hidden aspect-video bg-slate-900 border border-[#E5E7EB] relative group/media cursor-pointer flex items-center justify-center"
                  >
                    {ad.mediaType === 'video' ? (
                      <InFeedSponsoredVideo mediaUrl={ad.mediaUrl} />
                    ) : (
                      <img
                        src={ad.mediaUrl}
                        alt={ad.headline}
                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}

                {/* Location / Price Tag */}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  {ad.price && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {ad.price}
                    </span>
                  )}
                  <span className="text-[11px] text-[#70798C] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#70798C] shrink-0" />
                    <span className="truncate max-w-[140px]">{ad.location}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Action Area: Best-Practice Destination-Aware CTA */}
              <div className="mt-3.5 pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
                {(() => {
                  const cta = getAdvertCtaConfig(ad);
                  return (
                    <>
                      <button
                        onClick={(e) => handleCTA(e, ad)}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white font-bold text-xs flex items-center justify-between gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer group/cta"
                      >
                        <span className="truncate">{cta.label}</span>
                        <div className="flex items-center gap-1.5 text-white/70 group-hover/cta:text-white transition-colors shrink-0">
                          {cta.type === 'website' && (
                            <>
                              <span className="text-[10px] font-normal opacity-70 hidden sm:inline truncate max-w-[110px]">
                                {cta.destinationHint}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </>
                          )}
                          {cta.type === 'contact' && (
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {cta.type === 'property' && (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>

                      {/* Secondary Quick Contact for Website/Property ads that also support WhatsApp */}
                      {cta.type !== 'contact' && ad.whatsappNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = encodeURIComponent(
                              `Hello ${ad.advertiserName}, I saw your sponsored advert "${ad.headline}" on Setlla.`
                            );
                            window.open(`https://wa.me/${ad.whatsappNumber}?text=${text}`, '_blank');
                          }}
                          className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center justify-center transition-colors shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                          title="Direct WhatsApp Chat"
                          aria-label="Direct WhatsApp Chat"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}

        {/* 3. FINAL END CARD: Post an Ad Invitation */}
        {onOpenPostAd && (
          <div
            onClick={onOpenPostAd}
            className="w-[75%] sm:w-[65%] shrink-0 snap-start rounded-[22px] bg-white/85 hover:bg-white border-2 border-dashed border-[#342A21]/20 hover:border-[#342A21]/50 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] group shadow-card"
          >
            <div className="w-12 h-12 rounded-full bg-[#F6F3EF] group-hover:bg-[#342A21] text-[#342A21] group-hover:text-white border border-[#E5E7EB] flex items-center justify-center mb-3 transition-colors shadow-2xs">
              <Plus className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-[#000004] text-sm mb-1 group-hover:text-[#342A21] transition-colors">
              Grow Your Business Here
            </h4>
            <p className="text-[#70798C] text-xs leading-relaxed mb-4 max-w-[220px]">
              Reach thousands of verified house-hunters and tenants across Delta State today.
            </p>

            <span className="py-2 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white font-bold text-xs shadow-xs transition-colors">
              Post Sponsored Ad
            </span>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
