import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createCareRequest, getMyPets } from '../api';
import type { CareRequestCreateRequest, CareType, Pet, TimeSlotRequest } from '../types';

const initialTimeSlot: TimeSlotRequest = {
  careDate: '',
  startTime: '',
  endTime: '',
};

const initialForm: CareRequestCreateRequest = {
  petIds: [],
  careType: 'VISIT',
  requestPrice: 0,
  message: '',
  timeSlots: [initialTimeSlot],
};

const careTypeOptions: Array<{ value: CareType; label: string }> = [
  { value: 'VISIT', label: '방문 돌봄' },
  { value: 'BOARDING', label: '위탁 돌봄' },
];

const inputClassName =
  'w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 보호자가 특정 시터에게 돌봄 요청을 보내는 페이지입니다.
function CareRequestCreatePage() {
  const { sitterId } = useParams<{ sitterId: string }>();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<CareRequestCreateRequest>(initialForm);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 요청에 포함할 수 있는 내 반려동물 목록을 불러옵니다.
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

  // 반려동물 체크박스 선택 상태를 요청 petIds에 반영합니다.
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

  // 최대 30개까지 시간 슬롯 입력을 추가합니다.
  const addTimeSlot = () => {
    setForm((prevForm) => {
      if (prevForm.timeSlots.length >= 30) {
        return prevForm;
      }

      return {
        ...prevForm,
        timeSlots: [...prevForm.timeSlots, initialTimeSlot],
      };
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

  // 명세상 필수인 반려동물/시간 슬롯 조건을 프론트에서 먼저 확인합니다.
  const validateForm = () => {
    if (form.petIds.length === 0) {
      return '요청할 반려동물을 1마리 이상 선택해 주세요.';
    }

    if (!form.requestPrice || form.requestPrice <= 0) {
      return '요청 금액을 1원 이상 입력해 주세요.';
    }

    const hasEmptyTimeSlot = form.timeSlots.some(
      (timeSlot) => !timeSlot.careDate || !timeSlot.startTime || !timeSlot.endTime,
    );

    if (hasEmptyTimeSlot) {
      return '돌봄 날짜와 시작/종료 시간을 모두 입력해 주세요.';
    }

    return '';
  };

  // 돌봄 요청 API를 호출하고 성공하면 상세 화면으로 돌아갑니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (!sitterId) {
      setErrorMessage('시터 ID가 올바르지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCareRequest(Number(sitterId), form);

      if (result.success) {
        setSuccessMessage('돌봄 요청이 전송되었습니다.');
        navigate(`/sitters/${sitterId}`);
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('돌봄 요청 전송 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">CARE REQUEST</p>
            <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">
              돌봄 요청 작성
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6F675F]">
              요청할 반려동물과 돌봄 시간을 선택해 시터에게 직접 요청합니다.
            </p>
          </div>
          <Link
            to={sitterId ? `/sitters/${sitterId}` : '/sitters'}
            className="w-fit rounded-full border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#6F675F]"
          >
            상세로 돌아가기
          </Link>
        </div>

        <form className="mt-7 space-y-7" onSubmit={handleSubmit}>
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
                  등록된 반려동물이 없습니다. 요청 전에 반려동물을 먼저 등록해 주세요.
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
              {careTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={[
                    'cursor-pointer rounded-2xl border p-4 text-sm font-bold transition',
                    form.careType === option.value
                      ? 'border-[#E26B4A] bg-[#FFF7F2] text-[#E26B4A]'
                      : 'border-[#E7DCD1] bg-[#FFFCF8] text-[#6F675F]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="careType"
                    value={option.value}
                    checked={form.careType === option.value}
                    onChange={() =>
                      setForm((prevForm) => ({ ...prevForm, careType: option.value }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block" htmlFor="requestPrice">
            <span className="text-sm font-bold text-[#2A2622]">요청 금액</span>
            <input
              id="requestPrice"
              className={`mt-3 ${inputClassName}`}
              type="number"
              min={1}
              step={1}
              placeholder="예: 80000"
              value={form.requestPrice || ''}
              onChange={(event) =>
                setForm((prevForm) => ({
                  ...prevForm,
                  requestPrice: Number(event.target.value),
                }))
              }
            />
            <p className="mt-2 text-xs leading-5 text-[#8A8178]">
              백엔드 돌봄 요청 API에서 필수로 받는 제안 금액입니다.
            </p>
          </label>

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

          <label className="block" htmlFor="message">
            <span className="text-sm font-bold text-[#2A2622]">요청 메시지</span>
            <textarea
              id="message"
              className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm leading-6 text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
              placeholder="반려동물의 성향, 요청 사항, 주의할 점을 적어주세요."
              value={form.message}
              onChange={(event) =>
                setForm((prevForm) => ({ ...prevForm, message: event.target.value }))
              }
            />
          </label>

          {errorMessage && (
            <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-2xl bg-[#EEF7EA] px-4 py-3 text-sm font-medium text-[#3F5732]">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
          >
            {isSubmitting ? '요청 전송 중...' : '돌봄 요청 보내기'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CareRequestCreatePage;
