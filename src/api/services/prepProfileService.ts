import {
  PatchPrepProfileAnswerPayload,
  PatchPrepProfileAnswersPayload,
  PrepProfileAnswerPatchItem,
  PrepProfilePublicResponse,
  PrepProfileUploadUrlPayload,
  PrepProfileUploadUrlResponse,
} from "../../interfaces";

import {
  axiosInstanceWithToken,
  axiosInstanceWithoutToken,
} from "../config/axiosConfig";

export const getPublicPrepProfile = async (params: {
  contractToken: string;
  phone: string;
}): Promise<PrepProfilePublicResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("phone", params.phone);

    const url = `/contracts/public/${encodeURIComponent(params.contractToken)}/prep-profile?${queryParams.toString()}`;
    const response = await axiosInstanceWithoutToken.get<PrepProfilePublicResponse>(
      url,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching public prep profile:", error);
    throw error;
  }
};

export const patchPublicPrepProfileAnswers = async (params: {
  contractToken: string;
  phone: string;
  answers: PrepProfileAnswerPatchItem[];
}): Promise<PrepProfilePublicResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("phone", params.phone);

    const url = `/contracts/public/${encodeURIComponent(params.contractToken)}/prep-profile/answers?${queryParams.toString()}`;
    const payload: PatchPrepProfileAnswersPayload = { answers: params.answers };

    const response = await axiosInstanceWithoutToken.patch<PrepProfilePublicResponse>(
      url,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Error patching public prep profile answers:", error);
    throw error;
  }
};

export const createPublicPrepProfileUploadUrl = async (params: {
  contractToken: string;
  phone: string;
  payload: PrepProfileUploadUrlPayload;
}): Promise<PrepProfileUploadUrlResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("phone", params.phone);

    const url = `/contracts/public/${encodeURIComponent(params.contractToken)}/prep-profile/upload-url?${queryParams.toString()}`;
    const response =
      await axiosInstanceWithoutToken.post<PrepProfileUploadUrlResponse>(
        url,
        params.payload,
      );
    return response.data;
  } catch (error) {
    console.error("Error creating prep profile upload url:", error);
    throw error;
  }
};

export const uploadPrepProfileFileToSignedUrl = async (params: {
  signedUrl: string;
  file: File;
  mime: string;
}): Promise<void> => {
  // Signed URL is a full URL (Supabase). We use fetch.
  const res = await fetch(params.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.mime || "application/octet-stream",
    },
    body: params.file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
};

export const patchPublicPrepProfileAnswer = async (params: {
  contractToken: string;
  phone: string;
  payload: PatchPrepProfileAnswerPayload;
}): Promise<PrepProfilePublicResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("phone", params.phone);

    const url = `/contracts/public/${encodeURIComponent(params.contractToken)}/prep-profile/answer?${queryParams.toString()}`;
    const response = await axiosInstanceWithoutToken.patch<PrepProfilePublicResponse>(
      url,
      params.payload,
    );
    return response.data;
  } catch (error) {
    console.error("Error patching public prep profile answer:", error);
    throw error;
  }
};


export const setPublicPrepProfileTattooDesigns = async (params: {
  contractToken: string;
  phone: string;
  assets: Array<{ path: string; mime: string }>;
}): Promise<PrepProfilePublicResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("phone", params.phone);

    const url = `/contracts/public/${encodeURIComponent(params.contractToken)}/prep-profile/tattoo-designs?${queryParams.toString()}`;
    const response = await axiosInstanceWithoutToken.put<PrepProfilePublicResponse>(
      url,
      { assets: params.assets },
    );
    return response.data;
  } catch (error) {
    console.error("Error setting public tattoo designs:", error);
    throw error;
  }
};

/** Staff read (authenticated): answers with signed asset urls, no client phone. */
export const getStaffPrepProfile = async (
  contractId: number,
): Promise<PrepProfilePublicResponse> => {
  try {
    const response = await axiosInstanceWithToken.get<PrepProfilePublicResponse>(
      `/contracts/${contractId}/prep-profile`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching staff prep profile:", error);
    throw error;
  }
};
