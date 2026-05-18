import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/sitters', label: '시터 찾기' },
  { to: '/my-sitter', label: '내 시터' },
  { to: '/posts', label: '공고 보기' },
  { to: '/reservations', label: '예약 관리' },
  { to: '/pets', label: '반려동물' },
];

// 로그인 이후 주요 페이지에서 공통으로 사용하는 앱 레이아웃입니다.
function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#2A2622]">
      <header className="border-b border-[#E7DCD1] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-[#2A2622]">
            ForPets
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-[#E26B4A] text-white'
                      : 'text-[#6F675F] hover:bg-[#F4E9DE] hover:text-[#2A2622]',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#6F675F] hover:bg-[#F4E9DE]"
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-[#2A2622] px-4 py-2 text-sm font-semibold text-white"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

export default AppLayout;
