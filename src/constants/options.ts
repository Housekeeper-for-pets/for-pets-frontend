import type {
  CareType,
  CareRequestStatus,
  DayOfWeek,
  PetSize,
  PetSpecies,
  PossiblePetSize,
  PossiblePetType,
  ProposalStatus,
  PostStatus,
  Region,
  ReservationStatus,
  CancelCategory,
  SitterProfileStatus,
} from '../types';

export const regionOptions: Array<{ value: Region; label: string }> = [
  { value: 'UNKNOWN', label: '지역 미설정' },
  { value: 'GANGNAM', label: '강남구' },
  { value: 'SEOCHO', label: '서초구' },
  { value: 'SONGPA', label: '송파구' },
  { value: 'GANGDONG', label: '강동구' },
  { value: 'GWANGJIN', label: '광진구' },
  { value: 'SEONGDONG', label: '성동구' },
  { value: 'YONGSAN', label: '용산구' },
  { value: 'JUNG', label: '중구' },
  { value: 'JONGNO', label: '종로구' },
  { value: 'SEODAEMUN', label: '서대문구' },
  { value: 'MAPO', label: '마포구' },
  { value: 'EUNPYEONG', label: '은평구' },
  { value: 'YANGCHEON', label: '양천구' },
  { value: 'GANGSEO', label: '강서구' },
  { value: 'GURO', label: '구로구' },
  { value: 'GEUMCHEON', label: '금천구' },
  { value: 'YEONGDEUNGPO', label: '영등포구' },
  { value: 'DONGJAK', label: '동작구' },
  { value: 'GWANAK', label: '관악구' },
  { value: 'DOBONG', label: '도봉구' },
  { value: 'GANGBUK', label: '강북구' },
  { value: 'NOWON', label: '노원구' },
  { value: 'SEONGBUK', label: '성북구' },
  { value: 'DONGDAEMUN', label: '동대문구' },
  { value: 'JUNGNANG', label: '중랑구' },
];

export const petSpeciesLabels: Record<PetSpecies, string> = {
  DOG: '강아지',
  CAT: '고양이',
};

export const petSizeLabels: Record<PetSize, string> = {
  SMALL: '소형',
  MEDIUM: '중형',
  LARGE: '대형',
};

export const possiblePetTypeLabels: Record<PossiblePetType, string> = {
  DOG: '강아지',
  CAT: '고양이',
  ALL: '모두 가능',
};

export const possiblePetSizeLabels: Record<PossiblePetSize, string> = {
  SMALL: '소형',
  MEDIUM: '중형',
  LARGE: '대형',
  ALL: '모든 크기',
};

export const sitterStatusLabels: Record<SitterProfileStatus, string> = {
  RESERVABLE: '예약 가능',
  NON_RESERVABLE: '예약 불가',
};

export const careTypeLabels: Record<CareType, string> = {
  VISIT: '방문 돌봄',
  BOARDING: '위탁 돌봄',
};

export const postStatusLabels: Record<PostStatus, string> = {
  OPEN: '모집 중',
  CLOSED: '마감',
};

export const careRequestStatusLabels: Record<CareRequestStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  CANCELED: '취소됨',
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  WITHDRAWN: '철회됨',
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PENDING: '대기 중',
  CONFIRMED: '확정됨',
  COMPLETED: '완료됨',
  CANCELED: '취소됨',
  EXPIRED: '만료됨',
};

export const cancelCategoryLabels: Record<CancelCategory, string> = {
  PERSONAL: '개인 사정',
  SCHEDULE_CHANGE: '일정 변경',
  EMERGENCY: '긴급 상황',
  OTHER: '기타',
};

export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일',
};

export const getRegionLabel = (region?: Region) => {
  if (!region) {
    return '지역 미설정';
  }

  return regionOptions.find((option) => option.value === region)?.label ?? region;
};
