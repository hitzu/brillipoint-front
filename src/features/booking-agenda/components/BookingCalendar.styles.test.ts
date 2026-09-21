import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const calendarStyles = readFileSync(
  new URL("./BookingCalendar.module.css", import.meta.url),
  "utf8"
);

it("uses compact, high-contrast event treatment across agenda views", () => {
  expect(calendarStyles).toContain("--agenda-event-surface: #073c48;");
  expect(calendarStyles).toContain("--agenda-event-text: #f2fcff;");
  expect(calendarStyles).toContain("--fc-event-bg-color: var(--agenda-event-surface);");
  expect(calendarStyles).toContain("max-height: 100%;");
  expect(calendarStyles).toContain("text-overflow: ellipsis;");
  expect(calendarStyles).toContain(".fc-timegrid-event.fc-v-event");
  expect(calendarStyles).toContain(".fc-timegrid-event .agenda-calendar-entry)");
  expect(calendarStyles).toContain("color: var(--agenda-event-text) !important;");
});
