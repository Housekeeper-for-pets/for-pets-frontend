import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyInfo,
  getSitterReviewSummary,
  indexAiReviewSources,
  streamAiChatMessage,
} from '../api';
import {
  dayOfWeekLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterStatusLabels,
} from '../constants/options';
import type {
  MemberRole,
  RagIndexResponse,
  RagSearchResult,
  RecommendedSitter,
} from '../types';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  recommendedSitters?: RecommendedSitter[];
  sources?: RagSearchResult[];
  isStreaming?: boolean;
}

const promptSuggestions = [
  '분리불안 있는 말티즈를 차분하게 돌봐줄 시터 추천해줘',
  '그중에서 가격이 낮은 시터로 다시 알려줘',
  '노령견을 천천히 산책시켜주는 시터 찾아줘',
  '방금 추천한 시터들 중 소형견 경험이 많은 사람으로 골라줘',
];

const initialMessages: ChatMessage[] = [
  {
    id: 'initial',
    role: 'assistant',
    content:
      '원하는 지역, 반려동물 종류, 크기, 걱정되는 점을 알려주시면 조건에 맞는 시터를 찾아드릴게요.',
    recommendedSitters: [],
  },
];

const AI_PENDING_NOTICE_DELAY_MS = 7000;

const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const formatSourceScore = (score: number) => `${Math.round(score * 100)}%`;

const formatSessionId = (sessionId: string) =>
  sessionId.length > 12 ? `${sessionId.slice(0, 8)}...` : sessionId;

const sourceTypeLabels: Record<RagSearchResult['sourceType'], string> = {
  REVIEW: '보호자 리뷰',
};

const AiWorkingDots = () => (
  <span className="relative flex h-2 w-2 shrink-0">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D96F4F] opacity-60" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D96F4F]" />
  </span>
);

const buildScheduleSummary = (sitter: RecommendedSitter) => {
  if (!sitter.schedules.length) return '등록된 가능 시간이 없습니다.';

  return sitter.schedules
    .slice(0, 3)
    .map(
      (schedule) =>
        `${dayOfWeekLabels[schedule.dayOfWeek]} ${schedule.startTime.slice(
          0,
          5,
        )}-${schedule.endTime.slice(0, 5)}`,
    )
    .join(', ');
};

const enrichRecommendedSittersWithReviewSummaries = async (
  sitters: RecommendedSitter[],
) => {
  const enrichedSitters = await Promise.all(
    sitters.map(async (sitter) => {
      if (sitter.reviewSummary?.trim()) return sitter;

      const summaryResult = await getSitterReviewSummary(sitter.sitterId);

      if (!summaryResult.success) return sitter;

      return {
        ...sitter,
        reviewSummary: summaryResult.data.summary,
        strengths: summaryResult.data.strengths.length
          ? summaryResult.data.strengths
          : sitter.strengths,
        cautions: summaryResult.data.cautions.length
          ? summaryResult.data.cautions
          : sitter.cautions,
      };
    }),
  );

  return enrichedSitters;
};

const normalizeAnswerWithReviewSummaries = (
  answer: string,
  sitters: RecommendedSitter[],
) => {
  const hasReviewSummary = sitters.some((sitter) => sitter.reviewSummary?.trim());

  if (!hasReviewSummary) return answer;

  return answer
    .replace(
      '아직 리뷰 요약은 없지만,',
      '리뷰 요약도 함께 확인해 보니,',
    )
    .replace('아직 리뷰 요약은 없지만', '리뷰 요약도 함께 확인해 보니');
};

function AiSitterChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isIndexingRag, setIsIndexingRag] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [ragIndexResult, setRagIndexResult] = useState<RagIndexResponse | null>(null);
  const [ragIndexMessage, setRagIndexMessage] = useState('');
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatRequestInFlightRef = useRef(false);
  const pendingNoticeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );

  const latestRecommendedSitters = useMemo(() => {
    const assistantWithRecommendations = [...messages]
      .reverse()
      .find(
        (item) =>
          item.role === 'assistant' && item.recommendedSitters?.length,
      );

    return assistantWithRecommendations?.recommendedSitters ?? [];
  }, [messages]);

  const latestSources = useMemo(() => {
    const assistantWithSources = [...messages]
      .reverse()
      .find((item) => item.role === 'assistant' && item.sources?.length);

    return assistantWithSources?.sources ?? [];
  }, [messages]);

  const latestUserQuestion = useMemo(
    () => [...messages].reverse().find((item) => item.role === 'user')?.content,
    [messages],
  );

  const currentRecommendedSitter =
    latestRecommendedSitters[currentRecommendationIndex] ??
    latestRecommendedSitters[0];
  const recommendationCount = latestRecommendedSitters.length;
  const currentRecommendationNumber =
    recommendationCount > 0 ? currentRecommendationIndex + 1 : 0;
  const sessionLabel = chatSessionId
    ? `Session: ${formatSessionId(chatSessionId)}`
    : '새 대화 세션 준비';
  const isAdmin = memberRole === 'ADMIN';

  useEffect(() => {
    const fetchMemberRole = async () => {
      const result = await getMyInfo();

      if (result.success) {
        setMemberRole(result.data.role);
      }
    };

    void fetchMemberRole();
  }, []);

  useEffect(() => {
    setCurrentRecommendationIndex(0);
  }, [latestRecommendedSitters]);

  useEffect(
    () => () => {
      if (pendingNoticeTimerRef.current) {
        window.clearTimeout(pendingNoticeTimerRef.current);
      }
    },
    [],
  );

  const clearPendingNoticeTimer = () => {
    if (!pendingNoticeTimerRef.current) return;

    window.clearTimeout(pendingNoticeTimerRef.current);
    pendingNoticeTimerRef.current = null;
  };

  const startPendingNotice = () => {
    clearPendingNoticeTimer();
    setPendingMessage('AI가 조건에 맞는 시터와 리뷰 요약을 확인하는 중입니다.');
    pendingNoticeTimerRef.current = window.setTimeout(() => {
      setPendingMessage(
        'AI가 더 나은 추천 답변을 위해 정보를 확보 중입니다. 잠시만 기다려주세요.',
      );
      pendingNoticeTimerRef.current = null;
    }, AI_PENDING_NOTICE_DELAY_MS);
  };

  const moveRecommendation = (direction: 'prev' | 'next') => {
    if (!recommendationCount) return;

    setCurrentRecommendationIndex((prevIndex) => {
      if (direction === 'prev') {
        return prevIndex === 0 ? recommendationCount - 1 : prevIndex - 1;
      }

      return prevIndex === recommendationCount - 1 ? 0 : prevIndex + 1;
    });
  };

  const sendMessage = async (nextMessage: string) => {
    const trimmedMessage = nextMessage.trim();

    if (!trimmedMessage || chatRequestInFlightRef.current) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };
    const assistantMessageId = `assistant-${Date.now()}`;

    const upsertAssistantMessage = (nextMessage: Partial<ChatMessage>) => {
      setMessages((prevMessages) => {
        const existingMessage = prevMessages.find(
          (item) => item.id === assistantMessageId,
        );

        if (existingMessage) {
          return prevMessages.map((item) =>
            item.id === assistantMessageId ? { ...item, ...nextMessage } : item,
          );
        }

        return [
          ...prevMessages,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            recommendedSitters: [],
            sources: [],
            isStreaming: false,
            ...nextMessage,
          },
        ];
      });
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage('');
    setErrorMessage('');
    setAreSuggestionsOpen(false);
    chatRequestInFlightRef.current = true;
    setIsSending(true);
    startPendingNotice();

    try {
      const streamedResponse = await streamAiChatMessage(
        {
          message: trimmedMessage,
          sessionId: chatSessionId,
        },
        {
          onSession: (sessionId) => {
            setChatSessionId(sessionId);
          },
          onMessage: (chunk) => {
            setMessages((prevMessages) => {
              const existingMessage = prevMessages.find(
                (item) => item.id === assistantMessageId,
              );
              const nextContent = `${existingMessage?.content ?? ''}${chunk}`;

              if (existingMessage) {
                return prevMessages.map((item) =>
                  item.id === assistantMessageId
                    ? { ...item, content: nextContent, isStreaming: true }
                    : item,
                );
              }

              return [
                ...prevMessages,
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: nextContent,
                  recommendedSitters: [],
                  sources: [],
                  isStreaming: true,
                },
              ];
            });
          },
          onSources: (sources) => {
            upsertAssistantMessage({ sources });
          },
          onDone: (response) => {
            if (response.sessionId) {
              setChatSessionId(response.sessionId);
            }
          },
          onError: (streamErrorMessage) => {
            setErrorMessage(streamErrorMessage);
          },
        },
      );
      const recommendedSitters = await enrichRecommendedSittersWithReviewSummaries(
        streamedResponse.recommendedSitters,
      );
      const answer = normalizeAnswerWithReviewSummaries(
        streamedResponse.answer,
        recommendedSitters,
      );

      if (streamedResponse.sessionId) {
        setChatSessionId(streamedResponse.sessionId);
      }

      upsertAssistantMessage({
        content: answer,
        recommendedSitters,
        sources: streamedResponse.sources ?? [],
        isStreaming: false,
      });
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'AI 응답이 늦어지고 있거나 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.';

      setErrorMessage(
        nextErrorMessage,
      );
      upsertAssistantMessage({
        content: nextErrorMessage,
        isStreaming: false,
      });
    } finally {
      clearPendingNoticeTimer();
      setPendingMessage('');
      chatRequestInFlightRef.current = false;
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(message);
  };

  const handleRagIndex = async () => {
    if (isIndexingRag) return;

    setIsIndexingRag(true);
    setRagIndexMessage('');

    try {
      const result = await indexAiReviewSources();

      if (result.success) {
        setRagIndexResult(result.data);
        setRagIndexMessage('RAG 리뷰 인덱싱이 완료되었습니다.');
        return;
      }

      setRagIndexMessage(result.error?.message ?? 'RAG 인덱싱에 실패했습니다.');
    } catch {
      setRagIndexMessage('RAG 인덱싱 요청 중 문제가 발생했습니다.');
    } finally {
      setIsIndexingRag(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="fp-kicker">AI SITTER MATCH</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2A2622]">
            AI 시터 추천
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#7D7368]">
            반려동물의 성향과 필요한 돌봄 조건을 자연스럽게 적으면, 백엔드 AI
            추천 결과를 바탕으로 바로 요청할 수 있는 시터를 보여드립니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#E7DCD1] bg-white px-3 py-1.5 text-xs font-black text-[#6F675F] shadow-sm">
            {chatSessionId ? '대화 세션 유지 중' : '대화 세션 시작 전'}
          </span>
          <span className="rounded-full border border-[#E7DCD1] bg-white px-3 py-1.5 text-xs font-black text-[#9B8E82] shadow-sm">
            {sessionLabel}
          </span>
          {isSending && (
            <span className="rounded-full bg-[#FFF0EA] px-3 py-1.5 text-xs font-black text-[#B85B3D]">
              실시간 스트리밍 중
            </span>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                className="rounded-full bg-[#2A2622] px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-[#3C342E] disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
                onClick={() => void handleRagIndex()}
                disabled={isIndexingRag}
              >
                {isIndexingRag ? 'RAG 인덱싱 중...' : 'RAG 인덱싱'}
              </button>
              {ragIndexResult && (
                <span className="rounded-full border border-[#E7DCD1] bg-white px-3 py-1.5 text-xs font-black text-[#6F675F] shadow-sm">
                  성공 {ragIndexResult.indexedCount}건 · 실패{' '}
                  {ragIndexResult.failedCount}건
                </span>
              )}
              {ragIndexMessage && (
                <span className="rounded-full bg-[#F6EFE7] px-3 py-1.5 text-xs font-black text-[#8C8075]">
                  {ragIndexMessage}
                </span>
              )}
            </>
          )}
        </div>
        <Link
          to="/sitters"
          className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2.5 text-sm font-black text-[#2A2622] shadow-sm"
        >
          전체 시터 보기
        </Link>
      </section>

      <section className="mt-4 grid gap-5 lg:h-[calc(100vh-180px)] lg:min-h-[700px] lg:grid-cols-[minmax(0,1.15fr)_460px] lg:items-stretch">
        <div className="fp-shell-card flex min-h-[700px] flex-col rounded-2xl p-0 lg:min-h-0">
          <div className="border-b border-[#EFE5DA] px-5 py-4">
            <p className="text-sm font-black text-[#2A2622]">추천 상담</p>
            <p className="mt-1 text-xs font-semibold text-[#8C8075]">
              {latestUserQuestion
                ? `최근 질문: ${latestUserQuestion}`
                : '500자 이내로 조건을 입력하세요.'}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((chatMessage) => (
              <article
                key={chatMessage.id}
                className={[
                  'max-w-[88%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6',
                  chatMessage.role === 'user'
                    ? 'ml-auto bg-[#D96F4F] text-white'
                    : 'bg-[#F6EFE7] text-[#3B332D]',
                ].join(' ')}
              >
                <p>{chatMessage.content}</p>

                {chatMessage.role === 'assistant' &&
                  Boolean(chatMessage.sources?.length) && (
                    <div className="mt-3 space-y-2 border-t border-[#E6D8CA] pt-3">
                      <p className="text-xs font-black text-[#B85B3D]">
                        참고한 리뷰 근거
                      </p>
                      {chatMessage.sources?.slice(0, 3).map((source) => (
                        <Link
                          key={`${source.sourceType}-${source.reviewId}-${source.sitterId}`}
                          to={`/sitters/${source.sitterId}`}
                          className="block rounded-xl bg-white/65 p-3 text-xs font-bold leading-5 text-[#5E544B] transition hover:bg-white"
                        >
                          <span className="block text-[#8C8075]">
                            {sourceTypeLabels[source.sourceType]} #{source.reviewId} ·
                            시터 #{source.sitterId} · 평점 {source.rating} · 관련도{' '}
                            {formatSourceScore(source.score)}
                          </span>
                          <span className="mt-1 block line-clamp-2">
                            {source.snippet}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                {chatMessage.role === 'assistant' &&
                  chatMessage.id !== 'initial' &&
                  !chatMessage.sources?.length && (
                    <div className="mt-3 rounded-xl border border-dashed border-[#E3D6C8] bg-white/55 p-3 text-xs font-bold leading-5 text-[#8C8075]">
                      리뷰 근거가 연결되면 이곳에 출처가 표시됩니다.
                    </div>
                  )}

                {chatMessage.role === 'assistant' && chatMessage.isStreaming && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-black text-[#B85B3D]">
                    <AiWorkingDots />
                    AI가 답변을 실시간으로 작성 중입니다...
                  </div>
                )}
              </article>
            ))}

            {isSending && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F6EFE7] px-4 py-3 text-sm font-black text-[#8C8075]">
                <AiWorkingDots />
                {pendingMessage || '추천 결과와 리뷰 요약을 함께 확인하는 중...'}
              </div>
            )}
          </div>

          <div className="border-t border-[#EFE5DA] px-5 py-4">
            {areSuggestionsOpen ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-[#E7DCD1] bg-white px-3 py-1.5 text-xs font-bold text-[#6F675F] transition hover:border-[#D96F4F] hover:text-[#D96F4F]"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={isSending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                className="mb-3 inline-flex h-8 items-center gap-2 rounded-full border border-[#E7DCD1] bg-white px-3 text-xs font-black text-[#6F675F] transition hover:border-[#D96F4F] hover:text-[#D96F4F]"
                onClick={() => setAreSuggestionsOpen(true)}
              >
                ⌃ 예시 질문 열기
              </button>
            )}

            <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="min-h-20 resize-none rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm font-semibold text-[#2A2622] outline-none transition placeholder:text-[#B7AA9D] focus:border-[#D96F4F] focus:ring-4 focus:ring-[#D96F4F]/10"
                maxLength={500}
                placeholder="예: 마포구에 살고, 분리불안 있는 소형견을 방문 돌봄으로 맡기고 싶어요."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="rounded-2xl bg-[#2A2622] px-6 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
              >
                추천 받기
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#9D9083]">
              <span>{errorMessage}</span>
              <span>{message.length}/500</span>
            </div>
          </div>
        </div>

        <aside className="flex min-h-[700px] flex-col lg:min-h-0">
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#EFE5DA] bg-white shadow-sm">
            <div className="shrink-0 border-b border-[#EFE5DA] p-5">
              <p className="fp-kicker">RECOMMENDED</p>
              <h2 className="mt-2 text-xl font-black text-[#2A2622]">
                추천 시터 {recommendationCount}명
              </h2>
              {latestSources.length > 0 && (
                <p className="mt-2 text-xs font-bold leading-5 text-[#8C8075]">
                  실제 리뷰 근거 {latestSources.length}개를 함께 참고했어요.
                </p>
              )}
            </div>

            {!currentRecommendedSitter ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center">
                <div className="max-w-xs rounded-2xl border border-dashed border-[#E3D6C8] bg-[#FFFCF8] p-6">
                  <p className="text-sm font-black text-[#2A2622]">
                    아직 추천된 시터가 없습니다.
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#7D7368]">
                    왼쪽 채팅에 지역, 반려동물 종류, 걱정되는 점을 입력하면 추천
                    시터 카드가 표시됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <article
                key={currentRecommendedSitter.sitterId}
                className="flex min-h-0 flex-1 flex-col"
              >
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#D96F4F]">
                      {getRegionLabel(currentRecommendedSitter.region)}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#2A2622]">
                      시터 #{currentRecommendedSitter.sitterId}
                    </h3>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-black',
                      currentRecommendedSitter.status === 'RESERVABLE'
                        ? 'bg-[#E5F5E8] text-[#308047]'
                        : 'bg-[#F4E9DE] text-[#8C8075]',
                    ].join(' ')}
                  >
                    {sitterStatusLabels[currentRecommendedSitter.status]}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-[#6F675F]">
                  {currentRecommendedSitter.introduction || '등록된 소개글이 없습니다.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-[11px] font-black text-[#B85B3D]">
                    AI 리뷰 요약 기반
                  </span>
                  <span className="rounded-full bg-[#EEF7EA] px-3 py-1 text-[11px] font-black text-[#308047]">
                    {latestSources.length > 0 ? 'RAG 리뷰 근거 참고' : 'RAG 근거 대기'}
                  </span>
                  <span className="rounded-full bg-[#F6EFE7] px-3 py-1 text-[11px] font-black text-[#6F675F]">
                    실시간 가능 일정 포함
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-[#6F675F]">
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">가능 동물</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {possiblePetTypeLabels[currentRecommendedSitter.possiblePetType]}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">가능 크기</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {possiblePetSizeLabels[currentRecommendedSitter.possiblePetSize]}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">경력</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {currentRecommendedSitter.experienceYears}년
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">시간당</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {formatPrice(currentRecommendedSitter.pricePerHour)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-xl bg-[#F6EFE7] p-3">
                  <p className="text-xs font-black text-[#B85B3D]">리뷰 요약</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5E544B]">
                    {currentRecommendedSitter.reviewSummary ||
                      '리뷰가 충분하지 않아 요약을 만들 수 없습니다.'}
                  </p>
                </div>

                {(currentRecommendedSitter.strengths.length > 0 ||
                  currentRecommendedSitter.cautions.length > 0) && (
                  <div className="mt-4 grid gap-3 text-sm font-semibold leading-6">
                    {currentRecommendedSitter.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-[#308047]">강점</p>
                        <ul className="mt-1 space-y-1 text-[#5E544B]">
                          {currentRecommendedSitter.strengths.map((strength) => (
                            <li key={strength}>· {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentRecommendedSitter.cautions.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-[#B85B3D]">확인할 점</p>
                        <ul className="mt-1 space-y-1 text-[#5E544B]">
                          {currentRecommendedSitter.cautions.map((caution) => (
                            <li key={caution}>· {caution}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 text-xs font-bold leading-5 text-[#8C8075]">
                  {buildScheduleSummary(currentRecommendedSitter)}
                </p>
              </div>

              <div className="shrink-0 border-t border-[#EFE5DA] bg-white p-5">
                {recommendationCount > 0 && (
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full border border-[#E7DCD1] bg-white text-xl font-black text-[#6F675F] transition hover:border-[#D96F4F] hover:text-[#D96F4F]"
                      aria-label="이전 추천 시터"
                      onClick={() => moveRecommendation('prev')}
                    >
                      ‹
                    </button>
                    <span className="min-w-14 text-center text-sm font-black text-[#2A2622]">
                      {currentRecommendationNumber}/{recommendationCount}
                    </span>
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full border border-[#E7DCD1] bg-white text-xl font-black text-[#6F675F] transition hover:border-[#D96F4F] hover:text-[#D96F4F]"
                      aria-label="다음 추천 시터"
                      onClick={() => moveRecommendation('next')}
                    >
                      ›
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/sitters/${currentRecommendedSitter.sitterId}`}
                    className="rounded-xl border border-[#E7DCD1] bg-white px-3 py-2.5 text-center text-sm font-black text-[#2A2622]"
                  >
                    상세 보기
                  </Link>
                  <Link
                    to={`/sitters/${currentRecommendedSitter.sitterId}/requests/new`}
                    className="rounded-xl bg-[#D96F4F] px-3 py-2.5 text-center text-sm font-black text-white"
                  >
                    요청하기
                  </Link>
                </div>
              </div>
              </article>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

export default AiSitterChatPage;
