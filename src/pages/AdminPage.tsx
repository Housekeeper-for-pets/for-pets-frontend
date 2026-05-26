import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  approveAdminReservationCancel,
  approveAdminSitter,
  getAdminReservationCancelRequests,
  getPendingAdminSitters,
  rejectAdminReservationCancel,
  rejectAdminSitter,
} from '../api';
import {
  careTypeLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  reservationStatusLabels,
  sitterApprovalStatusLabels,
} from '../constants/options';
import type { AdminSitterProfile, Reservation } from '../types';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

function AdminPage() {
  const [sitters, setSitters] = useState<AdminSitterProfile[]>([]);
  const [cancelRequests, setCancelRequests] = useState<Reservation[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAdminData = async () => {
    setErrorMessage('');

    try {
      const [sitterResult, reservationResult] = await Promise.all([
        getPendingAdminSitters(),
        getAdminReservationCancelRequests(),
      ]);

      if (sitterResult.success) {
        setSitters(sitterResult.data);
      } else {
        setErrorMessage(sitterResult.error.message);
      }

      if (reservationResult.success) {
        setCancelRequests(reservationResult.data);
      } else {
        setErrorMessage(reservationResult.error.message);
      }
    } catch {
      setErrorMessage('관리자 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
  }, []);

  const handleApproveSitter = async (sitterId: number) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await approveAdminSitter(sitterId);

      if (result.success) {
        setSuccessMessage(`시터 프로필 #${result.data.id} 승인 완료`);
        await fetchAdminData();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 승인 중 문제가 발생했습니다.');
    }
  };

  const handleRejectSitter = async (
    event: FormEvent<HTMLFormElement>,
    sitterId: number,
  ) => {
    event.preventDefault();
    const rejectReason = rejectReasons[sitterId]?.trim() ?? '';

    if (rejectReason.length < 10) {
      setErrorMessage('거절 사유는 10자 이상 입력해 주세요.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await rejectAdminSitter(sitterId, { rejectReason });

      if (result.success) {
        setSuccessMessage(`시터 프로필 #${result.data.id} 거절 완료`);
        setRejectReasons((prevReasons) => ({ ...prevReasons, [sitterId]: '' }));
        await fetchAdminData();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 거절 중 문제가 발생했습니다.');
    }
  };

  const handleCancelDecision = async (
    reservationId: number,
    action: 'approve' | 'reject',
  ) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result =
        action === 'approve'
          ? await approveAdminReservationCancel(reservationId)
          : await rejectAdminReservationCancel(reservationId);

      if (result.success) {
        setSuccessMessage(
          action === 'approve'
            ? `예약 #${reservationId} 취소를 승인했습니다.`
            : `예약 #${reservationId} 취소를 거절했습니다.`,
        );
        await fetchAdminData();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('예약 취소 요청 처리 중 문제가 발생했습니다.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">ADMIN</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">관리자 콘솔</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            시터 프로필 승인과 불가피한 예약 취소 요청을 처리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAdminData()}
          className="w-fit rounded-full bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
        >
          새로고침
        </button>
      </section>

      {(errorMessage || successMessage) && (
        <p
          className={[
            'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
            errorMessage ? 'bg-[#FFF0EA] text-[#B44727]' : 'bg-[#EEF7EA] text-[#3F5732]',
          ].join(' ')}
        >
          {errorMessage || successMessage}
        </p>
      )}

      {isLoading && (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          관리자 데이터를 불러오는 중입니다.
        </p>
      )}

      {!isLoading && (
        <section className="mt-6 grid gap-6">
          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">SITTER APPROVAL</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  승인 대기 시터
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#6F675F]">{sitters.length}건</p>
            </div>

            <div className="mt-5 grid gap-4">
              {sitters.length === 0 && (
                <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                  승인 대기 시터가 없습니다.
                </p>
              )}

              {sitters.map((sitter) => (
                <div
                  key={sitter.id}
                  className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <p className="text-xs font-bold text-[#E26B4A]">
                        #{sitter.id} · 회원 #{sitter.memberId} · {getRegionLabel(sitter.region)}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-[#2A2622]">
                        {sitter.experienceYears}년 경력 · {sitter.pricePerHour.toLocaleString()}원
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                        {sitter.introduction || '소개글 없음'}
                      </p>
                    </div>
                    <span className="h-fit rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                      {sitterApprovalStatusLabels[sitter.approvalStatus]}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#FAF6F1] p-4">
                      <dt className="text-xs font-bold text-[#9B8E82]">동물</dt>
                      <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                        {possiblePetTypeLabels[sitter.possiblePetType]}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-[#FAF6F1] p-4">
                      <dt className="text-xs font-bold text-[#9B8E82]">크기</dt>
                      <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                        {possiblePetSizeLabels[sitter.possiblePetSize]}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[auto_1fr]">
                    <button
                      type="button"
                      onClick={() => void handleApproveSitter(sitter.id)}
                      className="rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
                    >
                      승인
                    </button>
                    <form
                      className="grid gap-3 md:grid-cols-[1fr_auto]"
                      onSubmit={(event) => void handleRejectSitter(event, sitter.id)}
                    >
                      <input
                        className={inputClassName}
                        placeholder="거절 사유 10자 이상"
                        value={rejectReasons[sitter.id] ?? ''}
                        onChange={(event) =>
                          setRejectReasons((prevReasons) => ({
                            ...prevReasons,
                            [sitter.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="submit"
                        className="rounded-2xl border border-[#E7DCD1] px-5 py-3 text-sm font-bold text-[#B44727]"
                      >
                        거절
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">CANCEL REQUESTS</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  불가피한 취소 요청
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#6F675F]">
                {cancelRequests.length}건
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              {cancelRequests.length === 0 && (
                <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                  처리할 취소 요청이 없습니다.
                </p>
              )}

              {cancelRequests.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-5"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <p className="text-xs font-bold text-[#E26B4A]">
                        예약 #{reservation.id} · {careTypeLabels[reservation.careType]}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-[#2A2622]">
                        {reservationStatusLabels[reservation.status]}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                        {reservation.cancelReason || '취소 사유 없음'}
                      </p>
                    </div>
                    <div className="flex h-fit gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCancelDecision(reservation.id, 'approve')}
                        className="rounded-full bg-[#E26B4A] px-4 py-2 text-xs font-bold text-white"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancelDecision(reservation.id, 'reject')}
                        className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

export default AdminPage;
