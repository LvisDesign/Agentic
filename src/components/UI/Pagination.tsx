import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface UseInfiniteScrollOptions {
  initialBatchSize?: number;
  batchSize?: number;
  scrollRootRef?: React.RefObject<HTMLElement | null>;
  resetKey?: string | number;
  hasMoreServerData?: boolean;
  onLoadMoreServerData?: () => Promise<boolean | void> | void;
}

export type SentinelRefType = ((node: HTMLDivElement | null) => void) &
  React.RefObject<HTMLDivElement | null>;

export interface UseInfiniteScrollResult<T> {
  visibleItems: T[];
  visibleCount: number;
  totalItems: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: SentinelRefType;
  loadMore: () => void;
}

function isElementNearViewport(
  el: HTMLDivElement | null,
  rootEl: HTMLElement | null,
  margin = 300
): boolean {
  if (!el || typeof window === 'undefined') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  if (rootEl) {
    const rootRect = rootEl.getBoundingClientRect();
    return rect.top <= rootRect.bottom + margin && rect.bottom >= rootRect.top - margin;
  }

  const viewportHeight =
    window.innerHeight || document.documentElement?.clientHeight || 800;
  return rect.top <= viewportHeight + margin;
}

/**
 * Instagram-style progressive infinite scroll hook.
 * Renders a small initial batch and automatically loads additional batches as the user scrolls near the bottom.
 * Works seamlessly across both dedicated scroll containers (Explore Feed) and window-scrolled tabbed Dashboards.
 */
