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

it("enables drag-select and converts it into a create request only when a policy is wired", () => {
  expect(agendaHours).toContain("selectable={Boolean(onCreateRequest)}");
  expect(agendaHours).toContain("select={onCreateRequest ? onSelect : undefined}");
  expect(agendaHours).toContain("civilSelectionRange(");
});

it("renders a clickable day-number header that opens the create modal for that date (T5)", () => {
  expect(agendaHours).toContain("onDaySelect");
  expect(agendaHours).toMatch(/dayHeaderContent=\{\s*onDaySelect/);
});

it("styles the Horarios day header like the Resumen headings (weekday + big day number)", () => {
  expect(agendaHours).toContain("agenda-hours-day-header__weekday");
  expect(agendaHours).toContain("agenda-hours-day-header__number");
  expect(calendarStyles).toMatch(
    /\.agenda-hours-day-header\) \{[\s\S]*?border: 0;[\s\S]*?background: transparent;/
  );
  expect(calendarStyles).toMatch(
    /\.agenda-hours-day-header__number\) \{[\s\S]*?font-size: 1\.3rem;/
  );
});

it("keeps header and body columns aligned: neutralizes the template's scroller-harness padding", () => {
  expect(calendarStyles).toMatch(
    /\.agenda-hours \.fc \.fc-scroller-harness\) \{[\s\S]*?padding: 0;/
  );
  expect(calendarStyles).not.toContain("overflow: visible !important;");
});

it("labels every hour on the left axis as HH:mm", () => {
  expect(agendaHours).toContain('slotLabelInterval="01:00:00"');
  expect(agendaHours).toMatch(/slotLabelFormat=\{\{[\s\S]*?hour: "2-digit"/);
});

it("gives short events enough height to show their label and time", () => {
  expect(agendaHours).toMatch(/eventMinHeight=\{\d+\}/);
  expect(calendarStyles).toMatch(
    /\.agenda-hours \.fc \.fc-timegrid-slot\) \{[\s\S]*?height: 2\.5rem;/
  );
});

it("disables FullCalendar's own toolbar so the page toolbar is the only navigation", () => {
  expect(agendaHours).toContain("headerToolbar={false}");
});
