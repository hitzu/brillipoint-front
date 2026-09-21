export type YMD = string;

export type AgendaBlock = "am_block" | "pm_block" | "night_block";

/** A date-blocking event returned by the staff agenda endpoint. */
export interface AgendaEntry {
  key: string;
  id: number;
  bookingId: number;
  contractId: number | null;
  sku: string | null;
  title: string | null;
  clientName: string | null;
  venueName: string | null;
  /** API day that anchors block-based entries without exact timestamps. */
  date: YMD;
  continuesFromPreviousDay: boolean;
  continuesNextDay: boolean;
  startsAt: string | null;
  endsAt: string | null;
  blocks: AgendaBlock[];
  /** True when the API only supplied a broad occupied interval. */
  isApproximate: boolean;
}

export type BookingScheduleType = "exact";

export interface BookingDetail {
  id: number;
  status: "hold" | "confirmed" | string;
  eventDate: YMD;
  serviceStartsAt: string | null;
  serviceEndsAt: string | null;
  title: string | null;
  purpose: string | null;
  venueName: string | null;
  mapsUrl: string | null;
  contract?: { sku?: string | null; token?: string | null } | null;
}

/** Minimal contract identity the booking form needs to link a booking. */
export interface ContractOption {
  id: number;
  sku: string;
  clientName: string;
}

export interface ExactBookingPayload {
  scheduleType: BookingScheduleType;
  eventDate: YMD;
  serviceStartsAt: string;
  serviceEndsAt: string;
  title?: string;
  purpose?: string;
  venueName?: string;
  mapsUrl?: string;
  /** Links the booking to a contract. Omitted, the booking stands alone. */
  contractId?: number;
}

export interface BookingNote {
  id: number;
  content: string;
  kind: "internal" | string;
  scope: "booking" | string;
}

export interface ScheduleAgendaEntryDto {
  id: number;
  status?: string | null;
  type?: string | null;
  purpose?: string | null;
  date: YMD;
  segmentStartsAt?: string | null;
  segmentEndsAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  continuesFromPreviousDay?: boolean;
  continuesNextDay?: boolean;
  blocks?: AgendaBlock[] | null;
  approximateStartsAt?: string | null;
  approximateEndsAt?: string | null;
  serviceStartsAt?: string | null;
  serviceEndsAt?: string | null;
  eventDate?: YMD | null;
  contractId?: number | null;
  sku?: string | null;
  title?: string | null;
  clientName?: string | null;
  venueName?: string | null;
}

export interface ScheduleAgendaDayDto {
  date: YMD;
  entries: ScheduleAgendaEntryDto[];
}

export interface AgendaCalendarProps {
  readOnly?: boolean;
  weekendsOnly?: boolean;
  initialDate?: YMD;
  onDateSelect?: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
}
