import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  acceptCareRequest,
  cancelSentCareRequest,
  getMyProposals,
  getReceivedCareRequests,
  getSentCareRequests,
  rejectCareRequest,
  withdrawProposal,
} from '../api';
import {
  careRequestStatusLabels,
  careTypeLabels,
  proposalStatusLabels,
} from '../constants/options';
import type { ApiResponse, CareRequest, Id, Proposal, TimeSlotResponse } from '../types';

type CareRequestAction = (requestId: Id) => Promise<ApiResponse<CareRequest>>;
type ProposalAction = (proposalId: Id) => Promise<ApiResponse<Proposal>>;
type ActivityTab = 'sent' | 'received' | 'proposals';

const getActivityTab = (value: string | null): ActivityTab | null => {
  if (value === 'sent' || value === 'received' || value === 'proposals') {
    return value;
  }

  return null;
};

const formatTimeSlots = (timeSlots: TimeSlotResponse[]) =>
  timeSlots
    .map((slot) => `${slot.careDate} ${slot.startTime}-${slot.endTime}`)
    .join(', ');

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const getRequestActionMessage = (actionLabel: string) =>
  `돌봄 요청을 ${actionLabel} 처리했습니다.`;

const getProposalActionMessage = (actionLabel: string) =>
  `제안을 ${actionLabel} 처리했습니다.`;

// 내가 보낸 요청, 받은 요청, 등록한 제안을 한 화면에서 관리하는 페이지입니다.
function MyActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = getActivityTab(searchParams.get('tab'));
  const [sentRequests, setSentRequests] = useState<CareRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<CareRequest[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchActivities = async () => {
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const [sentResult, receivedResult, proposalsResult] = await Promise.all([
        getSentCareRequests(),
        getReceivedCareRequests(),
        getMyProposals(),
      ]);

      if (!sentResult.success) {
        setErrorMessage(sentResult.error.message);
        return;
      }

      if (!receivedResult.success) {
        setErrorMessage(receivedResult.error.message);
        return;
      }

      if (!proposalsResult.success) {
        setErrorMessage(proposalsResult.error.message);
        return;
      }

      setSentRequests(sentResult.data);
      setReceivedRequests(receivedResult.data);
      setProposals(proposalsResult.data);
    } catch {
      setErrorMessage('요청과 제안 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchActivities();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const updateCareRequest = (updatedRequest: CareRequest) => {
    setSentRequests((prevRequests) =>
      prevRequests.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
      ),
    );
    setReceivedRequests((prevRequests) =>
      prevRequests.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
      ),
    );
  };

  const updateProposal = (updatedProposal: Proposal) => {
    setProposals((prevProposals) =>
      prevProposals.map((proposal) =>
        proposal.id === updatedProposal.id ? updatedProposal : proposal,
      ),
    );
  };

  const handleCareRequestAction = async (
    requestId: Id,
    actionName: string,
    actionLabel: string,
    action: CareRequestAction,
  ) => {
    setActionKey(`${actionName}-${requestId}`);
    setMessage('');
    setErrorMessage('');

    try {
      const result = await action(requestId);

      if (result.success) {
        updateCareRequest(result.data);
        setMessage(getRequestActionMessage(actionLabel));
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('돌봄 요청 상태를 변경하지 못했습니다.');
    } finally {
      setActionKey('');
    }
  };

  const handleProposalAction = async (
    proposalId: Id,
    actionName: string,
    actionLabel: string,
    action: ProposalAction,
  ) => {
    setActionKey(`${actionName}-${proposalId}`);
    setMessage('');
    setErrorMessage('');

    try {
      const result = await action(proposalId);

      if (result.success) {
        updateProposal(result.data);
        setMessage(getProposalActionMessage(actionLabel));
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('제안 상태를 변경하지 못했습니다.');
    } finally {
      setActionKey('');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section>
        <p className="text-sm font-bold text-[#E26B4A]">REQUESTS & PROPOSALS</p>
        <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">요청/제안 관리</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
          순방향 돌봄 요청과 역방향 공고 제안을 한곳에서 확인하고 상태를 변경합니다.
        </p>
      </section>

      {message && (
        <p className="mt-5 rounded-2xl bg-[#EFF8F0] px-4 py-3 text-sm font-medium text-[#2F7D4B]">
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          요청과 제안 목록을 불러오는 중입니다.
        </p>
      ) : !selectedTab ? (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <ActivitySummaryCard
            title="보낸 돌봄 요청"
            count={sentRequests.length}
            description="보호자가 시터에게 직접 보낸 요청입니다."
            onClick={() => setSearchParams({ tab: 'sent' })}
          />
          <ActivitySummaryCard
            title="받은 돌봄 요청"
            count={receivedRequests.length}
            description="시터로서 받은 요청을 수락하거나 거절합니다."
            onClick={() => setSearchParams({ tab: 'received' })}
          />
          <ActivitySummaryCard
            title="내 제안"
            count={proposals.length}
            description="공고에 보낸 제안과 상태를 확인합니다."
            onClick={() => setSearchParams({ tab: 'proposals' })}
          />
        </section>
      ) : (
        <div className="mt-6 grid gap-6">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="w-fit rounded-2xl border border-[#E7DCD1] bg-white px-4 py-2 text-sm font-bold text-[#6F675F]"
          >
            요청/제안 요약으로
          </button>

          {selectedTab === 'sent' && (
            <ActivitySection title="보낸 돌봄 요청" count={sentRequests.length}>
              {sentRequests.length === 0 && <EmptyMessage text="보낸 돌봄 요청이 없습니다." />}
              {sentRequests.map((request) => (
                <CareRequestCard
                  key={`sent-${request.id}`}
                  request={request}
                  actionArea={
                    request.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={actionKey === `cancel-${request.id}`}
                        className="rounded-2xl bg-[#F4E9DE] px-4 py-3 text-sm font-bold text-[#6F675F] disabled:opacity-60"
                        onClick={() =>
                          void handleCareRequestAction(
                            request.id,
                            'cancel',
                            '취소',
                            cancelSentCareRequest,
                          )
                        }
                      >
                        요청 취소
                      </button>
                    )
                  }
                />
              ))}
            </ActivitySection>
          )}

          {selectedTab === 'received' && (
            <ActivitySection title="받은 돌봄 요청" count={receivedRequests.length}>
              {receivedRequests.length === 0 && (
                <EmptyMessage text="받은 돌봄 요청이 없습니다." />
              )}
              {receivedRequests.map((request) => (
                <CareRequestCard
                  key={`received-${request.id}`}
                  request={request}
                  actionArea={
                    request.status === 'PENDING' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionKey === `accept-${request.id}`}
                          className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                          onClick={() =>
                            void handleCareRequestAction(
                              request.id,
                              'accept',
                              '수락',
                              acceptCareRequest,
                            )
                          }
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          disabled={actionKey === `reject-${request.id}`}
                          className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-bold text-[#B44727] disabled:opacity-60"
                          onClick={() =>
                            void handleCareRequestAction(
                              request.id,
                              'reject',
                              '거절',
                              rejectCareRequest,
                            )
                          }
                        >
                          거절
                        </button>
                      </div>
                    )
                  }
                />
              ))}
            </ActivitySection>
          )}

          {selectedTab === 'proposals' && (
            <ActivitySection title="내 제안" count={proposals.length}>
              {proposals.length === 0 && (
                <EmptyMessage text="등록한 제안이 없습니다." />
              )}
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  actionArea={
                    proposal.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={actionKey === `withdraw-${proposal.id}`}
                        className="rounded-2xl bg-[#F4E9DE] px-4 py-3 text-sm font-bold text-[#6F675F] disabled:opacity-60"
                        onClick={() =>
                          void handleProposalAction(
                            proposal.id,
                            'withdraw',
                            '철회',
                            withdrawProposal,
                          )
                        }
                      >
                        제안 철회
                      </button>
                    )
                  }
                />
              ))}
            </ActivitySection>
          )}
        </div>
      )}
    </main>
  );
}

