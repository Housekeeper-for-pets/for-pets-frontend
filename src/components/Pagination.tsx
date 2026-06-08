interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  windowSize?: number;
}

// 표시할 페이지 번호 범위를 계산합니다.
const buildPageWindow = (
  currentPage: number,
  totalPages: number,
  windowSize: number,
) => {
  if (totalPages <= windowSize) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, currentPage - half);
  const end = Math.min(totalPages, start + windowSize);
  start = Math.max(0, end - windowSize);

  return Array.from({ length: end - start }, (_, index) => start + index);
};

// 1 2 3 ... 형식의 페이지 선택 UI입니다.
function Pagination({
  currentPage,
  totalPages,
  onChange,
  windowSize = 5,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageWindow(currentPage, totalPages, windowSize);
  const showLeftEllipsis = pages[0] > 0;
  const showRightEllipsis = pages[pages.length - 1] < totalPages - 1;
  const prevDisabled = currentPage <= 0;
  const nextDisabled = currentPage >= totalPages - 1;

  const buttonClass =
    'min-w-9 rounded-full border border-[#E7DCD1] bg-white px-3 py-2 text-sm font-bold text-[#6F675F] transition hover:border-[#E26B4A] hover:text-[#E26B4A] disabled:cursor-not-allowed disabled:border-[#F0E7DC] disabled:text-[#C2B8AD]';
  const activeClass =
    'min-w-9 rounded-full bg-[#2A2622] px-3 py-2 text-sm font-bold text-white';

  return (
    <nav
      aria-label="페이지 이동"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        className={buttonClass}
        disabled={prevDisabled}
        onClick={() => onChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {showLeftEllipsis && (
        <>
          <button
            type="button"
            className={buttonClass}
            onClick={() => onChange(0)}
          >
            1
          </button>
          <span className="px-1 text-sm font-bold text-[#9B8E82]">…</span>
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={page === currentPage ? activeClass : buttonClass}
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => onChange(page)}
        >
          {page + 1}
        </button>
      ))}

      {showRightEllipsis && (
        <>
          <span className="px-1 text-sm font-bold text-[#9B8E82]">…</span>
          <button
            type="button"
            className={buttonClass}
            onClick={() => onChange(totalPages - 1)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className={buttonClass}
        disabled={nextDisabled}
        onClick={() => onChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}

export default Pagination;
