import type {
  CareType,
  Id,
  ISODateTimeString,
  PageQuery,
  TimeSlotRequest,
  TimeSlotResponse,
} from './common';
import type { Region } from './member';
import type { PetSnapshot } from './pet';

export type PostStatus = 'OPEN' | 'CLOSED';

export interface PostRequest {
  title: string;
  content: string;
  petIds: Id[];
  careType: CareType;
  budgetAmount: number;
  timeSlots: TimeSlotRequest[];
}

export interface Post {
  id: Id;
  memberId: Id;
  title: string;
  content: string;
  region: Region;
  careType: CareType;
  budgetAmount: number;
  status: PostStatus;
  pets: PetSnapshot[];
  timeSlots: TimeSlotResponse[];
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface PostSearchQuery extends PageQuery {
  region?: Region;
  careType?: CareType;
  status?: PostStatus;
  keyword?: string;
}
