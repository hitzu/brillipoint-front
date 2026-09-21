import type { AgendaEntry, YMD } from "../types";
import { entryIntervalsForDay, formatIntervalTime } from "./agendaIntervals";
import { addDays } from "./businessDate";

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2020, month, 1))
  )
);

export const entryLabel = (entry: AgendaEntry): string =>
  entry.contractId !== null
    ? (entry.sku ?? entry.clientName ?? "Evento")
    : (entry.title ?? entry.clientName ?? "Evento");

export const businessTime = (instant: string): string =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));

export const weekLabel = (start: YMD): string => {
  const end = addDays(start, 6);
  const label = (date: YMD) =>
    `${Number(date.slice(8))} ${MONTHS[Number(date.slice(5, 7)) - 1].slice(0, 3)}`;
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  const startYearSuffix = startYear === endYear ? "" : ` ${startYear}`;
  return `${label(start)}${startYearSuffix} – ${label(end)} ${endYear}`;
};

export const entryPresentation = (entry: AgendaEntry, date: YMD) => {
  const intervals = entryIntervalsForDay(date, entry);

  return {
    title: entryLabel(entry),
    time: intervals.some((interval) => interval.allDay)
      ? "Día completo"
      : intervals
          .map(
            (interval) =>
              `${formatIntervalTime(interval.start)} – ${formatIntervalTime(interval.end)}`
          )
          .join(" · "),
  };
};
