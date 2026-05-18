import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPost, getMyPets } from '../api';
import { careTypeLabels } from '../constants/options';
import type { CareType, Pet, PostRequest, TimeSlotRequest } from '../types';

const initialTimeSlot: TimeSlotRequest = {
  careDate: '',
  startTime: '',
  endTime: '',
};

const initialForm: PostRequest = {
  title: '',
  content: '',
  petIds: [],
  careType: 'VISIT',
  budgetAmount: 50000,
  timeSlots: [initialTimeSlot],
};

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 보호자가 시터들의 제안을 받을 케어 공고를 작성하는 페이지입니다.
function PostCreatePage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<PostRequest>(initialForm);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 공고에 포함할 내 반려동물 목록을 조회합니다.
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const result = await getMyPets();

        if (result.success) {
          setPets(result.data);
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('반려동물 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingPets(false);
      }
    };

    void fetchPets();
  }, []);

  // 공고에 포함할 반려동물 선택 상태를 변경합니다.
  const togglePet = (petId: number) => {
    setForm((prevForm) => {
      const hasPet = prevForm.petIds.includes(petId);

      return {
        ...prevForm,
        petIds: hasPet
          ? prevForm.petIds.filter((selectedPetId) => selectedPetId !== petId)
          : [...prevForm.petIds, petId],
      };
    });
  };

  // 특정 시간 슬롯의 날짜/시간 값을 변경합니다.
  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlotRequest,
    value: string,
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      timeSlots: prevForm.timeSlots.map((timeSlot, timeSlotIndex) =>
        timeSlotIndex === index ? { ...timeSlot, [field]: value } : timeSlot,
      ),
    }));
  };

  // 공고 시간 슬롯 입력을 추가합니다.
  const addTimeSlot = () => {
    setForm((prevForm) => {
      if (prevForm.timeSlots.length >= 30) {
        return prevForm;
      }

      return { ...prevForm, timeSlots: [...prevForm.timeSlots, initialTimeSlot] };
    });
  };

  // 최소 1개는 유지하면서 시간 슬롯 입력을 제거합니다.
  const removeTimeSlot = (index: number) => {
    setForm((prevForm) => {
      if (prevForm.timeSlots.length === 1) {
        return prevForm;
      }

      return {
        ...prevForm,
        timeSlots: prevForm.timeSlots.filter((_, timeSlotIndex) => timeSlotIndex !== index),
      };
    });
  };

  // 백엔드 검증 전에 필수 입력 누락을 먼저 안내합니다.
  const validateForm = () => {
    if (!form.title.trim()) return '공고 제목을 입력해 주세요.';
    if (!form.content.trim()) return '공고 내용을 입력해 주세요.';
    if (form.petIds.length === 0) return '반려동물을 1마리 이상 선택해 주세요.';
    if (form.budgetAmount <= 0) return '희망 예산은 0보다 커야 합니다.';

    const hasEmptyTimeSlot = form.timeSlots.some(
      (timeSlot) => !timeSlot.careDate || !timeSlot.startTime || !timeSlot.endTime,
    );

    if (hasEmptyTimeSlot) {
      return '돌봄 날짜와 시작/종료 시간을 모두 입력해 주세요.';
    }

    return '';
  };

  // 공고 생성 API를 호출하고 성공하면 공고 목록으로 이동합니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createPost(form);

      if (result.success) {
        navigate('/posts');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('공고 등록 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section className="rounded-[28px] border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">NEW POST</p>
            <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">공고 작성</h1>
            <p className="mt-3 text-sm leading-6 text-[#6F675F]">
              케어 조건을 공고로 등록하면 시터들이 제안을 보낼 수 있습니다.
            </p>
          </div>
          <Link
            to="/posts"
            className="w-fit rounded-full border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
          >
            목록으로
          </Link>
        </div>

        <form className="mt-7 space-y-7" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <label className="block" htmlFor="title">
              <span className="text-sm font-bold text-[#2A2622]">공고 제목</span>
              <input
                id="title"
                className={`mt-3 ${inputClassName}`}
                placeholder="출장 기간 동안 방문 돌봄을 부탁드려요"
                value={form.title}
                onChange={(event) =>
                  setForm((prevForm) => ({ ...prevForm, title: event.target.value }))
                }
              />
            </label>

            <label className="block" htmlFor="budgetAmount">
              <span className="text-sm font-bold text-[#2A2622]">희망 예산</span>
              <input
                id="budgetAmount"
                className={`mt-3 ${inputClassName}`}
                type="number"
                min={1}
                value={form.budgetAmount}
                onChange={(event) =>
                  setForm((prevForm) => ({
                    ...prevForm,
                    budgetAmount: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <label className="block" htmlFor="content">
            <span className="text-sm font-bold text-[#2A2622]">공고 내용</span>
            <textarea
              id="content"
              className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
              placeholder="돌봄 장소, 반려동물 성향, 원하는 케어 방식 등을 적어주세요."
              value={form.content}
              onChange={(event) =>
                setForm((prevForm) => ({ ...prevForm, content: event.target.value }))
              }
            />
          </label>

          <fieldset>
            <legend className="text-sm font-bold text-[#2A2622]">반려동물</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {isLoadingPets && (
                <p className="rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F] md:col-span-2">
                  반려동물 목록을 불러오는 중입니다.
                </p>
              )}

              {!isLoadingPets && pets.length === 0 && (
                <div className="rounded-2xl bg-[#FAF6F1] p-4 text-sm leading-6 text-[#6F675F] md:col-span-2">
                  등록된 반려동물이 없습니다. 공고 작성 전에 반려동물을 먼저 등록해
                  주세요.
                  <Link className="ml-2 font-bold text-[#E26B4A]" to="/pets">
                    등록하기
                  </Link>
                </div>
              )}

              {pets.map((pet) => (
                <label
                  key={pet.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                    form.petIds.includes(pet.id)
                      ? 'border-[#E26B4A] bg-[#FFF7F2]'
                      : 'border-[#E7DCD1] bg-[#FFFCF8]',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#E26B4A]"
                    checked={form.petIds.includes(pet.id)}
                    onChange={() => togglePet(pet.id)}
                  />
                  <span>
                    <span className="block text-sm font-bold text-[#2A2622]">
                      {pet.name}
                    </span>
                    <span className="mt-1 block text-xs text-[#6F675F]">
                      {[pet.breed, pet.age ? `${pet.age}살` : null, pet.size]
                        .filter(Boolean)
                        .join(' · ') || pet.species}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-[#2A2622]">돌봄 유형</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(careTypeLabels).map(([value, label]) => (
                <label
                  key={value}
                  className={[
                    'cursor-pointer rounded-2xl border p-4 text-sm font-bold transition',
                    form.careType === value
                      ? 'border-[#E26B4A] bg-[#FFF7F2] text-[#E26B4A]'
                      : 'border-[#E7DCD1] bg-[#FFFCF8] text-[#6F675F]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="careType"
                    value={value}
                    checked={form.careType === value}
                    onChange={() =>
                      setForm((prevForm) => ({
                        ...prevForm,
                        careType: value as CareType,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <div className="flex items-center justify-between gap-4">
              <legend className="text-sm font-bold text-[#2A2622]">돌봄 시간</legend>
              <button
                type="button"
                onClick={addTimeSlot}
                className="rounded-full bg-[#F4E9DE] px-3 py-2 text-xs font-bold text-[#6F675F]"
              >
                시간 추가
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {form.timeSlots.map((timeSlot, index) => (
                <div
                  key={`${index}-${timeSlot.careDate}`}
                  className="grid gap-3 rounded-2xl bg-[#FAF6F1] p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input
                    aria-label="돌봄 날짜"
                    className={inputClassName}
                    type="date"
                    value={timeSlot.careDate}
                    onChange={(event) =>
                      updateTimeSlot(index, 'careDate', event.target.value)
                    }
                  />
                  <input
                    aria-label="시작 시간"
                    className={inputClassName}
                    type="time"
                    value={timeSlot.startTime}
                    onChange={(event) =>
                      updateTimeSlot(index, 'startTime', event.target.value)
                    }
                  />
                  <input
                    aria-label="종료 시간"
                    className={inputClassName}
                    type="time"
                    value={timeSlot.endTime}
                    onChange={(event) =>
                      updateTimeSlot(index, 'endTime', event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="rounded-2xl border border-[#E7DCD1] px-4 py-3 text-sm font-bold text-[#6F675F]"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {errorMessage && (
            <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
          >
            {isSubmitting ? '등록 중...' : '공고 등록'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default PostCreatePage;
