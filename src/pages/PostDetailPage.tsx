import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  acceptProposal,
  closePost,
  createOrGetChatRoom,
  createProposal,
  deletePost,
  getMyInfo,
  getPost,
  getPostProposals,
  rejectProposal,
} from '../api';
import {
  careTypeLabels,
  getRegionLabel,
  postStatusLabels,
} from '../constants/options';
import type { Member, Post, Proposal, ProposalRequest } from '../types';

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
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalForm, setProposalForm] =
    useState<ProposalRequest>(initialProposalForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [proposalErrorMessage, setProposalErrorMessage] = useState('');
  const [proposalSuccessMessage, setProposalSuccessMessage] = useState('');
  const [ownerActionMessage, setOwnerActionMessage] = useState('');
  const [ownerActionErrorMessage, setOwnerActionErrorMessage] = useState('');

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

    const fetchCurrentMember = async () => {
      try {
        const result = await getMyInfo();

        if (result.success) {
          setCurrentMember(result.data);
        }
      } catch {
        // 비로그인/토큰 오류여도 공개 상세 화면은 유지합니다.
      }
    };

    void fetchPostDetail();
    void fetchProposals();
    void fetchCurrentMember();
  }, [postId]);

  const isOwner = Boolean(post && currentMember?.id === post.memberId);

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

  const handleOpenChat = async () => {
    if (!post) return;

    setProposalErrorMessage('');
    setIsOpeningChat(true);

    try {
      const result = await createOrGetChatRoom({ opponentId: post.memberId });

      if (result.success) {
        navigate(`/chat?roomId=${result.data.chatRoomId}`, {
          state: {
            selectedRoom: {
              chatRoomId: result.data.chatRoomId,
              opponentId: result.data.opponentId,
              opponentNickname: result.data.opponentNickname,
              lastMessage: null,
              lastMessageType: null,
              lastMessageAt: null,
              unreadCount: 0,
            },
          },
        });
        return;
      }

      setProposalErrorMessage(result.error.message);
    } catch {
      setProposalErrorMessage('채팅방을 여는 중 문제가 발생했습니다.');
    } finally {
      setIsOpeningChat(false);
    }
  };

  const refreshPostAndProposals = async () => {
    if (!postId) return;

    const [postResult, proposalResult] = await Promise.all([
      getPost(Number(postId)),
      getPostProposals(Number(postId)),
    ]);

    if (postResult.success) {
      setPost(postResult.data);
    }

    if (proposalResult.success) {
      setProposals(proposalResult.data);
    }
  };

  const handleClosePost = async () => {
    if (!post) return;

    setOwnerActionMessage('');
    setOwnerActionErrorMessage('');

    try {
      const result = await closePost(post.id);

      if (result.success) {
        setPost(result.data);
        setOwnerActionMessage('공고가 마감되었습니다.');
        return;
      }

      setOwnerActionErrorMessage(result.error.message);
    } catch {
      setOwnerActionErrorMessage('공고 마감 중 문제가 발생했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('공고를 삭제할까요?')) return;

    setOwnerActionMessage('');
    setOwnerActionErrorMessage('');

    try {
      const result = await deletePost(post.id);

      if (result.success) {
        navigate('/posts');
        return;
      }

      setOwnerActionErrorMessage(result.error.message);
    } catch {
      setOwnerActionErrorMessage('공고 삭제 중 문제가 발생했습니다.');
    }
  };

  const handleProposalDecision = async (
    proposalId: number,
    action: 'accept' | 'reject',
  ) => {
    setOwnerActionMessage('');
    setOwnerActionErrorMessage('');

    try {
      const result =
        action === 'accept'
          ? await acceptProposal(proposalId)
          : await rejectProposal(proposalId);

      if (result.success) {
        await refreshPostAndProposals();
        setOwnerActionMessage(
          action === 'accept'
            ? '제안을 수락했습니다. 예약이 생성되었습니다.'
            : '제안을 거절했습니다.',
        );
        return;
      }

      setOwnerActionErrorMessage(result.error.message);
    } catch {
      setOwnerActionErrorMessage('제안 상태 변경 중 문제가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          공고 정보를 불러오는 중입니다.
        </p>
      </main>
    );
  }

  if (errorMessage || !post) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-[#FFF0EA] p-5 text-sm font-medium text-[#B44727]">
          {errorMessage || '공고 정보를 찾을 수 없습니다.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-5">
        <Link
          to="/posts"
          className="inline-flex items-center rounded-full border border-[#E7DCD1] bg-white px-4 py-2 text-sm font-bold text-[#6F675F]"
        >
          ← 공고 목록으로
        </Link>
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-7 shadow-sm">
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

        <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">
            {isOwner ? 'OWNER TOOLS' : 'PROPOSAL'}
          </p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
            {isOwner ? '공고 관리' : '제안 등록'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6F675F]">
            {isOwner
              ? '공고 정보를 수정하거나 마감하고, 들어온 제안을 처리할 수 있습니다.'
              : '가능한 공고라면 제안 금액과 메시지를 보내 보호자에게 지원할 수 있습니다.'}
          </p>

          {isOwner && (
            <div className="mt-5 grid gap-3">
              <Link
                to={`/posts/${post.id}/edit`}
                className="rounded-2xl bg-[#2A2622] px-5 py-3 text-center text-sm font-bold text-white"
              >
                공고 수정
              </Link>
              <button
                type="button"
                onClick={handleClosePost}
                disabled={post.status === 'CLOSED'}
                className="rounded-2xl border border-[#E7DCD1] px-5 py-3 text-sm font-bold text-[#6F675F] disabled:cursor-not-allowed disabled:bg-[#F4E9DE]"
              >
                공고 마감
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="rounded-2xl bg-[#FFF0EA] px-5 py-3 text-sm font-bold text-[#B44727]"
              >
                공고 삭제
              </button>
            </div>
          )}

          {!isOwner && (
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
            <button
              type="button"
              onClick={() => void handleOpenChat()}
              disabled={isOpeningChat}
              className="w-full rounded-2xl border border-[#E7DCD1] px-5 py-3 text-sm font-bold text-[#6F675F] transition hover:border-[#E26B4A] hover:text-[#E26B4A] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
            >
              {isOpeningChat ? '채팅방 여는 중...' : '채팅하기'}
            </button>
          </form>
          )}

          {ownerActionErrorMessage && (
            <p className="mt-4 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
              {ownerActionErrorMessage}
            </p>
          )}
          {ownerActionMessage && (
            <p className="mt-4 rounded-2xl bg-[#EEF7EA] px-4 py-3 text-sm font-medium text-[#3F5732]">
              {ownerActionMessage}
            </p>
          )}
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">PETS</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                포함된 반려동물
              </h2>
            </div>
            <p className="text-sm font-semibold text-[#6F675F]">
              {post.pets.length}마리
            </p>
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

        <div className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
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

      {isOwner && (
      <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
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
              {isOwner && proposal.status === 'PENDING' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleProposalDecision(proposal.id, 'accept')}
                    className="rounded-full bg-[#E26B4A] px-4 py-2 text-xs font-bold text-white"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProposalDecision(proposal.id, 'reject')}
                    className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
                  >
                    거절
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      )}
    </main>
  );
}

export default PostDetailPage;