interface ActivitySummaryCardProps {
  title: string;
  count: number;
  description: string;
  onClick: () => void;
}

function ActivitySummaryCard({
  title,
  count,
  description,
  onClick,
}: ActivitySummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[#E7DCD1] bg-white p-5 text-left shadow-sm transition hover:border-[#E26B4A]"
    >
      <p className="text-sm font-bold text-[#E26B4A]">{title}</p>
      <p className="mt-4 text-3xl font-black text-[#2A2622]">{count}건</p>
      <p className="mt-3 text-sm leading-6 text-[#6F675F]">{description}</p>
    </button>
  );
}

interface ActivitySectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

// 요청/제안 목록의 반복 섹션 레이아웃입니다.
function ActivitySection({ title, count, children }: ActivitySectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2A2622]">{title}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#6F675F] shadow-sm">
          {count}건
        </span>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-white p-5 text-sm leading-6 text-[#6F675F] shadow-sm">
      {text}
    </p>
  );
}

interface CareRequestCardProps {
  request: CareRequest;
  actionArea?: ReactNode;
}

// 돌봄 요청 카드입니다.
function CareRequestCard({ request, actionArea }: CareRequestCardProps) {
  return (
    <article className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
            {careRequestStatusLabels[request.status]}
          </span>
          <h3 className="mt-3 text-lg font-bold text-[#2A2622]">
            요청 #{request.id} · {careTypeLabels[request.careType]}
          </h3>
          <p className="mt-2 text-sm text-[#6F675F]">
            보호자 {request.memberId} · 시터 {request.sitterProfileId}
          </p>
        </div>
        {actionArea}
      </div>

      <p className="mt-4 text-sm leading-6 text-[#6F675F]">
        {request.message || '요청 메시지가 없습니다.'}
      </p>
      <p className="mt-3 text-lg font-bold text-[#2A2622]">
        요청 금액 {formatPrice(request.requestPrice)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {request.pets.map((pet) => (
          <span
            key={`${request.id}-${pet.petId ?? pet.name}`}
            className="rounded-full bg-[#FAF6F1] px-3 py-1 text-xs font-bold text-[#6F675F]"
          >
            {pet.name}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-[#8A8178]">
        {formatTimeSlots(request.timeSlots)}
      </p>
    </article>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  actionArea?: ReactNode;
}

// 시터가 공고에 등록한 제안 카드입니다.
function ProposalCard({ proposal, actionArea }: ProposalCardProps) {
  return (
    <article className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
            {proposalStatusLabels[proposal.status]}
          </span>
          <h3 className="mt-3 text-lg font-bold text-[#2A2622]">
            공고 #{proposal.postId} 제안
          </h3>
          <p className="mt-2 text-sm text-[#6F675F]">
            시터 프로필 {proposal.sitterProfileId} · 제안자 {proposal.memberId}
          </p>
        </div>
        {actionArea}
      </div>

      <p className="mt-4 text-xl font-bold text-[#2A2622]">
        {formatPrice(proposal.proposedPrice)}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#6F675F]">
        {proposal.message || '제안 메시지가 없습니다.'}
      </p>
    </article>
  );
}

export default MyActivityPage;
