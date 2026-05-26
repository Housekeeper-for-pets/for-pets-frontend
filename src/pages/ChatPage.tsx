import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  createOrGetChatRoom,
  getChatMessages,
  getChatRooms,
  leaveChatRoom,
} from '../api';
import { getAccessToken } from '../api/tokenStorage';
import type {
  ChatMessageBroadcast,
  ChatMessageItem,
  ChatRoomListItem,
} from '../types';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const buildWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/chat`;
};

const parseStompBody = (frame: string) => {
  const [, body = ''] = frame.split('\n\n');
  return body.replace(/\0$/, '');
};

interface ChatRouteState {
  selectedRoom?: ChatRoomListItem;
}

function ChatPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [socketStatus, setSocketStatus] = useState('연결 전');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  const fetchRooms = async () => {
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

        setRooms(result.data.items);
        setSelectedRoom((prevRoom) =>
          targetRoom ??
          (prevRoom
            ? result.data.items.find((room) => room.chatRoomId === prevRoom.chatRoomId) ?? null
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
  };

  useEffect(() => {
    void fetchRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setErrorMessage('');

      try {
        const result = await getChatMessages(selectedRoom.chatRoomId, { size: 50 });

        if (result.success) {
          setMessages([...result.data.items].reverse());
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.chatRoomId === selectedRoom.chatRoomId
                ? { ...room, unreadCount: 0 }
                : room,
            ),
          );
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('메시지 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;

    const token = getAccessToken();

    if (!token) {
      setSocketStatus('토큰 없음');
      return;
    }

    const socket = new WebSocket(buildWebSocketUrl());
    socketRef.current = socket;
    setSocketStatus('연결 중');

    socket.onopen = () => {
      socket.send(`CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\n\n\0`);
    };

    socket.onmessage = (event) => {
      const frame = String(event.data);

      if (frame.startsWith('CONNECTED')) {
        setSocketStatus('연결됨');
        socket.send(
          `SUBSCRIBE\nid:room-${selectedRoom.chatRoomId}\ndestination:/sub/chat-rooms/${selectedRoom.chatRoomId}\n\n\0`,
        );
        return;
      }

      if (frame.startsWith('MESSAGE')) {
        const body = parseStompBody(frame);

        try {
          const broadcast = JSON.parse(body) as ChatMessageBroadcast;
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              messageId: broadcast.messageId,
              messageType: broadcast.messageType,
              senderId: broadcast.senderId,
              senderNickname: broadcast.senderNickname,
              content: broadcast.content,
              createdAt: broadcast.createdAt,
              isMine: false,
              isReadByOpponent: false,
            },
          ]);
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

    socket.onclose = () => {
      setSocketStatus('연결 종료');
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [selectedRoom]);

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedOpponentId = Number(opponentId);

    if (!parsedOpponentId) {
      setErrorMessage('상대 회원 ID를 입력해 주세요.');
      return;
    }

    setErrorMessage('');

    try {
      const result = await createOrGetChatRoom({ opponentId: parsedOpponentId });

      if (result.success) {
        setOpponentId('');
        await fetchRooms();
        setSelectedRoom({
          chatRoomId: result.data.chatRoomId,
          opponentId: result.data.opponentId,
          opponentNickname: result.data.opponentNickname,
          lastMessage: null,
          lastMessageType: null,
          lastMessageAt: null,
          unreadCount: 0,
        });
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('채팅방 생성 중 문제가 발생했습니다.');
    }
  };

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
            상대 회원 ID로 채팅방을 열고, STOMP WebSocket으로 메시지를 주고받습니다.
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
          <form className="grid gap-3" onSubmit={handleCreateRoom}>
            <input
              className={inputClassName}
              type="number"
              min={1}
              placeholder="상대 회원 ID"
              value={opponentId}
              onChange={(event) => setOpponentId(event.target.value)}
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white"
            >
              채팅방 열기
            </button>
          </form>

          <div className="mt-5 grid gap-3">
            {isLoadingRooms && (
              <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                채팅방을 불러오는 중입니다.
              </p>
            )}

            {!isLoadingRooms && rooms.length === 0 && (
              <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
                참여 중인 채팅방이 없습니다.
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
                {messages.map((message) => (
                  <div
                    key={message.messageId}
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
                ))}
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
              왼쪽에서 채팅방을 선택하거나 새 채팅방을 열어주세요.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default ChatPage;
