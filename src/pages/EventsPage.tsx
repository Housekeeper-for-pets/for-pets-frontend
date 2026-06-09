import { useState } from 'react';
import type { FormEvent } from 'react';
import { issueCoupon } from '../api';
import type { ApiErrorDetail } from '../types';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const getCouponIssueErrorMessage = (error: ApiErrorDetail) => {
  if (error.code === 'COUPON_ISSUE_LOCK_FAILED') {
    return '쿠폰 발급 요청이 몰려 잠시 처리되지 않았습니다. 잠시 후 다시 시도해 주세요.';
  }

  return error.message;
};

// 일반 사용자가 진행 중인 쿠폰 이벤트에 참여해 쿠폰을 발급받는 페이지입니다.
function EventsPage() {
  const [couponId, setCouponId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleIssueCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const parsedCouponId = Number(couponId);

    if (!parsedCouponId || parsedCouponId <= 0) {
      setErrorMessage('발급받을 쿠폰 ID를 입력해 주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await issueCoupon(parsedCouponId);

      if (result.success) {
        setSuccessMessage(
          `${result.data.couponName}이(가) 발급되었습니다. 내 계정에서 보유 쿠폰을 확인하세요.`,
        );
        setCouponId('');
        return;
      }

      setErrorMessage(getCouponIssueErrorMessage(result.error));
    } catch {
      setErrorMessage('쿠폰 발급 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section>
        <p className="text-sm font-bold text-[#E26B4A]">EVENTS</p>
        <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">이벤트</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
          진행 중인 쿠폰 이벤트에 참여하고 할인 쿠폰을 발급받으세요. 발급된 쿠폰은
          내 계정의 보유 쿠폰에서 확인할 수 있습니다.
        </p>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">COUPON CLAIM</p>
          <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">쿠폰 발급 받기</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            진행 중인 이벤트에서 안내받은 쿠폰 ID를 입력하고 발급 버튼을 누르세요.
            선착순 발급이라 인기 쿠폰은 빠르게 마감될 수 있습니다.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleIssueCoupon}>
            <label className="block" htmlFor="couponId">
              <span className="text-sm font-bold text-[#2A2622]">쿠폰 ID</span>
              <input
                id="couponId"
                className={`mt-2 ${inputClassName}`}
                type="number"
                min={1}
                placeholder="예: 1"
                value={couponId}
                onChange={(event) => setCouponId(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={isProcessing}
              className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              {isProcessing ? '발급 처리 중...' : '쿠폰 발급 받기'}
            </button>
          </form>

          {(errorMessage || successMessage) && (
            <p
              className={[
                'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
                errorMessage
                  ? 'bg-[#FFF0EA] text-[#B44727]'
                  : 'bg-[#EEF7EA] text-[#3F5732]',
              ].join(' ')}
            >
              {errorMessage || successMessage}
            </p>
          )}
        </article>

        <aside className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">HOW IT WORKS</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">이벤트 안내</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6F675F]">
            <li>· 쿠폰 ID는 SNS·공지사항 등 이벤트 채널에서 안내됩니다.</li>
            <li>· 한 사용자당 같은 쿠폰을 중복 발급할 수 없어요.</li>
            <li>· 발급된 쿠폰은 예약 결제 시 자동으로 표시됩니다.</li>
            <li>· 트래픽이 몰리면 잠시 후 다시 시도해 주세요.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

export default EventsPage;
