import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyInfo,
  updateMyInfo,
} from '../api';
import { getRegionLabel, regionOptions } from '../constants/options';
import type {
  ChangePasswordRequest,
  Member,
  MemberGender,
  Region,
  UpdateMemberRequest,
} from '../types';

const initialProfileForm: UpdateMemberRequest = {
  nickname: '',
  phone: '',
  gender: 'MALE',
  region: 'UNKNOWN',
};

const initialPasswordForm: ChangePasswordRequest = {
  currentPassword: '',
  newPassword: '',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const toProfileForm = (member: Member): UpdateMemberRequest => ({
  nickname: member.nickname,
  phone: member.phone ?? '',
  gender: member.gender ?? 'MALE',
  region: member.region ?? 'UNKNOWN',
});

// 내 회원 정보를 조회하고 수정하는 페이지입니다.
function MyProfilePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [profileForm, setProfileForm] =
    useState<UpdateMemberRequest>(initialProfileForm);
  const [passwordForm, setPasswordForm] =
    useState<ChangePasswordRequest>(initialPasswordForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 페이지 진입 시 내 회원 정보를 불러옵니다.
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const result = await getMyInfo();

        if (result.success) {
          setMember(result.data);
          setProfileForm(toProfileForm(result.data));
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('내 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMyInfo();
  }, []);

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
          prevMember
            ? {
                ...prevMember,
                ...result.data,
              }
            : prevMember,
        );
        setSuccessMessage('내 정보가 수정되었습니다.');
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
          <p className="text-sm font-bold text-[#E26B4A]">MY PROFILE</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">내 정보</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            닉네임, 연락처, 성별, 지역 정보를 관리합니다. 지역은 시터 활동 지역과
            공고 지역에 활용됩니다.
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <form
          className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
          onSubmit={handleProfileSubmit}
        >
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">PROFILE</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              기본 정보 수정
            </h2>
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

            <div className="grid gap-4 md:grid-cols-2">
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
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </label>

              <label className="block" htmlFor="region">
                <span className="text-sm font-bold text-[#2A2622]">지역</span>
                <select
                  id="region"
                  className={`mt-2 ${selectClassName}`}
                  value={profileForm.region}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      region: event.target.value as Region,
                    }))
                  }
                >
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="mt-6 w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
          >
            {isSavingProfile ? '저장 중...' : '내 정보 수정'}
          </button>
        </form>

        <aside className="grid gap-6">
          <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">SUMMARY</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">계정 요약</h2>
            {member ? (
              <dl className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-[#FAF6F1] p-4">
                  <dt className="text-xs font-bold text-[#9B8E82]">이메일</dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                    {member.email}
                  </dd>
                </div>
                <div className="rounded-2xl bg-[#FAF6F1] p-4">
                  <dt className="text-xs font-bold text-[#9B8E82]">지역</dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                    {getRegionLabel(profileForm.region)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                회원 정보를 확인할 수 없습니다.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
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
          </section>
        </aside>
      </section>

      <form
        className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
        onSubmit={handlePasswordSubmit}
      >
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">PASSWORD</p>
          <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
            비밀번호 변경
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block" htmlFor="currentPassword">
            <span className="text-sm font-bold text-[#2A2622]">현재 비밀번호</span>
            <input
              id="currentPassword"
              className={`mt-2 ${inputClassName}`}
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prevForm) => ({
                  ...prevForm,
                  currentPassword: event.target.value,
                }))
              }
            />
          </label>

          <label className="block" htmlFor="newPassword">
            <span className="text-sm font-bold text-[#2A2622]">새 비밀번호</span>
            <input
              id="newPassword"
              className={`mt-2 ${inputClassName}`}
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prevForm) => ({
                  ...prevForm,
                  newPassword: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isChangingPassword}
          className="mt-6 w-full rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
        >
          {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </main>
  );
}

export default MyProfilePage;
