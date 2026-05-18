import type { Id, ISODateTimeString } from './common';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ProposalRequest {
  proposedPrice: number;
  message?: string;
}

export interface Proposal {
  id: Id;
  postId: Id;
  sitterProfileId: Id;
  memberId: Id;
  proposedPrice: number;
  message?: string;
  status: ProposalStatus;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}