export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollResult<T> {
  const {
    initialBatchSize = 3,
    batchSize = 3,
    scrollRootRef,
    resetKey,
    hasMoreServerData = false,
    onLoadMoreServerData,
  } = options;

  const [visibleCount, setVisibleCount] = useState<number>(initialBatchSize);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [serverExhausted, setServerExhausted] = useState<boolean>(false);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
  const loadingLockRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Hybrid callback + object ref so mounting/switching tabs in dashboards immediately triggers observation
  const sentinelRef = useMemo<SentinelRefType>(() => {
    const fn = (node: HTMLDivElement | null) => {
      sentinelNodeRef.current = node;
      setSentinelEl(node);
    };
    Object.defineProperty(fn, 'current', {
      get: () => sentinelNodeRef.current,
      set: (node: HTMLDivElement | null) => {
        sentinelNodeRef.current = node;
        setSentinelEl(node);
      },
      configurable: true,
    });
    return fn as unknown as SentinelRefType;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset visible batch when filter/search/tab key changes
  useEffect(() => {
    setVisibleCount(initialBatchSize);
    setIsLoadingMore(false);
    setServerExhausted(false);
    loadingLockRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [resetKey, initialBatchSize]);

  // If new server data Flag turns false externally, sync serverExhausted
  useEffect(() => {
    if (!hasMoreServerData) {
      setServerExhausted(false);
    }
  }, [hasMoreServerData]);

  const hasLocalMore = visibleCount < items.length;
  const effectiveServerMore = Boolean(hasMoreServerData) && !serverExhausted;
  const hasMore = hasLocalMore || effectiveServerMore;

  // Keep latest values in a ref so loadMore never suffers from stale closures or mid-flight timer cancellations
  const latestRef = useRef({
    hasMore,
    hasLocalMore,
    effectiveServerMore,
    visibleCount,
    batchSize,
    itemsLength: items.length,
    onLoadMoreServerData,
  });
  latestRef.current = {
    hasMore,
    hasLocalMore,
    effectiveServerMore,
    visibleCount,
    batchSize,
    itemsLength: items.length,
    onLoadMoreServerData,
  };

  const loadMore = useCallback(() => {
    const state = latestRef.current;
    if (loadingLockRef.current || !state.hasMore) return;

    loadingLockRef.current = true;
    setIsLoadingMore(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const current = latestRef.current;
        const prevLen = current.itemsLength;

        if (
          current.visibleCount + current.batchSize >= current.itemsLength &&
          current.effectiveServerMore &&
          current.onLoadMoreServerData
        ) {
          const result = await current.onLoadMoreServerData();
          if (result === false && mountedRef.current) {
            setServerExhausted(true);
          }
        }

        if (mountedRef.current) {
          setVisibleCount((prev) => {
            const targetLen = Math.max(latestRef.current.itemsLength, prevLen);
            return Math.min(prev + latestRef.current.batchSize, targetLen + latestRef.current.batchSize);
          });
        }
      } catch (err) {
        console.warn('[Setlla InfiniteScroll] Batch load error:', err);
        if (mountedRef.current) {
          setServerExhausted(true);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoadingMore(false);
        }
        loadingLockRef.current = false;
        timerRef.current = null;
      }
    }, 180);
  }, []);

  // Observe sentinel via IntersectionObserver + scroll/resize listeners + immediate viewport check on mount/tab switch
  useEffect(() => {
    if (!sentinelEl || !hasMore) return;

    const rootElement = scrollRootRef?.current || null;

    const checkAndTrigger = () => {
      if (!loadingLockRef.current && latestRef.current.hasMore) {
        if (isElementNearViewport(sentinelEl, scrollRootRef?.current || null, 300)) {
          loadMore();
        }
      }
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first && first.isIntersecting && !loadingLockRef.current) {
            loadMore();
          }
        },
        {
          root: rootElement,
          rootMargin: '300px 0px',
          threshold: 0,
        }
      );
      observer.observe(sentinelEl);
    }

    // Attach passive scroll & resize listeners on both window and scrollRoot (if provided)
    window.addEventListener('scroll', checkAndTrigger, { passive: true });
    window.addEventListener('resize', checkAndTrigger, { passive: true });
    window.addEventListener('touchmove', checkAndTrigger, { passive: true });
    if (rootElement) {
      rootElement.addEventListener('scroll', checkAndTrigger, { passive: true });
    }

    // Immediate check on mount / tab change / after batch expansion in case sentinel is already visible
    const rafId = window.requestAnimationFrame(checkAndTrigger);
    const followupTimer = setTimeout(checkAndTrigger, 220);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', checkAndTrigger);
      window.removeEventListener('resize', checkAndTrigger);
      window.removeEventListener('touchmove', checkAndTrigger);
      if (rootElement) {
        rootElement.removeEventListener('scroll', checkAndTrigger);
      }
      window.cancelAnimationFrame(rafId);
      clearTimeout(followupTimer);
    };
  }, [sentinelEl, hasMore, visibleCount, items.length, resetKey, loadMore, scrollRootRef]);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  return {
    visibleItems,
    visibleCount: Math.min(visibleCount, items.length),
    totalItems: items.length,
    hasMore,
    isLoadingMore,
    sentinelRef,
    loadMore,
  };
}

export interface InfiniteScrollSentinelProps {
  sentinelRef: SentinelRefType | React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalItems: number;
  minItemsForCaughtUp?: number;
  caughtUpText?: string;
  className?: string;
}

/**
 * Instagram-style scroll sentinel & subtle bottom spinner.
 * Automatically triggers the next batch when scrolled into view without page numbers.
 */
export const InfiniteScrollSentinel: React.FC<InfiniteScrollSentinelProps> = ({
  sentinelRef,
  hasMore,
  isLoadingMore,
  totalItems,
  minItemsForCaughtUp = 3,
  caughtUpText = "You're all caught up",
  className = '',
}) => {
  if (totalItems === 0) return null;

  return (
    <div
      ref={sentinelRef as React.Ref<HTMLDivElement>}
      className={`w-full py-4 flex flex-col items-center justify-center select-none ${className}`}
      aria-live="polite"
    >
      {hasMore || isLoadingMore ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <div
            className="w-5 h-5 rounded-full border-2 border-[#EDDAA6] border-t-[#342A21] border-r-[#FFAD05] animate-spin"
            role="status"
            aria-label="Loading more"
          />
        </div>
      ) : totalItems >= minItemsForCaughtUp ? (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#70798C]/80 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#C68400]/80 shrink-0" />
          <span>{caughtUpText}</span>
        </div>
      ) : null}
    </div>
  );
};
