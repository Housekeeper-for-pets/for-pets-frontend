import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMyPosts, searchPosts } from '../api';
import Pagination from '../components/Pagination';
import RegionSelect from '../components/RegionSelect';
import { useAuth } from '../hooks/useAuth';
import {
  careTypeLabels,
  getRegionLabel,
  postStatusLabels,
} from '../constants/options';
import type { CareType, Post, PostSearchQuery, PostStatus, Region } from '../types';

const initialQuery: PostSearchQuery = {
  page: 0,
  size: 10,
  sort: 'createdAt',
  status: 'OPEN',
};

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const postSortOptions = [
  { value: 'createdAt', label: '최근 등록순' },
  { value: 'updatedAt', label: '최근 수정순' },
  { value: 'budgetAmount', label: '예산 높은순' },
] as const;

// 빈 검색 조건은 쿼리 파라미터에서 제외합니다.
const buildQuery = (query: PostSearchQuery, page = 0): PostSearchQuery => {
  const nextQuery: PostSearchQuery = {
    page,
    size: query.size,
    sort: query.sort,
  };

  if (query.region) nextQuery.region = query.region;
  if (query.careType) nextQuery.careType = query.careType;
  if (query.status) nextQuery.status = query.status;
  if (query.keyword) nextQuery.keyword = query.keyword;

  return nextQuery;
};

// 공고 목록을 검색하고 열린 공고를 확인하는 페이지입니다.
function PostsPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword') ?? undefined;
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [query, setQuery] = useState<PostSearchQuery>(() => ({
    ...initialQuery,
    keyword: keywordFromUrl,
  }));
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 현재 검색 조건으로 공고 목록을 조회합니다.
  const fetchPosts = async (
    nextQuery: PostSearchQuery,
    nextViewMode = viewMode,
    page = 0,
  ) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        nextViewMode === 'mine'
          ? await getMyPosts({
              page,
              size: nextQuery.size,
              status: nextQuery.status,
            })
          : await searchPosts(buildQuery(nextQuery, page));

      if (result.success) {
        setPosts(result.data.content);
        setTotalElements(result.data.totalElements);
        setTotalPages(result.data.totalPages);
        setCurrentPage(result.data.currentPage);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('공고 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const nextQuery: PostSearchQuery = {
      ...initialQuery,
      keyword: keywordFromUrl,
    };
    const timerId = window.setTimeout(() => {
      setQuery(nextQuery);
      void fetchPosts(nextQuery, viewMode, 0);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [keywordFromUrl]);

  // 검색 폼 제출 시 첫 페이지 기준으로 공고 목록을 다시 조회합니다.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchPosts(query, viewMode, 0);
  };

  const handleViewModeChange = (nextViewMode: 'all' | 'mine') => {
    setViewMode(nextViewMode);
    void fetchPosts(query, nextViewMode, 0);
  };

  const handlePageChange = (page: number) => {
    void fetchPosts(query, viewMode, page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">CARE POSTS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
            {viewMode === 'mine' ? '내 공고 관리' : '공고 보기'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            {viewMode === 'mine'
              ? '내가 등록한 공고의 상태와 들어온 제안을 확인하고 관리할 수 있습니다.'
              : '보호자가 등록한 케어 공고를 보고, 조건에 맞는 공고에 제안을 보낼 수 있습니다.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => handleViewModeChange(viewMode === 'mine' ? 'all' : 'mine')}
              className="w-fit rounded-full border border-[#E7DCD1] px-5 py-3 text-sm font-bold text-[#6F675F]"
            >
              {viewMode === 'mine' ? '전체 공고' : '내 공고'}
            </button>
          )}
          {isAuthenticated ? (
            <Link
              to="/posts/new"
              className="w-fit rounded-full bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
            >
              공고 작성
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-fit rounded-full bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
            >
              로그인하고 공고 작성
            </Link>
          )}
        </div>
      </section>

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm lg:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto]"
        onSubmit={handleSubmit}
      >
        <input
          aria-label="검색 키워드"
          className={inputClassName}
          placeholder="검색어"
          disabled={viewMode === 'mine'}
          value={query.keyword ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({ ...prevQuery, keyword: event.target.value }))
          }
        />

        <RegionSelect
          idPrefix="post-search-region"
          selectClassName={selectClassName}
          value={query.region}
          allLabel="전체 지역"
          disabled={viewMode === 'mine'}
          onChange={(value) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              region: value as Region | undefined,
            }))
          }
        />

        <select
          aria-label="돌봄 유형"
          className={selectClassName}
          disabled={viewMode === 'mine'}
          value={query.careType ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              careType: event.target.value ? (event.target.value as CareType) : undefined,
            }))
          }
        >
          <option value="">전체 유형</option>
          <option value="VISIT">{careTypeLabels.VISIT}</option>
          <option value="BOARDING">{careTypeLabels.BOARDING}</option>
        </select>

        <select
          aria-label="공고 상태"
          className={selectClassName}
          value={query.status ?? ''}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              status: event.target.value ? (event.target.value as PostStatus) : undefined,
            }))
          }
        >
          <option value="">전체 상태</option>
          <option value="OPEN">{postStatusLabels.OPEN}</option>
          <option value="CLOSED">{postStatusLabels.CLOSED}</option>
        </select>

        <select
          aria-label="공고 정렬"
          className={selectClassName}
          disabled={viewMode === 'mine'}
          value={query.sort ?? 'createdAt'}
          onChange={(event) =>
            setQuery((prevQuery) => ({
              ...prevQuery,
              sort: event.target.value,
            }))
          }
        >
          {postSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white"
        >
          {viewMode === 'mine' ? '조회' : '검색'}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#6F675F]">총 {totalElements}건</p>
      </div>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      <section className="mt-5 grid gap-4">
        {isLoading && (
          <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
            공고 목록을 불러오는 중입니다.
          </p>
        )}

        {!isLoading && posts.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-sm leading-6 text-[#6F675F] shadow-sm">
            조건에 맞는 공고가 없습니다.
          </p>
        )}

        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-[#E7DCD1] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
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
                <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F675F]">
                  {post.content}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-[#9B8E82]">희망 예산</p>
                <p className="mt-1 text-lg font-bold text-[#2A2622]">
                  {post.budgetAmount.toLocaleString()}원
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {post.pets.map((pet) => (
                <span
                  key={`${post.id}-${pet.petId ?? pet.name}`}
                  className="rounded-full bg-[#FAF6F1] px-3 py-1 text-xs font-bold text-[#6F675F]"
                >
                  {pet.name}
                </span>
              ))}
            </div>

            <Link
              to={`/posts/${post.id}`}
              className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white"
            >
              상세 보기
            </Link>
          </article>
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={handlePageChange}
      />
    </main>
  );
}

export default PostsPage;
