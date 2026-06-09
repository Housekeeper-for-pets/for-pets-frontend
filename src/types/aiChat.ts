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
  sessionId?: string | null;
}

export type RagSourceType = 'REVIEW';

export interface RagSearchRequest {
  query: string;
}

export interface RagSearchResult {
  sourceType: RagSourceType;
  reviewId: Id;
  sitterId: Id;
  rating: number;
  snippet: string;
  score: number;
}

export interface RagSearchResponse {
  results: RagSearchResult[];
}

export interface RagIndexResponse {
  indexedCount: number;
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
  sessionId?: string | null;
  answer: string;
  recommendedSitters: RecommendedSitter[];
  sources: RagSearchResult[];
}
