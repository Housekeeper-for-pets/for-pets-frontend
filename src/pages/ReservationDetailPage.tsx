import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import * as PortOne from '@portone/browser-sdk/v2';
import { Link, useParams } from 'react-router-dom';
import {
  cancelReservation,
  completeReservation,
  confirmPayment,
  createCareLog,
  createPayment,
  createReview,
  failPayment,
  getMyInfo,
  getReservation,
  getReservationCareLogs,
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
  CareLog,
  CreateCareLogRequest,
  CreateReviewRequest,
  ApiResponse,
  Member,
  PaymentRole,
  Reservation,
} from '../types';

const initialCancelForm: CancelReservationRequest = {
  cancelReason: '',
  cancelCategory: 'PERSONAL',
};

const initialCareLogForm: CreateCareLogRequest = {
  content: '',
  imageUrls: [],
};

const initialReviewForm: CreateReviewRequest = {
  reservationId: 0,
  rating: 5,
  reviewComment: '',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const parseImageUrls = (value: string) =>
  value
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);

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
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [cancelForm, setCancelForm] =
    useState<CancelReservationRequest>(initialCancelForm);
  const [careLogForm, setCareLogForm] =
    useState<CreateCareLogRequest>(initialCareLogForm);
  const [careLogImageInput, setCareLogImageInput] = useState('');
  const [reviewForm, setReviewForm] =
    useState<CreateReviewRequest>(initialReviewForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingCareLog, setIsCreatingCareLog] = useState(false);
  const [isCreatingReview, setIsCreatingReview] = useState(false);
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
          setReviewForm((prevForm) => ({
            ...prevForm,
            reservationId: reservationResult.data.id,
          }));

          const careLogResult = await getReservationCareLogs(reservationResult.data.id);
          if (careLogResult.success) {
            setCareLogs(careLogResult.data);
          }
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
    let merchantUidForFailure = '';

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
      merchantUidForFailure = payment.merchantUid;
      const markPaymentFailed = async (failedReason: string) => {
        const failResult = await failPayment({
          merchantUid: payment.merchantUid,
          failedReason,
        });

        if (!failResult.success) {
          setErrorMessage(failResult.error.message);
        }
      };

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
          pc: 'IFRAME',
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
        await markPaymentFailed('결제창이 완료 응답 없이 종료되었습니다.');
        setErrorMessage('결제가 완료되지 않았습니다.');
        return;
      }

      if (portOneResponse.code) {
        await markPaymentFailed(portOneResponse.message ?? portOneResponse.code);
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
              ? '예약이 확정되었습니다. 같은 시터의 겹치는 대기 예약은 자동 취소될 수 있습니다.'
              : '상대방 결제가 끝나면 예약이 확정됩니다.'
          }`,
        );
        return;
      }

      setErrorMessage(paymentConfirmResult.error.message);
    } catch (error) {
      console.error('[ReservationDetailPage] PortOne payment failed', error);
      if (merchantUidForFailure) {
        await failPayment({
          merchantUid: merchantUidForFailure,
          failedReason: getPaymentErrorMessage(error),
        });
      }
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

  const handleCreateCareLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reservation) return;

    if (!careLogForm.content.trim()) {
      setErrorMessage('케어 일지 내용을 입력해 주세요.');
      return;
    }

    setErrorMessage('');
    setActionMessage('');
    setIsCreatingCareLog(true);

    try {
      const result = await createCareLog(reservation.id, {
        content: careLogForm.content.trim(),
        imageUrls: parseImageUrls(careLogImageInput),
      });

      if (result.success) {
        setCareLogs((prevLogs) => [result.data, ...prevLogs]);
        setCareLogForm(initialCareLogForm);
        setCareLogImageInput('');
        setActionMessage('케어 일지가 등록되었습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('케어 일지 등록 중 문제가 발생했습니다.');
    } finally {
      setIsCreatingCareLog(false);
    }
  };

  const handleCreateReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reservation) return;

    if (reviewForm.reviewComment.trim().length < 10) {
      setErrorMessage('리뷰는 10자 이상 입력해 주세요.');
      return;
    }

    setErrorMessage('');
    setActionMessage('');
    setIsCreatingReview(true);

    try {
      const result = await createReview({
        ...reviewForm,
        reservationId: reservation.id,
        reviewComment: reviewForm.reviewComment.trim(),
      });

      if (result.success) {
        setReviewForm({ ...initialReviewForm, reservationId: reservation.id });
        setActionMessage('리뷰가 등록되었습니다. 시터 상세에서 확인할 수 있습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('리뷰 등록 중 문제가 발생했습니다.');
    } finally {
      setIsCreatingReview(false);
    }
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
  const canWriteCareLog =
    reservation.status === 'CONFIRMED' &&
    currentMember?.id === reservation.sitterMemberId;
  const canWriteReview =
    reservation.status === 'COMPLETED' &&
    currentMember?.id === reservation.guardianId;

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

          <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

          {reservation.status === 'CANCEL_REQUESTED' && (
            <div className="mt-5 rounded-2xl border border-[#E7DCD1] bg-[#FFF7E6] p-5">
              <p className="text-sm font-bold text-[#B44727]">CANCEL REVIEW</p>
              <h3 className="mt-2 text-lg font-bold text-[#2A2622]">
                불가피한 사유 취소 요청 검토 중
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                상대방이 불가피한 이유로 인해 예약 취소를 요청했습니다. 관리자의
                검토 이후 승인 시 예약이 위약금 없이 취소되며, 거절되면 다시 예약이
                확정 상태가 됩니다.
              </p>
              {reservation.cancelCategory && (
                <p className="mt-3 text-xs font-bold text-[#8A8178]">
                  취소 분류:{' '}
                  {cancelCategoryLabels[reservation.cancelCategory] ??
                    reservation.cancelCategory}
                </p>
              )}
              {reservation.cancelReason && (
                <p className="mt-2 rounded-2xl bg-white p-3 text-sm leading-6 text-[#6F675F]">
                  {reservation.cancelReason}
                </p>
              )}
            </div>
          )}

          {reservation.status === 'CANCELED' && reservation.cancelReason && (
            <div className="mt-5 rounded-2xl border border-[#E7DCD1] bg-[#FFF0EA] p-5">
              <p className="text-sm font-bold text-[#B44727]">CANCELED</p>
              <h3 className="mt-2 text-lg font-bold text-[#2A2622]">예약 취소 완료</h3>
              <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                이 예약은 취소되었습니다. 아래는 취소 사유와 분류입니다.
              </p>
              {reservation.cancelCategory && (
                <p className="mt-3 text-xs font-bold text-[#8A8178]">
                  취소 분류:{' '}
                  {cancelCategoryLabels[reservation.cancelCategory] ??
                    reservation.cancelCategory}
                  {reservation.canceledBy
                    ? ` · 취소 주체: ${
                        reservation.canceledBy === 'GUARDIAN' ? '보호자' : '시터'
                      }`
                    : ''}
                </p>
              )}
              <p className="mt-2 rounded-2xl bg-white p-3 text-sm leading-6 text-[#6F675F]">
                {reservation.cancelReason}
              </p>
              {reservation.canceledAt && (
                <p className="mt-2 text-xs text-[#8A8178]">
                  취소 시각: {formatDateTime(reservation.canceledAt)}
                </p>
              )}
            </div>
          )}

          {(() => {
            // 현재 로그인 유저의 역할을 판별해 "실 결제 금액"을 보여줍니다.
            const isGuardian = currentMember?.id === reservation.guardianId;
            const isSitter = currentMember?.id === reservation.sitterMemberId;
            const myAmount = isGuardian
              ? reservation.guardianPrice
              : isSitter
                ? reservation.sitterPrice
                : null;
            const myRoleLabel = isGuardian ? '보호자' : isSitter ? '시터' : null;
            const myPaid = isGuardian
              ? reservation.guardianPaid
              : isSitter
                ? reservation.sitterPaid
                : false;

            return (
              <div className="mt-5 rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAF6F1] p-4">
                    <dt className="text-xs font-bold text-[#9B8E82]">
                      보호자 결제금액 · {reservation.guardianPaid ? '결제 완료' : '결제 대기'}
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-[#2A2622]">
                      {reservation.guardianPrice.toLocaleString('ko-KR')}원
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-[#FAF6F1] p-4">
                    <dt className="text-xs font-bold text-[#9B8E82]">
                      시터 결제금액 · {reservation.sitterPaid ? '결제 완료' : '결제 대기'}
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-[#2A2622]">
                      {reservation.sitterPrice.toLocaleString('ko-KR')}원
                    </dd>
                  </div>
                </div>

                {myAmount !== null && myRoleLabel && (
                  <div className="mt-4 flex items-baseline justify-between gap-3 rounded-2xl bg-[#E26B4A] p-4">
                    <p className="text-xs font-bold text-white/80">
                      실 결제 금액 ({myRoleLabel}) · {myPaid ? '결제 완료' : '결제 대기'}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {myAmount.toLocaleString('ko-KR')}원
                    </p>
                  </div>
                )}

                <p className="mt-4 rounded-2xl bg-[#FFF0EA] p-4 text-xs leading-5 text-[#B44727]">
                  ※ 결제가 확정된 이후 개인 사정으로 취소하면, 시터의 경우 지불한
                  전체 금액을, 보호자의 경우 지불 금액의 20%를 위약금으로 지불합니다.
                </p>
              </div>
            );
          })()}
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">CARE LOGS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">케어 일지</h2>
              <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                시터가 등록한 돌봄 기록과 사진 링크를 한 곳에서 확인합니다.
              </p>
            </div>
            <p className="text-sm font-semibold text-[#6F675F]">
              {careLogs.length}개
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {careLogs.length === 0 && (
              <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F]">
                아직 등록된 케어 일지가 없습니다.
              </p>
            )}

            {careLogs.map((careLog) => (
              <article key={careLog.id} className="rounded-2xl bg-[#FAF6F1] p-5">
                <div className="flex flex-col justify-between gap-2 md:flex-row">
                  <p className="text-sm font-bold text-[#2A2622]">
                    시터 #{careLog.sitterMemberId}
                  </p>
                  <p className="text-xs font-semibold text-[#8A8178]">
                    {formatDateTime(careLog.createdAt)}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6F675F]">
                  {careLog.content}
                </p>
                {careLog.imageUrls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {careLog.imageUrls.map((imageUrl) => (
                      <a
                        key={imageUrl}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#6F675F]"
                      >
                        이미지 보기
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <form
            className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
            onSubmit={handleCreateCareLog}
          >
            <p className="text-sm font-bold text-[#E26B4A]">SITTER LOG</p>
            <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
              일지 작성
            </h2>
            <textarea
              className="mt-5 min-h-32 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
              placeholder="오늘 돌봄 내용, 식사, 산책, 특이사항을 기록하세요."
              value={careLogForm.content}
              onChange={(event) =>
                setCareLogForm((prevForm) => ({
                  ...prevForm,
                  content: event.target.value,
                }))
              }
            />
            <textarea
              className="mt-3 min-h-20 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
              placeholder="이미지 URL을 줄바꿈으로 입력"
              value={careLogImageInput}
              onChange={(event) => setCareLogImageInput(event.target.value)}
            />
            <button
              type="submit"
              disabled={!canWriteCareLog || isCreatingCareLog}
              className="mt-3 w-full rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              {canWriteCareLog ? '케어 일지 등록' : '시터만 확정 예약에 작성 가능'}
            </button>
          </form>

          <form
            className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
            onSubmit={handleCreateReview}
          >
            <p className="text-sm font-bold text-[#E26B4A]">REVIEW</p>
            <h2 className="mt-3 text-xl font-bold text-[#2A2622]">리뷰 작성</h2>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-[#2A2622]">평점</span>
              <select
                className={`mt-2 ${inputClassName}`}
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((prevForm) => ({
                    ...prevForm,
                    rating: Number(event.target.value),
                  }))
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}점
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
              placeholder="리뷰를 10자 이상 작성하세요."
              value={reviewForm.reviewComment}
              onChange={(event) =>
                setReviewForm((prevForm) => ({
                  ...prevForm,
                  reviewComment: event.target.value,
                }))
              }
            />
            <button
              type="submit"
              disabled={!canWriteReview || isCreatingReview}
              className="mt-3 w-full rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
            >
              {canWriteReview ? '리뷰 등록' : '보호자만 완료 예약에 작성 가능'}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default ReservationDetailPage;
