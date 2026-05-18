import { Link } from 'react-router-dom';

// 존재하지 않는 경로로 접근했을 때 보여주는 페이지입니다.
function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-2xl border border-[#E7DCD1] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-[#E26B4A]">404</p>
        <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6F675F]">
          주소가 변경되었거나 아직 준비되지 않은 화면입니다. 홈에서 다시 이동해 주세요.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
        >
          홈으로 이동
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;
