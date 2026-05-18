import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createProposal, getPost, getPostProposals } from '../api';
import {
  careTypeLabels,
  getRegionLabel,
  postStatusLabels,
} from '../constants/options';
import type { Post, Proposal, ProposalRequest } from '../types';

const initialProposalForm: ProposalRequest = {
  proposedPrice: 50000,
  message: '',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const proposalStatusLabels = {
  PENDING: '대기',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  WITHDRAWN: '철회됨',
} as const;

// 공고 상세를 보여주고 시터가 제안을 등록할 수 있는 페이지입니다.
function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalForm, setProposalForm] =
    useState<ProposalRequest>(initialProposalForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [proposalErrorMessage, setProposalErrorMessage] = useState('');
  const [proposalSuccessMessage, setProposalSuccessMessage] = useState('');

  // URL의 공고 ID로 공고 상세와 제안 목록을 조회합니다.
  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!postId) {
        setErrorMessage('공고 ID가 올바르지 않습니다.');
        setIsLoading(false);
        setIsLoadingProposals(false);
        return;
      }

      try {
        const result = await getPost(Number(postId));

        if (result.success) {
          setPost(result.data);
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('공고 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProposals = async () => {
      if (!postId) {
        return;
      }

      try {
        const result = await getPostProposals(Number(postId));

        if (result.success) {
          setProposals(result.data);
          return;
        }
      } catch {
        // 제안 목록은 권한에 따라 조회가 막힐 수 있어 상세 렌더링은 계속합니다.
      } finally {
        setIsLoadingProposals(false);
      }
    };

    void fetchPostDetail();
    void fetchProposals();
  }, [postId]);

  // 제안 등록 전 필수 입력값을 확인합니다.
  const validateProposal = () => {
    if (proposalForm.proposedPrice <= 0) {
      return '제안 금액은 0보다 커야 합니다.';
    }

    return '';
  };

  // 시터가 현재 공고에 제안을 등록합니다.
  const handleProposalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProposalErrorMessage('');
    setProposalSuccessMessage('');

    const validationMessage = validateProposal();

    if (validationMessage) {
      setProposalErrorMessage(validationMessage);
      return;
    }

    if (!postId) {
      setProposalErrorMessage('공고 ID가 올바르지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createProposal(Number(postId), proposalForm);

      if (result.success) {
        setProposals((prevProposals) => [result.data, ...prevProposals]);
        setProposalForm(initialProposalForm);
        setProposalSuccessMessage('제안이 등록되었습니다.');
        return;
      }

      setProposalErrorMessage(result.error.message);
    } catch {
      setProposalErrorMessage('제안 등록 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-[24px] bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          공고 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage || !post) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-[24px] bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage || '공고 정보를 찾을 수 없습니다.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-7 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-xs font-bold text-[#B44727]">
              {careTypeLabels[post.careType]}
            </span>
            <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
              {getRegionLabel(post.region)}
            </span>
            <span className="rounded-full bg-[#EEF7EA] px-3 py-1 text-xs font-bold text-[#3F5732]">
              {postStatusLabels[post.status]}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-[#2A2622]">{post.title}</h1>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#6F675F]">
            {post.content}
          </p>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">희망 예산</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {post.budgetAmount.toLocaleString()}원
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">반려동물</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {post.pets.length}마리
              </dd>
            </div>
            <div className="rounded-2xl bg-[#FAF6F1] p-4">
              <dt className="text-xs font-bold text-[#9B8E82]">시간 슬롯</dt>
              <dd className="mt-2 text-lg font-bold text-[#2A2622]">
                {post.timeSlots.length}개
              </dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">PROPOSAL</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">제안 등록</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            가능한 공고라면 제안 금액과 메시지를 보내 보호자에게 지원할 수 있습니다.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleProposalSubmit}>
            <label className="block" htmlFor="proposedPrice">
              <span className="text-sm font-bold text-[#2A2622]">제안 금액</span>
              <input
                id="proposedPrice"
                className={`mt-2 ${inputClassName}`}
                type="number"
                min={1}
                value={proposalForm.proposedPrice}
                onChange={(event) =>
                  setProposalForm((prevForm) => ({
                    ...prevForm,
                    proposedPrice: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="block" htmlFor="proposalMessage">
              <span className="text-sm font-bold text-[#2A2622]">제안 메시지</span>
              <textarea
                id="proposalMessage"
                className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
                placeholder="가능한 케어 방식과 본인의 강점을 적어주세요."
                value={proposalForm.message}
                onChange={(event) =>
                  setProposalForm((prevForm) => ({
                    ...prevForm,
                    message: event.target.value,
                  }))
                }
              />
            </label>

            {proposalErrorMessage && (
              <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
                {proposalErrorMessage}
              </p>
            )}
            {proposalSuccessMessage && (
              <p className="rounded-2xl bg-[#EEF7EA] px-4 py-3 text-sm font-medium text-[#3F5732]">
                {proposalSuccessMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || post.status !== 'OPEN'}
              className="w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
            >
              {isSubmitting ? '제안 등록 중...' : '제안 보내기'}
            </button>
          </form>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">PETS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                포함된 반려동물
              </h2>
            </div>
            <Link
              to="/posts"
              className="rounded-full border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
            >
              목록으로
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {post.pets.map((pet) => (
              <article key={`${pet.petId ?? pet.name}`} className="rounded-2xl bg-[#FAF6F1] p-4">
                <h3 className="text-sm font-bold text-[#2A2622]">{pet.name}</h3>
                <p className="mt-1 text-xs text-[#6F675F]">
                  {[pet.breed, pet.age ? `${pet.age}살` : null, pet.size]
                    .filter(Boolean)
                    .join(' · ') || pet.species}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">TIME SLOTS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">돌봄 시간</h2>
            </div>
            <p className="text-sm font-semibold text-[#6F675F]">
              {post.timeSlots.length}개
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {post.timeSlots.map((timeSlot, index) => (
              <div
                key={`${timeSlot.careDate}-${timeSlot.startTime}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-[#FAF6F1] p-4"
              >
                <span className="text-sm font-bold text-[#2A2622]">
                  {timeSlot.careDate}
                </span>
                <span className="text-sm font-semibold text-[#6F675F]">
                  {timeSlot.startTime} - {timeSlot.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">PROPOSALS</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              들어온 제안
            </h2>
          </div>
          <p className="text-sm font-semibold text-[#6F675F]">
            {proposals.length}건
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {isLoadingProposals && (
            <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
              제안 목록을 불러오는 중입니다.
            </p>
          )}

          {!isLoadingProposals && proposals.length === 0 && (
            <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
              아직 등록된 제안이 없습니다.
            </p>
          )}

          {proposals.map((proposal) => (
            <article
              key={proposal.id}
              className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-4"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-bold text-[#2A2622]">
                    {proposal.proposedPrice.toLocaleString()}원
                  </p>
                  {proposal.message && (
                    <p className="mt-2 text-sm leading-6 text-[#6F675F]">
                      {proposal.message}
                    </p>
                  )}
                </div>
                <span className="w-fit rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                  {proposalStatusLabels[proposal.status]}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PostDetailPage;
