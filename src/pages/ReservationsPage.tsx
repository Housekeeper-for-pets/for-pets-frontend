import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getMyReservations } from '../api';
import { careTypeLabels, reservationStatusLabels } from '../constants/options';
import type { Reservation, ReservationSearchQuery, ReservationStatus } from '../types';

const initialQuery: ReservationSearchQuery = {
  page: 0,
  size: 10,
  sort: 'createdAt',
};

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const buildQuery = (query: ReservationSearchQuery): ReservationSearchQuery => {
  const nextQuery: ReservationSearchQuery = {
    page: 0,
    size: query.size,
    sort: query.sort,
  };

  if (query.status) nextQuery.status = query.status;

  return nextQuery;
};

const sortReservations = (
  reservations: Reservation[],
  sort?: string,
) => {
  const field = sort === 'updatedAt' ? 'updatedAt' : 'createdAt';

  return [...reservations].sort((first, second) => {
    const firstTime = first[field] ? new Date(first[field]).getTime() : 0;
    const secondTime = second[field] ? new Date(second[field]).getTime() : 0;

    return secondTime - firstTime;
  });
};

const getPaymentLabel = (reservation: Reservation) => {
  if (reservation.guardianPaid && reservation.sitterPaid) return '결제 완료';
  if (reservation.guardianPaid || reservation.sitterPaid) return '한쪽 결제 완료';

  return '결제 대기';
};

// 로그인한 사용자의 예약 목록을 조회하고 상태별로 필터링하는 페이지입니다.
function ReservationsPage() {
  const [query, setQuery] = useState<ReservationSearchQuery>(initialQuery);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReservations = async (nextQuery: ReservationSearchQuery) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await getMyReservations();

      if (result.success) {
        const nextReservations = sortReservations(
          nextQuery.status
            ? result.data.filter((reservation) => reservation.status === nextQuery.status)
            : result.data,
          nextQuery.sort,
        );

        setAllReservations(result.data);
        setReservations(nextReservations);
        setTotalElements(nextReservations.length);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('예약 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void fetchReservations(initialQuery);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = buildQuery(query);
    const nextReservations = sortReservations(
      nextQuery.status
        ? allReservations.filter(
            (reservation) => reservation.status === nextQuery.status,
          )
        : allReservations,
      nextQuery.sort,
    );

    setQuery(nextQuery);
    setReservations(nextReservations);
    setTotalElements(nextReservations.length);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">RESERVATIONS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">예약 관리</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            돌봄 요청이나 제안 수락으로 생성된 예약의 상태를 확인합니다.
          </p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
          총 {totalElements}건
        </p>
      </section>

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]"
        onSubmit={handleSubmit}
      >
        <select
          aria-label="예약 상태"
          className={selectClassName}
          value={query.status ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              status: event.target.value
                ? (event.target.value as ReservationStatus)
                : undefined,
            }))
          }
        >
          <option value="">전체 상태</option>
          {Object.entries(reservationStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="정렬"
          className={selectClassName}
          value={query.sort}
          onChange={(event) =>
            setQuery((prevQuery) => ({ ...prevQuery, sort: event.target.value }))
          }
        >
          <option value="createdAt">생성일순</option>
          <option value="updatedAt">수정일순</option>
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
        >
          조회
        </button>
      </form>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      <section className="mt-6 grid gap-4">
        {isLoading && (
          <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
            예약 목록을 불러오는 중입니다.
          </p>
        )}

        {!isLoading && reservations.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-sm leading-6 text-[#6F675F] shadow-sm">
            아직 예약이 없습니다.
          </p>
        )}

        {reservations.map((reservation) => (
          <article
            key={reservation.id}
            className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                  {reservationStatusLabels[reservation.status]}
                </span>
                <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
                  예약 #{reservation.id}
                </h2>
                <p className="mt-2 text-sm text-[#6F675F]">
                  보호자 {reservation.guardianId} · 시터 프로필{' '}
                  {reservation.sitterProfileId}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#8A8178]">
                  {careTypeLabels[reservation.careType]} · {getPaymentLabel(reservation)}
                  {reservation.source ? ` · ${reservation.source}` : ''}
                </p>
              </div>

              <Link
                to={`/reservations/${reservation.id}`}
                className="rounded-2xl bg-[#2A2622] px-4 py-3 text-center text-sm font-bold text-white"
              >
                상세 보기
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {reservation.pets.map((pet) => (
                <span
                  key={`${reservation.id}-${pet.petId ?? pet.name}`}
                  className="rounded-full bg-[#FAF6F1] px-3 py-1 text-xs font-bold text-[#6F675F]"
                >
                  {pet.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default ReservationsPage;
