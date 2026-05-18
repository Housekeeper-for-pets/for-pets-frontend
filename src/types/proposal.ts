import type { Id, ISODateTimeString } from './common';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ProposalRequest {
  message: string;
}

export interface Proposal {
  id: Id;
  postId: Id;
  sitterId: Id;
  message: string;
  status: ProposalStatus;
  createdAt?: ISODateTimeString;
}
