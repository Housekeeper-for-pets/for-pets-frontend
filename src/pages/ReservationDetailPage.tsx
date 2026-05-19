import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  cancelReservation,
  completeReservation,
  confirmReservation,
  getReservation,
} from '../api';
import {
  cancelCategoryLabels,
  reservationStatusLabels,
} from '../constants/options';
import type {
  CancelCategory,
  CancelReservationRequest,
  ApiResponse,
  Reservation,
  ReservationStatus,
} from '../types';

const initialCancelForm: CancelReservationRequest = {
  cancelReason: '',
  cancelCategory: 'PERSONAL',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 예약 상세 정보와 확정/완료/취소 액션을 제공하는 페이지입니다.
function ReservationDetailPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cancelForm, setCancelForm] =
    useState<CancelReservationRequest>(initialCancelForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const updateReservationStatus = (status: ReservationStatus) => {
    setReservation((prevReservation) =>
      prevReservation ? { ...prevReservation, status } : prevReservation,
    );
  };

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        setErrorMessage('예약 ID가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getReservation(Number(reservationId));

        if (result.success) {
          setReservation(result.data);
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('예약 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchReservation();
  }, [reservationId]);

  const runReservationAction = async <T extends { status: ReservationStatus }>(
    action: () => Promise<ApiResponse<T>>,
    successMessage: string,
  ) => {
    setErrorMessage('');
    setActionMessage('');
    setIsUpdating(true);

    try {
      const result = await action();

      if (result.success && result.data) {
        updateReservationStatus(result.data.status);
        setActionMessage(successMessage);
        return;
      }

      setErrorMessage(result.error?.message ?? '예약 상태 변경에 실패했습니다.');
    } catch {
      setErrorMessage('예약 상태 변경 중 문제가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirm = () => {
    if (!reservation) return;
    void runReservationAction(
      () => confirmReservation(reservation.id),
      '예약이 확정되었습니다.',
    );
  };

  const handleComplete = () => {
    if (!reservation) return;
    void runReservationAction(
      () => completeReservation(reservation.id),
      '케어 완료 처리되었습니다.',
    );
  };

  const handleCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reservation) return;

    if (cancelForm.cancelReason.trim().length < 10) {
      setErrorMessage('취소 사유는 10자 이상 입력해 주세요.');
      return;
    }

    await runReservationAction(
      () => cancelReservation(reservation.id, cancelForm),
      '예약이 취소되었습니다.',
    );
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          예약 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage && !reservation) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">RESERVATION</p>
              <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
                예약 #{reservation.id}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                보호자 {reservation.guardianId} · 시터 프로필{' '}
                {reservation.sitterProfileId}
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
              {reservationStatusLabels[reservation.status]}
            </span>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">결제 상태</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {reservation.guardianPaid && reservation.sitterPaid
                  ? '양측 완료'
                  : reservation.guardianPaid
                    ? '시터 대기'
                    : reservation.sitterPaid
                      ? '보호자 대기'
                      : '결제 대기'}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">반려동물</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {reservation.pets.length}마리
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">시간 슬롯</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {reservation.timeSlots.length}개
              </dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">ACTIONS</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">상태 변경</h2>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={isUpdating || reservation.status !== 'PENDING'}
              onClick={handleConfirm}
              className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              예약 확정
            </button>
            <button
              type="button"
              disabled={isUpdating || reservation.status !== 'CONFIRMED'}
              onClick={handleComplete}
              className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
            >
              케어 완료
            </button>
          </div>

          <form className="mt-6 space-y-3" onSubmit={handleCancel}>
            <label className="block" htmlFor="cancelCategory">
              <span className="text-sm font-bold text-[#2A2622]">취소 분류</span>
              <select
                id="cancelCategory"
                className={`mt-2 ${inputClassName}`}
                value={cancelForm.cancelCategory}
                onChange={(event) =>
                  setCancelForm((prevForm) => ({
                    ...prevForm,
                    cancelCategory: event.target.value as CancelCategory,
                  }))
                }
              >
                {Object.entries(cancelCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block" htmlFor="cancelReason">
              <span className="text-sm font-bold text-[#2A2622]">취소 사유</span>
              <textarea
                id="cancelReason"
                className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
                placeholder="취소 사유를 10자 이상 입력하세요."
                value={cancelForm.cancelReason}
                onChange={(event) =>
                  setCancelForm((prevForm) => ({
                    ...prevForm,
                    cancelReason: event.target.value,
                  }))
                }
              />
            </label>

            <button
              type="submit"
              disabled={
                isUpdating ||
                !['PENDING', 'CONFIRMED'].includes(reservation.status)
              }
              className="w-full rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
            >
              예약 취소
            </button>
          </form>
        </aside>
      </section>

      {(errorMessage || actionMessage) && (
        <p
          className={[
            'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
            errorMessage
              ? 'bg-[#FFF0EA] text-[#B44727]'
              : 'bg-[#EEF7EA] text-[#3F5732]',
          ].join(' ')}
        >
          {errorMessage || actionMessage}
        </p>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">PETS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                예약 반려동물
              </h2>
            </div>
            <Link
              to="/reservations"
              className="rounded-full border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
            >
              목록으로
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {reservation.pets.map((pet) => (
              <article
                key={`${pet.petId ?? pet.name}`}
                className="rounded-2xl bg-[#FAF6F1] p-4"
              >
                <h3 className="text-sm font-bold text-[#2A2622]">{pet.name}</h3>
                <p className="mt-1 text-xs text-[#6F675F]">
                  {[pet.breed, pet.age ? `${pet.age}살` : null, pet.size]
                    .filter(Boolean)
                    .join(' · ') || pet.species}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">TIME SLOTS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">예약 시간</h2>
            </div>
            <p className="text-sm font-semibold text-[#6F675F]">
              {reservation.timeSlots.length}개
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {reservation.timeSlots.map((timeSlot, index) => (
              <div
                key={`${timeSlot.careDate}-${timeSlot.startTime}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-[#FAF6F1] p-4"
              >
                <span className="text-sm font-bold text-[#2A2622]">
                  {timeSlot.careDate}
                </span>
                <span className="text-sm font-semibold text-[#6F675F]">
                  {timeSlot.startTime} - {timeSlot.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ReservationDetailPage;
