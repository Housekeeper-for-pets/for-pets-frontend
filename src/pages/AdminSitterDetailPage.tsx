import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  approveAdminSitter,
  getAdminSitterDetail,
  rejectAdminSitter,
} from '../api';
import {
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterApprovalStatusLabels,
  sitterStatusLabels,
} from '../constants/options';
import type { AdminSitterDetail, MemberGender } from '../types';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const genderLabels: Record<MemberGender, string> = {
  MALE: '남성',
  FEMALE: '여성',
  UNKNOWN: '미지정',
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-';

// 관리자 시터 상세 — 시터 프로필 + 신청자 회원 정보를 한 번에 조회하고 승인/거절합니다.
function AdminSitterDetailPage() {
  const navigate = useNavigate();
  const { sitterProfileId } = useParams<{ sitterProfileId: string }>();
  const [detail, setDetail] = useState<AdminSitterDetail | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSitter = async () => {
    if (!sitterProfileId) {
      setErrorMessage('시터 ID가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await getAdminSitterDetail(Number(sitterProfileId));

      if (result.success) {
        setDetail(result.data);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 상세 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSitter();
    // sitterProfileId가 바뀌면 다시 조회합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitterProfileId]);

  const handleApprove = async () => {
    if (!sitterProfileId) return;

    setSuccessMessage('');
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const result = await approveAdminSitter(Number(sitterProfileId));

      if (result.success) {
        setSuccessMessage(`시터 프로필 #${result.data.id} 승인을 완료했습니다.`);
        window.setTimeout(() => navigate('/admin/sitters'), 700);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 승인 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sitterProfileId) return;

    if (rejectReason.trim().length < 10) {
      setErrorMessage('거절 사유는 10자 이상 입력해 주세요.');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const result = await rejectAdminSitter(Number(sitterProfileId), {
        rejectReason: rejectReason.trim(),
      });

      if (result.success) {
        setSuccessMessage(`시터 프로필 #${result.data.id} 거절을 완료했습니다.`);
        window.setTimeout(() => navigate('/admin/sitters'), 700);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 거절 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          시터 상세 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage || '시터 상세 정보를 찾을 수 없습니다.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to="/admin/sitters"
        className="text-xs font-bold text-[#6F675F] hover:text-[#E26B4A]"
      >
        ← 시터 승인 목록으로
      </Link>

      <section className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">SITTER DETAIL</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
            {detail.nickname}{' '}
            <span className="text-xl font-bold text-[#6F675F]">
              · 시터 프로필 #{detail.sitterProfileId}
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            신청자 회원 정보와 등록된 시터 프로필을 확인하고 승인 또는 거절을
            결정합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#F4E9DE] px-4 py-2 text-sm font-bold text-[#6F675F]">
          {sitterApprovalStatusLabels[detail.approvalStatus]}
        </span>
      </section>

      {(errorMessage || successMessage) && (
        <p
          className={[
            'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
            errorMessage
              ? 'bg-[#FFF0EA] text-[#B44727]'
              : 'bg-[#EEF7EA] text-[#3F5732]',
          ].join(' ')}
        >
          {errorMessage || successMessage}
        </p>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">MEMBER</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">신청자 회원 정보</h2>
          <dl className="mt-5 grid gap-3 md:grid-cols-2">
            <InfoCell label="회원 ID" value={`#${detail.memberId}`} />
            <InfoCell label="닉네임" value={detail.nickname} />
            <InfoCell label="이메일" value={detail.email} />
            <InfoCell label="전화번호" value={detail.phone} />
            <InfoCell label="활동 지역" value={getRegionLabel(detail.region)} />
            <InfoCell
              label="성별"
              value={detail.gender ? genderLabels[detail.gender] : '-'}
            />
            <InfoCell label="가입일" value={formatDateTime(detail.memberCreatedAt)} />
          </dl>
        </article>

        <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">APPROVAL</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">승인 처리</h2>

          {detail.approvalStatus === 'PENDING' ? (
            <>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleApprove()}
                className="mt-5 w-full rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
              >
                {isProcessing ? '처리 중...' : '승인'}
              </button>

              <form className="mt-3" onSubmit={handleReject}>
                <input
                  className={inputClassName}
                  placeholder="거절 사유 10자 이상"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="mt-3 w-full rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#B44727] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
                >
                  거절
                </button>
              </form>
            </>
          ) : (
            <div className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
              <p>
                이미 {sitterApprovalStatusLabels[detail.approvalStatus]} 상태입니다.
              </p>
              {detail.evaluatedAt && (
                <p className="mt-2 text-xs text-[#8A8178]">
                  처리 시각: {formatDateTime(detail.evaluatedAt)}
                  {detail.evaluatedBy ? ` · 관리자 #${detail.evaluatedBy}` : ''}
                </p>
              )}
              {detail.rejectReason && (
                <p className="mt-2 text-xs text-[#8A8178]">
                  거절 사유: {detail.rejectReason}
                </p>
              )}
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-[#E26B4A]">PROFILE</p>
        <h2 className="mt-3 text-xl font-bold text-[#2A2622]">시터 프로필</h2>
        <dl className="mt-5 grid gap-3 md:grid-cols-2">
          <InfoCell label="경력" value={`${detail.experienceYears}년`} />
          <InfoCell
            label="시간당 요금"
            value={`${detail.pricePerHour.toLocaleString('ko-KR')}원`}
          />
          <InfoCell
            label="가능 동물"
            value={possiblePetTypeLabels[detail.possiblePetType]}
          />
          <InfoCell
            label="가능 크기"
            value={possiblePetSizeLabels[detail.possiblePetSize]}
          />
          <InfoCell label="예약 상태" value={sitterStatusLabels[detail.status]} />
          <InfoCell
            label="프로필 등록일"
            value={formatDateTime(detail.profileCreatedAt)}
          />
        </dl>
        {detail.introduction && (
          <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
            {detail.introduction}
          </p>
        )}
      </section>
    </main>
  );
}

interface InfoCellProps {
  label: string;
  value: string;
}

function InfoCell({ label, value }: InfoCellProps) {
  return (
    <div className="rounded-2xl bg-[#FAF6F1] p-4">
      <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
    </div>
  );
}

export default AdminSitterDetailPage;
