import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveAdminReservationCancel,
  getAdminReservationCancelRequests,
  rejectAdminReservationCancel,
} from '../api';
import {
  cancelCategoryLabels,
  careTypeLabels,
  reservationStatusLabels,
} from '../constants/options';
import type { Reservation } from '../types';

// 관리자 불가피한 취소 요청 승인/거절 페이지입니다.
function AdminCancellationsPage() {
  const [cancelRequests, setCancelRequests] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCancelRequests = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await getAdminReservationCancelRequests();

      if (result.success) {
        setCancelRequests(result.data.content);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('취소 요청 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCancelRequests();
  }, []);

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
        await fetchCancelRequests();
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
          <Link
            to="/admin"
            className="text-xs font-bold text-[#6F675F] hover:text-[#E26B4A]"
          >
            ← 관리자 콘솔로
          </Link>
          <p className="mt-3 text-sm font-bold text-[#E26B4A]">CANCEL REQUESTS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
            불가피한 취소 요청 승인
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            환불·정산이 필요한 취소 요청을 검토하고 승인 또는 거절합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchCancelRequests()}
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

      {isLoading ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          취소 요청을 불러오는 중입니다.
        </p>
      ) : cancelRequests.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          처리할 취소 요청이 없습니다.
        </p>
      ) : (
        <section className="mt-6 grid gap-4">
          {cancelRequests.map((reservation) => (
            <article
              key={reservation.id}
              className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold text-[#E26B4A]">
                    예약 #{reservation.id} · {careTypeLabels[reservation.careType]}
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-[#2A2622]">
                    {reservationStatusLabels[reservation.status]}
                  </h2>
                  <p className="mt-2 text-sm text-[#6F675F]">
                    보호자 {reservation.guardianId} · 시터 프로필{' '}
                    {reservation.sitterProfileId}
                  </p>
                  {reservation.cancelCategory && (
                    <p className="mt-2 text-xs font-bold text-[#8A8178]">
                      취소 분류:{' '}
                      {cancelCategoryLabels[reservation.cancelCategory]}
                    </p>
                  )}
                  <p className="mt-3 rounded-2xl bg-[#FAF6F1] p-3 text-sm leading-6 text-[#6F675F]">
                    {reservation.cancelReason || '취소 사유 없음'}
                  </p>
                </div>
                <div className="flex h-fit shrink-0 gap-2">
                  <Link
                    to={`/reservations/${reservation.id}`}
                    className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
                  >
                    예약 상세
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCancelDecision(reservation.id, 'approve')
                    }
                    className="rounded-full bg-[#E26B4A] px-4 py-2 text-xs font-bold text-white"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCancelDecision(reservation.id, 'reject')
                    }
                    className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
                  >
                    거절
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default AdminCancellationsPage;
