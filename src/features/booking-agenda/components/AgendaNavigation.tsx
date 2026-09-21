import type { YMD } from "../types";
import { addDays, toYMD, weekStart } from "../utils/businessDate";
import { MONTHS, weekLabel } from "../utils/agendaPresentation";
import styles from "./AgendaNavigation.module.css";

interface Props {
  selectedDate: YMD;
  view: "summary" | "hours";
  onSelectDate: (date: YMD) => void;
  onViewChange: (view: "summary" | "hours") => void;
  showViewPicker?: boolean;
}

export const AgendaNavigation = ({
  selectedDate,
  view,
  onSelectDate,
  onViewChange,
  showViewPicker = true,
}: Props) => {
  const year = Number(selectedDate.slice(0, 4));
  const month = Number(selectedDate.slice(5, 7)) - 1;
  const day = Number(selectedDate.slice(8, 10));
  const currentYear = Number(toYMD(new Date()).slice(0, 4));
  const dateForMonth = (nextYear: number, nextMonth: number) => {
    const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
    return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  };
  const chooseMonth = (nextMonth: number) =>
    onSelectDate(dateForMonth(year, nextMonth));
  const shift = (days: number) => onSelectDate(addDays(selectedDate, days));

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
        <strong aria-live="polite">{weekLabel(weekStart(selectedDate))}</strong>
        <div>
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
        {showViewPicker ? (
          <div role="group" aria-label="Presentación">
            <button
              type="button"
              aria-pressed={view === "summary"}
              onClick={() => onViewChange("summary")}
            >
              Resumen
            </button>
            <button
              type="button"
              aria-pressed={view === "hours"}
              onClick={() => onViewChange("hours")}
            >
              Horarios
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
};
