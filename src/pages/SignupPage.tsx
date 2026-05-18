import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api';
import AuthPageShell from '../components/AuthPageShell';
import FormField from '../components/FormField';
import { regionOptions } from '../constants/options';
import type { MemberGender, Region, SignupRequest } from '../types';

const initialForm: SignupRequest = {
  email: '',
  password: '',
  nickname: '',
  phone: '',
  gender: 'MALE',
  region: 'UNKNOWN',
};

const selectClassName =
  'mt-2 w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 일반 회원 가입을 처리하는 페이지입니다.
function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupRequest>(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력값이 바뀔 때 회원가입 요청 상태를 갱신합니다.
  const updateField = (name: keyof SignupRequest, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // 회원가입 API를 호출하고 성공하면 로그인 페이지로 이동합니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await signup(form);

      if (result.success) {
        navigate('/login');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="회원가입"
      description="기본 회원으로 가입한 뒤 시터 프로필을 등록하면 시터로 전환할 수 있습니다."
      footerText="이미 계정이 있나요?"
      footerLinkText="로그인"
      footerLinkTo="/login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField
          id="email"
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="forpets@example.com"
          required
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
        <FormField
          id="password"
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          required
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
        />
        <FormField
          id="nickname"
          label="닉네임"
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="집사민"
          required
          value={form.nickname}
          onChange={(event) => updateField('nickname', event.target.value)}
        />
        <FormField
          id="phone"
          label="전화번호"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block" htmlFor="gender">
            <span className="text-sm font-semibold text-[#3E3730]">성별</span>
            <select
              id="gender"
              className={selectClassName}
              value={form.gender}
              onChange={(event) =>
                updateField('gender', event.target.value as MemberGender)
              }
            >
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </label>

          <label className="block" htmlFor="region">
            <span className="text-sm font-semibold text-[#3E3730]">지역</span>
            <select
              id="region"
              className={selectClassName}
              value={form.region}
              onChange={(event) =>
                updateField('region', event.target.value as Region)
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

        {errorMessage && (
          <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
        >
          {isSubmitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </AuthPageShell>
  );
}

export default SignupPage;
