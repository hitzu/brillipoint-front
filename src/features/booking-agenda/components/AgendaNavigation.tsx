import { MonthYearPicker } from "@shared/components/MonthYearPicker/MonthYearPicker";
import type { CalendarView, YMD } from "../types";
import { addDays, toYMD, weekStart } from "../utils/businessDate";
import { weekLabel } from "../utils/agendaPresentation";
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
  const isMonthView = view === "month" || view === "month-weekends";
  /** Same day in the target month, clamped to its last day (31 ene → 28 feb). */
  const dateForMonth = (nextYear: number, nextMonth: number) => {
    const target = new Date(Date.UTC(nextYear, nextMonth, 1));
    const targetYear = target.getUTCFullYear();
    const targetMonth = target.getUTCMonth();
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  };
  const step = (direction: 1 | -1) =>
    onSelectDate(
      isMonthView
        ? dateForMonth(year, month + direction)
        : addDays(selectedDate, direction * 7)
    );
  const unit = isMonthView ? "Mes" : "Semana";

  return (
    <nav
      className={`${styles.navigation} agenda-navigation`}
      aria-label="Navegación de agenda"
      data-tone={tone}
    >
      <div className="agenda-week-navigation">
        <div className="agenda-period">
          <div role="group" aria-label="Periodo">
            <button
              type="button"
              aria-label={`${unit} anterior`}
              onClick={() => step(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={`${unit} siguiente`}
              onClick={() => step(1)}
            >
              ›
            </button>
          </div>
          <MonthYearPicker
            year={year}
            month={month}
            label={isMonthView ? undefined : weekLabel(weekStart(selectedDate))}
            onChange={(nextYear, nextMonth) =>
              onSelectDate(dateForMonth(nextYear, nextMonth))
            }
          />
          <button type="button" onClick={() => onSelectDate(toYMD(new Date()))}>
            Hoy
          </button>
        </div>
        <div className="agenda-week-actions">
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
