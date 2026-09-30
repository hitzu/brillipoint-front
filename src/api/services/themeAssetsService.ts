import {
  ThemeAssetUploadUrlPayload,
  ThemeAssetUploadUrlResponse,
} from "../../interfaces";
import { axiosInstanceWithToken } from "../config/axiosConfig";

export const createThemeAssetUploadUrl = async (
  payload: ThemeAssetUploadUrlPayload,
): Promise<ThemeAssetUploadUrlResponse> => {
  const response = await axiosInstanceWithToken.post<ThemeAssetUploadUrlResponse>(
    "/theme-assets/upload-url",
    payload,
  );
  return response.data;
};

export const uploadThemeAssetBlobToSignedUrl = async (params: {
  signedUrl: string;
  blob: Blob;
  mime: string;
}): Promise<void> => {
  const res = await fetch(params.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.mime || "application/octet-stream",
    },
    body: params.blob,
  });

  if (!res.ok) {
    throw new Error(`Theme asset upload failed with status ${res.status}`);
  }
};
