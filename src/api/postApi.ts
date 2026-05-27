import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  Id,
  PageResponse,
  Post,
  PostRequest,
  PostSearchQuery,
} from '../types';

type MyPostQuery = Pick<PostSearchQuery, 'page' | 'size' | 'status'>;

// 보호자가 케어 공고를 생성합니다.
export const createPost = async (request: PostRequest) => {
  const response = await axiosInstance.post<ApiResponse<Post>>('/posts', request);

  return response.data;
};

// 지역, 돌봄 유형, 상태, 키워드 조건으로 공고 목록을 조회합니다.
export const searchPosts = async (query?: PostSearchQuery) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<Post>>>(
    '/posts',
    { params: query },
  );

  return response.data;
};

// 로그인한 보호자가 작성한 공고 목록을 조회합니다.
export const getMyPosts = async (query?: MyPostQuery) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<Post>>>(
    '/posts/me',
    { params: query },
  );

  return response.data;
};

// 특정 공고의 상세 정보를 조회합니다.
export const getPost = async (postId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Post>>(`/posts/${postId}`);

  return response.data;
};

// 작성자가 본인의 공고 내용을 수정합니다.
export const updatePost = async (postId: Id, request: PostRequest) => {
  const response = await axiosInstance.put<ApiResponse<Post>>(
    `/posts/${postId}`,
    request,
  );

  return response.data;
};

// 작성자가 공고를 종료 상태로 변경합니다.
export const closePost = async (postId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Post>>(
    `/posts/${postId}/close`,
  );

  return response.data;
};

// 작성자가 공고를 삭제합니다.
export const deletePost = async (postId: Id) => {
  const response = await axiosInstance.delete<ApiResponse<null>>(
    `/posts/${postId}`,
  );

  return response.data;
};
