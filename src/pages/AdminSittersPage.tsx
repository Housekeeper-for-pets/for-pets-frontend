import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingAdminSitters } from '../api';
import {
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterApprovalStatusLabels,
} from '../constants/options';
import type { AdminSitterProfile } from '../types';

// 관리자 시터 승인 대기 목록 페이지입니다. 시터 클릭 시 상세 페이지로 이동합니다.
function AdminSittersPage() {
  const [sitters, setSitters] = useState<AdminSitterProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSitters = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await getPendingAdminSitters();

      if (result.success) {
        setSitters(result.data.content);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('승인 대기 시터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSitters();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Link
            to="/admin"
            className="text-xs font-bold text-[#6F675F] hover:text-[#E26B4A]"
          >
            ← 관리자 콘솔로
          </Link>
          <p className="mt-3 text-sm font-bold text-[#E26B4A]">SITTER APPROVAL</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">시터 승인</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            시터를 클릭하면 회원 정보와 등록한 시터 프로필을 함께 확인하고 승인/거절할 수
            있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSitters()}
          className="w-fit rounded-full bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
        >
          새로고침
        </button>
      </section>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          승인 대기 시터를 불러오는 중입니다.
        </p>
      ) : sitters.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          승인 대기 시터가 없습니다.
        </p>
      ) : (
        <section className="mt-6 grid gap-3">
          {sitters.map((sitter) => (
            <Link
              key={sitter.id}
              to={`/admin/sitters/${sitter.id}`}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E7DCD1] bg-white px-5 py-4 shadow-sm transition hover:border-[#E26B4A] md:flex-row md:items-center"
            >
              <div className="flex-1">
                <p className="text-xs font-bold text-[#E26B4A]">
                  #{sitter.id} · 회원 #{sitter.memberId} ·{' '}
                  {getRegionLabel(sitter.region)}
                </p>
                <p className="mt-1 text-base font-bold text-[#2A2622]">
                  경력 {sitter.experienceYears}년 ·{' '}
                  {sitter.pricePerHour.toLocaleString('ko-KR')}원/시간 ·{' '}
                  {possiblePetTypeLabels[sitter.possiblePetType]} ·{' '}
                  {possiblePetSizeLabels[sitter.possiblePetSize]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                  {sitterApprovalStatusLabels[sitter.approvalStatus]}
                </span>
                <span className="text-xs font-bold text-[#E26B4A]">상세 →</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

export default AdminSittersPage;
