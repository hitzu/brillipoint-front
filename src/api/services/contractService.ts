import {
  Contract,
  ContractTransportStatus,
  ContractCompleteResponse,
  GenerateContractPayload,
  GetContractByIdResponse,
} from "../../interfaces";

import {
  axiosInstanceWithToken,
  axiosInstanceWithoutToken,
} from "../config/axiosConfig";

export const getContractByToken = async (
  token: string
): Promise<GetContractByIdResponse> => {
  try {
    const response = await axiosInstanceWithoutToken.get(
      `/contracts/get-by-token/${token}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching contract by token:", error);
    throw error;
  }
};

export const getContractBySku = async (sku: string): Promise<ContractCompleteResponse> => {
  try {
    const response = await axiosInstanceWithoutToken.get<ContractCompleteResponse>(`/contracts/get-by-sku/${encodeURIComponent(sku)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contract by sku:", error);
    throw error;
  }
};

export const getContractById = async (
  id: number
): Promise<GetContractByIdResponse> => {
  try {
    const url = `/contracts/${id}`;
    const response = await axiosInstanceWithToken.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching contract:", error);
    throw error;
  }
};

export interface GetContractsParams {
  includeFinalized?: boolean;
  excludeWithEvents?: boolean;
}

export const getContracts = async (
  params?: GetContractsParams
): Promise<Contract[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.includeFinalized) {
      queryParams.append("includeFinalized", "true");
    }
    if (params?.excludeWithEvents) {
      queryParams.append("excludeWithEvents", "true");
    }
    const url = queryParams.toString()
      ? `/contracts?${queryParams.toString()}`
      : "/contracts";
    const response = await axiosInstanceWithToken.get<Contract[]>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }
};

export const getContractsBySku = async (sku: string): Promise<Contract[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("sku", sku);
    const response = await axiosInstanceWithToken.get<Contract[]>(`/contracts?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contracts by sku:", error);
    throw error;
  }
};

export const deleteContractById = async (id: number): Promise<void> => {
  try {
    await axiosInstanceWithToken.delete(`/contracts/${id}`);
  } catch (error) {
    console.error("Error deleting contract:", error);
    throw error;
  }
};

export const finalizeContract = async (id: number): Promise<void> => {
  try {
    await axiosInstanceWithToken.post(`/contracts/${id}/finalize`);
  } catch (error) {
    console.error("Error finalizing contract:", error);
    throw error;
  }
};

export const generateContract = async (
  payload: GenerateContractPayload
): Promise<Contract> => {
  try {
    const response = await axiosInstanceWithToken.post<Contract>(
      `/contracts`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error generating contract:", error);
    throw error;
  }
};

export interface UpdateContractTransportPayload {
  status: ContractTransportStatus;
  /** Required (> 0) when status is "quoted"; must be omitted otherwise. */
  amount?: number;
}

export const updateContractTransport = async (
  id: number,
  payload: UpdateContractTransportPayload
): Promise<GetContractByIdResponse> => {
  try {
    const response = await axiosInstanceWithToken.patch<GetContractByIdResponse>(
      `/contracts/${id}/transport`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error updating contract transport:", error);
    throw error;
  }
};
