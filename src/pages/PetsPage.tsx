import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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

// Select 입력에서 반복되는 스타일을 한곳에서 관리합니다.
const selectClassName =
  'mt-2 w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]';

// 보호자가 본인의 반려동물을 조회하고 등록하는 페이지입니다.
function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<PetRequest>(initialForm);
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 페이지 진입 시 등록된 반려동물 목록을 불러옵니다.
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

  // 문자열 입력값을 반려동물 등록 요청 상태에 반영합니다.
  const updateTextField = (
    name: keyof Pick<PetRequest, 'name' | 'breed' | 'profileImageUrl' | 'note'>,
    value: string,
  ) => {
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // 숫자 입력값을 반려동물 등록 요청 상태에 반영합니다.
  const updateNumberField = (name: keyof Pick<PetRequest, 'age'>, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [name]: Number(value) }));
  };

  // 반려동물 등록/수정 API를 호출하고 성공하면 목록을 최신 상태로 갱신합니다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = editingPetId
        ? await updatePet(editingPetId, form)
        : await createPet(form);

      if (result.success) {
        setPets((prevPets) =>
          editingPetId
            ? prevPets.map((pet) => (pet.id === editingPetId ? result.data : pet))
            : [result.data, ...prevPets],
        );
        setForm(initialForm);
        setEditingPetId(null);
        setSuccessMessage(
          editingPetId ? '반려동물 정보가 수정되었습니다.' : '반려동물이 등록되었습니다.',
        );
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('반려동물 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택한 반려동물 정보를 폼에 채워 수정 모드로 전환합니다.
  const startEdit = (pet: Pet) => {
    setEditingPetId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      gender: pet.gender ?? 'UNKNOWN',
      age: pet.age ?? 0,
      size: pet.size ?? 'SMALL',
      profileImageUrl: pet.profileImageUrl ?? '',
      note: pet.note ?? '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 수정 모드를 해제하고 등록 폼으로 되돌립니다.
  const cancelEdit = () => {
    setEditingPetId(null);
    setForm(initialForm);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 백엔드 삭제 API를 호출한 뒤 목록에서 제거합니다.
  const handleDelete = async (petId: number) => {
    const shouldDelete = window.confirm(
      '이 반려동물을 삭제할까요? 진행 중인 예약이나 열린 공고에 포함되어 있으면 백엔드에서 삭제가 제한될 수 있습니다.',
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await deletePet(petId);

      if (result.success) {
        setPets((prevPets) => prevPets.filter((pet) => pet.id !== petId));
        if (editingPetId === petId) {
          cancelEdit();
        }
        setSuccessMessage('반려동물이 삭제되었습니다.');
        return;
      }

      setErrorMessage(result.error.message);
    } catch {
      setErrorMessage('반려동물 삭제 중 문제가 발생했습니다.');
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-[#E26B4A]">PET PROFILE</p>
        <h1 className="mt-3 text-2xl font-bold text-[#2A2622]">
          {editingPetId ? '반려동물 수정' : '반려동물 등록'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6F675F]">
          공고와 돌봄 요청에 사용할 반려동물 정보를 관리합니다.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <FormField
            id="petName"
            label="이름"
            type="text"
            required
            placeholder="초코"
            value={form.name}
            onChange={(event) => updateTextField('name', event.target.value)}
          />

          <label className="block" htmlFor="species">
            <span className="text-sm font-semibold text-[#3E3730]">종류</span>
            <select
              id="species"
              className={selectClassName}
              value={form.species}
              onChange={(event) =>
                setForm((prevForm) => ({
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
            onChange={(event) => updateTextField('breed', event.target.value)}
          />

          <FormField
            id="age"
            label="나이"
            type="number"
            min={0}
            value={form.age}
            onChange={(event) => updateNumberField('age', event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block" htmlFor="gender">
              <span className="text-sm font-semibold text-[#3E3730]">성별</span>
              <select
                id="gender"
                className={selectClassName}
                value={form.gender}
                onChange={(event) =>
                  setForm((prevForm) => ({
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
                  setForm((prevForm) => ({
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
            onChange={(event) =>
              updateTextField('profileImageUrl', event.target.value)
            }
          />
          <p className="-mt-3 text-xs leading-5 text-[#8A8178]">
            현재 백엔드는 파일 업로드 API 없이 이미지 URL만 저장합니다. 로컬 파일 업로드는
            업로드 엔드포인트가 추가되면 연결할 수 있습니다.
          </p>

          <FormField
            id="note"
            label="특이사항"
            type="text"
            placeholder="알레르기, 성격, 주의사항 등"
            value={form.note}
            onChange={(event) => updateTextField('note', event.target.value)}
          />

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
            {isSubmitting
              ? '저장 중...'
              : editingPetId
                ? '수정 완료'
                : '반려동물 등록'}
          </button>
          {editingPetId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="w-full rounded-2xl border border-[#E7DCD1] px-5 py-3 text-sm font-bold text-[#6F675F]"
            >
              수정 취소
            </button>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#E26B4A]">MY PETS</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2A2622]">
              등록된 반려동물
            </h2>
          </div>
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
              아직 등록된 반려동물이 없습니다. 첫 반려동물을 등록해 주세요.
            </p>
          )}

          {pets.map((pet) => (
            <article
              key={pet.id}
              className="rounded-2xl border border-[#E7DCD1] bg-[#FFFCF8] p-5"
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
              {pet.note && (
                <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#6F675F]">
                  {pet.note}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(pet)}
                  className="rounded-xl bg-[#2A2622] px-4 py-2 text-xs font-bold text-white"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(pet.id)}
                  className="rounded-xl border border-[#E7DCD1] px-4 py-2 text-xs font-bold text-[#B44727]"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PetsPage;
