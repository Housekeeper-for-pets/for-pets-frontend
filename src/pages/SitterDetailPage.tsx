import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSitterProfile } from '../api';
import {
  dayOfWeekLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterStatusLabels,
} from '../constants/options';
import type { SitterProfile } from '../types';

// 특정 시터의 프로필과 가능 시간을 보여주는 상세 페이지입니다.
function SitterDetailPage() {
  const { sitterId } = useParams<{ sitterId: string }>();
  const [sitter, setSitter] = useState<SitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // URL의 시터 ID로 상세 정보를 조회합니다.
  useEffect(() => {
    const fetchSitter = async () => {
      if (!sitterId) {
        setErrorMessage('시터 ID가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getSitterProfile(Number(sitterId));

        if (result.success) {
          setSitter(result.data);
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('시터 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSitter();
  }, [sitterId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-[24px] bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          시터 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage || !sitter) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-[24px] bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage || '시터 정보를 찾을 수 없습니다.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">
                {getRegionLabel(sitter.region)}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
                {sitter.experienceYears}년 경력 펫시터
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6F675F]">
                {sitter.introduction || '아직 자기소개가 등록되지 않았습니다.'}
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#EEF7EA] px-3 py-1 text-xs font-bold text-[#3F5732]">
              {sitterStatusLabels[sitter.status]}
            </span>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">가능 동물</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {possiblePetTypeLabels[sitter.possiblePetType]}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">가능 크기</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {possiblePetSizeLabels[sitter.possiblePetSize]}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">시간당 요금</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {sitter.pricePerHour.toLocaleString()}원
              </dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">REQUEST</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">돌봄 요청</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            반려동물과 돌봄 시간을 선택해 이 시터에게 직접 요청할 수 있습니다.
          </p>
          <Link
            to={`/sitters/${sitter.id}/requests/new`}
            className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white"
          >
            요청 작성하기
          </Link>
        </aside>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">SCHEDULE</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              가능한 시간
            </h2>
          </div>
          <p className="text-sm font-semibold text-[#6F675F]">
            {sitter.schedules.length}개
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sitter.schedules.length === 0 && (
            <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F] md:col-span-2">
              아직 등록된 가능 시간이 없습니다.
            </p>
          )}

          {sitter.schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-2xl bg-[#FAF6F1] p-4"
            >
              <span className="text-sm font-bold text-[#2A2622]">
                {dayOfWeekLabels[schedule.dayOfWeek]}
              </span>
              <span className="text-sm font-semibold text-[#6F675F]">
                {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default SitterDetailPage;
