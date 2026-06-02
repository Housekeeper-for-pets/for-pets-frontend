import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteReview,
  getMyReceivedReviews,
  getMyWrittenReviews,
} from '../api';
import type {
  Id,
  MyReceivedReview,
  MyReceivedReviewPageResponse,
  MyWrittenReview,
  MyWrittenReviewPageResponse,
} from '../types';

type ReviewTab = 'written' | 'received';

const pageSize = 10;

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const renderStars = (rating: number) => '★'.repeat(rating).padEnd(5, '☆');

const emptyWrittenPage: MyWrittenReviewPageResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  size: pageSize,
};

const emptyReceivedPage: MyReceivedReviewPageResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  size: pageSize,
};

function MyReviewsPage() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('written');
  const [writtenPage, setWrittenPage] =
    useState<MyWrittenReviewPageResponse>(emptyWrittenPage);
  const [receivedPage, setReceivedPage] =
    useState<MyReceivedReviewPageResponse>(emptyReceivedPage);
  const [writtenPageIndex, setWrittenPageIndex] = useState(0);
  const [receivedPageIndex, setReceivedPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<Id | null>(null);

  const isWrittenTab = activeTab === 'written';
  const currentPage = isWrittenTab ? writtenPage : receivedPage;
  const currentPageIndex = isWrittenTab ? writtenPageIndex : receivedPageIndex;

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      setMessage('');

      const query = {
        page: currentPageIndex,
        size: pageSize,
        sort: 'createdAt',
        direction: 'desc' as const,
      };
      if (isWrittenTab) {
        const result = await getMyWrittenReviews(query);

        if (result.success) {
          setWrittenPage(result.data);
        } else {
          setMessage(result.error.message);
        }
      } else {
        const result = await getMyReceivedReviews(query);

        if (result.success) {
          setReceivedPage(result.data);
        } else {
          setMessage(result.error.message);
        }
      }

      setIsLoading(false);
    };

    void fetchReviews();
  }, [isWrittenTab, currentPageIndex]);

  const handleDelete = async (reviewId: Id) => {
    if (!window.confirm('작성한 후기를 삭제할까요?')) return;

    setDeletingReviewId(reviewId);
    setMessage('');

    const result = await deleteReview(reviewId);

    if (result.success) {
      setWrittenPage((prevPage) => ({
        ...prevPage,
        content: prevPage.content.filter((review) => review.id !== reviewId),
        totalElements: Math.max(prevPage.totalElements - 1, 0),
      }));
      setMessage('후기를 삭제했습니다.');
    } else {
      setMessage(result.error.message);
    }

    setDeletingReviewId(null);
  };

  const changePage = (direction: 'prev' | 'next') => {
    const totalPages = currentPage.totalPages;
    const nextPage =
      direction === 'prev'
        ? Math.max(currentPageIndex - 1, 0)
        : Math.min(currentPageIndex + 1, Math.max(totalPages - 1, 0));

    if (nextPage === currentPageIndex) return;

    if (isWrittenTab) {
      setWrittenPageIndex(nextPage);
    } else {
      setReceivedPageIndex(nextPage);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="fp-kicker">MY REVIEWS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2A2622]">
            내 후기
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7D7368]">
            내가 남긴 후기와 시터 활동으로 받은 후기를 한 곳에서 확인합니다.
          </p>
        </div>
        <Link
          to="/reservations"
          className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2.5 text-sm font-black text-[#2A2622] shadow-sm"
        >
          예약 관리
        </Link>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { value: 'written', label: '내가 쓴 후기', count: writtenPage.totalElements },
          { value: 'received', label: '내가 받은 후기', count: receivedPage.totalElements },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={[
              'rounded-full px-4 py-2 text-sm font-black transition',
              activeTab === tab.value
                ? 'bg-[#D96F4F] text-white'
                : 'border border-[#E7DCD1] bg-white text-[#6F675F]',
            ].join(' ')}
            onClick={() => setActiveTab(tab.value as ReviewTab)}
          >
            {tab.label} {tab.count.toLocaleString('ko-KR')}
          </button>
        ))}
      </div>

      {message && (
        <div className="mt-5 rounded-2xl border border-[#F0D2C5] bg-[#FFF6F1] px-4 py-3 text-sm font-bold text-[#B85B3D]">
          {message}
        </div>
      )}

      <section className="mt-5">
        {isLoading ? (
          <div className="fp-shell-card rounded-2xl p-6 text-sm font-bold text-[#7D7368]">
            후기 목록을 불러오는 중입니다.
          </div>
        ) : currentPage.content.length === 0 ? (
          <EmptyReviewState activeTab={activeTab} />
        ) : isWrittenTab ? (
          <WrittenReviewList
            reviews={writtenPage.content}
            deletingReviewId={deletingReviewId}
            onDelete={handleDelete}
          />
        ) : (
          <ReceivedReviewList reviews={receivedPage.content} />
        )}
      </section>

      {!isLoading && currentPage.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2 text-sm font-black text-[#2A2622] disabled:cursor-not-allowed disabled:text-[#B7AA9D]"
            disabled={currentPageIndex <= 0}
            onClick={() => changePage('prev')}
          >
            이전
          </button>
          <span className="text-sm font-black text-[#6F675F]">
            {currentPage.currentPage + 1}/{currentPage.totalPages}
          </span>
          <button
            type="button"
            className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2 text-sm font-black text-[#2A2622] disabled:cursor-not-allowed disabled:text-[#B7AA9D]"
            disabled={currentPageIndex >= currentPage.totalPages - 1}
            onClick={() => changePage('next')}
          >
            다음
          </button>
        </div>
      )}
    </main>
  );
}

