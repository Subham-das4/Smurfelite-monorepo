'use client';

import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BASE_PAGE_BTN =
  'px-4 py-2 rounded-lg border text-sm transition-colors bg-surface-light dark:bg-surface-dark';
const ACTIVE_PAGE_BTN = `${BASE_PAGE_BTN} bg-primary! text-white border-primary font-medium`;
const INACTIVE_PAGE_BTN = `${BASE_PAGE_BTN} border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary cursor-pointer`;
const NAV_BTN =
  'p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary hover:border-primary bg-surface-light dark:bg-surface-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={NAV_BTN}
        aria-label="Previous page"
      >
        <MdChevronLeft className="text-xl" />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="text-gray-400 px-2 select-none">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? ACTIVE_PAGE_BTN : INACTIVE_PAGE_BTN}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={NAV_BTN}
        aria-label="Next page"
      >
        <MdChevronRight className="text-xl" />
      </button>
    </nav>
  );
};
