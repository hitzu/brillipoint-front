import {
  CreatePromotionPayload,
  Promotion,
  PromotionDetail,
  SetPromotionPackagesPayload,
  UpdatePromotionPayload,
} from "../../interfaces";
import { axiosInstanceWithToken } from "../config/axiosConfig";

export const getPromotionsByBrandId = async ({
  brandId,
  status = "active",
}: {
  brandId?: number;
  status?: string;
}): Promise<Promotion[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (brandId) {
      queryParams.append("brandId", brandId.toString());
    }
    if (status) {
      queryParams.append("status", status);
    }

    const url = "/promotions" + (queryParams.toString() ? `?${queryParams.toString()}` : "");
    const response = await axiosInstanceWithToken.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
};

export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await axiosInstanceWithToken.get("/promotions");
    return response.data;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
};

export const getPromotionById = async (id: number): Promise<PromotionDetail> => {
  const response = await axiosInstanceWithToken.get<PromotionDetail>(`/promotions/${id}`);
  return response.data;
};

export const createPromotion = async (payload: CreatePromotionPayload): Promise<Promotion> => {
  const response = await axiosInstanceWithToken.post<Promotion>("/promotions", payload);
  return response.data;
};

export const updatePromotionById = async (
  id: number,
  payload: UpdatePromotionPayload
): Promise<void> => {
  await axiosInstanceWithToken.patch(`/promotions/${id}`, payload);
};

export const deletePromotionById = async (id: number): Promise<void> => {
  await axiosInstanceWithToken.delete(`/promotions/${id}`);
};

export const setPromotionPackages = async (
  id: number,
  payload: SetPromotionPackagesPayload
): Promise<void> => {
  await axiosInstanceWithToken.post(`/promotions/${id}/packages/bulk`, payload);
};
