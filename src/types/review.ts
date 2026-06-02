import type { Id, ISODateTimeString, PageQuery } from './common';

export interface CreateReviewRequest {
  reservationId: Id;
  reviewComment: string;
  rating: number;
}

export interface Review {
  id: Id;
  reservationId: Id;
  reviewerId: Id;
  revieweeId: Id;
  reviewComment: string;
  rating: number;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface MyWrittenReview {
  id: Id;
  reservationId: Id;
  revieweeId: Id;
  revieweeNickname: string;
  sitterProfileId: Id;
  rating: number;
  reviewComment: string;
  createdAt?: ISODateTimeString;
}

export interface MyReceivedReview {
  id: Id;
  reservationId: Id;
  reviewerId: Id;
  reviewerNickname: string;
  rating: number;
  reviewComment: string;
  createdAt?: ISODateTimeString;
}

export interface ReviewPageResponse {
  content: Review[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface MyWrittenReviewPageResponse {
  content: MyWrittenReview[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface MyReceivedReviewPageResponse {
  content: MyReceivedReview[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface ReviewSearchQuery extends PageQuery {
  direction?: 'asc' | 'desc';
}
