import { Extra } from "./extras";
import { Package } from "./packages";
import { Payment } from "./payments";
import { Promotion } from "./promotions";
import { Slot } from "./slots";

export interface Contract {
  id: number;
  createdAt: string;
  status: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  sku: string;
  totalAmount: number;
  token: string;
}

export interface ContractPackages {
  id: number;
  contractId: number;
  packageId: number;
  quantity: number;
  nameSnapshot: string;
  basePriceSnapshot: number;
  discountPercentageSnapshot: number;
  finalPriceSnapshot: number;
  package: Package;
  promotion: Promotion | null;
}

export interface ContractExtra {
  id: number;
  contractId: number;
  extraId: number;
  contractPackageId: number;
  quantity: number;
  nameSnapshot: string;
  basePriceSnapshot: number;
  discountPercentageSnapshot: number;
  finalPriceSnapshot: number;
  extra: Extra;
  promotion: Promotion | null;
}

/** @deprecated Contracts now expose `bookings`; kept only for legacy views. */
export interface ContractSlot {
  id: number;
  purpose: string;
  slotId: number;
  contractId: number;
  slot: Slot;
}

export interface ContractBooking {
  id: number;
  status: string;
  purpose: string | null;
  eventDate: string;
  serviceStartsAt: string;
  serviceEndsAt: string;
  title: string | null;
  venueName: string | null;
}

export interface GetContractByIdResponse {
  contract: Contract;
  slots?: Slot[];
  packages: ContractPackages[];
  extras: ContractExtra[];
  payments: Payment[];
  paidAmount: number;
  /** @deprecated API sends `[]`; use `bookings`. */
  contractSlots?: ContractSlot[];
  bookings: ContractBooking[];
}



export interface ContractCompleteResponse {
  contract: Contract;
  slots?: Slot[];
  packages: ContractPackages[];
  extras: ContractExtra[];
  payments: Payment[];
  paidAmount: number;
  /** @deprecated API sends `[]`; use `bookings`. */
  contractSlots?: ContractSlot[];
  bookings: ContractBooking[];
}


export interface GenerateContractItem {
  packageId: number;
  quantity: number;
  source?: string;
  clientRef?: string;
}

export interface GenerateContractExtra {
  extraId: number;
  quantity: number;
  packageClientRef?: string;
}

export interface GenerateContractPayload {
  userId: number;
  slotId?: number;
  brandId?: number;
  sku: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  packages: GenerateContractItem[];
  extras?: GenerateContractExtra[];
}
