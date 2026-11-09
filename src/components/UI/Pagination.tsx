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

export interface UseInfiniteScrollResult<T> {
  visibleItems: T[];
  visibleCount: number;
  totalItems: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  loadMore: () => void;
}

/**
 * Instagram-style progressive infinite scroll hook.
 * Renders a small initial batch and automatically loads additional batches as the user scrolls near the bottom.
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingLockRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset visible batch when filter/search key changes
  useEffect(() => {
    setVisibleCount(initialBatchSize);
    setIsLoadingMore(false);
    loadingLockRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [resetKey, initialBatchSize]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const hasLocalMore = visibleCount < items.length;
  const hasMore = hasLocalMore || Boolean(hasMoreServerData);

  const loadMore = useCallback(() => {
    if (loadingLockRef.current || !hasMore) return;

    loadingLockRef.current = true;
    setIsLoadingMore(true);

    timerRef.current = setTimeout(async () => {
      try {
        if (visibleCount + batchSize >= items.length && hasMoreServerData && onLoadMoreServerData) {
          await onLoadMoreServerData();
        }
        setVisibleCount((prev) => Math.min(prev + batchSize, Math.max(items.length + batchSize, prev + batchSize)));
      } finally {
        setIsLoadingMore(false);
        loadingLockRef.current = false;
      }
    }, 280);
  }, [hasMore, visibleCount, batchSize, items.length, hasMoreServerData, onLoadMoreServerData]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const rootElement = scrollRootRef?.current || null;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && !loadingLockRef.current) {
          loadMore();
        }
      },
      {
        root: rootElement,
        rootMargin: '220px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, scrollRootRef, visibleCount, items.length]);

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
  sentinelRef: React.RefObject<HTMLDivElement | null>;
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
      ref={sentinelRef}
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
