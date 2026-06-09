import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  getMyInfo,
  getChatMessages,
  getChatRooms,
  leaveChatRoom,
} from '../api';
import { buildWebSocketUrl } from '../api/baseUrls';
import { getAccessToken } from '../api/tokenStorage';
import type {
  ChatMessageBroadcast,
  ChatMessageItem,
  ChatRoomListItem,
} from '../types';

const inputClassName =
    'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// [수정 1] parseStompBody: split('\n\n') → indexOf('\n\n')
// split은 바디 안에 \n\n이 포함된 JSON이 오면 잘못 분리됨
// indexOf로 첫 번째 구분자 위치를 직접 찾아 slice
const parseStompBody = (frame: string): string => {
  const separatorIndex = frame.indexOf('\n\n');
  if (separatorIndex === -1) return '';
  return frame.slice(separatorIndex + 2).replace(/\0$/, '');
};

interface ChatRouteState {
  selectedRoom?: ChatRoomListItem;
}

const sortMessages = (items: ChatMessageItem[]) => {
  const messageMap = new Map<number, ChatMessageItem>();

  items.forEach((item) => {
    messageMap.set(item.messageId, item);
  });

  return [...messageMap.values()].sort((a, b) => a.messageId - b.messageId);
};

const getRoomTime = (room: ChatRoomListItem) =>
    room.lastMessageAt ? new Date(room.lastMessageAt).getTime() : 0;

const sortRooms = (items: ChatRoomListItem[]) =>
    [...items].sort((a, b) => {
      const timeDiff = getRoomTime(b) - getRoomTime(a);

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return b.chatRoomId - a.chatRoomId;
    });

// [수정 4] 재연결 설정 상수
// 최대 5회, 지수 백오프(1s → 2s → 4s → 8s → 16s), 최대 30s
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_ATTEMPTS = 5;
const RECONNECT_MAX_DELAY_MS = 30000;

function ChatPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [socketStatus, setSocketStatus] = useState('연결 전');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // 채팅방 진입 시점의 unreadCount 스냅샷
  // → markCurrentRoomAsRead로 unreadCount가 0이 되어도 구분선 위치 유지
  // → 메시지를 읽거나 답장하면 0으로 초기화 → 구분선 사라짐
  const [unreadCountSnapshot, setUnreadCountSnapshot] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const selectedRoomRef = useRef<ChatRoomListItem | null>(null);
  const currentMemberIdRef = useRef<number | null>(null);
  const firstUnreadRef = useRef<HTMLDivElement | null>(null);   // 첫 안읽은 메시지 DOM
  const messagesEndRef = useRef<HTMLDivElement | null>(null);    // 메시지 목록 맨 아래 DOM
  const isInitialLoadRef = useRef(false);                        // 첫 진입 로드 여부 추적
  // [수정 3] 현재 구독 중인 채팅방 ID 추적 (소켓 재연결 없이 SUBSCRIBE만 추가하기 위해)
  const subscribedRoomIdsRef = useRef<Set<number>>(new Set());
  // [수정 4] 재연결 시도 횟수 및 타이머 ref
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  // 재연결 중 의도적 close 여부를 구분하기 위한 플래그
  const intentionalCloseRef = useRef(false);

  // [수정 3] rooms 최신값을 ref로 유지해 onmessage 클로저에서 stale 없이 접근
  const roomsRef = useRef<ChatRoomListItem[]>([]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    currentMemberIdRef.current = currentMemberId;
  }, [currentMemberId]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const upsertRoom = (nextRoom: ChatRoomListItem) => {
    setRooms((prevRooms) => {
      const existingRoom = prevRooms.find(
          (room) => room.chatRoomId === nextRoom.chatRoomId,
      );

      if (!existingRoom) {
        return sortRooms([nextRoom, ...prevRooms]);
      }

      return sortRooms([
        { ...existingRoom, ...nextRoom },
        ...prevRooms.filter((room) => room.chatRoomId !== nextRoom.chatRoomId),
      ]);
    });
  };

  const fetchRooms = useCallback(async () => {
    setErrorMessage('');
    const targetChatRoomId = Number(searchParams.get('roomId'));
    const routeStateRoom = (location.state as ChatRouteState | null)?.selectedRoom;

    try {
      const result = await getChatRooms({ size: 30 });

      if (result.success) {
        const targetRoom =
            (targetChatRoomId
                ? result.data.items.find((room) => room.chatRoomId === targetChatRoomId)
                : null) ??
            (targetChatRoomId && routeStateRoom?.chatRoomId === targetChatRoomId
                ? routeStateRoom
                : null);
        const nextRooms = sortRooms(
            targetRoom &&
            !result.data.items.some((room) => room.chatRoomId === targetRoom.chatRoomId)
                ? [targetRoom, ...result.data.items]
                : result.data.items,
        );

        setRooms(nextRooms);
        setSelectedRoom((prevRoom) =>
            targetRoom ??
            (prevRoom && nextRooms.some((room) => room.chatRoomId === prevRoom.chatRoomId)
                ? prevRoom
                : null),
        );

        if (targetRoom) {
          setSearchParams({}, { replace: true });
        }

        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('채팅방 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingRooms(false);
    }
  }, [location.state, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchCurrentMember = async () => {
      try {
        const result = await getMyInfo();

        if (result.success) {
          setCurrentMemberId(result.data.id);
        }
      } catch {
        setCurrentMemberId(null);
      }
    };

    void fetchCurrentMember();
    void fetchRooms();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchRooms();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  // 채팅방 메시지 조회 = 서버 읽음 위치 갱신 (ChatMessageService.updateReadPosition §9)
  // connectWebSocket 클로저 안에서도 최신 함수를 참조할 수 있도록 ref로 보관
  // updateOnly=true : broadcast 직접 추가 후 호출 → setMessages 생략, lastReadMessageId만 갱신
  // updateOnly=false: 초기 로드 또는 탭 전환 → setMessages로 메시지 목록 전체 갱신
  const markCurrentRoomAsReadRef = useRef<
      ((chatRoomId: number, isInitialLoad?: boolean, updateOnly?: boolean) => Promise<void>) | null
  >(null);

  const markCurrentRoomAsRead = useCallback(
      async (chatRoomId: number, isInitialLoad = false, updateOnly = false) => {
        try {
          const result = await getChatMessages(chatRoomId, { size: 50 });

          if (result.success) {
            if (!updateOnly) {
              const sorted = sortMessages(result.data.items);
              setMessages(sorted);
              if (isInitialLoad) {
                isInitialLoadRef.current = true;
              }
            }
            // 로컬 unreadCount는 항상 0으로 갱신 (5초 폴링이 덮어쓰기 전에 반영)
            setRooms((prevRooms) =>
                prevRooms.map((room) =>
                    room.chatRoomId === chatRoomId ? { ...room, unreadCount: 0 } : room,
                ),
            );
          }
        } catch {
          // 읽음 갱신 실패는 조용히 무시 (메시지는 이미 화면에 있음)
        }
      },
      [],
  );

  useEffect(() => {
    markCurrentRoomAsReadRef.current = markCurrentRoomAsRead;
  }, [markCurrentRoomAsRead]);

  // 메시지 목록이 바뀔 때 스크롤 처리
  // - 첫 진입(isInitialLoadRef=true): 첫 안읽은 메시지로 스크롤, 없으면 맨 아래
  // - 실시간 수신: 항상 맨 아래로 스크롤
  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView();
      }
    } else {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedRoom) {
      setMessages([]);
      return;
    }

    // 진입 시점의 unreadCount를 스냅샷으로 저장 (구분선 위치 고정용)
    setUnreadCountSnapshot(selectedRoom.unreadCount);

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setErrorMessage('');

      try {
        await markCurrentRoomAsRead(selectedRoom.chatRoomId, true);
      } catch {
        setErrorMessage('메시지 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, [selectedRoom, markCurrentRoomAsRead]);

  // [수정 3] 소켓이 OPEN 상태일 때 새 채팅방에 SUBSCRIBE만 추가
  // subscribedRoomIdsRef(Set)로 중복 구독 방지
  const subscribeNewRoom = useCallback((chatRoomId: number) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (subscribedRoomIdsRef.current.has(chatRoomId)) return;

    socket.send(
        `SUBSCRIBE\nid:room-${chatRoomId}\ndestination:/sub/chat-rooms/${chatRoomId}\n\n\0`,
    );
    subscribedRoomIdsRef.current.add(chatRoomId);
  }, []);

  // [수정 4] WebSocket 연결 함수 (최초 연결 + 재연결에서 공통 사용)
  const connectWebSocket = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setSocketStatus('토큰 없음');
      return;
    }

    const socket = new WebSocket(buildWebSocketUrl('/ws/chat'));
    socketRef.current = socket;
    subscribedRoomIdsRef.current = new Set(); // 연결마다 구독 목록 초기화
    setSocketStatus('연결 중');

    socket.onopen = () => {
      // [수정 2] "Bearer " 공백 포함 — 백엔드 substring(7) 파싱과 일치
      // 백엔드: startsWith("Bearer ") 검증 후 substring(7)로 토큰 추출
      // STOMP 네이티브 헤더에서 Authorization의 값이 "Bearer {token}" 형태여야 함
      socket.send(`CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\n\n\0`);
    };

    socket.onmessage = (event) => {
      const frame = String(event.data);

      if (frame.startsWith('CONNECTED')) {
        // [수정 4] 연결 성공 시 재연결 카운터 초기화
        reconnectAttemptsRef.current = 0;
        setSocketStatus('연결됨');

        // CONNECTED 시점의 최신 rooms로 전체 구독
        roomsRef.current.forEach((room) => {
          socket.send(
              `SUBSCRIBE\nid:room-${room.chatRoomId}\ndestination:/sub/chat-rooms/${room.chatRoomId}\n\n\0`,
          );
          subscribedRoomIdsRef.current.add(room.chatRoomId);
        });
        return;
      }

      if (frame.startsWith('MESSAGE')) {
        const body = parseStompBody(frame);

        try {
          const broadcast = JSON.parse(body) as ChatMessageBroadcast;
          const activeRoom = selectedRoomRef.current;
          const memberId = currentMemberIdRef.current;
          const isMine = broadcast.senderId === memberId;
          const isActiveRoom = activeRoom?.chatRoomId === broadcast.chatRoomId;
          // [수정 3] rooms state 대신 roomsRef 사용 — 클로저 stale 방지
          const existingRoom = roomsRef.current.find(
              (room) => room.chatRoomId === broadcast.chatRoomId,
          );

          if (isActiveRoom) {
            // 현재 열린 채팅방에 메시지 수신
            // 1) broadcast를 메시지 목록에 즉시 추가 → 렌더링 지연 없음
            // 2) getChatMessages 비동기 재호출 → 서버 lastReadMessageId 갱신 (§9 읽음 처리)
            setMessages((prevMessages) =>
                sortMessages([
                  ...prevMessages,
                  {
                    messageId: broadcast.messageId,
                    messageType: broadcast.messageType,
                    senderId: broadcast.senderId,
                    senderNickname: broadcast.senderNickname,
                    content: broadcast.content,
                    createdAt: broadcast.createdAt,
                    isMine,
                    isReadByOpponent: false,
                  },
                ]),
            );
            // updateOnly=true: 메시지 목록은 이미 broadcast로 추가됨 → lastReadMessageId 갱신만
            void markCurrentRoomAsReadRef.current?.(broadcast.chatRoomId, false, true);
          } else {
            // 백그라운드 채팅방에 메시지 수신: UI에 메시지 직접 추가하지 않고 unreadCount만 올림
            if (!existingRoom) {
              void fetchRooms();
              return;
            }

            upsertRoom({
              ...existingRoom,
              lastMessage: broadcast.content,
              lastMessageType: broadcast.messageType,
              lastMessageAt: broadcast.createdAt,
              unreadCount: isMine ? 0 : existingRoom.unreadCount + 1,
            });

            if (!isMine) {
              void fetchRooms();
            }
          }

          // 현재 방이든 아니든 방 목록의 lastMessage/lastMessageAt은 항상 갱신
          if (isActiveRoom && existingRoom) {
            upsertRoom({
              ...existingRoom,
              lastMessage: broadcast.content,
              lastMessageType: broadcast.messageType,
              lastMessageAt: broadcast.createdAt,
              unreadCount: 0,
            });
          }
        } catch {
          setErrorMessage('수신 메시지를 해석하지 못했습니다.');
        }
      }

      if (frame.startsWith('ERROR')) {
        setSocketStatus('오류');
        setErrorMessage(parseStompBody(frame) || '채팅 연결 오류가 발생했습니다.');
      }
    };

    socket.onerror = () => {
      setSocketStatus('오류');
    };

    // [수정 4] 의도적 종료는 재연결 안 함 / 예기치 않은 종료는 지수 백오프 재연결
    socket.onclose = () => {
      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        setSocketStatus('연결 종료');
        return;
      }

      const attempts = reconnectAttemptsRef.current;

      if (attempts >= RECONNECT_MAX_ATTEMPTS) {
        setSocketStatus('재연결 실패');
        setErrorMessage('채팅 연결이 끊어졌습니다. 페이지를 새로고침해 주세요.');
        return;
      }

      // 1s → 2s → 4s → 8s → 16s (최대 30s)
      const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts),
          RECONNECT_MAX_DELAY_MS,
      );

      setSocketStatus(`재연결 중... (${attempts + 1}/${RECONNECT_MAX_ATTEMPTS})`);
      reconnectAttemptsRef.current += 1;

      reconnectTimerRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, delay);
    };
  }, [fetchRooms]);

  useEffect(() => {
    if (currentMemberId === null) return;

    // 이미 OPEN 상태면 소켓 재생성 없이 새 방 구독만 추가
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      rooms.forEach((room) => subscribeNewRoom(room.chatRoomId));
      return;
    }

    connectWebSocket();

    return () => {
      // 언마운트 또는 currentMemberId 변경 시 의도적 close
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      intentionalCloseRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [currentMemberId]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ rooms 배열 자체는 의존성 제외 — rooms 변경은 아래 useEffect에서 subscribeNewRoom으로 처리

  // [수정 3] rooms가 바뀔 때 새 채팅방만 구독 추가 (소켓 재생성 없음)
  useEffect(() => {
    rooms.forEach((room) => subscribeNewRoom(room.chatRoomId));
  }, [rooms, subscribeNewRoom]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRoom || !messageText.trim()) return;

    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN || socketStatus !== '연결됨') {
      setErrorMessage('채팅 소켓이 아직 연결되지 않았습니다.');
      return;
    }

    const content = messageText.trim();
    socket.send(
        `SEND\ndestination:/pub/chat-rooms/${selectedRoom.chatRoomId}/messages\ncontent-type:application/json\n\n${JSON.stringify({ content })}\0`,
    );
    setMessageText('');
    // 답장 시 구분선 제거
    setUnreadCountSnapshot(0);
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const result = await leaveChatRoom(selectedRoom.chatRoomId);

      if (result.success) {
        setSelectedRoom(null);
        await fetchRooms();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('채팅방 나가기 중 문제가 발생했습니다.');
    }
  };

  return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">CHAT</p>
            <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">채팅</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
              공고 또는 시터 프로필에서 채팅을 시작할 수 있습니다.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
            {socketStatus}
          </span>
        </section>

        {errorMessage && (
            <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
              {errorMessage}
            </p>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm">
            <div className="grid gap-3">
              {isLoadingRooms && (
                  <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                    채팅방을 불러오는 중입니다.
                  </p>
              )}

              {!isLoadingRooms && rooms.length === 0 && (
                  <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                    참여 중인 채팅방이 없습니다. 공고 또는 시터 프로필에서 채팅을 시작해 보세요.
                  </p>
              )}

              {rooms.map((room) => (
                  <button
                      key={room.chatRoomId}
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className={[
                        'rounded-2xl border p-4 text-left transition',
                        selectedRoom?.chatRoomId === room.chatRoomId
                            ? 'border-[#E26B4A] bg-[#FFF7F2]'
                            : 'border-[#E7DCD1] bg-[#FFFCF8]',
                      ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#2A2622]">
                        {room.opponentNickname}
                      </p>
                      {room.unreadCount > 0 && (
                          <span className="rounded-full bg-[#E26B4A] px-2 py-1 text-[10px] font-bold text-white">
                            {room.unreadCount}
                          </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[#6F675F]">
                      {room.lastMessage || '아직 메시지가 없습니다.'}
                    </p>
                  </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm">
            {selectedRoom ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-[#E7DCD1] pb-4">
                    <div>
                      <p className="text-sm font-bold text-[#E26B4A]">
                        room #{selectedRoom.chatRoomId}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-[#2A2622]">
                        {selectedRoom.opponentNickname}
                      </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleLeaveRoom()}
                        className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#B44727]"
                    >
                      나가기
                    </button>
                  </div>

                  <div className="mt-5 grid max-h-[520px] min-h-[360px] content-start gap-3 overflow-y-auto rounded-2xl bg-[#FAF6F1] p-4">
                    {isLoadingMessages && (
                        <p className="text-sm text-[#6F675F]">메시지를 불러오는 중입니다.</p>
                    )}
                    {!isLoadingMessages && messages.length === 0 && (
                        <p className="text-sm text-[#6F675F]">아직 메시지가 없습니다.</p>
                    )}
                    {(() => {
                      // unreadCount: 상대방 메시지 중 안 읽은 개수
                      // 뒤에서부터 상대방 메시지(isMine=false)만 unreadCount개 세어
                      // 그 첫 번째 메시지의 index를 구분선 위치로 사용
                      const unreadCount = unreadCountSnapshot;
                      let firstUnreadIndex = -1;
                      if (unreadCount > 0) {
                        let opponentCount = 0;
                        for (let i = messages.length - 1; i >= 0; i--) {
                          if (!messages[i].isMine) {
                            opponentCount += 1;
                            if (opponentCount === unreadCount) {
                              firstUnreadIndex = i;
                              break;
                            }
                          }
                        }
                      }

                      return messages.map((message, index) => {
                        const isFirstUnread = index === firstUnreadIndex;

                        return (
                            <div key={message.messageId}>
                              {isFirstUnread && (
                                  <div
                                      ref={firstUnreadRef}
                                      className="my-2 flex items-center gap-2"
                                  >
                                    <div className="h-px flex-1 bg-[#E26B4A] opacity-40" />
                                    <span className="text-[10px] font-bold text-[#E26B4A] opacity-70">
                                      여기서부터 읽지 않은 메시지
                                    </span>
                                    <div className="h-px flex-1 bg-[#E26B4A] opacity-40" />
                                  </div>
                              )}
                              <div
                                  className={[
                                    'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6',
                                    message.isMine
                                        ? 'ml-auto bg-[#E26B4A] text-white'
                                        : 'bg-white text-[#2A2622]',
                                  ].join(' ')}
                              >
                                <p className="text-xs font-bold opacity-80">
                                  {message.senderNickname}
                                </p>
                                <p className="mt-1">{message.content}</p>
                              </div>
                            </div>
                        );
                      });
                    })()}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSendMessage}>
                    <input
                        className={inputClassName}
                        placeholder="메시지 입력"
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                    />
                    <button
                        type="submit"
                        className="rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
                    >
                      전송
                    </button>
                  </form>
                </>
            ) : (
                <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F]">
                  왼쪽에서 채팅방을 선택해 주세요.
                </p>
            )}
          </section>
        </section>
      </main>
  );
}

export default ChatPage;
