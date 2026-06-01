import type { Id, ISODateTimeString } from './common';

export interface CreateCareLogRequest {
  content: string;
  imageUrls?: string[];
}

export interface CareLog {
  id: Id;
  reservationId: Id;
  sitterMemberId: Id;
  content: string;
  imageUrls: string[];
  createdAt?: ISODateTimeString;
}
