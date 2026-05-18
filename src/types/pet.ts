import type { Id } from './common';

export type PetSpecies = 'DOG' | 'CAT' | 'ETC';

export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE';

// 반려동물 등록/수정 요청 타입입니다.
export interface PetRequest {
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  age: number;
  weight: number;
  size: PetSize;
  specialNotes?: string;
}

// 반려동물 API 응답 타입입니다.
export interface Pet extends PetRequest {
  id: Id;
}

// 요청/공고/예약 생성 당시의 반려동물 정보를 보존하는 스냅샷 타입입니다.
export interface PetSnapshot {
  id?: Id;
  petId?: Id;
  name: string;
  species: PetSpecies;
  breed?: string;
  size?: PetSize;
  age?: number;
  gender?: PetGender;
}
