import { useEffect, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPet, deletePet, getMyPets, updatePet } from '../api';
import FormField from '../components/FormField';
import { petSpeciesLabels } from '../constants/options';
import type { Pet, PetGender, PetRequest, PetSize, PetSpecies } from '../types';

const initialForm: PetRequest = {
  name: '',
  species: 'DOG',
  breed: '',
  gender: 'MALE',
  age: 1,
  size: 'SMALL',
  profileImageUrl: '',
  note: '',
};

const speciesOptions: Array<{ value: PetSpecies; label: string }> = [
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
  { value: 'ETC', label: '기타' },
];

const genderOptions: Array<{ value: PetGender; label: string }> = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'UNKNOWN', label: '모름' },
];

const sizeOptions: Array<{ value: PetSize; label: string }> = [
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
];

const selectClassName =
  'mt-2 w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

type PetMode = 'list' | 'new' | 'detail' | 'edit';

const getMode = (value: string | null): PetMode => {
  if (value === 'new' || value === 'detail' || value === 'edit') return value;

  return 'list';
};

const toPetForm = (pet: Pet): PetRequest => ({
  name: pet.name,
  species: pet.species,
  breed: pet.breed ?? '',
  gender: pet.gender ?? 'UNKNOWN',
  age: pet.age ?? 0,
  size: pet.size ?? 'SMALL',
  profileImageUrl: pet.profileImageUrl ?? '',
  note: pet.note ?? '',
});

