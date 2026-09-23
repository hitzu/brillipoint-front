import type { CalendarView, YMD } from "../types";
import { addDays, toYMD, weekStart } from "../utils/businessDate";
import { MONTHS, weekLabel } from "../utils/agendaPresentation";
import styles from "./AgendaNavigation.module.css";

interface Props {
  selectedDate: YMD;
  view: CalendarView;
  onSelectDate: (date: YMD) => void;
  onViewChange: (view: CalendarView) => void;
  showViewPicker?: boolean;
  /** Restricts which options the view picker offers; defaults to all four. */
  views?: CalendarView[];
}

const ALL_VIEWS: CalendarView[] = ["summary", "hours", "month", "month-weekends"];

const VIEW_LABELS: Record<CalendarView, string> = {
  summary: "Resumen",
  hours: "Horarios",
  month: "Mes",
  "month-weekends": "Fines de semana",
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const AgendaNavigation = ({
  selectedDate,
  view,
  onSelectDate,
  onViewChange,
  showViewPicker = true,
  views = ALL_VIEWS,
}: Props) => {
  const year = Number(selectedDate.slice(0, 4));
  const month = Number(selectedDate.slice(5, 7)) - 1;
  const day = Number(selectedDate.slice(8, 10));
  const currentYear = Number(toYMD(new Date()).slice(0, 4));
  const isMonthView = view === "month" || view === "month-weekends";
  const dateForMonth = (nextYear: number, nextMonth: number) => {
    const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
    return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  };
  const chooseMonth = (nextMonth: number) =>
    onSelectDate(dateForMonth(year, nextMonth));
  const shift = (days: number) => onSelectDate(addDays(selectedDate, days));
  const shiftMonth = (delta: number) => {
    const total = month + delta;
    const nextYear = year + Math.floor(total / 12);
    const nextMonth = ((total % 12) + 12) % 12;
    onSelectDate(dateForMonth(nextYear, nextMonth));
  };
  const title = isMonthView
    ? `${capitalize(MONTHS[month])} ${year}`
    : weekLabel(weekStart(selectedDate));

  return (
    <nav
      className={`${styles.navigation} agenda-navigation`}
      aria-label="Navegación de agenda"
    >
      <div className="agenda-date-filters">
        <div role="group" aria-label="Año">
          {[currentYear, currentYear + 1, currentYear + 2].map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={item === year}
              onClick={() => onSelectDate(dateForMonth(item, month))}
            >
              {item}
            </button>
          ))}
        </div>
        <label>
          Mes
          <select
            aria-label="Mes"
            value={month}
            onChange={(event) => chooseMonth(Number(event.target.value))}
          >
            {MONTHS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="agenda-week-navigation">
        <strong aria-live="polite">{title}</strong>
        <div>
          <button
            type="button"
            aria-label={isMonthView ? "Mes anterior" : "Semana anterior"}
            onClick={() => (isMonthView ? shiftMonth(-1) : shift(-7))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={isMonthView ? "Mes siguiente" : "Semana siguiente"}
            onClick={() => (isMonthView ? shiftMonth(1) : shift(7))}
          >
            ›
          </button>
        </div>
        {showViewPicker ? (
          <div role="group" aria-label="Presentación">
            {views.map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={view === option}
                onClick={() => onViewChange(option)}
              >
                {VIEW_LABELS[option]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
};
