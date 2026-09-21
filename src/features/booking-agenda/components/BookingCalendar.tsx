import type { AgendaCalendarProps, AgendaEntry, YMD } from "../types";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { AgendaHours } from "./AgendaHours";
import { AgendaSummary } from "./AgendaSummary";
import { MobileAgenda } from "./MobileAgenda";
import styles from "./BookingCalendar.module.css";

export interface BookingCalendarProps extends AgendaCalendarProps {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  view?: "summary" | "hours";
}

export const BookingCalendar = ({
  entries,
  selectedDate,
  view = "summary",
  weekendsOnly = false,
  readOnly = false,
  onDateSelect,
  onEventSelect,
}: BookingCalendarProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const selectDate = (date: YMD) => onDateSelect?.(date);
  const selectEvent = readOnly
    ? undefined
    : (entry: AgendaEntry) => onEventSelect?.(entry);

  return (
    <div
      className={`${styles.calendar} booking-calendar${readOnly ? " is-readonly" : ""}`}
      data-readonly={readOnly}
      data-weekends-only={weekendsOnly}
      data-testid="agenda-weekend-filter"
    >
      {isMobile ? (
        <MobileAgenda
          entries={entries}
          selectedDate={selectedDate}
          weekendsOnly={weekendsOnly}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
        />
      ) : view === "hours" ? (
        <AgendaHours
          entries={entries}
          selectedDate={selectedDate}
          weekendsOnly={weekendsOnly}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
        />
      ) : (
        <AgendaSummary
          entries={entries}
          selectedDate={selectedDate}
          weekendsOnly={weekendsOnly}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
        />
      )}
    </div>
  );
};