// 보호자의 반려동물 목록, 상세, 등록, 수정을 단계적으로 관리하는 페이지입니다.
function PetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = getMode(searchParams.get('mode'));
  const selectedPetId = Number(searchParams.get('petId'));
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<PetRequest>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null;

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
        setIsLoading(false);
      }
    };

    void fetchPets();
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
    if (mode === 'edit' && selectedPet) {
      setForm(toPetForm(selectedPet));
      return;
    }

    if (mode === 'new') {
      setForm(initialForm);
    }

    }, 0);

    return () => window.clearTimeout(timerId);
  }, [mode, selectedPet]);

  const moveList = () => {
    setSearchParams({});
    setErrorMessage('');
    setSuccessMessage('');
  };

  const updateTextField = (
    name: keyof Pick<PetRequest, 'name' | 'breed' | 'profileImageUrl' | 'note'>,
    value: string,
  ) => {
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const updateNumberField = (name: keyof Pick<PetRequest, 'age'>, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [name]: Number(value) }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result =
        mode === 'edit' && selectedPet
          ? await updatePet(selectedPet.id, form)
          : await createPet(form);

      if (result.success) {
        setPets((prevPets) =>
          mode === 'edit'
            ? prevPets.map((pet) => (pet.id === result.data.id ? result.data : pet))
            : [result.data, ...prevPets],
        );
        setSuccessMessage(
          mode === 'edit' ? '반려동물 정보가 수정되었습니다.' : '반려동물이 등록되었습니다.',
        );
        setSearchParams({ mode: 'detail', petId: String(result.data.id) });
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('반려동물 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (petId: number) => {
    const shouldDelete = window.confirm(
      '이 반려동물을 삭제할까요? 진행 중인 예약이나 열린 공고에 포함되어 있으면 백엔드에서 삭제가 제한될 수 있습니다.',
    );

    if (!shouldDelete) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await deletePet(petId);

      if (result.success) {
        setPets((prevPets) => prevPets.filter((pet) => pet.id !== petId));
        setSuccessMessage('반려동물이 삭제되었습니다.');
        moveList();
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('반려동물 삭제 중 문제가 발생했습니다.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">MY PETS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">내 반려동물</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            등록된 반려동물을 먼저 확인하고, 필요할 때만 등록 또는 수정합니다.
          </p>
        </div>
        {mode === 'list' ? (
          <button
            type="button"
            onClick={() => setSearchParams({ mode: 'new' })}
            className="w-fit rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white"
          >
            반려동물 등록
          </button>
        ) : (
          <button
            type="button"
            onClick={moveList}
            className="w-fit rounded-2xl border border-[#E7DCD1] bg-white px-5 py-3 text-sm font-bold text-[#6F675F]"
          >
            목록으로
          </button>
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

      {mode === 'list' && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#2A2622]">요약 목록</h2>
            <p className="text-sm font-semibold text-[#6F675F]">{pets.length}마리</p>
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading && (
              <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm text-[#6F675F]">
                반려동물 목록을 불러오는 중입니다.
              </p>
            )}

            {!isLoading && pets.length === 0 && (
              <p className="rounded-2xl bg-[#FAF6F1] p-5 text-sm leading-6 text-[#6F675F]">
                아직 등록된 반려동물이 없습니다. 등록 버튼을 눌러 첫 반려동물을
                추가해 주세요.
              </p>
            )}

            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() =>
                  setSearchParams({ mode: 'detail', petId: String(pet.id) })
                }
                className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-5 text-left transition hover:border-[#E26B4A]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#F4E9DE] text-sm font-black text-[#B85B3D]">
                      {pet.profileImageUrl ? (
                        <img
                          src={pet.profileImageUrl}
                          alt={`${pet.name} 프로필`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        pet.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-[#2A2622]">
                        {pet.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#6F675F]">
                        {[pet.breed, pet.age || pet.age === 0 ? `${pet.age}살` : null, pet.size]
                          .filter(Boolean)
                          .join(' · ') || petSpeciesLabels[pet.species]}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                    {petSpeciesLabels[pet.species]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {mode === 'detail' && !isLoading && !selectedPet && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-[#FFF0EA] p-6 shadow-sm">
          <p className="text-sm font-bold text-[#B44727]">PET NOT FOUND</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">
            접근할 수 없는 반려동물입니다.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6F675F]">
            요청하신 반려동물(#{selectedPetId || '-'})은 내 계정에 등록되어 있지
            않거나 삭제되었어요. 다른 사용자의 반려동물 정보는 조회할 수 없습니다.
          </p>
          <button
            type="button"
            onClick={moveList}
            className="mt-5 rounded-2xl border border-[#E7DCD1] bg-white px-4 py-2 text-sm font-bold text-[#6F675F]"
          >
            내 반려동물 목록으로
          </button>
        </section>
      )}

      {mode === 'detail' && selectedPet && (
        <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-[#E26B4A]">PET DETAIL</p>
              <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
                {selectedPet.name}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setSearchParams({ mode: 'edit', petId: String(selectedPet.id) })
                }
                className="rounded-2xl bg-[#E26B4A] px-4 py-2 text-sm font-bold text-white"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(selectedPet.id)}
                className="rounded-2xl border border-[#E7DCD1] px-4 py-2 text-sm font-bold text-[#B44727]"
              >
                삭제
              </button>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ['종류', petSpeciesLabels[selectedPet.species]],
              ['품종', selectedPet.breed || '미입력'],
              ['나이', selectedPet.age || selectedPet.age === 0 ? `${selectedPet.age}살` : '미입력'],
              ['크기', selectedPet.size || '미입력'],
              ['성별', selectedPet.gender || '미입력'],
              ['특이사항', selectedPet.note || '미입력'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#FAF6F1] p-4">
                <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(mode === 'new' || mode === 'edit') && (
        <PetForm
          form={form}
          isSubmitting={isSubmitting}
          mode={mode}
          onSubmit={handleSubmit}
          onTextChange={updateTextField}
          onNumberChange={updateNumberField}
          onFormChange={setForm}
        />
      )}
    </main>
  );
}

interface PetFormProps {
  form: PetRequest;
  mode: 'new' | 'edit';
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTextChange: (
    name: keyof Pick<PetRequest, 'name' | 'breed' | 'profileImageUrl' | 'note'>,
    value: string,
  ) => void;
  onNumberChange: (name: keyof Pick<PetRequest, 'age'>, value: string) => void;
  onFormChange: Dispatch<SetStateAction<PetRequest>>;
}

function PetForm({
  form,
  mode,
  isSubmitting,
  onSubmit,
  onTextChange,
  onNumberChange,
  onFormChange,
}: PetFormProps) {
  return (
    <section className="mt-6 rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-[#E26B4A]">PET FORM</p>
      <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
        {mode === 'edit' ? '반려동물 정보 수정' : '반려동물 등록'}
      </h2>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <FormField
          id="petName"
          label="이름"
          type="text"
          required
          placeholder="초코"
          value={form.name}
          onChange={(event) => onTextChange('name', event.target.value)}
        />

        <label className="block" htmlFor="species">
          <span className="text-sm font-semibold text-[#3E3730]">종류</span>
          <select
            id="species"
            className={selectClassName}
            value={form.species}
            onChange={(event) =>
              onFormChange((prevForm) => ({
                ...prevForm,
                species: event.target.value as PetSpecies,
              }))
            }
          >
            {speciesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <FormField
          id="breed"
          label="품종"
          type="text"
          placeholder="말티즈"
          value={form.breed}
          onChange={(event) => onTextChange('breed', event.target.value)}
        />

        <FormField
          id="age"
          label="나이"
          type="number"
          min={0}
          placeholder="0"
          value={form.age || ''}
          onChange={(event) => onNumberChange('age', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block" htmlFor="gender">
            <span className="text-sm font-semibold text-[#3E3730]">성별</span>
            <select
              id="gender"
              className={selectClassName}
              value={form.gender}
              onChange={(event) =>
                onFormChange((prevForm) => ({
                  ...prevForm,
                  gender: event.target.value as PetGender,
                }))
              }
            >
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block" htmlFor="size">
            <span className="text-sm font-semibold text-[#3E3730]">크기</span>
            <select
              id="size"
              className={selectClassName}
              value={form.size}
              onChange={(event) =>
                onFormChange((prevForm) => ({
                  ...prevForm,
                  size: event.target.value as PetSize,
                }))
              }
            >
              {sizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <FormField
          id="profileImageUrl"
          label="프로필 이미지 URL 선택 입력"
          type="url"
          placeholder="이미지 주소가 있을 때만 입력"
          value={form.profileImageUrl}
          onChange={(event) => onTextChange('profileImageUrl', event.target.value)}
        />
        <p className="-mt-3 text-xs leading-5 text-[#8A8178]">
          현재 백엔드는 파일 업로드 API 없이 이미지 URL만 저장합니다.
        </p>

        <FormField
          id="note"
          label="특이사항"
          type="text"
          placeholder="알레르기, 성격, 주의사항 등"
          value={form.note}
          onChange={(event) => onTextChange('note', event.target.value)}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#E26B4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D95D3D] disabled:cursor-not-allowed disabled:bg-[#D8B6A9]"
        >
          {isSubmitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '등록 완료'}
        </button>
      </form>
    </section>
  );
}

export default PetsPage;
