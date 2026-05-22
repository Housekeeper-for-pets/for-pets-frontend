import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import * as PortOne from '@portone/browser-sdk/v2';
import { Link, useParams } from 'react-router-dom';
import {
  cancelReservation,
  completeReservation,
  confirmPayment,
  confirmReservation,
  createPayment,
  getMyInfo,
  getReservation,
} from '../api';
import { hasPortOneConfig, portOneConfig } from '../api/portOneConfig';
import {
  cancelCategoryLabels,
  careTypeLabels,
  reservationStatusLabels,
} from '../constants/options';
import type {
  CancelCategory,
  CancelReservationRequest,
  ApiResponse,
  Member,
  PaymentRole,
  Reservation,
} from '../types';

const initialCancelForm: CancelReservationRequest = {
  cancelReason: '',
  cancelCategory: 'PERSONAL',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const getPaymentLabel = (reservation: Reservation) => {
  if (reservation.guardianPaid && reservation.sitterPaid) {
    return '양측 결제 완료';
  }

  if (reservation.guardianPaid) {
    return '시터 결제 대기';
  }

  if (reservation.sitterPaid) {
    return '보호자 결제 대기';
  }

  return '양측 결제 대기';
};

const paymentRoleLabels: Record<PaymentRole, string> = {
  GUARDIAN: '보호자',
  SITTER: '시터',
};

const getPayableRoles = (
  reservation: Reservation,
  currentMember: Member | null,
): PaymentRole[] => {
  if (!currentMember || reservation.status !== 'PENDING') {
    return [];
  }

  const roles: PaymentRole[] = [];

  if (currentMember.id === reservation.guardianId && !reservation.guardianPaid) {
    roles.push('GUARDIAN');
  }

  if (currentMember.id === reservation.sitterMemberId && !reservation.sitterPaid) {
    roles.push('SITTER');
  }

  return roles;
};

const getPaymentErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return '결제 처리 중 문제가 발생했습니다.';
};

const getCreatePaymentFailureMessage = (message: string, code?: string) => {
  if (code === 'DUPLICATE_PAYMENT_REQUEST') {
    return [
      message,
      '이전 결제창 호출이 실패했어도 서버에는 READY 결제가 남아 있을 수 있습니다.',
      '현재 백엔드는 READY 결제 취소/재사용 API가 없어 테스트 DB에서 해당 payments 행을 CANCELED 처리하거나 새 예약으로 다시 테스트해야 합니다.',
    ].join(' ');
  }

  return message;
};

