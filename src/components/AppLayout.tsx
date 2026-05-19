import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getMyInfo, getMyPets } from '../api';
import { useAuth } from '../hooks/useAuth';
import type { Member, Pet } from '../types';
import BrandLogo from './BrandLogo';

const navItems = [
  { to: '/', label: '홈', icon: 'home', group: '매칭' },
  { to: '/posts', label: '공고 보기', icon: 'post', group: '매칭' },
  { to: '/sitters', label: '시터 찾기', icon: 'sitter', group: '매칭' },
  { to: '/activity', label: '요청/제안', icon: 'activity', group: '매칭' },
  { to: '/reservations', label: '예약 관리', icon: 'calendar', group: '관리' },
  { to: '/pets', label: '반려동물', icon: 'paw', group: '관리' },
  { to: '/my-sitter', label: '내 시터', icon: 'badge', group: '계정' },
  { to: '/me', label: '내 정보', icon: 'user', group: '계정' },
];

const navGroups = ['매칭', '관리', '계정'];

const iconPaths = {
  home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z',
  post: 'M5 5h14v14H5z M8 9h8 M8 13h8 M8 17h5',
  sitter: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21a8 8 0 0 1 16 0 M16.5 7.5l2-2 M18.5 5.5l1.5 1.5',
  activity: 'M5 12h4l2-5 4 10 2-5h2 M6 19h12',
  calendar: 'M7 3v4 M17 3v4 M4 8h16 M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  paw: 'M8.5 10.5c1.1 0 2-1.2 2-2.7s-.9-2.8-2-2.8-2 1.2-2 2.8.9 2.7 2 2.7Z M15.5 10.5c1.1 0 2-1.2 2-2.7s-.9-2.8-2-2.8-2 1.2-2 2.8.9 2.7 2 2.7Z M5.5 14.5c.9 0 1.6-.9 1.6-2s-.7-2-1.6-2-1.6.9-1.6 2 .7 2 1.6 2Z M18.5 14.5c.9 0 1.6-.9 1.6-2s-.7-2-1.6-2-1.6.9-1.6 2 .7 2 1.6 2Z M8 17.5c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.8-1.1 3-4 3s-4-1.2-4-3Z',
  badge: 'M12 3l7 4v5c0 4.2-2.8 7.2-7 9-4.2-1.8-7-4.8-7-9V7l7-4Z M9 12l2 2 4-4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M5 21a7 7 0 0 1 14 0',
} as const;

type NavIconName = keyof typeof iconPaths;

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

// 로그인 이후 주요 페이지에서 공통으로 사용하는 앱 레이아웃입니다.
function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchSidebarProfile = async () => {
      const [memberResult, petsResult] = await Promise.allSettled([
        getMyInfo(),
        getMyPets(),
      ]);

      if (memberResult.status === 'fulfilled' && memberResult.value.success) {
        setMember(memberResult.value.data);
      }

      if (petsResult.status === 'fulfilled' && petsResult.value.success) {
        setPets(petsResult.value.data);
      }
    };

    void fetchSidebarProfile();
  }, [isAuthenticated]);

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

  const primaryPetName = pets[0]?.name;
  const sidebarTitle = primaryPetName
    ? `${primaryPetName} 보호자님`
    : member?.nickname
      ? `${member.nickname}님`
      : 'ForPets';
  const sidebarDescription =
    member?.nickname && primaryPetName
      ? `${member.nickname}님의 반려동물 케어`
      : '반려동물 케어 매칭';
  const sidebarInitial = (primaryPetName ?? member?.nickname ?? 'F').slice(0, 1);

  return (
    <div className="min-h-screen text-[#2A2622]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[236px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-[#E7DCD1] bg-[#FFFCF8]/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="flex items-baseline gap-2">
            <BrandLogo />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7AA9D]">
              MVP
            </span>
          </div>

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
                          <NavIcon name={item.icon as NavIconName} />
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
                {sidebarInitial}
              </span>
              <div>
                <p className="text-sm font-black text-[#2A2622]">{sidebarTitle}</p>
                <p className="text-xs font-semibold text-[#8C8075]">
                  {sidebarDescription}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#E7DCD1] bg-[#FFFCF8]/88 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-8">
              <div className="lg:hidden">
                <BrandLogo compact />
              </div>

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