function EmptyReviewState({ activeTab }: { activeTab: ReviewTab }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E3D6C8] bg-[#FFFCF8] p-8 text-center">
      <p className="text-sm font-black text-[#2A2622]">
        {activeTab === 'written'
          ? '아직 작성한 후기가 없습니다.'
          : '아직 받은 후기가 없습니다.'}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#7D7368]">
        {activeTab === 'written'
          ? '케어가 완료된 예약에서 후기를 남기면 이곳에 표시됩니다.'
          : '시터 활동 후 보호자가 후기를 남기면 이곳에 표시됩니다.'}
      </p>
    </div>
  );
}

function WrittenReviewList({
  reviews,
  deletingReviewId,
  onDelete,
}: {
  reviews: MyWrittenReview[];
  deletingReviewId: Id | null;
  onDelete: (reviewId: Id) => Promise<void>;
}) {
  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-[#EFE5DA] bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black text-[#D96F4F]">
                {formatDateTime(review.createdAt)}
              </p>
              <h2 className="mt-2 text-xl font-black text-[#2A2622]">
                {review.revieweeNickname} 시터에게 남긴 후기
              </h2>
              <p className="mt-2 text-lg font-black text-[#E5A13C]">
                {renderStars(review.rating)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/sitters/${review.sitterProfileId}`}
                className="rounded-xl border border-[#E7DCD1] bg-white px-3 py-2 text-xs font-black text-[#2A2622]"
              >
                시터 보기
              </Link>
              <Link
                to={`/reservations/${review.reservationId}`}
                className="rounded-xl border border-[#E7DCD1] bg-white px-3 py-2 text-xs font-black text-[#2A2622]"
              >
                예약 보기
              </Link>
              <button
                type="button"
                disabled={deletingReviewId === review.id}
                className="rounded-xl bg-[#2A2622] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
                onClick={() => void onDelete(review.id)}
              >
                {deletingReviewId === review.id ? '삭제 중' : '삭제'}
              </button>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-[#FFFCF8] p-4 text-sm font-semibold leading-7 text-[#5E544B]">
            {review.reviewComment}
          </p>
        </article>
      ))}
    </div>
  );
}

function ReceivedReviewList({ reviews }: { reviews: MyReceivedReview[] }) {
  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-[#EFE5DA] bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black text-[#D96F4F]">
                {formatDateTime(review.createdAt)}
              </p>
              <h2 className="mt-2 text-xl font-black text-[#2A2622]">
                {review.reviewerNickname} 보호자가 남긴 후기
              </h2>
              <p className="mt-2 text-lg font-black text-[#E5A13C]">
                {renderStars(review.rating)}
              </p>
            </div>
            <Link
              to={`/reservations/${review.reservationId}`}
              className="w-fit rounded-xl border border-[#E7DCD1] bg-white px-3 py-2 text-xs font-black text-[#2A2622]"
            >
              예약 보기
            </Link>
          </div>

          <p className="mt-4 rounded-2xl bg-[#FFFCF8] p-4 text-sm font-semibold leading-7 text-[#5E544B]">
            {review.reviewComment}
          </p>
        </article>
      ))}
    </div>
  );
}

export default MyReviewsPage;
