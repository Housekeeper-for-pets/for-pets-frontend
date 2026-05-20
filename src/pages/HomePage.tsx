import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const serviceSteps = [
  {
    label: '순방향 매칭',
    title: '시터를 직접 찾고 요청하기',
    description: '지역, 돌봄 가능 시간, 반려동물 조건을 보고 원하는 시터에게 바로 요청합니다.',
  },
  {
    label: '역방향 매칭',
    title: '공고를 올리고 제안 비교하기',
    description: '보호자가 케어 조건을 올리면 시터가 제안하고, 보호자는 조건을 비교합니다.',
  },
  {
    label: '예약 관리',
    title: '수락 이후 예약으로 연결하기',
    description: '요청 수락 또는 제안 채택 이후 예약 상태를 확인하고 확정합니다.',
  },
];

const onboardingCards = [
  {
    title: '반려동물 등록',
    description: '돌봄 요청과 공고에 포함할 반려동물 정보를 먼저 등록합니다.',
    to: '/pets',
    cta: '등록하기',
  },
  {
    title: '시터 찾기',
    description: '내 지역과 돌봄 조건에 맞는 시터를 찾아 직접 요청합니다.',
    to: '/sitters',
    cta: '찾아보기',
  },
  {
    title: '공고 작성',
    description: '케어 일정과 예산을 등록하고 시터들의 제안을 받아봅니다.',
    to: '/posts/new',
    cta: '작성하기',
  },
];

// 메인 홈 페이지입니다.
function HomePage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PublicHome />;
  }

  return <SignedInHome />;
}

// 로그인 전 사용자가 서비스의 핵심 흐름을 이해하고 가입할 수 있도록 안내합니다.
function PublicHome() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <section className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <img
            src="/forpets-logo-balanced.png"
            alt="포펫츠 로고"
            className="h-28 w-28 rounded-3xl object-cover shadow-sm shadow-[#D96F4F]/10"
          />
          <p className="fp-kicker mt-5">FORPETS MVP</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight text-[#2A2622] md:text-5xl">
            보호자와 펫시터가 조건으로 만나는 케어 매칭 플랫폼
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-[#6F675F]">
            직접 시터를 찾아 요청하거나, 공고를 등록해 시터의 제안을 비교하세요.
            모든 흐름은 예약 상태 관리로 이어집니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-xl bg-[#D96F4F] px-5 py-3 text-sm font-black text-white shadow-sm shadow-[#D96F4F]/20"
            >
              회원가입
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[#E7DCD1] bg-white px-5 py-3 text-sm font-black text-[#2A2622] shadow-sm"
            >
              로그인
            </Link>
          </div>
        </div>

        <div className="fp-shell-card rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-[#EFE5DA] pb-4">
            <div>
              <p className="fp-kicker">MATCHING FLOW</p>
              <h2 className="mt-2 text-xl font-black text-[#2A2622]">
                ForPets MVP 흐름
              </h2>
            </div>
            <span className="rounded-full bg-[#F7DFD2] px-3 py-1 text-xs font-black text-[#B85B3D]">
              v1
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {serviceSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-xl border border-[#EFE5DA] bg-[#FFFCF8] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1E9DF] text-xs font-black text-[#D96F4F]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-black text-[#D96F4F]">{step.label}</p>
                    <h3 className="mt-1 font-black text-[#2A2622]">{step.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-[#6F675F]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// 로그인 후 아직 활동 데이터가 없을 수 있는 사용자를 위한 홈 화면입니다.
function SignedInHome() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <img
            src="/forpets-logo-balanced.png"
            alt="포펫츠 로고"
            className="h-28 w-28 rounded-3xl object-cover shadow-sm shadow-[#D96F4F]/10"
          />
          <p className="fp-kicker mt-5">HOME</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2A2622]">
            매칭을 시작해볼까요?
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7D7368]">
            반려동물 등록, 시터 찾기, 공고 작성 중 필요한 작업부터 진행하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/sitters"
            className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2.5 text-sm font-black text-[#2A2622] shadow-sm"
          >
            시터 찾기
          </Link>
          <Link
            to="/posts/new"
            className="rounded-xl bg-[#D96F4F] px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-[#D96F4F]/20"
          >
            공고 등록
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {onboardingCards.map((card) => (
          <article key={card.title} className="fp-shell-card rounded-2xl p-5">
            <h2 className="text-xl font-black text-[#2A2622]">{card.title}</h2>
            <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-[#6F675F]">
              {card.description}
            </p>
            <Link
              to={card.to}
              className="mt-5 inline-flex rounded-xl bg-[#2A2622] px-4 py-2.5 text-sm font-black text-white"
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <article className="fp-shell-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="fp-kicker">ACTIVITY</p>
              <h2 className="mt-2 text-xl font-black text-[#2A2622]">최근 활동</h2>
            </div>
            <Link to="/activity" className="text-sm font-black text-[#D96F4F]">
              요청/제안 보기
            </Link>
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-[#E3D6C8] bg-[#FFFCF8] p-6 text-center">
            <p className="text-sm font-black text-[#2A2622]">아직 표시할 활동이 없습니다.</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#7D7368]">
              공고를 등록하거나 시터에게 요청을 보내면 이곳에서 흐름을 확인할 수 있습니다.
            </p>
          </div>
        </article>

        <aside className="fp-shell-card rounded-2xl p-5">
          <p className="fp-kicker">NEXT STEP</p>
          <h2 className="mt-2 text-xl font-black text-[#2A2622]">추천 시작 순서</h2>
          <ol className="mt-5 grid gap-3">
            {['내 정보에서 지역 설정', '반려동물 프로필 등록', '시터 찾기 또는 공고 작성'].map(
              (item, index) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F7DFD2] text-xs font-black text-[#B85B3D]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-[#6F675F]">{item}</span>
                </li>
              ),
            )}
          </ol>
        </aside>
      </section>
    </main>
  );
}

export default HomePage;
