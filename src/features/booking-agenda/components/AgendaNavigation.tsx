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
  /** Renders a "Volver" button that returns to the previous level (opt-in). */
  onBack?: () => void;
  /** "public" neutralizes the app's dark theme for pages like expo. */
  tone?: "app" | "public";
}

const ALL_VIEWS: CalendarView[] = ["summary", "hours", "month", "month-weekends"];

const VIEW_LABELS: Record<CalendarView, string> = {
  summary: "Resumen",
  hours: "Horarios",
  month: "Mes",
  "month-weekends": "Fines de semana",
};

/** 3-letter chip labels, in calendar order. */
const MONTH_ABBREVIATIONS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const AgendaNavigation = ({
  selectedDate,
  view,
  onSelectDate,
  onViewChange,
  showViewPicker = true,
  views = ALL_VIEWS,
  onBack,
  tone = "app",
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
  const title = isMonthView
    ? `${capitalize(MONTHS[month])} ${year}`
    : weekLabel(weekStart(selectedDate));

  return (
    <nav
      className={`${styles.navigation} agenda-navigation`}
      aria-label="Navegación de agenda"
      data-tone={tone}
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
        <div
          className={styles.monthChips}
          role="group"
          aria-label="Mes"
        >
          {MONTH_ABBREVIATIONS.map((abbreviation, index) => (
            <button
              type="button"
              key={abbreviation}
              aria-pressed={index === month}
              aria-label={capitalize(MONTHS[index])}
              onClick={() => chooseMonth(index)}
            >
              {abbreviation}
            </button>
          ))}
        </div>
      </div>
      <div className="agenda-week-navigation">
        <strong aria-live="polite">{title}</strong>
        <div className="agenda-week-actions">
          {!isMonthView ? (
            <>
              <button type="button" onClick={() => onSelectDate(toYMD(new Date()))}>
                Hoy
              </button>
              <div role="group" aria-label="Semana">
                <button
                  type="button"
                  aria-label="Semana anterior"
                  onClick={() => shift(-7)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Semana siguiente"
                  onClick={() => shift(7)}
                >
                  ›
                </button>
              </div>
            </>
          ) : null}
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
          {onBack ? (
            <button type="button" className={styles.backButton} onClick={onBack}>
              ← Volver
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
};
