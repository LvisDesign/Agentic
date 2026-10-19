import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  MapPin, 
  Phone, 
  Share2,
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';
import { PropertyListing } from '../../types/marketplace';

interface InFeedSponsoredCarouselProps {
  adverts: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  onOpenBookingModal?: (listing: PropertyListing) => void;
  listings?: PropertyListing[];
}

export const InFeedSponsoredCarousel: React.FC<InFeedSponsoredCarouselProps> = ({
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  onOpenBookingModal,
  listings = [],
}) => {
  const [expandedAdIds, setExpandedAdIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMenuAdId, setActiveMenuAdId] = useState<string | null>(null);

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
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
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
      text: `${ad.headline} - Sponsored on DeltaRent`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share dialog
      }
    } else {
      await navigator.clipboard.writeText(`${ad.headline} — Check it on DeltaRent: ${window.location.href}`);
      showToast('Link copied to clipboard!');
    }
  };

  const handleCTA = (e: React.MouseEvent, ad: AdvertStory) => {
    e.stopPropagation();

    // If ad links to a property and onOpenBookingModal exists
    if (ad.propertyId && onOpenBookingModal) {
      const matchedListing = listings.find((l) => l.id === ad.propertyId);
      if (matchedListing) {
        onOpenBookingModal(matchedListing);
        return;
      }
    }

    // Direct WhatsApp chat
    if (ad.whatsappNumber) {
      const text = encodeURIComponent(
        `Hello ${ad.advertiserName}, I saw your sponsored advert "${ad.headline}" on DeltaRent.`
      );
      window.open(`https://wa.me/${ad.whatsappNumber}?text=${text}`, '_blank');
      return;
    }

    // Default to story viewer if available
    if (onSelectAdvert) {
      onSelectAdvert(ad);
    }
  };

  if (!adverts || adverts.length === 0) return null;

  return (
    <div className="w-full my-4 sm:my-6 rounded-3xl bg-[#000004] text-white p-3.5 sm:p-4 shadow-xl border border-white/10 relative overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-white text-[#000004] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200 animate-fade-in pointer-events-none whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 1. SECTION HEADER (Matching Threads header structure with Left/Right Scroll Icons) */}
      <div className="px-1 pt-1 pb-3 flex flex-col gap-1.5 border-b border-white/10">
        {/* Top brand line: Logo + Title + Left/Right Scroll Icons + Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Sponsored Promos</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-300">
                Delta
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenPostAd && (
              <button
                onClick={onOpenPostAd}
                className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-amber-300" />
                <span>Post Ad</span>
              </button>
            )}

            <button
              onClick={() => setActiveMenuAdId(activeMenuAdId === 'header' ? null : 'header')}
              className="w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Sponsored options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subheader: Overlapping Avatars + Join / Activity text */}
        <div className="flex items-center gap-2 pl-0.5">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            <span className="inline-block w-4.5 h-4.5 rounded-full ring-2 ring-[#000004] bg-emerald-500 text-[8px] font-bold text-white text-center leading-[18px]">
              DH
            </span>
            <span className="inline-block w-4.5 h-4.5 rounded-full ring-2 ring-[#000004] bg-amber-500 text-[8px] font-bold text-white text-center leading-[18px]">
              WM
            </span>
            <span className="inline-block w-4.5 h-4.5 rounded-full ring-2 ring-[#000004] bg-blue-500 text-[8px] font-bold text-white text-center leading-[18px]">
              SG
            </span>
          </div>
          
          <p className="text-[11px] text-zinc-400 font-medium truncate">
            <span className="text-zinc-200 font-semibold">higgsfield.ai</span> and 8 verified services joined
          </p>
        </div>

        {/* Header menu dropdown */}
        {activeMenuAdId === 'header' && (
          <div className="mt-2 p-2 rounded-xl bg-[#23252B] border border-white/10 text-xs text-zinc-300 space-y-1.5 animate-slide-up">
            <p className="font-semibold text-white">About DeltaRent Sponsored Spotlight</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              These verified regional adverts and artisan services are promoted to house-hunters browsing rental apartments in Delta State.
            </p>
            {onOpenPostAd && (
              <button
                onClick={() => {
                  setActiveMenuAdId(null);
                  onOpenPostAd();
                }}
                className="w-full text-left font-bold text-amber-300 hover:text-amber-200 text-xs py-1"
              >
                + Promote Your Apartment or Service Here
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. HORIZONTAL SWIPE CAROUSEL (Peeking next card layout with Floating Left/Right Scroll Icons) */}
      <div className="relative mt-3 group/carousel">
        {/* Floating Left Scroll Icon */}
        {canScrollLeft && (
          <button
            onClick={handleScrollLeft}
            className="absolute -left-1 sm:left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#18191D]/90 hover:bg-white text-white hover:text-[#000004] border border-white/30 hover:border-white shadow-xl flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Scroll left"
            title="Previous adverts"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
        )}

        {/* Floating Right Scroll Icon */}
        {canScrollRight && (
          <button
            onClick={handleScrollRight}
            className="absolute -right-1 sm:right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#18191D]/90 hover:bg-white text-white hover:text-[#000004] border border-white/30 hover:border-white shadow-xl flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer"
            aria-label="Scroll right"
            title="Next adverts"
          >
            <ChevronRight className="w-5 h-5 -mr-0.5" />
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
              className="w-[85vw] max-w-[340px] shrink-0 snap-start rounded-[22px] bg-[#18191D] border border-white/10 p-4 flex flex-col justify-between shadow-lg relative group transition-transform active:scale-[0.99]"
            >
              {/* Top Row: Author Avatar + Handle + Timestamp + Menu */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/20">
                      <img
                        src={ad.avatarUrl || ad.thumbnailUrl}
                        alt={ad.advertiserName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Author Handle & Time */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                        {ad.advertiserHandle || ad.advertiserName.toLowerCase().replace(/\s+/g, '_')}
                      </span>
                      <span className="text-zinc-500 text-xs shrink-0">•</span>
                      <span className="text-zinc-400 text-xs shrink-0">
                        {ad.timeAgo || '2d'}
                      </span>
                      {ad.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Three Dots Menu Button */}
                  <button
                    onClick={() => setActiveMenuAdId(activeMenuAdId === ad.id ? null : ad.id)}
                    className="w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                    aria-label="Ad options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown for Card Menu */}
                {activeMenuAdId === ad.id && (
                  <div className="mb-2 p-2 rounded-xl bg-[#23252B] border border-white/10 text-xs text-zinc-300 space-y-1 animate-slide-up">
                    <p className="font-bold text-white text-[11px]">{ad.advertiserName}</p>
                    <p className="text-[10px] text-zinc-400">{ad.location}</p>
                    <button
                      onClick={(e) => {
                        handleShare(e, ad);
                        setActiveMenuAdId(null);
                      }}
                      className="w-full text-left font-semibold text-zinc-200 hover:text-white text-[11px] py-1 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share Advert</span>
                    </button>
                  </div>
                )}

                {/* Bold Headline */}
                <h4 className="font-bold text-white text-[14px] sm:text-[15px] leading-snug tracking-tight mb-2">
                  {ad.headline}
                </h4>

                {/* Text Body Copy (with ... more toggle) */}
                <div className="text-zinc-300 text-xs leading-relaxed">
                  <p className={isExpanded ? 'whitespace-pre-line' : 'line-clamp-3'}>
                    {ad.description}
                  </p>
                  
                  {ad.description.length > 90 && (
                    <button
                      onClick={() => setExpandedAdIds((prev) => ({ ...prev, [ad.id]: !isExpanded }))}
                      className="text-zinc-500 hover:text-zinc-300 font-semibold text-xs mt-1 transition-colors"
                    >
                      {isExpanded ? 'less' : '... more'}
                    </button>
                  )}
                </div>

                {/* Media Preview (Walkthrough Video or High-Res Photo) */}
                {ad.mediaUrl && (
                  <div 
                    onClick={() => onSelectAdvert && onSelectAdvert(ad)}
                    className="mt-2.5 rounded-xl overflow-hidden aspect-video bg-black/60 border border-white/10 relative group/media cursor-pointer flex items-center justify-center"
                  >
                    {ad.mediaType === 'video' ? (
                      <>
                        <video
                          src={ad.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                        <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                          <Film className="w-2.5 h-2.5 text-amber-300" />
                          <span>VIDEO</span>
                        </span>
                        <div className="absolute inset-0 bg-black/20 group-hover/media:bg-transparent transition-colors flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white group-hover/media:scale-110 transition-transform">
                            <Film className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={ad.mediaUrl}
                          alt={ad.headline}
                          className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                          <ImageIcon className="w-2.5 h-2.5 text-white/80" />
                          <span>PHOTO</span>
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Location / Price Tag */}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  {ad.price && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {ad.price}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span className="truncate max-w-[140px]">{ad.location}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Action Area: Primary Action CTA Button */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col">
                <button
                  onClick={(e) => handleCTA(e, ad)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#000004] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{ad.ctaText || 'Learn More'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 3. FINAL END CARD: Post an Ad Invitation */}
        {onOpenPostAd && (
          <div
            onClick={onOpenPostAd}
            className="w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[22px] bg-gradient-to-b from-[#1E2026] to-[#121316] border-2 border-dashed border-white/20 hover:border-amber-400/60 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.98] group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-amber-400/20 text-white group-hover:text-amber-300 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-white text-sm mb-1 group-hover:text-amber-200">
              Grow Your Business Here
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4 max-w-[220px]">
              Reach thousands of house-hunters and tenants across Delta State today.
            </p>

            <span className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-sm transition-colors">
              Post Sponsored Ad
            </span>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
