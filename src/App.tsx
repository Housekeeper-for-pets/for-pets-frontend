import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import AdminCancellationsPage from './pages/AdminCancellationsPage';
import AdminSitterDetailPage from './pages/AdminSitterDetailPage';
import AdminSittersPage from './pages/AdminSittersPage';
import AiSitterChatPage from './pages/AiSitterChatPage';
import CareRequestCreatePage from './pages/CareRequestCreatePage';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyActivityPage from './pages/MyActivityPage';
import MyProfilePage from './pages/MyProfilePage';
import MyReviewsPage from './pages/MyReviewsPage';
import MySitterProfilePage from './pages/MySitterProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import PetsPage from './pages/PetsPage';
import PaymentsPage from './pages/PaymentsPage';
import PostCreatePage from './pages/PostCreatePage';
import PostDetailPage from './pages/PostDetailPage';
import PostsPage from './pages/PostsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import ReservationsPage from './pages/ReservationsPage';
import SettlementsPage from './pages/SettlementsPage';
import SitterDetailPage from './pages/SitterDetailPage';
import SittersPage from './pages/SittersPage';
import SignupPage from './pages/SignupPage';

// 전체 페이지 라우팅을 관리하는 컴포넌트입니다.
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        {/* 비로그인 상태에서도 시터/공고 목록과 상세는 열어 둡니다. */}
        <Route path="/sitters" element={<SittersPage />} />
        <Route path="/sitters/:sitterId" element={<SitterDetailPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/ai-chat" element={<AiSitterChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/activity" element={<MyActivityPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/sitters" element={<AdminSittersPage />} />
          <Route
            path="/admin/sitters/:sitterProfileId"
            element={<AdminSitterDetailPage />}
          />
          <Route
            path="/admin/cancellations"
            element={<AdminCancellationsPage />}
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/my-reviews" element={<MyReviewsPage />} />
          <Route path="/my-sitter" element={<MySitterProfilePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/posts/new" element={<PostCreatePage />} />
          <Route path="/posts/:postId/edit" element={<PostCreatePage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/:reservationId" element={<ReservationDetailPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
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
