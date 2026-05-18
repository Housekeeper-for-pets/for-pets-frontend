import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/', label: '홈', icon: '⌂', group: '매칭' },
  { to: '/posts', label: '공고 보기', icon: '☰', group: '매칭' },
  { to: '/sitters', label: '시터 찾기', icon: '⌕', group: '매칭' },
  { to: '/activity', label: '요청/제안', icon: '↔', group: '매칭' },
  { to: '/reservations', label: '예약 관리', icon: '□', group: '관리' },
  { to: '/pets', label: '반려동물', icon: '◇', group: '관리' },
  { to: '/my-sitter', label: '내 시터', icon: '◌', group: '계정' },
  { to: '/me', label: '내 정보', icon: '♙', group: '계정' },
];

const navGroups = ['매칭', '관리', '계정'];

// 로그인 이후 주요 페이지에서 공통으로 사용하는 앱 레이아웃입니다.
function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const [keyword, setKeyword] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const submitSearch = () => {
    const nextKeyword = keyword.trim();

    if (!nextKeyword) {
      navigate('/posts');
      return;
    }

    navigate(`/posts?keyword=${encodeURIComponent(nextKeyword)}`);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  return (
    <div className="min-h-screen text-[#2A2622]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[236px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-[#E7DCD1] bg-[#FFFCF8]/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#2A2622]">
              포펫츠
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7AA9D]">
              MVP
            </span>
          </Link>

          <nav className="mt-9 space-y-7">
            {navGroups.map((group) => (
              <div key={group}>
                <p className="px-3 text-[11px] font-bold text-[#B7AA9D]">{group}</p>
                <div className="mt-2 grid gap-1">
                  {navItems
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                            isActive
                              ? 'bg-[#F7DFD2] text-[#2A2622] shadow-[inset_3px_0_0_#D96F4F]'
                              : 'text-[#786E64] hover:bg-[#F5EDE5] hover:text-[#2A2622]',
                          ].join(' ')
                        }
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/70 text-xs text-[#D96F4F]">
                          {item.icon}
                        </span>
                        {item.label}
                      </NavLink>
                    ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#F6EFE7] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F2D9CC] text-xs font-black text-[#B85B3D]">
                FP
              </span>
              <div>
                <p className="text-sm font-black text-[#2A2622]">ForPets</p>
                <p className="text-xs font-semibold text-[#8C8075]">
                  반려동물 케어 매칭
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#E7DCD1] bg-[#FFFCF8]/88 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-8">
              <Link to="/" className="font-black tracking-tight text-[#2A2622] lg:hidden">
                포펫츠
              </Link>

              <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
                <span className="text-xs font-bold text-[#B7AA9D]">홈</span>
                <div className="h-4 w-px bg-[#E7DCD1]" />
                <form className="relative w-full max-w-xs" onSubmit={handleSearchSubmit}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#B7AA9D]">
                    ⌕
                  </span>
                  <input
                    className="h-9 w-full rounded-xl border border-[#EEE4DA] bg-[#F6EFE7] pl-8 pr-3 text-xs font-semibold text-[#2A2622] placeholder:text-[#B7AA9D]"
                    placeholder="공고 검색"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitSearch();
                      }
                    }}
                  />
                  <button type="submit" className="sr-only">
                    검색
                  </button>
                </form>
              </div>

              <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto lg:hidden">
                {navItems.slice(0, 6).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      [
                        'shrink-0 rounded-full px-3 py-2 text-xs font-bold transition',
                        isActive
                          ? 'bg-[#D96F4F] text-white'
                          : 'bg-white text-[#786E64]',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#2A2622] px-4 py-2 text-xs font-bold text-white"
                  onClick={() => void handleLogout()}
                >
                  로그아웃
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-full px-4 py-2 text-xs font-bold text-[#6F675F] hover:bg-[#F4E9DE]"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-full bg-[#D96F4F] px-4 py-2 text-xs font-bold text-white"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
