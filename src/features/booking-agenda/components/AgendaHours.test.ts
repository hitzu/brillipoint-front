import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const agendaHours = readFileSync(
  new URL("./AgendaHours.tsx", import.meta.url),
  "utf8"
);
const calendarStyles = readFileSync(
  new URL("./BookingCalendar.module.css", import.meta.url),
  "utf8"
);

it("removes the all-day row and keeps weekly date headings visible", () => {
  expect(agendaHours).toContain("allDaySlot={false}");
  expect(calendarStyles).toMatch(
    /\.agenda-hours\) \{[\s\S]*?\.fc \.fc-col-header-cell\) \{[\s\S]*?position: sticky;[\s\S]*?top: 0;[\s\S]*?z-index: 3;/
  );
});

it("uses the compact title/time layout for events up to two hours", () => {
  expect(agendaHours).toMatch(/<=\s*120 \* 60 \* 1000/);
  expect(calendarStyles).toContain(".agenda-calendar-entry--compact");
  expect(calendarStyles).toContain("display: flex;");
  expect(calendarStyles).toContain("align-items: baseline;");
});
