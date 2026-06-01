import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendAiChatMessage } from '../api';
import {
  dayOfWeekLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterStatusLabels,
} from '../constants/options';
import type { RecommendedSitter } from '../types';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  recommendedSitters?: RecommendedSitter[];
}

const promptSuggestions = [
  '마포구에서 소형견 가능한 시터 추천해줘',
  '분리불안 있는 말티즈를 잘 보는 시터 찾아줘',
  '고양이 위탁 돌봄 가능한 시터 있을까?',
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

const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;

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

function AiSitterChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const latestRecommendedSitters = useMemo(() => {
    const assistantWithRecommendations = [...messages]
      .reverse()
      .find(
        (item) =>
          item.role === 'assistant' && item.recommendedSitters?.length,
      );

    return assistantWithRecommendations?.recommendedSitters ?? [];
  }, [messages]);

  const sendMessage = async (nextMessage: string) => {
    const trimmedMessage = nextMessage.trim();

    if (!trimmedMessage || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage('');
    setErrorMessage('');
    setIsSending(true);

    const result = await sendAiChatMessage({ message: trimmedMessage });

    if (result.success) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.data.answer,
          recommendedSitters: result.data.recommendedSitters,
        },
      ]);
    } else {
      setErrorMessage(result.error.message);
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(message);
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="fp-kicker">AI SITTER MATCH</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2A2622]">
            AI 시터 추천
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#7D7368]">
            반려동물의 성향과 필요한 돌봄 조건을 자연스럽게 적으면, 백엔드 AI
            추천 결과를 바탕으로 바로 요청할 수 있는 시터를 보여드립니다.
          </p>
        </div>
        <Link
          to="/sitters"
          className="rounded-xl border border-[#E7DCD1] bg-white px-4 py-2.5 text-sm font-black text-[#2A2622] shadow-sm"
        >
          전체 시터 보기
        </Link>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="fp-shell-card flex min-h-[660px] flex-col rounded-2xl p-0">
          <div className="border-b border-[#EFE5DA] px-5 py-4">
            <p className="text-sm font-black text-[#2A2622]">추천 상담</p>
            <p className="mt-1 text-xs font-semibold text-[#8C8075]">
              500자 이내로 조건을 입력하세요.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
                {chatMessage.content}
              </article>
            ))}

            {isSending && (
              <div className="inline-flex rounded-2xl bg-[#F6EFE7] px-4 py-3 text-sm font-black text-[#8C8075]">
                추천 결과를 찾는 중...
              </div>
            )}
          </div>

          <div className="border-t border-[#EFE5DA] px-5 py-4">
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

            <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="min-h-24 resize-none rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm font-semibold text-[#2A2622] outline-none transition placeholder:text-[#B7AA9D] focus:border-[#D96F4F] focus:ring-4 focus:ring-[#D96F4F]/10"
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

        <aside className="space-y-4">
          <div className="fp-shell-card rounded-2xl p-5">
            <p className="fp-kicker">RECOMMENDED</p>
            <h2 className="mt-2 text-xl font-black text-[#2A2622]">
              추천 시터 {latestRecommendedSitters.length}명
            </h2>
          </div>

          {latestRecommendedSitters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E3D6C8] bg-[#FFFCF8] p-6 text-center">
              <p className="text-sm font-black text-[#2A2622]">
                아직 추천된 시터가 없습니다.
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#7D7368]">
                지역과 반려동물 조건을 알려주면 이곳에 추천 카드가 표시됩니다.
              </p>
            </div>
          ) : (
            latestRecommendedSitters.map((sitter) => (
              <article
                key={sitter.sitterId}
                className="rounded-2xl border border-[#EFE5DA] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#D96F4F]">
                      {getRegionLabel(sitter.region)}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#2A2622]">
                      시터 #{sitter.sitterId}
                    </h3>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-black',
                      sitter.status === 'RESERVABLE'
                        ? 'bg-[#E5F5E8] text-[#308047]'
                        : 'bg-[#F4E9DE] text-[#8C8075]',
                    ].join(' ')}
                  >
                    {sitterStatusLabels[sitter.status]}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-[#6F675F]">
                  {sitter.introduction || '등록된 소개글이 없습니다.'}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-[#6F675F]">
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">가능 동물</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {possiblePetTypeLabels[sitter.possiblePetType]}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">가능 크기</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {possiblePetSizeLabels[sitter.possiblePetSize]}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">경력</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {sitter.experienceYears}년
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#FFFCF8] p-3">
                    <dt className="text-[#B7AA9D]">시간당</dt>
                    <dd className="mt-1 text-[#2A2622]">
                      {formatPrice(sitter.pricePerHour)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-xl bg-[#F6EFE7] p-3">
                  <p className="text-xs font-black text-[#B85B3D]">리뷰 요약</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5E544B]">
                    {sitter.reviewSummary || '아직 리뷰 요약이 없습니다.'}
                  </p>
                </div>

                {(sitter.strengths.length > 0 || sitter.cautions.length > 0) && (
                  <div className="mt-4 grid gap-3 text-sm font-semibold leading-6">
                    {sitter.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-[#308047]">강점</p>
                        <ul className="mt-1 space-y-1 text-[#5E544B]">
                          {sitter.strengths.map((strength) => (
                            <li key={strength}>· {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sitter.cautions.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-[#B85B3D]">확인할 점</p>
                        <ul className="mt-1 space-y-1 text-[#5E544B]">
                          {sitter.cautions.map((caution) => (
                            <li key={caution}>· {caution}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 text-xs font-bold leading-5 text-[#8C8075]">
                  {buildScheduleSummary(sitter)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    to={`/sitters/${sitter.sitterId}`}
                    className="rounded-xl border border-[#E7DCD1] bg-white px-3 py-2.5 text-center text-sm font-black text-[#2A2622]"
                  >
                    상세 보기
                  </Link>
                  <Link
                    to={`/sitters/${sitter.sitterId}/requests/new`}
                    className="rounded-xl bg-[#D96F4F] px-3 py-2.5 text-center text-sm font-black text-white"
                  >
                    요청하기
                  </Link>
                </div>
              </article>
            ))
          )}
        </aside>
      </section>
    </main>
  );
}

export default AiSitterChatPage;
