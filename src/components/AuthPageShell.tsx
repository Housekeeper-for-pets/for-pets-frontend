import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthPageShellProps {
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
  children: ReactNode;
}

// 인증 페이지의 공통 카드형 화면 구조입니다.
function AuthPageShell({
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[#FAF6F1] px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-7 shadow-sm">
          <Link to="/" className="text-sm font-bold text-[#E26B4A]">
            ForPets
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#2A2622]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6F675F]">{description}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-center text-sm text-[#6F675F]">
            {footerText}{' '}
            <Link className="font-semibold text-[#E26B4A]" to={footerLinkTo}>
              {footerLinkText}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthPageShell;
