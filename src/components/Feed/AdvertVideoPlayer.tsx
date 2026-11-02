import React, { useRef, useState, useEffect } from 'react';
import { DEFAULT_WALKTHROUGH_VIDEO, getBlobFromIDB } from '../../utils/mediaStorage';

interface AdvertVideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
  advertId?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Dedicated production video player for sponsored adverts.
 * Features:
 * 1. Overcomes React JSX muted-autoplay restriction by directly setting DOM properties
 * 2. Self-healing: if an expired local blob URL or unresolvable stream fails, seamlessly
 *    falls back to the verified walkthrough video so it ALWAYS plays as an active video
 * 3. Restores offline agent/partner video uploads from device IndexedDB cache when available
 */
export const AdvertVideoPlayer: React.FC<AdvertVideoPlayerProps> = ({
  src,
  poster,
  className = 'w-full h-full object-cover',
  advertId,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSource, setVideoSource] = useState<string>(() => {
    if (!src || src.trim() === '') return DEFAULT_WALKTHROUGH_VIDEO;
    return src;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // If advertId or src matches an IndexedDB key, try loading local offline blob
  useEffect(() => {
    let isCancelled = false;
    const keyToLookup = advertId || (src && src.startsWith('media-') ? src : null);
    if (keyToLookup) {
      getBlobFromIDB(keyToLookup).then((blob) => {
        if (blob && !isCancelled) {
          try {
            const blobUrl = URL.createObjectURL(blob);
            setVideoSource(blobUrl);
          } catch (_) {}
        }
      }).catch(() => {});
    }
    return () => {
      isCancelled = true;
    };
  }, [advertId, src]);

  // Sync if prop changes
  useEffect(() => {
    if (src && src.trim() !== '' && !videoSource.startsWith('blob:')) {
      setVideoSource(src);
    }
  }, [src]);

  // Guarantee browser autoplay by directly configuring DOM properties
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = muted;
    video.muted = muted;
    video.playsInline = playsInline;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    if (muted) {
      video.setAttribute('muted', '');
    } else {
      video.removeAttribute('muted');
    }
    video.preload = 'auto';

    const triggerPlay = () => {
      if (!video) return;
      if (muted) video.muted = true;
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch((_err) => {
            // Re-attempt muted play to satisfy browser autoplay security policies
            video.muted = true;
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          });
      }
    };

    if (autoPlay) {
      triggerPlay();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && autoPlay) {
        triggerPlay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [videoSource, autoPlay, muted, playsInline]);

  const handleVideoError = () => {
    console.warn('[Setlla Video Player] Video failed to load:', videoSource);
    // If the failed source is not the verified default walkthrough video, fall back so it ALWAYS plays as a video!
    if (videoSource !== DEFAULT_WALKTHROUGH_VIDEO) {
      console.log('[Setlla Video Player] Seamlessly falling back to verified local walkthrough video');
      setVideoSource(DEFAULT_WALKTHROUGH_VIDEO);
      const video = videoRef.current;
      if (video) {
        video.load();
        video.muted = true;
        video.play().catch(() => {});
      }
    }
  };

  return (
    <video
      ref={videoRef}
      src={videoSource}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload="auto"
      className={className}
      onError={handleVideoError}
      onCanPlay={() => {
        const video = videoRef.current;
        if (video && autoPlay && video.paused) {
          if (muted) video.muted = true;
          video.play().catch(() => {});
        }
      }}
      onClick={onClick}
    />
  );
};

