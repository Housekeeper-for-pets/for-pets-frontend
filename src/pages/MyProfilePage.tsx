import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  changeMyPassword,
  createCoupon,
  deleteMyAccount,
  getMyInfo,
  getMyPosts,
  issueCoupon,
  revokeUserCoupon,
  updateMyInfo,
} from '../api';
import RegionSelect from '../components/RegionSelect';
import {
  careTypeLabels,
  getRegionLabel,
  postStatusLabels,
} from '../constants/options';
import type {
  ApiErrorDetail,
  ChangePasswordRequest,
  Member,
  MemberGender,
  Post,
  Region,
  UpdateMemberRequest,
} from '../types';

const initialProfileForm: UpdateMemberRequest = {
  nickname: '',
  phone: '',
  gender: 'UNKNOWN',
  region: 'UNKNOWN',
};

const initialPasswordForm: ChangePasswordRequest = {
  currentPassword: '',
  newPassword: '',
};

const initialCouponForm = {
  name: '10% 할인 쿠폰',
  totalQuantity: 100,
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const toProfileForm = (member: Member): UpdateMemberRequest => ({
  nickname: member.nickname,
  phone: member.phone ?? '',
  gender: member.gender ?? 'UNKNOWN',
  region: member.region ?? 'UNKNOWN',
});

type AccountMode = 'summary' | 'detail' | 'edit';

const getMode = (value: string | null): AccountMode => {
  if (value === 'detail' || value === 'edit') return value;

  return 'summary';
};

const getCouponIssueErrorMessage = (error: ApiErrorDetail) => {
  if (error.code === 'COUPON_ISSUE_LOCK_FAILED') {
    return '쿠폰 발급 요청이 몰려 잠시 처리되지 않았습니다. 잠시 후 다시 시도해 주세요.';
  }

  return error.message;
};

// 내 계정의 허브, 상세, 수정 흐름을 관리하는 페이지입니다.
function MyProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = getMode(searchParams.get('mode'));
  const [member, setMember] = useState<Member | null>(null);
  const [profileForm, setProfileForm] =
    useState<UpdateMemberRequest>(initialProfileForm);
  const [passwordForm, setPasswordForm] =
    useState<ChangePasswordRequest>(initialPasswordForm);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myPostsTotal, setMyPostsTotal] = useState(0);
  const [isMyPostsLoading, setIsMyPostsLoading] = useState(true);
  const [myPostsError, setMyPostsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [couponId, setCouponId] = useState('');
  const [userCouponId, setUserCouponId] = useState('');
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [isProcessingCoupon, setIsProcessingCoupon] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMyInfo = async () => {
    const result = await getMyInfo();

    if (result.success) {
      setMember(result.data);
      setProfileForm(toProfileForm(result.data));
      return;
    }

    setErrorMessage(result.error.message);
  };

  useEffect(() => {
    const loadMyInfo = async () => {
      try {
        await fetchMyInfo();
      } catch {
        setErrorMessage('내 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadMyInfo();
  }, []);

  useEffect(() => {
    const loadMyPosts = async () => {
      setIsMyPostsLoading(true);
      setMyPostsError('');

      try {
        const result = await getMyPosts({ page: 0, size: 5 });

        if (result.success) {
          setMyPosts(result.data.content);
          setMyPostsTotal(result.data.totalElements);
          return;
        }

        setMyPostsError(result.error.message);
      } catch {
        setMyPostsError('내 공고 목록을 불러오지 못했습니다.');
      } finally {
        setIsMyPostsLoading(false);
      }
    };

    void loadMyPosts();
  }, []);

  const moveMode = (nextMode: AccountMode) => {
    setErrorMessage('');
    setSuccessMessage('');
    setSearchParams(nextMode === 'summary' ? {} : { mode: nextMode });
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!profileForm.nickname.trim()) {
      setErrorMessage('닉네임을 입력해 주세요.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await updateMyInfo(profileForm);

      if (result.success) {
        setMember((prevMember) =>
          prevMember ? { ...prevMember, ...result.data } : prevMember,
        );
        setSuccessMessage('내 정보가 수정되었습니다.');
        moveMode('detail');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('내 정보 수정 중 문제가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setErrorMessage('현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changeMyPassword(passwordForm);

      if (result.success) {
        setPasswordForm(initialPasswordForm);
        setSuccessMessage(result.data.message);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('비밀번호 변경 중 문제가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const shouldDelete = window.confirm('정말 회원 탈퇴를 진행할까요?');

    if (!shouldDelete) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsDeletingAccount(true);

    try {
      const result = await deleteMyAccount();

      if (result.success) {
        setSuccessMessage(result.data.message);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('회원 탈퇴 처리 중 문제가 발생했습니다.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleIssueCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const parsedCouponId = Number(couponId);

    if (!parsedCouponId) {
      setErrorMessage('발급할 쿠폰 ID를 입력해 주세요.');
      return;
    }

    setIsProcessingCoupon(true);

    try {
      const result = await issueCoupon(parsedCouponId);

      if (result.success) {
        await fetchMyInfo();
        setCouponId('');
        setSuccessMessage(
          `${result.data.couponName}이 발급되었습니다. 보유 쿠폰 수량을 갱신했습니다.`,
        );
        return;
      }

      setErrorMessage(getCouponIssueErrorMessage(result.error));
    } catch {
      setErrorMessage('쿠폰 발급 중 문제가 발생했습니다.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  const handleCreateCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!couponForm.name.trim() || couponForm.totalQuantity <= 0) {
      setErrorMessage('쿠폰명과 발급 수량을 확인해 주세요.');
      return;
    }

    setIsProcessingCoupon(true);

    try {
      const result = await createCoupon(couponForm);

      if (result.success) {
        setSuccessMessage(
          `쿠폰 #${result.data.couponId} 생성 완료: ${result.data.name}`,
        );
        setCouponForm(initialCouponForm);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('쿠폰 생성 중 문제가 발생했습니다.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  const handleRevokeCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const parsedUserCouponId = Number(userCouponId);

    if (!parsedUserCouponId) {
      setErrorMessage('회수할 유저 쿠폰 ID를 입력해 주세요.');
      return;
    }

    setIsProcessingCoupon(true);

    try {
      const result = await revokeUserCoupon(parsedUserCouponId);

      if (result.success) {
        setUserCouponId('');
        setSuccessMessage(`유저 쿠폰 #${result.data.userCouponId}이 회수되었습니다.`);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('쿠폰 회수 중 문제가 발생했습니다.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          내 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">MY ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">내 계정</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            계정 정보, 반려동물, 시터 프로필을 한 흐름 안에서 관리합니다.
          </p>
        </div>
        {member && (
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
            {member.role} · {member.status}
          </span>
        )}
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

      {mode === 'summary' && member && (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">SUMMARY</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              {member.nickname}님 계정 요약
            </h2>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">이메일</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                  {member.email}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">지역</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                  {getRegionLabel(member.region)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">보유 쿠폰</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                  {member.couponCount}장
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => moveMode('detail')}
                className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white"
              >
                계정 상세보기
              </button>
              <Link
                to="/pets"
                className="rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm font-bold text-[#2A2622]"
              >
                내 반려동물
              </Link>
              <Link
                to="/my-reviews"
                className="rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm font-bold text-[#2A2622]"
              >
                내 후기
              </Link>
              <Link
                to={member.role === 'SITTER' ? '/my-sitter' : '/my-sitter?mode=register'}
                className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white"
              >
                {member.role === 'SITTER' ? '내 시터 프로필' : '시터 등록'}
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">MY POSTS</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  내 공고
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                  내가 등록한 케어 공고와 들어온 제안을 한 화면에서 관리합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#6F675F] shadow-sm">
                  총 {myPostsTotal}건
                </span>
                <Link
                  to="/posts/new"
                  className="rounded-full bg-[#E26B4A] px-4 py-2 text-xs font-bold text-white"
                >
                  공고 작성
                </Link>
              </div>
            </div>

            {isMyPostsLoading && (
              <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                내 공고 목록을 불러오는 중입니다.
              </p>
            )}

            {!isMyPostsLoading && myPostsError && (
              <p className="mt-5 rounded-2xl bg-[#FFF0EA] p-4 text-sm font-medium text-[#B44727]">
                {myPostsError}
              </p>
            )}

            {!isMyPostsLoading && !myPostsError && myPosts.length === 0 && (
              <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
                아직 작성한 공고가 없습니다.
              </p>
            )}

            {!isMyPostsLoading && !myPostsError && myPosts.length > 0 && (
              <ul className="mt-5 grid gap-3">
                {myPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      to={`/posts/${post.id}`}
                      className="flex flex-col justify-between gap-2 rounded-2xl bg-[#FAF6F1] p-4 transition hover:bg-[#F4E9DE] md:flex-row md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#FFF0EA] px-2 py-0.5 text-xs font-bold text-[#B44727]">
                            {careTypeLabels[post.careType]}
                          </span>
                          <span className="rounded-full bg-[#EEF7EA] px-2 py-0.5 text-xs font-bold text-[#3F5732]">
                            {postStatusLabels[post.status]}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-sm font-bold text-[#2A2622]">
                          {post.title}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#2A2622]">
                        {post.budgetAmount.toLocaleString('ko-KR')}원
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!isMyPostsLoading && !myPostsError && myPostsTotal > myPosts.length && (
              <Link
                to="/posts"
                className="mt-4 inline-flex w-fit rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
              >
                내 공고 전체 보기
              </Link>
            )}
          </article>

          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">PAYMENT & MONEY</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              결제와 정산
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6F675F]">
              예약 결제 상태와 시터 정산 내역을 내 계정에서 바로 확인합니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/payments"
                className="rounded-2xl bg-[#2A2622] px-4 py-3 text-center text-sm font-bold text-white"
              >
                결제 내역
              </Link>
              <Link
                to="/settlements"
                className="rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-center text-sm font-bold text-[#2A2622]"
              >
                정산 내역
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">COUPONS</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              쿠폰 테스트
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6F675F]">
              쿠폰 목록 API가 없어 발급할 쿠폰 ID를 직접 입력합니다.
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
                disabled={isProcessingCoupon}
                className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
              >
                쿠폰 발급
              </button>
            </form>

            {member.role === 'ADMIN' && (
              <div className="mt-6 space-y-5 border-t border-[#E7DCD1] pt-5">
                <form className="grid gap-3" onSubmit={handleCreateCoupon}>
                  <p className="text-sm font-bold text-[#2A2622]">관리자 쿠폰 생성</p>
                  <input
                    className={inputClassName}
                    aria-label="쿠폰명"
                    value={couponForm.name}
                    onChange={(event) =>
                      setCouponForm((prevForm) => ({
                        ...prevForm,
                        name: event.target.value,
                      }))
                    }
                  />
                  <input
                    className={inputClassName}
                    aria-label="전체 발급 수량"
                    type="number"
                    min={1}
                    value={couponForm.totalQuantity}
                    onChange={(event) =>
                      setCouponForm((prevForm) => ({
                        ...prevForm,
                        totalQuantity: Number(event.target.value),
                      }))
                    }
                  />
                  <button
                    type="submit"
                    disabled={isProcessingCoupon}
                    className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
                  >
                    쿠폰 생성
                  </button>
                </form>

                <form className="grid gap-3" onSubmit={handleRevokeCoupon}>
                  <p className="text-sm font-bold text-[#2A2622]">유저 쿠폰 회수</p>
                  <input
                    className={inputClassName}
                    aria-label="유저 쿠폰 ID"
                    type="number"
                    min={1}
                    placeholder="UserCoupon ID"
                    value={userCouponId}
                    onChange={(event) => setUserCouponId(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isProcessingCoupon}
                    className="rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
                  >
                    쿠폰 회수
                  </button>
                </form>
              </div>
            )}
          </article>

          <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">DANGER ZONE</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">회원 탈퇴</h2>
            <p className="mt-2 text-sm leading-6 text-[#6F675F]">
              탈퇴는 Soft Delete로 처리되며, 관리자 계정은 탈퇴할 수 없습니다.
            </p>
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={() => void handleDeleteAccount()}
              className="mt-5 w-full rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
            >
              {isDeletingAccount ? '처리 중...' : '회원 탈퇴'}
            </button>
          </aside>
        </section>
      )}

      {mode === 'detail' && member && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">DETAIL</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                계정 상세 정보
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moveMode('summary')}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
              >
                요약으로
              </button>
              <button
                type="button"
                onClick={() => moveMode('edit')}
                className="rounded-2xl bg-[#E26B4A] px-4 py-2 text-sm font-bold text-white"
              >
                수정
              </button>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ['이메일', member.email],
              ['닉네임', member.nickname],
              ['전화번호', member.phone || '미입력'],
              ['성별', member.gender || '미입력'],
              ['지역', getRegionLabel(member.region)],
              ['보유 쿠폰', `${member.couponCount}장`],
              ['역할', member.role],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {mode === 'edit' && (
        <>
          <form
            className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
            onSubmit={handleProfileSubmit}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">EDIT</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  프로필 내용 수정
                </h2>
              </div>
              <button
                type="button"
                onClick={() => moveMode('detail')}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
              >
                취소
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block" htmlFor="nickname">
                <span className="text-sm font-bold text-[#2A2622]">닉네임</span>
                <input
                  id="nickname"
                  className={`mt-2 ${inputClassName}`}
                  value={profileForm.nickname}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      nickname: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block" htmlFor="phone">
                <span className="text-sm font-bold text-[#2A2622]">전화번호</span>
                <input
                  id="phone"
                  className={`mt-2 ${inputClassName}`}
                  type="tel"
                  placeholder="010-0000-0000"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block" htmlFor="gender">
                <span className="text-sm font-bold text-[#2A2622]">성별</span>
                <select
                  id="gender"
                  className={`mt-2 ${selectClassName}`}
                  value={profileForm.gender}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      gender: event.target.value as MemberGender,
                    }))
                  }
                >
                  <option value="UNKNOWN">선택 안 함</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </label>

              <RegionSelect
                idPrefix="profile-region"
                selectClassName={`mt-2 ${selectClassName}`}
                value={profileForm.region}
                emptyValue="UNKNOWN"
                onChange={(value) =>
                  setProfileForm((prevForm) => ({
                    ...prevForm,
                    region: (value ?? 'UNKNOWN') as Region,
                  }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="mt-6 w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              {isSavingProfile ? '저장 중...' : '내 정보 저장'}
            </button>
          </form>

          <form
            className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
            onSubmit={handlePasswordSubmit}
          >
            <p className="text-sm font-bold text-[#E26B4A]">PASSWORD</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              비밀번호 변경
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                className={inputClassName}
                type="password"
                placeholder="현재 비밀번호"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prevForm) => ({
                    ...prevForm,
                    currentPassword: event.target.value,
                  }))
                }
              />
              <input
                className={inputClassName}
                type="password"
                placeholder="새 비밀번호"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prevForm) => ({
                    ...prevForm,
                    newPassword: event.target.value,
                  }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-6 w-full rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
            >
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </>
      )}
    </main>
  );
}

export default MyProfilePage;
