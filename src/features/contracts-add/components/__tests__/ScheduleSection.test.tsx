// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScheduleSection } from "../ScheduleSection";

const renderSection = (props: Partial<React.ComponentProps<typeof ScheduleSection>> = {}) =>
  render(
    <ScheduleSection
      eventDate="2026-09-19"
      onEventDateChange={vi.fn()}
      startTime="12:00"
      onStartTimeChange={vi.fn()}
      endTime="18:00"
      onEndTimeChange={vi.fn()}
      endsNextDay={false}
      venueName=""
      onVenueNameChange={vi.fn()}
      mapsUrl=""
      onMapsUrlChange={vi.fn()}
      {...props}
    />,
  );

describe("ScheduleSection", () => {
  it("uses Agenda time selectors with half-hour options and accepts custom values", () => {
    const onStartTimeChange = vi.fn();
    const onEndTimeChange = vi.fn();
    renderSection({ onStartTimeChange, onEndTimeChange });

    const start = screen.getByRole("combobox", { name: "Inicio" });
    fireEvent.focus(start);
    expect(screen.getByRole("option", { name: "12:00" })).toBeTruthy();
    fireEvent.change(start, { target: { value: "12:15" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Fin" }), {
      target: { value: "18:15" },
    });

    expect(onStartTimeChange).toHaveBeenCalledWith("12:15");
    expect(onEndTimeChange).toHaveBeenCalledWith("18:15");
    expect(screen.queryByLabelText("Fecha fin")).toBeNull();
  });

  it("shows the next-day indicator for equal or earlier end times", () => {
    renderSection({ startTime: "18:00", endTime: "18:00", endsNextDay: true });
    expect(
      screen.getByRole("img", { name: /Termina el día siguiente/ }),
    ).toBeTruthy();
  });

  it("calls the Maps URL setter when the input changes", () => {
    const onMapsUrlChange = vi.fn();
    renderSection({ onMapsUrlChange });
    const mapsUrlInput = screen.getByLabelText("URL de Google Maps");
    expect(mapsUrlInput.getAttribute("type")).toBe("url");
    fireEvent.change(mapsUrlInput, {
      target: { value: "https://maps.google.com/?q=venue" },
    });
    expect(onMapsUrlChange).toHaveBeenCalledWith(
      "https://maps.google.com/?q=venue",
    );
  });

  it("does not render an all-day shortcut", () => {
    renderSection();
    expect(screen.queryByRole("button", { name: /todo el día/i })).toBeNull();
  });
});
