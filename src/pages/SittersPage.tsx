import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { searchSitters } from '../api';
import {
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  regionOptions,
  sitterStatusLabels,
} from '../constants/options';
import type {
  PossiblePetSize,
  PossiblePetType,
  Region,
  SitterProfile,
  SitterSearchQuery,
} from '../types';

const initialQuery: SitterSearchQuery = {
  page: 0,
  size: 10,
  sort: 'createdAt',
};

const possiblePetTypeOptions: Array<{ value: PossiblePetType; label: string }> = [
  { value: 'ALL', label: '모두' },
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
];

const possiblePetSizeOptions: Array<{ value: PossiblePetSize; label: string }> = [
  { value: 'ALL', label: '모든 크기' },
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
];

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 빈 문자열은 쿼리 파라미터에서 제외해 백엔드 기본 검색 조건을 사용하게 합니다.
const buildQuery = (query: SitterSearchQuery): SitterSearchQuery => {
  const nextQuery: SitterSearchQuery = {
    page: 0,
    size: query.size,
    sort: query.sort,
  };

  if (query.region) nextQuery.region = query.region;
  if (query.possiblePetType) nextQuery.possiblePetType = query.possiblePetType;
  if (query.possiblePetSize) nextQuery.possiblePetSize = query.possiblePetSize;
  if (query.minPrice) nextQuery.minPrice = query.minPrice;
  if (query.maxPrice) nextQuery.maxPrice = query.maxPrice;

  return nextQuery;
};

// 조건 기반으로 시터를 검색하고 목록을 보여주는 페이지입니다.
function SittersPage() {
  const [query, setQuery] = useState<SitterSearchQuery>(initialQuery);
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 현재 검색 조건으로 시터 목록을 조회합니다.
  const fetchSitters = async (nextQuery: SitterSearchQuery) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await searchSitters(buildQuery(nextQuery));

      if (result.success) {
        setSitters(result.data.content);
        setTotalElements(result.data.totalElements);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSitters(query);
  }, []);

  // 검색 폼을 제출하면 첫 페이지 기준으로 목록을 다시 조회합니다.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchSitters(query);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">SITTER SEARCH</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">시터 찾기</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            지역, 돌봄 가능한 반려동물, 요금 조건으로 시터를 찾고 상세 화면에서
            돌봄 요청을 시작할 수 있습니다.
          </p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
          {totalElements}명
        </p>
      </section>

      <form
        className="mt-6 grid gap-3 rounded-[28px] border border-[#E7DCD1] bg-white p-5 shadow-sm md:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <select
          aria-label="지역"
          className={selectClassName}
          value={query.region ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              region: event.target.value ? (event.target.value as Region) : undefined,
            }))
          }
        >
          <option value="">전체 지역</option>
          {regionOptions
            .filter((option) => option.value !== 'UNKNOWN')
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>

        <select
          aria-label="돌봄 가능한 동물"
          className={selectClassName}
          value={query.possiblePetType ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              possiblePetType: event.target.value
                ? (event.target.value as PossiblePetType)
                : undefined,
            }))
          }
        >
          <option value="">동물 전체</option>
          {possiblePetTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          aria-label="돌봄 가능한 크기"
          className={selectClassName}
          value={query.possiblePetSize ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              possiblePetSize: event.target.value
                ? (event.target.value as PossiblePetSize)
                : undefined,
            }))
          }
        >
          <option value="">크기 전체</option>
          {possiblePetSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
          <option value="createdAt">최근 등록순</option>
          <option value="pricePerHour">요금 낮은순</option>
          <option value="experienceYears">경력 높은순</option>
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D]"
        >
          검색
        </button>
      </form>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading && (
          <p className="rounded-[24px] bg-white p-5 text-sm text-[#6F675F] shadow-sm md:col-span-2">
            시터 목록을 불러오는 중입니다.
          </p>
        )}

        {!isLoading && sitters.length === 0 && (
          <p className="rounded-[24px] bg-white p-5 text-sm leading-6 text-[#6F675F] shadow-sm md:col-span-2">
            조건에 맞는 시터가 없습니다. 검색 조건을 조금 넓혀보세요.
          </p>
        )}

        {sitters.map((sitter) => (
          <article
            key={sitter.id}
            className="rounded-[24px] border border-[#E7DCD1] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">
                  {getRegionLabel(sitter.region)}
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#2A2622]">
                  {sitter.experienceYears}년 경력 시터
                </h2>
              </div>
              <span className="rounded-full bg-[#EEF7EA] px-3 py-1 text-xs font-bold text-[#3F5732]">
                {sitterStatusLabels[sitter.status]}
              </span>
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#6F675F]">
              {sitter.introduction || '아직 자기소개가 등록되지 않았습니다.'}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-[#FAF6F1] p-3">
                <dt className="text-xs font-bold text-[#9B8E82]">동물</dt>
                <dd className="mt-1 font-bold text-[#2A2622]">
                  {possiblePetTypeLabels[sitter.possiblePetType]}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAF6F1] p-3">
                <dt className="text-xs font-bold text-[#9B8E82]">크기</dt>
                <dd className="mt-1 font-bold text-[#2A2622]">
                  {possiblePetSizeLabels[sitter.possiblePetSize]}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAF6F1] p-3">
                <dt className="text-xs font-bold text-[#9B8E82]">요금</dt>
                <dd className="mt-1 font-bold text-[#2A2622]">
                  {sitter.pricePerHour.toLocaleString()}원
                </dd>
              </div>
            </dl>

            <Link
              to={`/sitters/${sitter.id}`}
              className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white"
            >
              상세 보기
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SittersPage;
