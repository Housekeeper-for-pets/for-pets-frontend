import type { Id } from './common';

export type ReviewSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export type SummaryStatus = 'FRESH' | 'STALE' | 'FAILED';

export interface SitterReviewSummary {
  sitterId: Id;
  summary: string;
  strengths: string[];
  cautions: string[];
  recommendedFor: string[];
  keywords: string[];
  sentiment: ReviewSentiment;
  confidenceScore?: number | null;
  reviewCount: number;
  aiGenerated: boolean;
  summaryStatus: SummaryStatus;
  model?: string | null;
  promptVersion?: string | null;
}
