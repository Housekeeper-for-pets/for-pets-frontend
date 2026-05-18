export type Id = number;

export type ISODateTimeString = string;

export type ISODateString = string;

export type TimeString = string;

export type CareType = 'VISIT' | 'BOARDING';

// API 성공/실패 응답의 공통 래퍼 타입입니다.
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorDetail {
  status: number;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 목록 조회 API에서 공통으로 사용하는 페이지 응답 타입입니다.
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

// 공고/요청/예약에서 공통으로 사용하는 시간 슬롯 타입입니다.
export interface TimeSlotRequest {
  careDate: ISODateString;
  startTime: TimeString;
  endTime: TimeString;
}

export interface TimeSlotResponse extends TimeSlotRequest {
  id?: Id;
  sequence?: number;
}

export interface MessageResponse {
  message: string;
}
