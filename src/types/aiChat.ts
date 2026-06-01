import type { Id, ISODateTimeString } from './common';
import type { Region } from './member';
import type {
  PossiblePetSize,
  PossiblePetType,
  SitterProfileStatus,
  SitterSchedule,
} from './sitter';

export interface AiChatRequest {
  message: string;
}

export interface RecommendedSitter {
  sitterId: Id;
  memberId: Id;
  region: Region;
  introduction?: string | null;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
  status: SitterProfileStatus;
  reviewSummary?: string | null;
  strengths: string[];
  cautions: string[];
  schedules: SitterSchedule[];
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface AiChatResponse {
  answer: string;
  recommendedSitters: RecommendedSitter[];
}
