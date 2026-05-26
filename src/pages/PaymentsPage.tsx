import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { failPayment, getMyPayments } from '../api';
import type { PaymentResponse, PaymentStatus, PaymentType } from '../types';

const paymentStatusLabels: Record<PaymentStatus, string> = {
  READY: '결제 준비',
  PENDING: '진행 중',
  PAID: '결제 완료',
  FAILED: '실패',
  CANCELED: '취소',
  REFUNDED: '환불',
  EXPIRED: '만료',
};

const paymentTypeLabels: Record<PaymentType, string> = {
  FULL: '보호자 결제',
  DEPOSIT: '시터 예약금',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [failedReason, setFailedReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFailing, setIsFailing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPayments = async () => {
    setErrorMessage('');

    try {
      const result = await getMyPayments();

      if (result.success) {
        setPayments(result.data);
        setSelectedPayment((prevPayment) =>
          prevPayment
            ? result.data.find((payment) => payment.paymentId === prevPayment.paymentId) ?? null
            : result.data[0] ?? null,
        );
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('결제 내역을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayments();
  }, []);

  const handleFailPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPayment) return;

    if (!failedReason.trim()) {
      setErrorMessage('실패 사유를 입력해 주세요.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsFailing(true);

    try {
      const result = await failPayment({
        merchantUid: selectedPayment.merchantUid,
        failedReason,
      });

      if (result.success) {
        setSelectedPayment(result.data);
        setFailedReason('');
        setSuccessMessage('결제 실패 처리가 반영되었습니다.');
        await fetchPayments();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('결제 실패 처리 중 문제가 발생했습니다.');
    } finally {
      setIsFailing(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">PAYMENTS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">결제 내역</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            PortOne 결제 요청, 승인, 실패 상태를 확인하고 실패 콜백을 테스트합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
          {payments.length}건
        </span>
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          {isLoading && (
            <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
              결제 내역을 불러오는 중입니다.
            </p>
          )}

          {!isLoading && payments.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
              아직 결제 내역이 없습니다.
            </p>
          )}

          {payments.map((payment) => (
            <button
              key={payment.paymentId}
              type="button"
              onClick={() => setSelectedPayment(payment)}
              className={[
                'rounded-2xl border p-5 text-left shadow-sm transition',
                selectedPayment?.paymentId === payment.paymentId
                  ? 'border-[#E26B4A] bg-[#FFF7F2]'
                  : 'border-[#E7DCD1] bg-white',
              ].join(' ')}
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold text-[#E26B4A]">
                    예약 #{payment.reservationId} ·{' '}
                    {payment.paymentType
                      ? paymentTypeLabels[payment.paymentType]
                      : payment.paymentRole}
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-[#2A2622]">
                    {payment.finalAmount.toLocaleString()}원
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#8A8178]">
                    {payment.merchantUid}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                  {paymentStatusLabels[payment.status] ?? payment.status}
                </span>
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">DETAIL</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">결제 상세</h2>

          {selectedPayment ? (
            <>
              <dl className="mt-5 grid gap-3">
                {[
                  ['결제 ID', selectedPayment.paymentId],
                  ['예약 ID', selectedPayment.reservationId],
                  ['회원 ID', selectedPayment.memberId ?? '-'],
                  ['역할', selectedPayment.paymentRole],
                  [
                    '결제 유형',
                    selectedPayment.paymentType
                      ? paymentTypeLabels[selectedPayment.paymentType]
                      : '-',
                  ],
                  ['원금', `${selectedPayment.originalAmount.toLocaleString()}원`],
                  ['할인', `${selectedPayment.discountAmount.toLocaleString()}원`],
                  ['최종 결제액', `${selectedPayment.finalAmount.toLocaleString()}원`],
                  ['쿠폰', selectedPayment.userCouponId ?? '-'],
                  ['상태', paymentStatusLabels[selectedPayment.status] ?? selectedPayment.status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#FAF6F1] p-4">
                    <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
                    <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
                  </div>
                ))}
              </dl>

              <Link
                to={`/reservations/${selectedPayment.reservationId}`}
                className="mt-4 inline-flex w-full justify-center rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white"
              >
                예약 보기
              </Link>

              <form className="mt-6 border-t border-[#E7DCD1] pt-5" onSubmit={handleFailPayment}>
                <label className="block" htmlFor="failedReason">
                  <span className="text-sm font-bold text-[#2A2622]">실패 사유</span>
                  <input
                    id="failedReason"
                    className={`mt-2 ${inputClassName}`}
                    placeholder="결제창 취소 또는 실패 사유"
                    value={failedReason}
                    onChange={(event) => setFailedReason(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={isFailing || !['READY', 'PENDING'].includes(selectedPayment.status)}
                  className="mt-3 w-full rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
                >
                  결제 실패 처리
                </button>
              </form>
            </>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
              확인할 결제를 선택해 주세요.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default PaymentsPage;
