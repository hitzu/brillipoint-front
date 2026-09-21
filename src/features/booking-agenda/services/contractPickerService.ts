import { axiosInstanceWithToken } from "../../../api/config/axiosConfig";
import type { ContractOption } from "../types";

interface ContractListItemDto {
  id: number;
  sku: string | null;
  clientName: string | null;
}

/**
 * The API has no contract search endpoint, so the picker pulls the staff
 * contract list once and narrows it in the browser. Swap this for a query
 * parameter the day `GET /contracts` learns to filter.
 */
export const searchContracts = async (): Promise<ContractOption[]> => {
  const { data } = await axiosInstanceWithToken.get<ContractListItemDto[]>(
    "/contracts"
  );
  return data.map((contract) => ({
    id: contract.id,
    sku: contract.sku ?? "",
    clientName: contract.clientName ?? "",
  }));
};
