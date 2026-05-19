import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// 인증이 필요한 페이지에 비로그인 사용자가 접근하면 로그인 페이지로 이동시킵니다.
function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
