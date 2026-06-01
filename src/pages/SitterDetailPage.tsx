import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createOrGetChatRoom,
  generateSitterReviewSummary,
  getSitterProfile,
  getSitterReviews,
  getSitterReviewSummary,
} from '../api';
import {
  dayOfWeekLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterApprovalStatusLabels,
  sitterStatusLabels,
} from '../constants/options';
import type { SitterProfile } from '../types';
import type { Review, SitterReviewSummary } from '../types';

const sentimentLabels = {
  POSITIVE: '긍정적',
  NEUTRAL: '중립',
  NEGATIVE: '주의 필요',
} as const;

const summaryStatusLabels = {
  FRESH: '최신 요약',
  STALE: '업데이트 권장',
  FAILED: '요약 실패',
} as const;

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

// 특정 시터의 프로필과 가능 시간을 보여주는 상세 페이지입니다.
function SitterDetailPage() {
  const navigate = useNavigate();
  const { sitterId } = useParams<{ sitterId: string }>();
  const [sitter, setSitter] = useState<SitterProfile | null>(null);
  const [reviewSummary, setReviewSummary] =
    useState<SitterReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState('createdAt:desc');
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  // URL의 시터 ID로 상세 정보를 조회합니다.
  useEffect(() => {
    const fetchSitter = async () => {
      if (!sitterId) {
        setErrorMessage('시터 ID가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const nextSitterId = Number(sitterId);
        const [sitterResult, reviewsResult, summaryResult] =
          await Promise.allSettled([
            getSitterProfile(nextSitterId),
            getSitterReviews(nextSitterId, {
              page: 0,
              size: 5,
              sort: 'createdAt',
              direction: 'desc',
            }),
            getSitterReviewSummary(nextSitterId),
          ]);

        if (sitterResult.status === 'fulfilled' && sitterResult.value.success) {
          setSitter(sitterResult.value.data);
        } else {
          setErrorMessage(
            sitterResult.status === 'fulfilled'
              ? sitterResult.value.error?.message ?? '시터 정보를 불러오지 못했습니다.'
              : '시터 정보를 불러오지 못했습니다.',
          );
        }

        if (reviewsResult.status === 'fulfilled' && reviewsResult.value.success) {
          setReviews(reviewsResult.value.data.content);
          setReviewTotalElements(reviewsResult.value.data.totalElements);
        }

        if (summaryResult.status === 'fulfilled' && summaryResult.value.success) {
          setReviewSummary(summaryResult.value.data);
        }
      } catch {
        setErrorMessage('시터 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSitter();
  }, [sitterId]);

  const fetchReviews = async (nextSort = reviewSort) => {
    if (!sitter) return;

    const [sort, direction] = nextSort.split(':');
    const result = await getSitterReviews(sitter.id, {
      page: 0,
      size: 5,
      sort,
      direction: direction as 'asc' | 'desc',
    });

    if (result.success) {
      setReviews(result.data.content);
      setReviewTotalElements(result.data.totalElements);
      return;
    }

    setReviewMessage(result.error.message);
  };

  const handleReviewSortChange = (nextSort: string) => {
    setReviewSort(nextSort);
    void fetchReviews(nextSort);
  };

  const handleGenerateSummary = async () => {
    if (!sitter) return;

    setReviewMessage('');
    setIsGeneratingSummary(true);

    try {
      const result = await generateSitterReviewSummary(sitter.id);

      if (result.success) {
        setReviewSummary(result.data);
        setReviewMessage('리뷰 요약을 갱신했습니다.');
        return;
      }

      setReviewMessage(result.error.message);
    } catch {
      setReviewMessage('리뷰 요약 생성 중 문제가 발생했습니다.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleOpenChat = async () => {
    if (!sitter) return;

    setErrorMessage('');
    setIsOpeningChat(true);

    try {
      const result = await createOrGetChatRoom({ opponentId: sitter.memberId });

      if (result.success) {
        navigate(`/chat?roomId=${result.data.chatRoomId}`, {
          state: {
            selectedRoom: {
              chatRoomId: result.data.chatRoomId,
              opponentId: result.data.opponentId,
              opponentNickname: result.data.opponentNickname,
              lastMessage: null,
              lastMessageType: null,
              lastMessageAt: null,
              unreadCount: 0,
            },
          },
        });
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('채팅방을 여는 중 문제가 발생했습니다.');
    } finally {
      setIsOpeningChat(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          시터 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage || !sitter) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage || '시터 정보를 찾을 수 없습니다.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">
                {getRegionLabel(sitter.region)}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
                {sitter.experienceYears}년 경력 펫시터
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                {sitter.introduction || '아직 자기소개가 등록되지 않았습니다.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {sitter.approvalStatus && (
                <span className="w-fit rounded-full bg-[#FFF0EA] px-3 py-1 text-xs font-bold text-[#B44727]">
                  {sitterApprovalStatusLabels[sitter.approvalStatus]}
                </span>
              )}
              <span className="w-fit rounded-full bg-[#EEF7EA] px-3 py-1 text-xs font-bold text-[#3F5732]">
                {sitterStatusLabels[sitter.status]}
              </span>
            </div>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">승인 상태</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {sitter.approvalStatus
                  ? sitterApprovalStatusLabels[sitter.approvalStatus]
                  : '확인 필요'}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">가능 동물</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {possiblePetTypeLabels[sitter.possiblePetType]}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">가능 크기</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {possiblePetSizeLabels[sitter.possiblePetSize]}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">시간당 요금</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {sitter.pricePerHour.toLocaleString()}원
              </dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">REQUEST</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">돌봄 요청</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            반려동물과 돌봄 시간을 선택해 이 시터에게 직접 요청할 수 있습니다.
          </p>
          <Link
            to={`/sitters/${sitter.id}/requests/new`}
            className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white"
          >
            요청 작성하기
          </Link>
          <button
            type="button"
            onClick={() => void handleOpenChat()}
            disabled={isOpeningChat}
            className="mt-3 inline-flex w-full justify-center rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#6F675F] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
          >
            {isOpeningChat ? '채팅방 여는 중...' : '채팅하기'}
          </button>
        </aside>
      </section>

      <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">SCHEDULE</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              가능한 시간
            </h2>
          </div>
          <p className="text-sm font-semibold text-[#6F675F]">
            {sitter.schedules.length}개
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sitter.schedules.length === 0 && (
            <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F] md:col-span-2">
              아직 등록된 가능 시간이 없습니다.
            </p>
          )}

          {sitter.schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-2xl bg-[#FAF6F1] p-4"
            >
              <span className="text-sm font-bold text-[#2A2622]">
                {dayOfWeekLabels[schedule.dayOfWeek]}
              </span>
              <span className="text-sm font-semibold text-[#6F675F]">
                {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">AI REVIEW</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                리뷰 요약
              </h2>
            </div>
            {reviewSummary && (
              <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                {summaryStatusLabels[reviewSummary.summaryStatus]}
              </span>
            )}
          </div>

          {reviewSummary ? (
            <div className="mt-5 space-y-5">
              <p className="text-sm leading-6 text-[#6F675F]">
                {reviewSummary.summary}
              </p>
              <dl className="grid gap-3">
                <div className="rounded-2xl bg-[#FAF6F1] p-4">
                  <dt className="text-xs font-bold text-[#9B8E82]">분위기</dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                    {sentimentLabels[reviewSummary.sentiment]} · 리뷰{' '}
                    {reviewSummary.reviewCount}개 기반
                  </dd>
                </div>
                {reviewSummary.strengths.length > 0 && (
                  <div className="rounded-2xl bg-[#EEF7EA] p-4">
                    <dt className="text-xs font-bold text-[#3F5732]">강점</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {reviewSummary.strengths.map((strength) => (
                        <span
                          key={strength}
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#3F5732]"
                        >
                          {strength}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {reviewSummary.cautions.length > 0 && (
                  <div className="rounded-2xl bg-[#FFF0EA] p-4">
                    <dt className="text-xs font-bold text-[#B44727]">확인할 점</dt>
                    <dd className="mt-2 space-y-1 text-xs font-semibold text-[#8A4A35]">
                      {reviewSummary.cautions.map((caution) => (
                        <p key={caution}>{caution}</p>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
              아직 생성된 리뷰 요약이 없습니다. 리뷰가 쌓이면 요약을 생성해 시터의
              강점과 주의할 점을 빠르게 확인할 수 있습니다.
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleGenerateSummary()}
            disabled={isGeneratingSummary}
            className="mt-5 w-full rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
          >
            {isGeneratingSummary ? '요약 생성 중' : 'AI 요약 갱신'}
          </button>
        </article>

        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">REVIEWS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                보호자 리뷰
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#6F675F]">
                총 {reviewTotalElements}개
              </p>
            </div>
            <select
              aria-label="리뷰 정렬"
              className="rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm font-semibold text-[#2A2622] outline-none"
              value={reviewSort}
              onChange={(event) => handleReviewSortChange(event.target.value)}
            >
              <option value="createdAt:desc">최신순</option>
              <option value="rating:desc">평점 높은순</option>
              <option value="rating:asc">평점 낮은순</option>
            </select>
          </div>

          {reviewMessage && (
            <p className="mt-4 rounded-2xl bg-[#EEF7EA] px-4 py-3 text-sm font-medium text-[#3F5732]">
              {reviewMessage}
            </p>
          )}

          <div className="mt-5 grid gap-3">
            {reviews.length === 0 && (
              <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F]">
                아직 등록된 리뷰가 없습니다.
              </p>
            )}

            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-[#FAF6F1] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#2A2622]">
                    {'★'.repeat(review.rating)}
                    <span className="text-[#D7C7B9]">
                      {'★'.repeat(5 - review.rating)}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-[#8A8178]">
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                  {review.reviewComment}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default SitterDetailPage;
