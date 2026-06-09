import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminReservationCancelRequests,
  getPendingAdminSitters,
} from '../api';

// 관리자 허브 — 시터 승인과 취소 요청 처리 페이지로 분기합니다.
function AdminPage() {
  const [sitterCount, setSitterCount] = useState(0);
  const [cancelCount, setCancelCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [sitterResult, cancelResult] = await Promise.all([
          getPendingAdminSitters(),
          getAdminReservationCancelRequests(),
        ]);

        if (sitterResult.success) {
          setSitterCount(sitterResult.data.totalElements);
        } else {
          setErrorMessage(sitterResult.error.message);
        }

        if (cancelResult.success) {
          setCancelCount(cancelResult.data.totalElements);
        } else {
          setErrorMessage(cancelResult.error.message);
        }
      } catch {
        setErrorMessage('관리자 데이터를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCounts();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section>
        <p className="text-sm font-bold text-[#E26B4A]">ADMIN</p>
        <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">관리자 콘솔</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
          시터 프로필 승인과 불가피한 예약 취소 요청을 분리된 화면에서 처리합니다.
        </p>
      </section>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <AdminHubCard
          to="/admin/sitters"
          label="SITTER APPROVAL"
          title="시터 승인"
          count={isLoading ? null : sitterCount}
          description="시터 등록 신청을 검토하고 승인/거절합니다."
        />
        <AdminHubCard
          to="/admin/cancellations"
          label="CANCEL REQUESTS"
          title="불가피한 취소 요청 승인"
          count={isLoading ? null : cancelCount}
          description="환불·정산이 필요한 취소 요청을 처리합니다."
        />
      </section>
    </main>
  );
}

interface AdminHubCardProps {
  to: string;
  label: string;
  title: string;
  count: number | null;
  description: string;
}

function AdminHubCard({ to, label, title, count, description }: AdminHubCardProps) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm transition hover:border-[#E26B4A]"
    >
      <p className="text-sm font-bold text-[#E26B4A]">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-[#2A2622]">{title}</h2>
        <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-xs font-bold text-[#B44727]">
          {count === null ? '불러오는 중' : `${count}건 대기`}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6F675F]">{description}</p>
      <p className="mt-5 text-sm font-bold text-[#2A2622]">바로 이동 →</p>
    </Link>
  );
}

export default AdminPage;
