import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import AuthPageShell from '../components/AuthPageShell';
import FormField from '../components/FormField';
import type { LoginRequest } from '../types';

const initialForm: LoginRequest = {
  email: '',
  password: '',
};

// 이메일과 비밀번호로 로그인하는 페이지입니다.
function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginRequest>(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력값이 바뀔 때 로그인 요청 상태를 갱신합니다.
  const updateField = (name: keyof LoginRequest, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // 로그인 API를 호출하고 성공하면 홈으로 이동합니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(form);

      if (result.success) {
        navigate('/');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="로그인"
      description="ForPets 계정으로 보호자와 시터 매칭 기능을 이용해 보세요."
      footerText="아직 계정이 없나요?"
      footerLinkText="회원가입"
      footerLinkTo="/signup"
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
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          required
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
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
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </AuthPageShell>
  );
}

export default LoginPage;
