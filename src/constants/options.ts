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

interface RegionGroup {
  label: string;
  options: Array<{ value: Region; label: string }>;
}

export const regionGroups: RegionGroup[] = [
  {
    label: '서울특별시',
    options: [
      { value: 'GANGNAM', label: '강남구' },
      { value: 'GANGDONG', label: '강동구' },
      { value: 'GANGBUK', label: '강북구' },
      { value: 'GANGSEO', label: '강서구' },
      { value: 'GWANAK', label: '관악구' },
      { value: 'GWANGJIN', label: '광진구' },
      { value: 'GURO', label: '구로구' },
      { value: 'GEUMCHEON', label: '금천구' },
      { value: 'NOWON', label: '노원구' },
      { value: 'DOBONG', label: '도봉구' },
      { value: 'DONGDAEMUN', label: '동대문구' },
      { value: 'DONGJAK', label: '동작구' },
      { value: 'MAPO', label: '마포구' },
      { value: 'SEODAEMUN', label: '서대문구' },
      { value: 'SEOCHO', label: '서초구' },
      { value: 'SEONGDONG', label: '성동구' },
      { value: 'SEONGBUK', label: '성북구' },
      { value: 'SONGPA', label: '송파구' },
      { value: 'YANGCHEON', label: '양천구' },
      { value: 'YEONGDEUNGPO', label: '영등포구' },
      { value: 'YONGSAN', label: '용산구' },
      { value: 'EUNPYEONG', label: '은평구' },
      { value: 'JONGNO', label: '종로구' },
      { value: 'JUNG', label: '중구' },
      { value: 'JUNGNANG', label: '중랑구' },
    ],
  },
  {
    label: '부산광역시',
    options: [
      { value: 'BUSAN_GANGSEO', label: '강서구' },
      { value: 'BUSAN_GEUMJEONG', label: '금정구' },
      { value: 'BUSAN_GIJANG', label: '기장군' },
      { value: 'BUSAN_NAM', label: '남구' },
      { value: 'BUSAN_DONG', label: '동구' },
      { value: 'BUSAN_DONGNAE', label: '동래구' },
      { value: 'BUSAN_BUSANJIN', label: '부산진구' },
      { value: 'BUSAN_BUK', label: '북구' },
      { value: 'BUSAN_SASANG', label: '사상구' },
      { value: 'BUSAN_SAHA', label: '사하구' },
      { value: 'BUSAN_SEO', label: '서구' },
      { value: 'BUSAN_SUYEONG', label: '수영구' },
      { value: 'BUSAN_YEONJE', label: '연제구' },
      { value: 'BUSAN_YEONGDO', label: '영도구' },
      { value: 'BUSAN_JUNG', label: '중구' },
      { value: 'BUSAN_HAEUNDAE', label: '해운대구' },
    ],
  },
  {
    label: '대구광역시',
    options: [
      { value: 'DAEGU_GUNWI', label: '군위군' },
      { value: 'DAEGU_NAM', label: '남구' },
      { value: 'DAEGU_DALSEO', label: '달서구' },
      { value: 'DAEGU_DALSEONG', label: '달성군' },
      { value: 'DAEGU_DONG', label: '동구' },
      { value: 'DAEGU_BUK', label: '북구' },
      { value: 'DAEGU_SEO', label: '서구' },
      { value: 'DAEGU_SUSEONG', label: '수성구' },
      { value: 'DAEGU_JUNG', label: '중구' },
    ],
  },
  {
    label: '인천광역시',
    options: [
      { value: 'INCHEON_GANGHWA', label: '강화군' },
      { value: 'INCHEON_GYEYANG', label: '계양구' },
      { value: 'INCHEON_NAMDONG', label: '남동구' },
      { value: 'INCHEON_DONG', label: '동구' },
      { value: 'INCHEON_MICHUHOL', label: '미추홀구' },
      { value: 'INCHEON_BUPYEONG', label: '부평구' },
      { value: 'INCHEON_SEO', label: '서구' },
      { value: 'INCHEON_YEONSU', label: '연수구' },
      { value: 'INCHEON_ONGJIN', label: '옹진군' },
      { value: 'INCHEON_JUNG', label: '중구' },
    ],
  },
  {
    label: '광주광역시',
    options: [
      { value: 'GWANGJU_GWANGSAN', label: '광산구' },
      { value: 'GWANGJU_NAM', label: '남구' },
      { value: 'GWANGJU_DONG', label: '동구' },
      { value: 'GWANGJU_BUK', label: '북구' },
      { value: 'GWANGJU_SEO', label: '서구' },
    ],
  },
  {
    label: '대전광역시',
    options: [
      { value: 'DAEJEON_DAEDEOK', label: '대덕구' },
      { value: 'DAEJEON_DONG', label: '동구' },
      { value: 'DAEJEON_SEO', label: '서구' },
      { value: 'DAEJEON_YUSEONG', label: '유성구' },
      { value: 'DAEJEON_JUNG', label: '중구' },
    ],
  },
  {
    label: '울산광역시',
    options: [
      { value: 'ULSAN_NAM', label: '남구' },
      { value: 'ULSAN_DONG', label: '동구' },
      { value: 'ULSAN_BUK', label: '북구' },
      { value: 'ULSAN_ULJU', label: '울주군' },
      { value: 'ULSAN_JUNG', label: '중구' },
    ],
  },
  {
    label: '세종특별자치시',
    options: [{ value: 'SEJONG', label: '세종시' }],
  },
  {
    label: '경기도',
    options: [
      { value: 'GYEONGGI_GAPYEONG', label: '가평군' },
      { value: 'GYEONGGI_GOYANG_DEOGYANG', label: '고양시 덕양구' },
      { value: 'GYEONGGI_GOYANG_ILSANDONG', label: '고양시 일산동구' },
      { value: 'GYEONGGI_GOYANG_ILSANSEO', label: '고양시 일산서구' },
      { value: 'GYEONGGI_GWACHEON', label: '과천시' },
      { value: 'GYEONGGI_GWANGMYEONG', label: '광명시' },
      { value: 'GYEONGGI_GWANGJU', label: '광주시' },
      { value: 'GYEONGGI_GURI', label: '구리시' },
      { value: 'GYEONGGI_GUNPO', label: '군포시' },
      { value: 'GYEONGGI_GIMPO', label: '김포시' },
      { value: 'GYEONGGI_NAMYANGJU', label: '남양주시' },
      { value: 'GYEONGGI_DONGDUCHEON', label: '동두천시' },
      { value: 'GYEONGGI_BUCHEON', label: '부천시' },
      { value: 'GYEONGGI_SEONGNAM_BUNDANG', label: '성남시 분당구' },
      { value: 'GYEONGGI_SEONGNAM_SUJEONG', label: '성남시 수정구' },
      { value: 'GYEONGGI_SEONGNAM_JUNGWON', label: '성남시 중원구' },
      { value: 'GYEONGGI_SUWON_GWONSEON', label: '수원시 권선구' },
      { value: 'GYEONGGI_SUWON_YEONGTONG', label: '수원시 영통구' },
      { value: 'GYEONGGI_SUWON_JANGAN', label: '수원시 장안구' },
      { value: 'GYEONGGI_SUWON_PALDAL', label: '수원시 팔달구' },
      { value: 'GYEONGGI_SIHEUNG', label: '시흥시' },
      { value: 'GYEONGGI_ANSAN_DANWON', label: '안산시 단원구' },
      { value: 'GYEONGGI_ANSAN_SANGNOK', label: '안산시 상록구' },
      { value: 'GYEONGGI_ANSEONG', label: '안성시' },
      { value: 'GYEONGGI_ANYANG_DONGAN', label: '안양시 동안구' },
      { value: 'GYEONGGI_ANYANG_MANAN', label: '안양시 만안구' },
      { value: 'GYEONGGI_YANGJU', label: '양주시' },
      { value: 'GYEONGGI_YANGPYEONG', label: '양평군' },
      { value: 'GYEONGGI_YEOJU', label: '여주시' },
      { value: 'GYEONGGI_YEONCHEON', label: '연천군' },
      { value: 'GYEONGGI_OSAN', label: '오산시' },
      { value: 'GYEONGGI_YONGIN_GIHEUNG', label: '용인시 기흥구' },
      { value: 'GYEONGGI_YONGIN_SUJI', label: '용인시 수지구' },
      { value: 'GYEONGGI_YONGIN_CHEOIN', label: '용인시 처인구' },
      { value: 'GYEONGGI_UIWANG', label: '의왕시' },
      { value: 'GYEONGGI_UIJEONGBU', label: '의정부시' },
      { value: 'GYEONGGI_ICHEON', label: '이천시' },
      { value: 'GYEONGGI_PAJU', label: '파주시' },
      { value: 'GYEONGGI_PYEONGTAEK', label: '평택시' },
      { value: 'GYEONGGI_POCHEON', label: '포천시' },
      { value: 'GYEONGGI_HANAM', label: '하남시' },
      { value: 'GYEONGGI_HWASEONG', label: '화성시' },
    ],
  },
  {
    label: '강원특별자치도',
    options: [
      { value: 'GANGWON_GANGNEUNG', label: '강릉시' },
      { value: 'GANGWON_GOSEONG', label: '고성군' },
      { value: 'GANGWON_DONGHAE', label: '동해시' },
      { value: 'GANGWON_SAMCHEOK', label: '삼척시' },
      { value: 'GANGWON_SOKCHO', label: '속초시' },
      { value: 'GANGWON_YANGGU', label: '양구군' },
      { value: 'GANGWON_YANGYANG', label: '양양군' },
      { value: 'GANGWON_YEONGWOL', label: '영월군' },
      { value: 'GANGWON_WONJU', label: '원주시' },
      { value: 'GANGWON_INJE', label: '인제군' },
      { value: 'GANGWON_JEONGSEON', label: '정선군' },
      { value: 'GANGWON_CHEORWON', label: '철원군' },
      { value: 'GANGWON_CHUNCHEON', label: '춘천시' },
      { value: 'GANGWON_TAEBAEK', label: '태백시' },
      { value: 'GANGWON_PYEONGCHANG', label: '평창군' },
      { value: 'GANGWON_HONGCHEON', label: '홍천군' },
      { value: 'GANGWON_HWACHEON', label: '화천군' },
      { value: 'GANGWON_HOENGSEONG', label: '횡성군' },
    ],
  },
  {
    label: '충청북도',
    options: [
      { value: 'CHUNGBUK_GOESAN', label: '괴산군' },
      { value: 'CHUNGBUK_DANYANG', label: '단양군' },
      { value: 'CHUNGBUK_BOEUN', label: '보은군' },
      { value: 'CHUNGBUK_YEONGDONG', label: '영동군' },
      { value: 'CHUNGBUK_OKCHEON', label: '옥천군' },
      { value: 'CHUNGBUK_EUMSEONG', label: '음성군' },
      { value: 'CHUNGBUK_JECHEON', label: '제천시' },
      { value: 'CHUNGBUK_JEUNGPYEONG', label: '증평군' },
      { value: 'CHUNGBUK_JINCHEON', label: '진천군' },
      { value: 'CHUNGBUK_CHEONGJU_SANGDANG', label: '청주시 상당구' },
      { value: 'CHUNGBUK_CHEONGJU_SEOWON', label: '청주시 서원구' },
      { value: 'CHUNGBUK_CHEONGJU_CHEONGWON', label: '청주시 청원구' },
      { value: 'CHUNGBUK_CHEONGJU_HEUNGDEOK', label: '청주시 흥덕구' },
      { value: 'CHUNGBUK_CHUNGJU', label: '충주시' },
    ],
  },
  {
    label: '충청남도',
    options: [
      { value: 'CHUNGNAM_GYERYONG', label: '계룡시' },
      { value: 'CHUNGNAM_GONGJU', label: '공주시' },
      { value: 'CHUNGNAM_GEUMSAN', label: '금산군' },
      { value: 'CHUNGNAM_NONSAN', label: '논산시' },
      { value: 'CHUNGNAM_DANGJIN', label: '당진시' },
      { value: 'CHUNGNAM_BORYEONG', label: '보령시' },
      { value: 'CHUNGNAM_BUYEO', label: '부여군' },
      { value: 'CHUNGNAM_SEOSAN', label: '서산시' },
      { value: 'CHUNGNAM_SEOCHEON', label: '서천군' },
      { value: 'CHUNGNAM_ASAN', label: '아산시' },
      { value: 'CHUNGNAM_YESAN', label: '예산군' },
      { value: 'CHUNGNAM_CHEONAN_DONGNAM', label: '천안시 동남구' },
      { value: 'CHUNGNAM_CHEONAN_SEOBUK', label: '천안시 서북구' },
      { value: 'CHUNGNAM_CHEONGYANG', label: '청양군' },
      { value: 'CHUNGNAM_TAEAN', label: '태안군' },
      { value: 'CHUNGNAM_HONGSEONG', label: '홍성군' },
    ],
  },
  {
    label: '전북특별자치도',
    options: [
      { value: 'JEONBUK_GOCHANG', label: '고창군' },
      { value: 'JEONBUK_GUNSAN', label: '군산시' },
      { value: 'JEONBUK_GIMJE', label: '김제시' },
      { value: 'JEONBUK_NAMWON', label: '남원시' },
      { value: 'JEONBUK_MUJU', label: '무주군' },
      { value: 'JEONBUK_BUAN', label: '부안군' },
      { value: 'JEONBUK_SUNCHANG', label: '순창군' },
      { value: 'JEONBUK_WANJU', label: '완주군' },
      { value: 'JEONBUK_IKSAN', label: '익산시' },
      { value: 'JEONBUK_IMSIL', label: '임실군' },
      { value: 'JEONBUK_JANGSU', label: '장수군' },
      { value: 'JEONBUK_JEONJU_DEOKJIN', label: '전주시 덕진구' },
      { value: 'JEONBUK_JEONJU_WANSAN', label: '전주시 완산구' },
      { value: 'JEONBUK_JEONGEUP', label: '정읍시' },
      { value: 'JEONBUK_JINAN', label: '진안군' },
    ],
  },
  {
    label: '전라남도',
    options: [
      { value: 'JEONNAM_GANGJIN', label: '강진군' },
      { value: 'JEONNAM_GOHEUNG', label: '고흥군' },
      { value: 'JEONNAM_GOKSEONG', label: '곡성군' },
      { value: 'JEONNAM_GWANGYANG', label: '광양시' },
      { value: 'JEONNAM_GURYE', label: '구례군' },
      { value: 'JEONNAM_NAJU', label: '나주시' },
      { value: 'JEONNAM_DAMYANG', label: '담양군' },
      { value: 'JEONNAM_MOKPO', label: '목포시' },
      { value: 'JEONNAM_MUAN', label: '무안군' },
      { value: 'JEONNAM_BOSEONG', label: '보성군' },
      { value: 'JEONNAM_SUNCHEON', label: '순천시' },
      { value: 'JEONNAM_SINAN', label: '신안군' },
      { value: 'JEONNAM_YEOSU', label: '여수시' },
      { value: 'JEONNAM_YEONGGWANG', label: '영광군' },
      { value: 'JEONNAM_YEONGAM', label: '영암군' },
      { value: 'JEONNAM_WANDO', label: '완도군' },
      { value: 'JEONNAM_JANGSEONG', label: '장성군' },
      { value: 'JEONNAM_JANGHEUNG', label: '장흥군' },
      { value: 'JEONNAM_JINDO', label: '진도군' },
      { value: 'JEONNAM_HAMPYEONG', label: '함평군' },
      { value: 'JEONNAM_HAENAM', label: '해남군' },
      { value: 'JEONNAM_HWASUN', label: '화순군' },
    ],
  },
  {
    label: '경상북도',
    options: [
      { value: 'GYEONGBUK_GYEONGSAN', label: '경산시' },
      { value: 'GYEONGBUK_GYEONGJU', label: '경주시' },
      { value: 'GYEONGBUK_GORYEONG', label: '고령군' },
      { value: 'GYEONGBUK_GUMI', label: '구미시' },
      { value: 'GYEONGBUK_GIMCHEON', label: '김천시' },
      { value: 'GYEONGBUK_MUNGYEONG', label: '문경시' },
      { value: 'GYEONGBUK_BONGHWA', label: '봉화군' },
      { value: 'GYEONGBUK_SANGJU', label: '상주시' },
      { value: 'GYEONGBUK_SEONGJU', label: '성주군' },
      { value: 'GYEONGBUK_ANDONG', label: '안동시' },
      { value: 'GYEONGBUK_YEONGDEOK', label: '영덕군' },
      { value: 'GYEONGBUK_YEONGYANG', label: '영양군' },
      { value: 'GYEONGBUK_YEONGJU', label: '영주시' },
      { value: 'GYEONGBUK_YEONGCHEON', label: '영천시' },
      { value: 'GYEONGBUK_YECHEON', label: '예천군' },
      { value: 'GYEONGBUK_ULLEUNG', label: '울릉군' },
      { value: 'GYEONGBUK_ULJIN', label: '울진군' },
      { value: 'GYEONGBUK_UISEONG', label: '의성군' },
      { value: 'GYEONGBUK_CHEONGDO', label: '청도군' },
      { value: 'GYEONGBUK_CHEONGSONG', label: '청송군' },
      { value: 'GYEONGBUK_CHILGOK', label: '칠곡군' },
      { value: 'GYEONGBUK_POHANG_NAM', label: '포항시 남구' },
      { value: 'GYEONGBUK_POHANG_BUK', label: '포항시 북구' },
    ],
  },
  {
    label: '경상남도',
    options: [
      { value: 'GYEONGNAM_GEOJE', label: '거제시' },
      { value: 'GYEONGNAM_GEOCHANG', label: '거창군' },
      { value: 'GYEONGNAM_GOSEONG', label: '고성군' },
      { value: 'GYEONGNAM_GIMHAE', label: '김해시' },
      { value: 'GYEONGNAM_NAMHAE', label: '남해군' },
      { value: 'GYEONGNAM_MIRYANG', label: '밀양시' },
      { value: 'GYEONGNAM_SACHEON', label: '사천시' },
      { value: 'GYEONGNAM_SANCHEONG', label: '산청군' },
      { value: 'GYEONGNAM_YANGSAN', label: '양산시' },
      { value: 'GYEONGNAM_UIRYEONG', label: '의령군' },
      { value: 'GYEONGNAM_JINJU', label: '진주시' },
      { value: 'GYEONGNAM_CHANGNYEONG', label: '창녕군' },
      { value: 'GYEONGNAM_CHANGWON_MASANHAPPO', label: '창원시 마산합포구' },
      { value: 'GYEONGNAM_CHANGWON_MASANHOEWON', label: '창원시 마산회원구' },
      { value: 'GYEONGNAM_CHANGWON_SEONGSAN', label: '창원시 성산구' },
      { value: 'GYEONGNAM_CHANGWON_UICHANG', label: '창원시 의창구' },
      { value: 'GYEONGNAM_CHANGWON_JINHAE', label: '창원시 진해구' },
      { value: 'GYEONGNAM_TONGYEONG', label: '통영시' },
      { value: 'GYEONGNAM_HADONG', label: '하동군' },
      { value: 'GYEONGNAM_HAMAN', label: '함안군' },
      { value: 'GYEONGNAM_HAMYANG', label: '함양군' },
      { value: 'GYEONGNAM_HAPCHEON', label: '합천군' },
    ],
  },
  {
    label: '제주특별자치도',
    options: [
      { value: 'JEJU_JEJU', label: '제주시' },
      { value: 'JEJU_SEOGWIPO', label: '서귀포시' },
    ],
  },
];

export const regionOptions: Array<{ value: Region; label: string }> = [
  { value: 'UNKNOWN', label: '지역 미설정' },
  ...regionGroups.flatMap((group) =>
    group.options.map((option) => ({
      value: option.value,
      label: `${group.label} > ${option.label}`,
    })),
  ),
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
