import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api';
import AuthPageShell from '../components/AuthPageShell';
import FormField from '../components/FormField';
import type { SignupRequest } from '../types';

const initialForm: SignupRequest = {
  email: '',
  password: '',
  nickname: '',
  phone: '',
};

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
