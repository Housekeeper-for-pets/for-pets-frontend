import { axiosInstance } from './axiosInstance';
import type { ApiResponse, Id, Pet, PetRequest } from '../types';

// 반려동물을 새로 등록합니다.
export const createPet = async (request: PetRequest) => {
  const response = await axiosInstance.post<ApiResponse<Pet>>('/pets', request);

  return response.data;
};

// 현재 로그인한 회원이 등록한 반려동물 목록을 조회합니다.
export const getMyPets = async () => {
  const response = await axiosInstance.get<ApiResponse<Pet[]>>('/pets');

  return response.data;
};

// 특정 반려동물의 상세 정보를 조회합니다.
export const getPet = async (petId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Pet>>(`/pets/${petId}`);

  return response.data;
};

// 특정 반려동물의 정보를 수정합니다.
export const updatePet = async (petId: Id, request: PetRequest) => {
  const response = await axiosInstance.put<ApiResponse<Pet>>(
    `/pets/${petId}`,
    request,
  );

  return response.data;
};

// 특정 반려동물을 삭제합니다.
export const deletePet = async (petId: Id) => {
  const response = await axiosInstance.delete<ApiResponse<null>>(
    `/pets/${petId}`,
  );

  return response.data;
};
