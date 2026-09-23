import type { AgendaCalendarProps, AgendaEntry, CalendarView, YMD } from "../types";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { AgendaHours } from "./AgendaHours";
import { AgendaSummary } from "./AgendaSummary";
import { MobileAgenda } from "./MobileAgenda";
import { MonthGrid } from "./MonthGrid";
import { MonthWeekendsGrid } from "./MonthWeekendsGrid";
import styles from "./BookingCalendar.module.css";

export interface BookingCalendarProps extends AgendaCalendarProps {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  view?: CalendarView;
}

export const BookingCalendar = ({
  entries,
  selectedDate,
  view = "summary",
  weekendsOnly = false,
  readOnly = false,
  onDateSelect,
  onEventSelect,
  getCreateOptions,
  onCreateRequest,
  timelineScale = "hours",
}: BookingCalendarProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const selectDate = (date: YMD) => onDateSelect?.(date);
  const selectEvent = readOnly
    ? undefined
    : (entry: AgendaEntry) => onEventSelect?.(entry);

  // Month grids handle their own responsive layout via CSS: they render at
  // every breakpoint, unlike the week views below which swap to
  // MobileAgenda on small screens.
  if (view === "month-weekends")
    return (
      <div
        className={`${styles.calendar} booking-calendar${readOnly ? " is-readonly" : ""}`}
        data-readonly={readOnly}
        data-weekends-only={weekendsOnly}
        data-testid="agenda-weekend-filter"
      >
        <MonthWeekendsGrid
          entries={entries}
          anchor={selectedDate}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
          getCreateOptions={getCreateOptions}
          onCreateRequest={onCreateRequest}
          timelineScale={timelineScale}
        />
      </div>
    );

  if (view === "month")
    return (
      <div
        className={`${styles.calendar} booking-calendar${readOnly ? " is-readonly" : ""}`}
        data-readonly={readOnly}
        data-weekends-only={weekendsOnly}
        data-testid="agenda-weekend-filter"
      >
        <MonthGrid
          entries={entries}
          anchor={selectedDate}
          selectedDate={selectedDate}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
          getCreateOptions={getCreateOptions}
          onCreateRequest={onCreateRequest}
          timelineScale={timelineScale}
        />
      </div>
    );

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
          getCreateOptions={getCreateOptions}
          onCreateRequest={onCreateRequest}
        />
      ) : view === "hours" ? (
        <AgendaHours
          entries={entries}
          selectedDate={selectedDate}
          weekendsOnly={weekendsOnly}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
          onCreateRequest={onCreateRequest}
        />
      ) : (
        <AgendaSummary
          entries={entries}
          selectedDate={selectedDate}
          weekendsOnly={weekendsOnly}
          onDateSelect={selectDate}
          onEventSelect={selectEvent}
          getCreateOptions={getCreateOptions}
          onCreateRequest={onCreateRequest}
        />
      )}
    </div>
  );
};
