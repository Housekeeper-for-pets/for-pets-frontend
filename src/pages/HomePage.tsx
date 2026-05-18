import { Link } from 'react-router-dom';

// 메인 홈 페이지입니다.
function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="fp-kicker">FORPETS MVP</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2A2622]">
            안녕하세요, 몽치보호자님
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7D7368]">
            서울 강남구 역삼동 · 오늘 새 제안과 예약 흐름을 확인해 보세요.
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

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          { label: '새 제안', value: '4건', hint: '+3 오늘', active: true },
          { label: '활성 공고', value: '1건', hint: '조회 47회' },
          { label: '예정된 예약', value: '2건', hint: 'D-7 이내 1건' },
          { label: '반려동물', value: '3마리', hint: '강아지 2 · 고양이 1' },
        ].map((item) => (
          <article
            key={item.label}
            className={[
              'rounded-2xl border p-5 shadow-sm',
              item.active
                ? 'border-[#D96F4F] bg-[#D96F4F] text-white shadow-[#D96F4F]/20'
                : 'border-[#E7DCD1] bg-white/90 text-[#2A2622]',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold',
                item.active ? 'text-white/75' : 'text-[#9B8E82]',
              ].join(' ')}
            >
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight">{item.value}</p>
            <p
              className={[
                'mt-2 text-xs font-bold',
                item.active ? 'text-white/80' : 'text-[#7A955F]',
              ].join(' ')}
            >
              {item.hint}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-5">
          <article className="fp-shell-card rounded-2xl p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <span className="rounded-full bg-[#EAF0E1] px-3 py-1 text-xs font-black text-[#6E8754]">
                  모집 중
                </span>
                <h2 className="mt-3 text-xl font-black text-[#2A2622]">
                  5월 20일 강아지·고양이 종일 돌봄 부탁드려요
                </h2>
                <p className="mt-2 text-sm font-semibold text-[#7D7368]">
                  일정 5월 20일 09:00-18:00 · 희망 예산 120,000원
                </p>
              </div>
              <Link
                to="/posts"
                className="text-sm font-black text-[#D96F4F]"
              >
                전체 비교하기
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ['댕댕시터', '강남 5년 · 산책 가능', '120,000원', '96%'],
                ['포포시터', '서초 7년 · 고양이 전문', '135,000원', '88%'],
                ['멍멍이모', '송파 3년 · 가격 합리', '96,000원', '72%'],
              ].map(([name, meta, price, score]) => (
                <div
                  key={name}
                  className="grid gap-3 rounded-xl border border-[#EFE5DA] bg-[#FFFCF8] p-4 md:grid-cols-[1fr_auto]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F1E9DF] text-xs font-black text-[#B8AA9D]">
                      펫
                    </span>
                    <div>
                      <p className="font-black text-[#2A2622]">{name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#8C8075]">
                        {meta}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <span className="text-sm font-black text-[#7A955F]">{score}</span>
                    <span className="text-lg font-black text-[#2A2622]">{price}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="fp-shell-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="fp-kicker">UPCOMING</p>
                <h2 className="mt-2 text-xl font-black">예정된 예약</h2>
              </div>
              <Link to="/reservations" className="text-sm font-black text-[#D96F4F]">
                전체 보기
              </Link>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#FFFCF8] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#F4EDE5] text-[10px] font-black text-[#B8AA9D]">
                  SITTER
                </span>
                <div>
                  <p className="font-black">댕댕시터</p>
                  <p className="mt-1 text-xs font-semibold text-[#8C8075]">
                    5월 20일 09:00-18:00
                  </p>
                </div>
              </div>
              <Link
                to="/reservations"
                className="rounded-xl border border-[#E7DCD1] px-4 py-2 text-sm font-black"
              >
                상세
              </Link>
            </div>
          </article>
        </div>

        <aside className="grid gap-5">
          <section className="fp-shell-card rounded-2xl p-5">
            <p className="fp-kicker">RECENT</p>
            <h2 className="mt-2 text-xl font-black">최근 활동</h2>
            <ul className="mt-5 grid gap-3">
              {[
                '댕댕시터님이 제안을 보냈습니다',
                '포포시터님이 제안을 보냈습니다',
                '내 공고가 47회 조회되었습니다',
                '멍멍이모님이 제안을 보냈습니다',
              ].map((text, index) => (
                <li key={text} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#D96F4F]" />
                  <div>
                    <p className="font-bold text-[#2A2622]">{text}</p>
                    <p className="mt-1 text-xs font-semibold text-[#A89D91]">
                      {index + 1}시간 전
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="fp-shell-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="fp-kicker">PETS</p>
                <h2 className="mt-2 text-xl font-black">내 반려동물</h2>
              </div>
              <Link to="/pets" className="text-sm font-black text-[#D96F4F]">
                추가
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {['몽치 · 말티즈 · 3살', '나비 · 코리안숏헤어 · 5살', '보리 · 시바견 · 2살'].map(
                (pet) => (
                  <div key={pet} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F4EDE5] text-[10px] font-black text-[#B8AA9D]">
                      PET
                    </span>
                    <p className="text-sm font-bold text-[#6F675F]">{pet}</p>
                  </div>
                ),
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default HomePage;
