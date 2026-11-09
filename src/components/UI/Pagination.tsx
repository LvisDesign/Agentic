import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  hideOnSinglePage?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'listings',
  hideOnSinglePage = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;
  if (hideOnSinglePage && totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];

    if (safePage > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className={`w-full rounded-2xl bg-gradient-to-r from-[#FFFDF8] via-white to-[#FFF9EB] border border-[#EDDAA6]/80 px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Left: Item range & page indicator */}
      <div className="flex items-center gap-2 text-xs text-[#70798C] order-2 sm:order-1">
        <span>
          Showing <strong className="text-[#000004] font-bold">{startItem}</strong>
          {startItem !== endItem && (
            <>
              –<strong className="text-[#000004] font-bold">{endItem}</strong>
            </>
          )}{' '}
          of <strong className="text-[#000004] font-bold">{totalItems}</strong> {itemLabel}
        </span>
        <span className="text-[#D1D5DB]">&bull;</span>
        <span className="px-2 py-0.5 rounded-full bg-[#FFF8E6] border border-[#EDD595] text-[#342A21] font-bold text-[11px]">
          Page {safePage} of {totalPages}
        </span>
      </div>

      {/* Right: Page controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => safePage > 1 && onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
            safePage <= 1
              ? 'bg-[#FAF8F5] text-[#70798C]/45 border-[#E5E7EB] cursor-not-allowed'
              : 'bg-white hover:bg-[#FFF8E6] text-[#342A21] border-[#EDDAA6] hover:border-[#FFAD05] cursor-pointer active:scale-95 shadow-2xs'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageItem) => {
            if (pageItem === 'ellipsis-start' || pageItem === 'ellipsis-end') {
              return (
                <span
                  key={pageItem}
                  className="w-7 h-8 flex items-center justify-center text-xs font-bold text-[#70798C] select-none"
                >
                  &hellip;
                </span>
              );
            }

            const isActive = pageItem === safePage;
            return (
              <button
                key={pageItem}
                type="button"
                onClick={() => !isActive && onPageChange(pageItem)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${
                  isActive
                    ? 'bg-[#342A21] text-[#FFAD05] border-[#342A21] shadow-xs ring-2 ring-[#FFAD05]/25 cursor-default'
                    : 'bg-white hover:bg-[#FFF8E6] text-[#342A21] border-[#E5E7EB] hover:border-[#EDD595] cursor-pointer active:scale-95'
                }`}
              >
                {pageItem}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => safePage < totalPages && onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
            safePage >= totalPages
              ? 'bg-[#FAF8F5] text-[#70798C]/45 border-[#E5E7EB] cursor-not-allowed'
              : 'bg-white hover:bg-[#FFF8E6] text-[#342A21] border-[#EDDAA6] hover:border-[#FFAD05] cursor-pointer active:scale-95 shadow-2xs'
          }`}
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </nav>
  );
};
