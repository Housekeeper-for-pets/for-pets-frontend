import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createCoupon, revokeUserCoupon } from '../api';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const initialCouponForm = {
  name: '10% 할인 쿠폰',
  totalQuantity: 100,
};

// 관리자가 신규 쿠폰을 생성하고 잘못 발급된 유저 쿠폰을 회수하는 페이지입니다.
function AdminCouponsPage() {
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [userCouponId, setUserCouponId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!couponForm.name.trim() || couponForm.totalQuantity <= 0) {
      setErrorMessage('쿠폰명과 발급 수량을 확인해 주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await createCoupon(couponForm);

      if (result.success) {
        setSuccessMessage(
          `쿠폰 #${result.data.couponId} 생성 완료: ${result.data.name}`,
        );
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('쿠폰 생성 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const parsedUserCouponId = Number(userCouponId);

    if (!parsedUserCouponId || parsedUserCouponId <= 0) {
      setErrorMessage('회수할 유저 쿠폰 ID를 입력해 주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await revokeUserCoupon(parsedUserCouponId);

      if (result.success) {
        setSuccessMessage(
          `유저 쿠폰 #${result.data.userCouponId}이(가) 회수되었습니다.`,
        );
        setUserCouponId('');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('쿠폰 회수 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section>
        <Link
          to="/admin"
          className="text-xs font-bold text-[#6F675F] hover:text-[#E26B4A]"
        >
          ← 관리자 콘솔로
        </Link>
        <p className="mt-3 text-sm font-bold text-[#E26B4A]">COUPONS</p>
        <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">쿠폰 발급 관리</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
          신규 이벤트 쿠폰을 생성하고, 잘못 발급된 유저 쿠폰을 회수합니다.
        </p>
      </section>

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

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">CREATE</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">신규 쿠폰 생성</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            생성한 쿠폰의 ID는 이벤트 페이지에서 사용자에게 안내해 주세요.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleCreateCoupon}>
            <label className="block">
              <span className="text-sm font-bold text-[#2A2622]">쿠폰명</span>
              <input
                className={`mt-2 ${inputClassName}`}
                aria-label="쿠폰명"
                value={couponForm.name}
                onChange={(event) =>
                  setCouponForm((prevForm) => ({
                    ...prevForm,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#2A2622]">전체 발급 수량</span>
              <input
                className={`mt-2 ${inputClassName}`}
                aria-label="전체 발급 수량"
                type="number"
                min={1}
                placeholder="예: 100"
                value={couponForm.totalQuantity || ''}
                onChange={(event) =>
                  setCouponForm((prevForm) => ({
                    ...prevForm,
                    totalQuantity: Number(event.target.value),
                  }))
                }
              />
            </label>
            <button
              type="submit"
              disabled={isProcessing}
              className="mt-2 rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              {isProcessing ? '처리 중...' : '쿠폰 생성'}
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">REVOKE</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">유저 쿠폰 회수</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            잘못 발급되었거나 부정 사용된 유저 쿠폰의 ID를 입력해 회수합니다.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleRevokeCoupon}>
            <label className="block">
              <span className="text-sm font-bold text-[#2A2622]">유저 쿠폰 ID</span>
              <input
                className={`mt-2 ${inputClassName}`}
                aria-label="유저 쿠폰 ID"
                type="number"
                min={1}
                placeholder="UserCoupon ID"
                value={userCouponId}
                onChange={(event) => setUserCouponId(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={isProcessing}
              className="mt-2 rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
            >
              {isProcessing ? '처리 중...' : '쿠폰 회수'}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}

export default AdminCouponsPage;
