import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageCircle, 
  Phone, 
  MapPin 
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';

interface AdvertStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adverts: AdvertStory[];
  initialAdvertId?: string;
  onNavigateToProperty?: (propertyId: string) => void;
}

export const AdvertStoryModal: React.FC<AdvertStoryModalProps> = ({
  isOpen,
  onClose,
  adverts,
  initialAdvertId,
  onNavigateToProperty,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize selected advert index
  useEffect(() => {
    if (initialAdvertId) {
      const idx = adverts.findIndex((a) => a.id === initialAdvertId);
      if (idx !== -1) setCurrentIndex(idx);
    }
    setProgress(0);
  }, [initialAdvertId, isOpen]);

  const activeAd = adverts[currentIndex] || adverts[0];

  // Auto-progress bar timer (5.5 seconds per story)
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = 50; // update every 50ms
    const totalDuration = 5500;
    const step = (interval / totalDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isPaused, adverts.length]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < adverts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!isOpen || !activeAd) return null;

  const handleCtaClick = () => {
    if (activeAd.propertyId && onNavigateToProperty) {
      onNavigateToProperty(activeAd.propertyId);
      onClose();
    } else if (activeAd.whatsappNumber) {
      const message = encodeURIComponent(
        `Hello, I saw your verified advert "${activeAd.headline}" on Setlla. I would like to make an inquiry.`
      );
      window.open(`https://wa.me/${activeAd.whatsappNumber}?text=${message}`, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Centered Phone-proportioned Story Canvas */}
      <div 
        className="relative w-full max-w-[420px] h-[92vh] max-h-[840px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* 1. Top Story Progress Bars (Instagram Stories Multi-Segment) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {adverts.map((ad, idx) => (
            <div 
              key={ad.id} 
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: 
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* 2. Advertiser Header Bar */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            {/* Squared Thumbnail with Rounded Edges in Brand Color */}
            <div className="w-9 h-9 rounded-[12px] p-[2px] bg-gradient-to-tr from-[#342A21] via-[#524436] to-[#251E17] shadow-xs">
              <img
                src={activeAd.thumbnailUrl}
                alt={activeAd.advertiserName}
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>

            <div>
              <span className="font-bold text-xs text-white drop-shadow-md block">
                {activeAd.advertiserName}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-white/80">
                <span className="px-1 py-0.2 rounded bg-[#342A21]/90 font-semibold uppercase text-[8px] tracking-wider">
                  {activeAd.badgeText}
                </span>
                <span>•</span>
                <span>Sponsored Advert</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close story"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/20 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Media Viewport (Image / Video) */}
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
          {activeAd.mediaType === 'video' ? (
            <video
              key={activeAd.mediaUrl}
              src={activeAd.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={activeAd.mediaUrl}
              alt={activeAd.headline}
              className="w-full h-full object-cover"
            />
          )}

          {/* Top & Bottom Shading Gradients for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

          {/* Left / Right Tap Zones */}
          <div 
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-36 w-1/3 z-20 cursor-pointer"
            title="Previous Story"
          />
          <div 
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-36 w-1/3 z-20 cursor-pointer"
            title="Next Story"
          />
          </div>

        {/* 4. Bottom Advert Story Sheet Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent text-white space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-xs text-white/90 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#00C3F7]" />
              {activeAd.location}
            </span>
            {activeAd.price && (
              <span className="font-display font-bold text-base sm:text-lg text-emerald-400">
                {activeAd.price}
              </span>
            )}
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-white leading-snug">
            {activeAd.headline}
          </h3>

          <p className="text-xs text-white/80 line-clamp-3 leading-relaxed">
            {activeAd.description}
          </p>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCtaClick}
              className="flex-1 py-3 px-4 rounded-xl bg-[#000004] hover:bg-neutral-900 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <span>{activeAd.ctaText}</span>
            </button>

            {activeAd.whatsappNumber && (
              <a
                href={`https://wa.me/${activeAd.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-lg active:scale-95 shrink-0"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}

            {activeAd.phone && (
              <a
                href={`tel:${activeAd.phone.replace(/\s+/g, '')}`}
                className="w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/20 active:scale-95 shrink-0"
                title="Call Advertiser"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
