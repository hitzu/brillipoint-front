const MINUTES_PER_DAY = 24 * 60;

export interface TimeOption {
  value: string;
  label: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const minutesFromTime = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const timeFromMinutes = (minutes: number): string => {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

/** Every 30-minute mark in a day: 00:00, 00:30, … 23:30. */
export const startTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let minutes = 0; minutes < MINUTES_PER_DAY; minutes += 30) {
    const value = timeFromMinutes(minutes);
    options.push({ value, label: value });
  }
  return options;
};

/** Spanish-locale duration: minutes under an hour, otherwise hours with a decimal comma. */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `${text} h`;
};

/**
 * Options from start+30min through start+24h, wrapping past midnight, each
 * labeled with its duration relative to `startsAt` (Google-Calendar style).
 */
export const endTimeOptions = (startsAt: string): TimeOption[] => {
  const startMinutes = minutesFromTime(startsAt);
  const options: TimeOption[] = [];
  for (let offset = 30; offset <= MINUTES_PER_DAY; offset += 30) {
    const value = timeFromMinutes(startMinutes + offset);
    options.push({ value, label: `${value} (${formatDuration(offset)})` });
  }
  return options;
};

/** The existing convention: an end at or before start means the next civil day. */
export const isNextDayEnd = (startsAt: string, endsAt: string): boolean =>
  endsAt <= startsAt;

/** Duration in minutes when `endsAt` wraps past midnight relative to `startsAt`. */
export const nextDayDurationMinutes = (startsAt: string, endsAt: string): number => {
  const startMinutes = minutesFromTime(startsAt);
  const endMinutes = minutesFromTime(endsAt);
  return MINUTES_PER_DAY - startMinutes + endMinutes;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Whether a typed value is a well-formed HH:mm in range. */
export const isValidTime = (value: string): boolean => TIME_PATTERN.test(value);

/**
 * The option whose value is closest in clock time to `value` — used to scroll
 * a dropdown to a sensible spot when the current value is off the 30-min
 * grid. A plain clock-minute distance (no midnight wraparound) is close
 * enough for this positioning purpose.
 */
export const closestOptionValue = (
  options: TimeOption[],
  value: string
): string | undefined => {
  if (!options.length || !isValidTime(value)) return undefined;
  const target = minutesFromTime(value);
  let closest = options[0];
  let closestDistance = Infinity;
  for (const option of options) {
    const distance = Math.abs(minutesFromTime(option.value) - target);
    if (distance < closestDistance) {
      closest = option;
      closestDistance = distance;
    }
  }
  return closest.value;
};
