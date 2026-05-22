import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CareRequestCreatePage from './pages/CareRequestCreatePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyActivityPage from './pages/MyActivityPage';
import MyProfilePage from './pages/MyProfilePage';
import MySitterProfilePage from './pages/MySitterProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import PetsPage from './pages/PetsPage';
import PostCreatePage from './pages/PostCreatePage';
import PostDetailPage from './pages/PostDetailPage';
import PostsPage from './pages/PostsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import ReservationsPage from './pages/ReservationsPage';
import SitterDetailPage from './pages/SitterDetailPage';
import SittersPage from './pages/SittersPage';
import SignupPage from './pages/SignupPage';

// 전체 페이지 라우팅을 관리하는 컴포넌트입니다.
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sitters" element={<SittersPage />} />
        <Route path="/sitters/:sitterId" element={<SitterDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/activity" element={<MyActivityPage />} />
          <Route path="/my-sitter" element={<MySitterProfilePage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/new" element={<PostCreatePage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/:reservationId" element={<ReservationDetailPage />} />
          <Route
            path="/sitters/:sitterId/requests/new"
            element={<CareRequestCreatePage />}
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

export default App;
