import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyInfo,
  getNotifications,
  getProposal,
  markNotificationAsRead,
} from '../api';
import type { Id, Member, Notification, NotificationType } from '../types';

const notificationTypeLabels: Record<NotificationType, string> = {
  CARE_LOG: '케어 일지',
  PROPOSAL_ARRIVED: '새 제안',
  MATCHING_CONFIRMED: '매칭 확정',
  REQUEST_RECEIVED: '돌봄 요청',
  PROPOSAL_WITHDRAWN: '제안 철회',
  PAYMENT_COMPLETED: '결제 완료',
  RESERVATION_CANCELED: '예약 취소 완료',
  CANCEL_REQUESTED: '예약 취소 요청',
};

const getIsRead = (notification: Notification) =>
  notification.isRead ?? notification.read ?? false;

const getReferencePath = (notification: Notification) => {
  // 알림 타입을 가장 우선으로 분기합니다.
  // (referenceType은 백엔드 구현 차이가 있어 신뢰도가 낮으므로 폴백으로만 사용)
  // 가정: 백엔드는 각 타입의 "주 엔티티" id를 referenceId로 내려줍니다.
  //   - PROPOSAL_ARRIVED  → referenceId = postId (제안이 도착한 공고)
  //   - REQUEST_RECEIVED  → referenceId = careRequestId
  //   - MATCHING_CONFIRMED→ referenceId = reservationId (새로 생성된 예약)
  //   - PAYMENT_COMPLETED → referenceId = reservationId
  //   - CARE_LOG          → referenceId = reservationId
  //   - RESERVATION_CANCELED / CANCEL_REQUESTED → referenceId = reservationId
  switch (notification.type) {
    case 'REQUEST_RECEIVED':
      // 새로운 돌봄 요청 도착 — 받은 요청 탭에서 해당 요청 카드로 스크롤/하이라이트
      return notification.referenceId
        ? `/activity?tab=received&requestId=${notification.referenceId}`
        : '/activity?tab=received';
    case 'PROPOSAL_ARRIVED':
      // 새로운 제안 도착 — 제안이 도착한 공고 상세로 바로 이동
      // 백엔드가 referenceId를 proposalId로 내려주므로 클릭 시 Proposal을 조회해
      // postId로 변환 후 이동합니다. (sentinel 값으로 표시)
      return notification.referenceId
        ? `proposal:${notification.referenceId}`
        : '/activity?tab=received-proposals';
    case 'PROPOSAL_WITHDRAWN':
      return '/activity?tab=proposals';
    case 'MATCHING_CONFIRMED':
      // 제안/요청 수락으로 새 예약이 생성된 경우 — 생성된 예약 상세로 바로 이동
      return notification.referenceId
        ? `/reservations/${notification.referenceId}`
        : '/reservations';
    case 'PAYMENT_COMPLETED':
      // 결제 완료 — 해당 예약 상세로 이동 (결제 내역 페이지 아님)
      return notification.referenceId
        ? `/reservations/${notification.referenceId}`
        : '/reservations';
    case 'CARE_LOG':
      return notification.referenceId
        ? `/reservations/${notification.referenceId}`
        : '/reservations';
    case 'RESERVATION_CANCELED':
      return notification.referenceId
        ? `/reservations/${notification.referenceId}`
        : '/reservations';
    case 'CANCEL_REQUESTED':
      return notification.referenceId
        ? `/reservations/${notification.referenceId}`
        : '/reservations';
    default: {
      // 알 수 없는 타입 — referenceType 기준 폴백
      if (notification.referenceId) {
        switch (notification.referenceType?.toUpperCase()) {
          case 'RESERVATION':
            return `/reservations/${notification.referenceId}`;
          case 'POST':
            return `/posts/${notification.referenceId}`;
          case 'SITTER':
          case 'SITTER_PROFILE':
            return `/sitters/${notification.referenceId}`;
          default:
            break;
        }
      }
      return null;
    }
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

// 알림 목록과 SSE 실시간 수신 상태를 확인하는 페이지입니다.
function NotificationsPage() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<Id | null>(null);
  // 제안 알림 → Post 변환 조회 중인 알림 id (버튼 비활성화용)
  const [resolvingId, setResolvingId] = useState<Id | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [streamMessage, setStreamMessage] = useState('');

  // 제안 sentinel 경로를 받으면 Proposal을 조회해 실제 Post 경로로 이동합니다.
  const handleNavigateToReference = async (
    notification: Notification,
    path: string,
  ) => {
    if (!path.startsWith('proposal:')) {
      navigate(path);
      return;
    }

    const proposalId = Number(path.slice('proposal:'.length));
    setResolvingId(notification.id);
    setErrorMessage('');

    try {
      const result = await getProposal(proposalId);

      if (result.success) {
        navigate(`/posts/${result.data.postId}`);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('제안 정보를 불러오지 못했습니다.');
    } finally {
      setResolvingId(null);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !getIsRead(notification)).length,
    [notifications],
  );

  const fetchNotifications = async (userId: Id, nextUnreadOnly = unreadOnly) => {
    setErrorMessage('');

    try {
      const result = await getNotifications({ userId, unreadOnly: nextUnreadOnly });

      if (result.success) {
        setNotifications(result.data);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('알림 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      try {
        const memberResult = await getMyInfo();

        if (!memberResult.success) {
          setErrorMessage(memberResult.error.message);
          return;
        }

        setMember(memberResult.data);
        await fetchNotifications(memberResult.data.id, unreadOnly);
      } catch {
        setErrorMessage('알림 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!member) return;

    void fetchNotifications(member.id, unreadOnly);
  }, [unreadOnly, member?.id]);

  useEffect(() => {
    if (!member) return;

    const handleNotification = () => {
      setStreamMessage('새 알림이 도착했습니다.');
      void fetchNotifications(member.id, unreadOnly);
    };

    window.addEventListener('forpets:notification', handleNotification);

    return () => {
      window.removeEventListener('forpets:notification', handleNotification);
    };
  }, [member?.id, unreadOnly]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!member || getIsRead(notification)) return;

    setProcessingId(notification.id);
    setErrorMessage('');

    try {
      const result = await markNotificationAsRead(notification.id, member.id);

      if (result.success) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((prevNotification) =>
            prevNotification.id === notification.id
              ? { ...prevNotification, isRead: true, read: true }
              : prevNotification,
          ),
        );
        window.dispatchEvent(new CustomEvent('forpets:notification-refresh'));
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('알림 읽음 처리 중 문제가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">NOTIFICATIONS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">알림</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            요청, 제안, 결제처럼 바로 확인해야 하는 이벤트를 모아 봅니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly((prevValue) => !prevValue)}
            className={[
              'rounded-full px-4 py-2 text-sm font-bold transition',
              unreadOnly
                ? 'bg-[#2A2622] text-white'
                : 'border border-[#E7DCD1] bg-white text-[#6F675F]',
            ].join(' ')}
          >
            {unreadOnly ? '전체 보기' : '안 읽은 알림'}
          </button>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
            미읽음 {unreadCount}건
          </span>
        </div>
      </section>

      {(errorMessage || streamMessage) && (
        <p
          className={[
            'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
            errorMessage ? 'bg-[#FFF0EA] text-[#B44727]' : 'bg-[#EEF7EA] text-[#3F5732]',
          ].join(' ')}
        >
          {errorMessage || streamMessage}
        </p>
      )}

      <section className="mt-6 grid gap-4">
        {isLoading && (
          <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
            알림을 불러오는 중입니다.
          </p>
        )}

        {!isLoading && notifications.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
            표시할 알림이 없습니다.
          </p>
        )}

        {notifications.map((notification) => {
          const isRead = getIsRead(notification);
          const referencePath = getReferencePath(notification);

          return (
            <article
              key={notification.id}
              className={[
                'rounded-2xl border p-5 shadow-sm',
                isRead
                  ? 'border-[#E7DCD1] bg-white'
                  : 'border-[#E26B4A] bg-[#FFF7F2]',
              ].join(' ')}
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-xs font-bold text-[#B44727]">
                      {notificationTypeLabels[notification.type] ?? notification.type}
                    </span>
                    <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                      {isRead ? '읽음' : '미읽음'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-[#2A2622]">
                    {notification.message}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-[#8A8178]">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {referencePath &&
                    (referencePath.startsWith('proposal:') ? (
                      <button
                        type="button"
                        disabled={resolvingId === notification.id}
                        onClick={() =>
                          void handleNavigateToReference(notification, referencePath)
                        }
                        className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F] disabled:cursor-not-allowed disabled:text-[#B0A59A]"
                      >
                        {resolvingId === notification.id ? '이동 중...' : '관련 화면'}
                      </button>
                    ) : (
                      <Link
                        to={referencePath}
                        className="rounded-full border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#6F675F]"
                      >
                        관련 화면
                      </Link>
                    ))}
                  <button
                    type="button"
                    disabled={isRead || processingId === notification.id}
                    onClick={() => void handleMarkAsRead(notification)}
                    className="rounded-full bg-[#2A2622] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
                  >
                    {isRead ? '읽음 완료' : '읽음 처리'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default NotificationsPage;
