import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteReview, getMyWrittenReviews } from '../api';
import type { Id, MyWrittenReview } from '../types';

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const renderStars = (rating: number) => '★'.repeat(rating).padEnd(5, '☆');

function MyReviewsPage() {
  const [reviews, setReviews] = useState<MyWrittenReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<Id | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const result = await getMyWrittenReviews();

      if (result.success) {
        setReviews(result.data);
      } else {
        setMessage(result.error.message);
      }

      setIsLoading(false);
    };

    void fetchReviews();
  }, []);

  const handleDelete = async (reviewId: Id) => {
    if (!window.confirm('작성한 후기를 삭제할까요?')) return;

    setDeletingReviewId(reviewId);
    setMessage('');

    const result = await deleteReview(reviewId);

    if (result.success) {
      setReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== reviewId),
      );
      setMessage('후기를 삭제했습니다.');
    } else {
      setMessage(result.error.message);
    }

    setDeletingReviewId(null);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="fp-kicker">MY REVIEWS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2A2622]">
            내가 작성한 후기
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7D7368]">
            완료된 예약에 남긴 후기를 모아서 확인하고 관리합니다.
          </p>
        </div>
        <Link
          to="/reservations"
          className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2.5 text-sm font-black text-[#2A2622] shadow-sm"
        >
          예약 관리
        </Link>
      </section>

      {message && (
        <div className="mt-5 rounded-2xl border border-[#F0D2C5] bg-[#FFF6F1] px-4 py-3 text-sm font-bold text-[#B85B3D]">
          {message}
        </div>
      )}

      <section className="mt-6">
        {isLoading ? (
          <div className="fp-shell-card rounded-2xl p-6 text-sm font-bold text-[#7D7368]">
            후기 목록을 불러오는 중입니다.
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E3D6C8] bg-[#FFFCF8] p-8 text-center">
            <p className="text-sm font-black text-[#2A2622]">
              아직 작성한 후기가 없습니다.
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#7D7368]">
              케어가 완료된 예약에서 후기를 남기면 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
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
                      onClick={() => void handleDelete(review.id)}
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
        )}
      </section>
    </main>
  );
}

export default MyReviewsPage;