// 예약 상세 정보와 확정/완료/취소 액션을 제공하는 페이지입니다.
function ReservationDetailPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [cancelForm, setCancelForm] =
    useState<CancelReservationRequest>(initialCancelForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [payingRole, setPayingRole] = useState<PaymentRole | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        setErrorMessage('예약 ID가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const [reservationResult, memberResult] = await Promise.all([
          getReservation(Number(reservationId)),
          getMyInfo(),
        ]);

        if (memberResult.success) {
          setCurrentMember(memberResult.data);
        }

        if (reservationResult.success) {
          setReservation(reservationResult.data);
          return;
        }

        setErrorMessage(reservationResult.error.message);
      } catch {
        setErrorMessage('예약 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchReservation();
  }, [reservationId]);

  const runReservationAction = async (
    action: () => Promise<ApiResponse<Reservation>>,
    successMessage: string,
  ) => {
    setErrorMessage('');
    setActionMessage('');
    setIsUpdating(true);

    try {
      const result = await action();

      if (result.success && result.data) {
        setReservation(result.data);
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

  const handlePayment = async (paymentRole: PaymentRole) => {
    if (!reservation) return;

    if (!hasPortOneConfig) {
      setErrorMessage('PortOne 결제 설정이 없습니다.');
      return;
    }

    if (!currentMember?.email) {
      setErrorMessage('이니시스 결제에 필요한 회원 이메일이 없습니다.');
      return;
    }

    setErrorMessage('');
    setActionMessage('');
    setPayingRole(paymentRole);

    try {
      const paymentResult = await createPayment({
        reservationId: reservation.id,
        paymentRole,
      });

      if (!paymentResult.success) {
        setErrorMessage(
          getCreatePaymentFailureMessage(
            paymentResult.error.message,
            paymentResult.error.code,
          ),
        );
        return;
      }

      const payment = paymentResult.data;
      setActionMessage(
        `${payment.finalAmount.toLocaleString()}원 결제창을 여는 중입니다.`,
      );
      const portOneResponse = await PortOne.requestPayment({
        storeId: portOneConfig.storeId,
        channelKey: portOneConfig.channelKey,
        paymentId: payment.merchantUid,
        orderName: `포펫 예약 #${reservation.id} ${paymentRoleLabels[paymentRole]} 결제`,
        totalAmount: payment.finalAmount,
        currency: 'KRW',
        payMethod: 'CARD',
        windowType: {
          pc: 'POPUP',
          mobile: 'REDIRECTION',
        },
        redirectUrl: window.location.href,
        customer: {
          customerId: String(currentMember.id),
          fullName: currentMember.nickname,
          email: currentMember.email,
          phoneNumber: currentMember.phone,
        },
        customData: {
          reservationId: reservation.id,
          paymentRole,
        },
      });

      if (!portOneResponse) {
        setErrorMessage('결제가 완료되지 않았습니다.');
        return;
      }

      if (portOneResponse.code) {
        setErrorMessage(portOneResponse.message ?? '결제창에서 결제가 실패했습니다.');
        return;
      }

      if (portOneResponse.paymentId !== payment.merchantUid) {
        setErrorMessage('결제 ID가 일치하지 않습니다.');
        return;
      }

      const paymentConfirmResult = await confirmPayment({
        merchantUid: payment.merchantUid,
      });

      if (paymentConfirmResult.success) {
        const reservationResult = await getReservation(reservation.id);

        if (reservationResult.success) {
          setReservation(reservationResult.data);
        } else {
          setReservation((prevReservation) =>
            prevReservation
              ? {
                  ...prevReservation,
                  status: paymentConfirmResult.data.reservationStatus,
                  guardianPaid:
                    paymentRole === 'GUARDIAN' ? true : prevReservation.guardianPaid,
                  sitterPaid:
                    paymentRole === 'SITTER' ? true : prevReservation.sitterPaid,
                }
              : prevReservation,
          );
        }

        setActionMessage(
          `${paymentRoleLabels[paymentRole]} 결제가 검증되었습니다. ${
            paymentConfirmResult.data.reservationStatus === 'CONFIRMED'
              ? '예약이 확정되었습니다.'
              : '상대방 결제가 끝나면 예약이 확정됩니다.'
          }`,
        );
        return;
      }

      if (paymentConfirmResult.error.code !== 'NOT_FOUND') {
        setErrorMessage(paymentConfirmResult.error.message);
        return;
      }

      const legacyConfirmResult = await confirmReservation(reservation.id);

      if (!legacyConfirmResult.success) {
        setErrorMessage(legacyConfirmResult.error.message);
        return;
      }

      setReservation(legacyConfirmResult.data);
      setActionMessage(
        '결제창은 완료되었지만 현재 연결된 백엔드에 /api/payments/confirm이 없어 기존 예약 확정 API로 처리했습니다.',
      );
    } catch (error) {
      console.error('[ReservationDetailPage] PortOne payment failed', error);
      setErrorMessage(getPaymentErrorMessage(error));
    } finally {
      setPayingRole(null);
    }
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

  const payableRoles = getPayableRoles(reservation, currentMember);

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
                {reservation.sitterProfileId} · {careTypeLabels[reservation.careType]}
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
                {getPaymentLabel(reservation)}
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
          <p className="text-sm font-bold text-[#E26B4A]">PAYMENT</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">예약 결제</h2>
          <div className="mt-5 grid gap-3">
            {payableRoles.length > 0 ? (
              payableRoles.map((paymentRole) => (
                <button
                  key={paymentRole}
                  type="button"
                  disabled={Boolean(payingRole)}
                  onClick={() => void handlePayment(paymentRole)}
                  className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
                >
                  {payingRole === paymentRole
                    ? '결제 진행 중'
                    : `${paymentRoleLabels[paymentRole]} 결제하기`}
                </button>
              ))
            ) : (
              <p className="rounded-2xl bg-[#FAF6F1] px-4 py-3 text-sm font-semibold text-[#6F675F]">
                {reservation.status === 'PENDING'
                  ? '현재 계정으로 진행할 결제가 없습니다.'
                  : '결제 가능한 예약 상태가 아닙니다.'}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl bg-[#FAF6F1] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-[#2A2622]">보호자 결제</span>
              <span className="font-semibold text-[#6F675F]">
                {reservation.guardianPaid ? '완료' : '대기'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-[#2A2622]">시터 결제</span>
              <span className="font-semibold text-[#6F675F]">
                {reservation.sitterPaid ? '완료' : '대기'}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E7DCD1] pt-6">
            <p className="text-sm font-bold text-[#E26B4A]">ACTIONS</p>
            <h2 className="mt-3 text-xl font-bold text-[#2A2622]">상태 변경</h2>
          </div>
          <div className="mt-5 grid gap-3">
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
