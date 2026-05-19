import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createSitterProfile,
  deleteMySitterProfile,
  getMySitterProfile,
  replaceMySitterSchedules,
  updateMySitterProfile,
  updateMySitterStatus,
} from '../api';
import RegionSelect from '../components/RegionSelect';
import {
  dayOfWeekLabels,
  getRegionLabel,
  possiblePetSizeLabels,
  possiblePetTypeLabels,
  sitterStatusLabels,
} from '../constants/options';
import type {
  DayOfWeek,
  PossiblePetSize,
  PossiblePetType,
  Region,
  SitterProfile,
  SitterProfileRequest,
  SitterProfileStatus,
  SitterScheduleRequest,
  UpdateSitterProfileRequest,
} from '../types';

type SitterProfileForm = SitterProfileRequest & {
  region: Region;
};

const initialProfileForm: SitterProfileForm = {
  region: 'UNKNOWN',
  introduction: '',
  experienceYears: 0,
  possiblePetType: 'ALL',
  possiblePetSize: 'ALL',
  pricePerHour: 15000,
};

const initialScheduleForm: SitterScheduleRequest = {
  dayOfWeek: 'MONDAY',
  startTime: '09:00',
  endTime: '18:00',
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const selectClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

const possiblePetTypeOptions: Array<{ value: PossiblePetType; label: string }> = [
  { value: 'ALL', label: '모두 가능' },
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
  { value: 'ETC', label: '기타' },
];

const possiblePetSizeOptions: Array<{ value: PossiblePetSize; label: string }> = [
  { value: 'ALL', label: '모든 크기' },
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
];

const dayOfWeekOptions = Object.entries(dayOfWeekLabels).map(([value, label]) => ({
  value: value as DayOfWeek,
  label,
}));

const toProfileForm = (profile: SitterProfile): SitterProfileForm => ({
  region: profile.region,
  introduction: profile.introduction ?? '',
  experienceYears: profile.experienceYears,
  possiblePetType: profile.possiblePetType,
  possiblePetSize: profile.possiblePetSize,
  pricePerHour: profile.pricePerHour,
});

type SitterMode = 'summary' | 'register' | 'detail' | 'edit';

const getMode = (value: string | null): SitterMode => {
  if (value === 'register' || value === 'detail' || value === 'edit') return value;

  return 'summary';
};

// 내 시터 프로필과 가능 시간을 등록/수정하는 페이지입니다.
function MySitterProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = getMode(searchParams.get('mode'));
  const [profile, setProfile] = useState<SitterProfile | null>(null);
  const [profileForm, setProfileForm] =
    useState<SitterProfileForm>(initialProfileForm);
  const [schedules, setSchedules] = useState<SitterScheduleRequest[]>([
    initialScheduleForm,
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 페이지 진입 시 내 시터 프로필을 조회합니다.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getMySitterProfile();

        if (result.success) {
          setProfile(result.data);
          setProfileForm(toProfileForm(result.data));
          setSchedules(
            result.data.schedules.length > 0
              ? result.data.schedules.map(({ dayOfWeek, startTime, endTime }) => ({
                  dayOfWeek,
                  startTime,
                  endTime,
                }))
              : [initialScheduleForm],
          );
          return;
        }
      } catch {
        // 시터 프로필이 아직 없는 사용자는 생성 폼을 그대로 보여줍니다.
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const updateSchedule = (
    index: number,
    field: keyof SitterScheduleRequest,
    value: string,
  ) => {
    setSchedules((prevSchedules) =>
      prevSchedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule,
      ),
    );
  };

  const addSchedule = () => {
    setSchedules((prevSchedules) => {
      if (prevSchedules.length >= 7) {
        return prevSchedules;
      }

      return [...prevSchedules, initialScheduleForm];
    });
  };

  const removeSchedule = (index: number) => {
    setSchedules((prevSchedules) => {
      if (prevSchedules.length === 1) {
        return prevSchedules;
      }

      return prevSchedules.filter((_, scheduleIndex) => scheduleIndex !== index);
    });
  };

  const validateProfileForm = () => {
    if (profileForm.experienceYears < 0) {
      return '경력 연수는 0 이상이어야 합니다.';
    }

    if (profileForm.pricePerHour <= 0) {
      return '시간당 요금은 0보다 커야 합니다.';
    }

    return '';
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationMessage = validateProfileForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSavingProfile(true);

    try {
      const request: SitterProfileRequest = {
        introduction: profileForm.introduction,
        experienceYears: profileForm.experienceYears,
        possiblePetType: profileForm.possiblePetType,
        possiblePetSize: profileForm.possiblePetSize,
        pricePerHour: profileForm.pricePerHour,
      };

      const result = profile
        ? await updateMySitterProfile({
            ...request,
            region: profileForm.region,
          } satisfies UpdateSitterProfileRequest)
        : await createSitterProfile(request);

      if (result.success) {
        setProfile(result.data);
        setProfileForm(toProfileForm(result.data));
        setSuccessMessage(
          profile ? '시터 프로필이 수정되었습니다.' : '시터 프로필이 등록되었습니다.',
        );
        setSearchParams({ mode: 'summary' });
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 프로필 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    const shouldDelete = window.confirm('시터 프로필 등록을 취소할까요?');

    if (!shouldDelete) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsDeletingProfile(true);

    try {
      const result = await deleteMySitterProfile();

      if (result.success) {
        setProfile(null);
        setProfileForm(initialProfileForm);
        setSchedules([initialScheduleForm]);
        setSearchParams({ mode: 'register' });
        setSuccessMessage('시터 프로필이 삭제되었습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('시터 프로필 삭제 중 문제가 발생했습니다.');
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleStatusChange = async (status: SitterProfileStatus) => {
    if (!profile) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await updateMySitterStatus({ status });

      if (result.success) {
        setProfile(result.data);
        setProfileForm(toProfileForm(result.data));
        setSuccessMessage('예약 가능 상태가 변경되었습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('예약 가능 상태 변경 중 문제가 발생했습니다.');
    }
  };

  const validateSchedules = () => {
    const daySet = new Set<DayOfWeek>();

    for (const schedule of schedules) {
      if (!schedule.startTime || !schedule.endTime) {
        return '시작 시간과 종료 시간을 모두 입력해 주세요.';
      }

      if (schedule.startTime >= schedule.endTime) {
        return '시작 시간은 종료 시간보다 빨라야 합니다.';
      }

      if (daySet.has(schedule.dayOfWeek)) {
        return '요일별 가능 시간은 1개만 등록할 수 있습니다.';
      }

      daySet.add(schedule.dayOfWeek);
    }

    return '';
  };

  const handleScheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationMessage = validateSchedules();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSavingSchedules(true);

    try {
      const result = await replaceMySitterSchedules({ schedules });

      if (result.success) {
        setSchedules(
          result.data.map(({ dayOfWeek, startTime, endTime }) => ({
            dayOfWeek,
            startTime,
            endTime,
          })),
        );
        setProfile((prevProfile) =>
          prevProfile ? { ...prevProfile, schedules: result.data } : prevProfile,
        );
        setSuccessMessage('가능 시간이 저장되었습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('가능 시간 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSavingSchedules(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
          내 시터 프로필을 불러오는 중입니다.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">MY SITTER PROFILE</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
            내 시터 프로필
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            시터 프로필을 등록하고 예약 가능 시간과 상태를 관리합니다.
          </p>
        </div>
        {profile && (
          <span className="w-fit rounded-full bg-[#EEF7EA] px-4 py-2 text-sm font-bold text-[#3F5732]">
            {sitterStatusLabels[profile.status]}
          </span>
        )}
      </section>

      {(errorMessage || successMessage) && (
        <p
          className={[
            'mt-5 rounded-2xl px-4 py-3 text-sm font-medium',
            errorMessage
              ? 'bg-[#FFF0EA] text-[#B44727]'
              : 'bg-[#EEF7EA] text-[#3F5732]',
          ].join(' ')}
        >
          {errorMessage || successMessage}
        </p>
      )}

      {mode === 'summary' && profile && (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">SUMMARY</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  시터 프로필 요약
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({ mode: 'detail' })}
                className="rounded-2xl bg-[#2A2622] px-4 py-2 text-sm font-bold text-white"
              >
                상세보기
              </button>
            </div>
            <dl className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">활동 지역</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                  {getRegionLabel(profile.region)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">시간당 요금</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                  {profile.pricePerHour.toLocaleString('ko-KR')}원
                </dd>
              </div>
            </dl>
          </article>

          <aside className="grid gap-4">
            <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#E26B4A]">STATUS</p>
              <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
                예약 가능 상태
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={profile.status === 'RESERVABLE'}
                  onClick={() => void handleStatusChange('RESERVABLE')}
                  className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
                >
                  예약 가능
                </button>
                <button
                  type="button"
                  disabled={profile.status === 'NON_RESERVABLE'}
                  onClick={() => void handleStatusChange('NON_RESERVABLE')}
                  className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
                >
                  예약 불가
                </button>
              </div>
            </section>
            <Link
              to="/reservations?scope=active"
              className="rounded-2xl border border-[#E7DCD1] bg-white px-5 py-4 text-center text-sm font-bold text-[#2A2622] shadow-sm"
            >
              진행중인 예약 조회
            </Link>
          </aside>
        </section>
      )}

      {mode === 'summary' && !profile && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">NO SITTER PROFILE</p>
          <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
            아직 시터 프로필이 없습니다.
          </h2>
          <button
            type="button"
            onClick={() => setSearchParams({ mode: 'register' })}
            className="mt-6 rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
          >
            시터 등록
          </button>
        </section>
      )}

      {mode === 'detail' && profile && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">DETAIL</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                시터 프로필 상세
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSearchParams({ mode: 'summary' })}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
              >
                요약으로
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ mode: 'edit' })}
                className="rounded-2xl bg-[#E26B4A] px-4 py-2 text-sm font-bold text-white"
              >
                프로필 수정
              </button>
              <button
                type="button"
                disabled={isDeletingProfile}
                onClick={() => void handleDeleteProfile()}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#B44727]"
              >
                시터 등록 취소
              </button>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ['활동 지역', getRegionLabel(profile.region)],
              ['경력', `${profile.experienceYears}년`],
              ['가능 동물', possiblePetTypeLabels[profile.possiblePetType]],
              ['가능 크기', possiblePetSizeLabels[profile.possiblePetSize]],
              ['시간당 요금', `${profile.pricePerHour.toLocaleString('ko-KR')}원`],
              ['예약 상태', sitterStatusLabels[profile.status]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
              </div>
            ))}
          </dl>
          {profile.introduction && (
            <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
              {profile.introduction}
            </p>
          )}
        </section>
      )}

      {(mode === 'register' || mode === 'edit') && (
        <>
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <form
              className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
              onSubmit={handleProfileSubmit}
            >
              <div>
                <p className="text-sm font-bold text-[#E26B4A]">PROFILE</p>
                <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                  {profile ? '프로필 수정' : '프로필 등록'}
                </h2>
              </div>

          <div className="mt-6 grid gap-4">
            {profile && (
              <RegionSelect
                idPrefix="sitter-profile-region"
                selectClassName={`mt-2 ${selectClassName}`}
                value={profileForm.region}
                emptyValue="UNKNOWN"
                onChange={(value) =>
                  setProfileForm((prevForm) => ({
                    ...prevForm,
                    region: (value ?? 'UNKNOWN') as Region,
                  }))
                }
              />
            )}

            {!profile && (
              <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
                최초 등록 시 활동 지역은 회원 프로필의 지역 정보로 설정됩니다.
              </p>
            )}

            <label className="block" htmlFor="introduction">
              <span className="text-sm font-bold text-[#2A2622]">자기소개</span>
              <textarea
                id="introduction"
                className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
                placeholder="돌봄 경험과 가능한 케어 방식을 소개해 주세요."
                value={profileForm.introduction}
                onChange={(event) =>
                  setProfileForm((prevForm) => ({
                    ...prevForm,
                    introduction: event.target.value,
                  }))
                }
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block" htmlFor="experienceYears">
                <span className="text-sm font-bold text-[#2A2622]">경력 연수</span>
                <input
                  id="experienceYears"
                  className={`mt-2 ${inputClassName}`}
                  type="number"
                  min={0}
                  value={profileForm.experienceYears}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      experienceYears: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="block" htmlFor="pricePerHour">
                <span className="text-sm font-bold text-[#2A2622]">시간당 요금</span>
                <input
                  id="pricePerHour"
                  className={`mt-2 ${inputClassName}`}
                  type="number"
                  min={1}
                  value={profileForm.pricePerHour}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      pricePerHour: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block" htmlFor="possiblePetType">
                <span className="text-sm font-bold text-[#2A2622]">가능 동물</span>
                <select
                  id="possiblePetType"
                  className={`mt-2 ${selectClassName}`}
                  value={profileForm.possiblePetType}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      possiblePetType: event.target.value as PossiblePetType,
                    }))
                  }
                >
                  {possiblePetTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block" htmlFor="possiblePetSize">
                <span className="text-sm font-bold text-[#2A2622]">가능 크기</span>
                <select
                  id="possiblePetSize"
                  className={`mt-2 ${selectClassName}`}
                  value={profileForm.possiblePetSize}
                  onChange={(event) =>
                    setProfileForm((prevForm) => ({
                      ...prevForm,
                      possiblePetSize: event.target.value as PossiblePetSize,
                    }))
                  }
                >
                  {possiblePetSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="mt-6 w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
          >
            {isSavingProfile ? '저장 중...' : profile ? '프로필 수정' : '프로필 등록'}
          </button>
        </form>

        <aside className="grid gap-6">
          <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">STATUS</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              예약 가능 상태
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6F675F]">
              예약 가능 상태를 변경하면 시터 검색과 요청 가능 여부에 반영됩니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!profile || profile.status === 'RESERVABLE'}
                onClick={() => void handleStatusChange('RESERVABLE')}
                className="rounded-2xl bg-[#E26B4A] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
              >
                예약 가능
              </button>
              <button
                type="button"
                disabled={!profile || profile.status === 'NON_RESERVABLE'}
                onClick={() => void handleStatusChange('NON_RESERVABLE')}
                className="rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
              >
                예약 불가
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#E26B4A]">SUMMARY</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">프로필 요약</h2>
            {profile ? (
              <dl className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-[#FAF6F1] p-4">
                  <dt className="text-xs font-bold text-[#9B8E82]">활동 지역</dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                    {getRegionLabel(profile.region)}
                  </dd>
                </div>
                <div className="rounded-2xl bg-[#FAF6F1] p-4">
                  <dt className="text-xs font-bold text-[#9B8E82]">가능 조건</dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2622]">
                    {possiblePetTypeLabels[profile.possiblePetType]} ·{' '}
                    {possiblePetSizeLabels[profile.possiblePetSize]}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F]">
                아직 시터 프로필이 없습니다.
              </p>
            )}
          </section>
        </aside>
      </section>

      <form
        className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm"
        onSubmit={handleScheduleSubmit}
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">SCHEDULE</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              가능 시간 관리
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6F675F]">
              요일별 가능 시간을 등록합니다. 저장 시 기존 스케줄은 전체 교체됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={addSchedule}
            className="w-fit rounded-full bg-[#F4E9DE] px-4 py-2 text-sm font-bold text-[#6F675F]"
          >
            시간 추가
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {schedules.map((schedule, index) => (
            <div
              key={`${index}-${schedule.dayOfWeek}`}
              className="grid gap-3 rounded-2xl bg-[#FAF6F1] p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <select
                aria-label="요일"
                className={selectClassName}
                value={schedule.dayOfWeek}
                onChange={(event) =>
                  updateSchedule(index, 'dayOfWeek', event.target.value)
                }
              >
                {dayOfWeekOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                aria-label="시작 시간"
                className={inputClassName}
                type="time"
                value={schedule.startTime}
                onChange={(event) =>
                  updateSchedule(index, 'startTime', event.target.value)
                }
              />
              <input
                aria-label="종료 시간"
                className={inputClassName}
                type="time"
                value={schedule.endTime}
                onChange={(event) =>
                  updateSchedule(index, 'endTime', event.target.value)
                }
              />
              <button
                type="button"
                onClick={() => removeSchedule(index)}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#6F675F]"
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={!profile || isSavingSchedules}
          className="mt-5 w-full rounded-2xl bg-[#2A2622] px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#B0A59A]"
        >
          {isSavingSchedules ? '저장 중...' : '가능 시간 저장'}
        </button>
      </form>
      </>
      )}
    </main>
  );
}

export default MySitterProfilePage;
