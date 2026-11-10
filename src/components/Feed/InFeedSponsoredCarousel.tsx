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
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { AdvertStory, getAdvertCtaConfig } from '../../data/mockAdverts';
import { isVideoMediaUrl } from '../../services/adService';
import { PropertyListing } from '../../types/marketplace';
import { ShareSheetModal, SharePayload } from '../UI/ShareSheetModal';

interface InFeedSponsoredCarouselProps {
  adverts: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  listings?: PropertyListing[];
}

interface InFeedSponsoredVideoProps {
  mediaUrl: string;
  posterUrl?: string;
}

/**
 * Formats headline or description text to fix stray comma/period spacing
 * (e.g. "Branding ,Documentation Jobs" -> "Branding, Documentation Jobs")
 */
function formatCleanAdCopy(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Computes 1-2 character brand initials for monogram fallback
 */
function getBrandInitials(name?: string): string {
  const clean = (name || 'Setlla Partner').replace(/^@/, '').trim();
  if (!clean) return 'SP';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Resilient Advertiser Avatar with automatic monogram fallback when avatarUrl is missing,
 * points to a video file, or fails to load.
 */
const AdvertiserAvatar: React.FC<{ ad: AdvertStory }> = ({ ad }) => {
  const [imgError, setImgError] = useState(false);

  const candidateUrl = ad.avatarUrl && !isVideoMediaUrl(ad.avatarUrl)
    ? ad.avatarUrl
    : ad.thumbnailUrl && !isVideoMediaUrl(ad.thumbnailUrl) && ad.mediaType !== 'video'
    ? ad.thumbnailUrl
    : '';

  const showImage = Boolean(candidateUrl && !imgError);
  const initials = getBrandInitials(ad.advertiserName || ad.advertiserHandle);

  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#342A21] to-[#1A1410] border border-[#E5D3A7] flex items-center justify-center shadow-2xs">
        {showImage ? (
          <img
            src={candidateUrl}
            alt={ad.advertiserName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="font-display font-extrabold text-xs tracking-wider text-[#FFAD05] select-none">
            {initials}
          </span>
        )}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-2xs"
        title="Verified Setlla Partner"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
      </span>
    </div>
  );
};

const InFeedSponsoredVideo: React.FC<InFeedSponsoredVideoProps> = ({ mediaUrl, posterUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const isInitialMount = useRef(true);

  const safePoster = posterUrl && !isVideoMediaUrl(posterUrl) ? posterUrl : undefined;
  const videoSrcWithFrame = mediaUrl.includes('#') ? mediaUrl : `${mediaUrl}#t=0.1`;

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

        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          if (hasEnded) return;

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => {
                if (video && !video.muted) {
                  video.muted = true;
                  setIsMuted(true);
                  video
                    .play()
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
          setHasEnded(false);
          try {
            video.currentTime = 0.1;
          } catch (_) {}
        }
      },
      {
        threshold: [0, 0.1, 0.3, 0.6, 1.0],
      }
    );

    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.hidden && !video.paused) {
        video.pause();
        setIsPlaying(false);
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
    video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0.3) {
      try {
        // Hold on a visible frame near the end rather than a black blank frame
        video.currentTime = Math.max(0.1, video.duration - 0.15);
      } catch (_) {}
    }
    setHasEnded(true);
    setIsPlaying(false);
    if (video) {
      video.pause();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative cursor-pointer flex items-center justify-center overflow-hidden bg-[#18130F]"
      onClick={() => {
        if (hasEnded) handlePlayAgain();
      }}
    >
      <video
        ref={videoRef}
        src={videoSrcWithFrame}
        poster={safePoster}
        className="relative z-10 w-full h-auto block"
        muted={isMuted}
        playsInline
        preload="metadata"
        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted || e.currentTarget.volume === 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {/* Top-Right Floating Audio Pill */}
      <button
        type="button"
        onClick={toggleMute}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-sm transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        title={isMuted ? 'Tap to unmute' : 'Tap to mute'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-white/90" />
            <span className="text-[10px] font-bold tracking-wide text-white/95">Unmute</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#FFAD05]" />
            <span className="text-[10px] font-bold tracking-wide text-[#FFAD05]">Sound On</span>
          </>
        )}
      </button>

      {/* Replay / Play Overlay */}
      {hasEnded ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1.5px] transition-all"
          onClick={handlePlayAgain}
        >
          <button
            type="button"
            onClick={handlePlayAgain}
            className="group/replay px-4 py-2 rounded-full bg-[#231C16]/90 hover:bg-[#342A21] text-white border border-[#FFAD05]/40 shadow-xl flex items-center gap-2 text-xs font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Replay video"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFAD05] group-hover/replay:-rotate-45 transition-transform duration-300" />
            <span>Replay Video</span>
          </button>
        </div>
      ) : !isPlaying ? (
        <div
          onClick={handlePlayAgain}
          className="absolute inset-0 z-20 bg-black/15 hover:bg-black/25 transition-colors flex items-center justify-center"
        >
          <div className="w-11 h-11 rounded-full bg-[#231C16]/85 backdrop-blur-md border border-[#FFAD05]/50 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
            <Play className="w-4 h-4 text-[#FFAD05] fill-[#FFAD05] ml-0.5" />
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
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isSingleAd = adverts.length === 1;

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const firstCard = container.firstElementChild as HTMLElement | null;
    if (firstCard && firstCard.offsetWidth > 0) {
      const idx = Math.round(scrollLeft / (firstCard.offsetWidth + 12));
      setActiveSlideIndex(Math.max(0, Math.min(adverts.length - 1, idx)));
    }
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

  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const card = container.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : container.clientWidth * 0.88;
    container.scrollTo({ left: step * index, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    scrollToSlide(Math.max(0, activeSlideIndex - 1));
  };

  const handleScrollRight = () => {
    scrollToSlide(Math.min(adverts.length - 1, activeSlideIndex + 1));
  };

  const handleShare = (e: React.MouseEvent, ad: AdvertStory) => {
    e.stopPropagation();
    const shareUrl = ad.websiteUrl || window.location.href;
    setSharePayload({
      title: formatCleanAdCopy(ad.headline),
      subtitle: `${ad.advertiserName} • Sponsored on Setlla`,
      text: `${formatCleanAdCopy(ad.headline)} by ${ad.advertiserName} on Setlla`,
      url: shareUrl,
    });
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
        `Hello ${ad.advertiserName}, I saw your sponsored advert "${formatCleanAdCopy(ad.headline)}" on Setlla.`
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
    <section
      aria-label="Sponsored Promos"
      className="w-full my-4 sm:my-6 rounded-[26px] p-3.5 sm:p-5 border border-[#E8D8B5] relative overflow-hidden transition-all"
      style={{
        background:
          'linear-gradient(145deg, #FFFDF9 0%, #FAF3E3 52%, #F3E6C8 100%)',
        boxShadow:
          '0 16px 40px -12px rgba(52, 42, 33, 0.12), 0 4px 14px -2px rgba(52, 42, 33, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* Subtle Top-Right Warm Gold Ambient Highlight */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(circle, rgba(255, 173, 5, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* 1. SECTION HEADER */}
      <div className="px-0.5 pb-3 flex items-center justify-between border-b border-[#342A21]/10 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#231C16] truncate">
            Sponsored Spotlight
          </h3>
          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FFF7E0] text-[#8A5A00] border border-[#EDD595] shadow-2xs shrink-0">
            Featured
          </span>
        </div>

        {onOpenPostAd && (
          <button
            type="button"
            onClick={onOpenPostAd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#342A21] hover:bg-[#231C16] text-white text-[11px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFAD05]" />
            <span>Post Ad</span>
          </button>
        )}
      </div>

      {/* 2. CAROUSEL TRACK */}
      <div className="relative mt-3.5 group/carousel z-10">
        {!isSingleAd && canScrollLeft && (
          <button
            type="button"
            onClick={handleScrollLeft}
            className="hidden md:flex absolute -left-2 lg:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#342A21] border border-[#E5D3A7] shadow-card hover:shadow-elevated items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Previous advert"
            title="Previous advert"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5 text-[#342A21]" />
          </button>
        )}

        {!isSingleAd && canScrollRight && (
          <button
            type="button"
            onClick={handleScrollRight}
            className="hidden md:flex absolute -right-2 lg:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#342A21] border border-[#E5D3A7] shadow-card hover:shadow-elevated items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Next advert"
            title="Next advert"
          >
            <ChevronRight className="w-5 h-5 -mr-0.5 text-[#342A21]" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex items-start gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 pt-0.5 overscroll-x-contain scroll-smooth"
        >
          {adverts.map((ad) => {
            const isExpanded = !!expandedAdIds[ad.id];
            const cleanHeadline = formatCleanAdCopy(ad.headline || ad.title);
            const cleanDescription =
              ad.description &&
              String(ad.description).trim() !== 'NaN' &&
              String(ad.description).trim() !== 'undefined'
                ? formatCleanAdCopy(ad.description)
                : '';
            const handleDisplay = (
              ad.advertiserHandle ||
              `@${(ad.advertiserName || 'partner').toLowerCase().replace(/[^a-z0-9]+/g, '')}`
            ).replace(/^@@/, '@');

            return (
              <article
                key={ad.id}
                className={`${
                  isSingleAd ? 'w-full' : 'w-[88%] sm:w-[85%]'
                } shrink-0 snap-start rounded-[22px] bg-white border border-[#EDE3CC] hover:border-[#D9C398] p-3.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md relative group transition-all duration-200`}
              >
                <div>
                  {/* A. Top Brand Identity Bar */}
                  <div className="flex items-center justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AdvertiserAvatar ad={ad} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1A1410] text-xs sm:text-sm tracking-tight truncate">
                            {ad.advertiserName || handleDisplay}
                          </span>
                          {ad.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF5EA] text-[#6E5634] border border-[#E8D8B5] shrink-0">
                              {ad.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#70798C] truncate">
                          <span className="truncate font-medium">{handleDisplay}</span>
                          <span>•</span>
                          <span className="shrink-0">{ad.timeAgo || 'Sponsored'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, ad)}
                      className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#5C5346] hover:text-[#1A1410] border border-[#EDE3CC] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      aria-label="Share advert"
                      title="Share Advert"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* B. Media-First Showcase (Full Intrinsic Display — Video or High-Res Visual) */}
                  {ad.mediaUrl && (
                    <div
                      onClick={(e) => handleCTA(e, ad)}
                      className="mb-3 w-full rounded-2xl overflow-hidden bg-[#18130F] border border-[#EDE3CC] relative group/media cursor-pointer shadow-2xs"
                    >
                      {ad.mediaType === 'video' || isVideoMediaUrl(ad.mediaUrl) ? (
                        <InFeedSponsoredVideo mediaUrl={ad.mediaUrl} posterUrl={ad.thumbnailUrl} />
                      ) : (
                        <img
                          src={ad.mediaUrl}
                          alt={cleanHeadline}
                          className="w-full h-auto block group-hover/media:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                      )}

                      {/* Price Badge Overlay if present */}
                      {ad.price && (
                        <span className="absolute bottom-2.5 left-2.5 z-20 text-[11px] font-extrabold text-white bg-[#231C16]/85 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg shadow-sm">
                          {ad.price}
                        </span>
                      )}
                    </div>
                  )}

                  {/* C. Headline & Expandable Copy */}
                  <h4
                    onClick={(e) => handleCTA(e, ad)}
                    className="font-display font-bold text-[#1A1410] text-[15px] sm:text-base leading-snug tracking-tight mb-1.5 hover:text-[#342A21] cursor-pointer transition-colors"
                  >
                    {cleanHeadline}
                  </h4>

                  {cleanDescription && (
                    <div className="text-[#5C6474] text-xs leading-relaxed">
                      <p className={isExpanded ? 'whitespace-pre-line text-[#342A21]' : 'line-clamp-2'}>
                        {cleanDescription}
                      </p>

                      {cleanDescription.length > 95 && (
                        <button
                          type="button"
                          onClick={() => setExpandedAdIds((prev) => ({ ...prev, [ad.id]: !isExpanded }))}
                          className="text-[#8A5A00] hover:underline font-bold text-xs mt-0.5 transition-colors cursor-pointer"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* D. High-Conversion Footer Bar */}
                <div className="mt-3.5 pt-3 border-t border-[#F0E7D5] flex items-center justify-between gap-2.5">
                  <span className="text-[11px] font-medium text-[#6E6558] inline-flex items-center gap-1 min-w-0 max-w-[38%]">
                    <MapPin className="w-3.5 h-3.5 text-[#C68400] shrink-0" />
                    <span className="truncate">{ad.location || 'Delta State'}</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {(() => {
                      const cta = getAdvertCtaConfig(ad);
                      return (
                        <>
                          {ad.phone && cta.type !== 'contact' && (
                            <a
                              href={`tel:${ad.phone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-9 h-9 rounded-xl bg-[#FAF5EA] hover:bg-[#F0E4CA] text-[#342A21] border border-[#E5D3A7] flex items-center justify-center transition-colors shrink-0"
                              title="Call Advertiser"
                              aria-label="Call Advertiser"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {cta.type !== 'contact' && ad.whatsappNumber && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = encodeURIComponent(
                                  `Hello ${ad.advertiserName}, I saw your sponsored advert "${cleanHeadline}" on Setlla.`
                                );
                                window.open(`https://wa.me/${ad.whatsappNumber}?text=${text}`, '_blank');
                              }}
                              className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Direct WhatsApp Chat"
                              aria-label="Direct WhatsApp Chat"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleCTA(e, ad)}
                            className="flex-1 sm:flex-initial sm:min-w-[165px] py-2.5 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white font-bold text-xs flex items-center justify-between gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer group/cta"
                          >
                            <span className="truncate">{cta.label}</span>
                            <div className="flex items-center gap-1 text-white/80 group-hover/cta:text-white transition-colors shrink-0">
                              {cta.type === 'website' && <ExternalLink className="w-3.5 h-3.5 text-[#FFAD05]" />}
                              {cta.type === 'contact' && <WhatsAppIcon className="w-4 h-4 text-emerald-400" />}
                              {cta.type === 'property' && <ChevronRight className="w-3.5 h-3.5 text-[#FFAD05]" />}
                            </div>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* 3. Interactive Pagination Dots (when multiple campaigns are active) */}
        {adverts.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {adverts.map((ad, idx) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => scrollToSlide(idx)}
                aria-label={`Go to sponsored ad ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  idx === activeSlideIndex
                    ? 'w-5 bg-[#342A21]'
                    : 'w-1.5 bg-[#342A21]/25 hover:bg-[#342A21]/45'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <ShareSheetModal
        isOpen={Boolean(sharePayload)}
        onClose={() => setSharePayload(null)}
        payload={sharePayload}
      />
    </section>
  );
};
