import type { Extra } from "../../../interfaces/extras";
import type { GetPackagesResponse } from "../../../interfaces/packages";
import {
  isValidEmailFormat,
  isValidPhoneLength,
} from "../../expo-bebe/utils/contactValidation";
import { validMapsUrl } from "@shared/scheduling/mapsUrl";

export interface CartItem {
  pkg: GetPackagesResponse;
  quantity: number;
  /** Stable per-line id, mirrors expo-bebe's `pkg-${id}` — extras link to it. */
  clientRef: string;
}

export interface ExtraCartItem {
  extra: Extra;
  quantity: number;
  /** Cart line's `clientRef` this extra is tied to, or null when unlinked. */
  packageClientRef: string | null;
}

export interface ValidateCreateContractFormInput {
  selectedUserId: number | "";
  selectedBrandId: number | "";
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  cart: CartItem[];
  eventDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  mapsUrl: string;
  depositNum: number;
  subtotal: number;
}

/**
 * Validates the create-contract form before submit, mirroring
 * expo-bebe's useContractForm order: vendor, brand, client name, contact
 * (optional phone/email, validated when present), packages,
 * date, times, deposit. Returns a Spanish, user-facing error message, or
 * null when the form is valid.
 *
 * Start and end are compared as full datetimes (date + time), not just
 * times: the event can cross midnight into the next civil day (endDate
 * follows startDate automatically but can be picked separately), so a
 * same-day time-only comparison would wrongly accept an overnight span with
 * the end date left behind, or wrongly reject one that legitimately spans
 * two days.
 */
export function validateCreateContractForm({
  selectedUserId,
  selectedBrandId,
  clientName,
  clientPhone,
  clientEmail,
  cart,
  eventDate,
  startTime,
  endDate,
  endTime,
  mapsUrl,
  depositNum,
  subtotal,
}: ValidateCreateContractFormInput): string | null {
  if (!selectedUserId) return "Selecciona un vendedor.";
  if (!selectedBrandId) return "Selecciona una marca.";
  if (!clientName.trim()) return "Ingresa el nombre del cliente.";
  if (!isValidPhoneLength(clientPhone)) {
    return "El teléfono debe tener exactamente 10 dígitos.";
  }
  if (!isValidEmailFormat(clientEmail)) return "Ingresa un email válido.";
  if (cart.length === 0) return "Agrega al menos un paquete.";
  if (!eventDate) return "Selecciona una fecha.";
  if (!endDate) return "Selecciona una fecha de fin.";
  if (!startTime || !endTime) {
    return "Selecciona la hora de inicio y de fin.";
  }
  if (`${eventDate}T${startTime}` >= `${endDate}T${endTime}`) {
    return "La hora de inicio debe ser anterior a la hora de fin.";
  }
  if (!validMapsUrl(mapsUrl)) return "Ingresa una URL de Maps válida.";
  if (depositNum < 0) return "El anticipo no puede ser negativo.";
  if (depositNum > subtotal) {
    return "El anticipo no puede ser mayor al subtotal.";
  }
  return null;
}
