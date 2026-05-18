import { Link } from 'react-router-dom';

// 메인 홈 페이지입니다.
function HomePage() {
  return (
    <main className="px-6 py-12">
      <section className="mx-auto grid max-w-6xl gap-8 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-sm font-semibold text-[#E26B4A]">FORPETS MVP</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-[#2A2622] md:text-5xl">
            보호자와 펫시터를 연결하는 반려동물 케어 매칭 플랫폼
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#6F675F]">
            원하는 시터에게 직접 요청하거나, 공고를 올리고 시터의 제안을
            비교해 예약까지 이어갈 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
            >
              시작하기
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[#E7DCD1] bg-white px-5 py-3 text-sm font-bold text-[#2A2622]"
            >
              로그인
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-[#FAF6F1] p-5">
              <p className="text-xs font-bold text-[#E26B4A]">CARE REQUEST</p>
              <p className="mt-2 text-lg font-bold">시터에게 직접 요청</p>
              <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                지역과 가능 시간에 맞는 시터를 찾아 돌봄 요청을 보냅니다.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F4E9DE] p-5">
              <p className="text-xs font-bold text-[#3F5732]">POST PROPOSAL</p>
              <p className="mt-2 text-lg font-bold">공고 등록 후 제안 비교</p>
              <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                보호자가 조건을 올리면 시터가 제안하고 예약으로 연결됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
