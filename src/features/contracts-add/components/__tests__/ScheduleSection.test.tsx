// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScheduleSection } from "../ScheduleSection";

describe("ScheduleSection", () => {
  it("calls the time setters when the inputs change", () => {
    const onStartTimeChange = vi.fn();
    const onEndTimeChange = vi.fn();
    render(
      <ScheduleSection
        eventDate="2026-09-19"
        onEventDateChange={vi.fn()}
        startTime=""
        onStartTimeChange={onStartTimeChange}
        endDate="2026-09-19"
        onEndDateChange={vi.fn()}
        endTime=""
        onEndTimeChange={onEndTimeChange}
        onApplyAllDay={vi.fn()}
        venueName=""
        onVenueNameChange={vi.fn()}
        mapsUrl=""
        onMapsUrlChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "12:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "18:00" },
    });
    expect(onStartTimeChange).toHaveBeenCalledWith("12:00");
    expect(onEndTimeChange).toHaveBeenCalledWith("18:00");
  });

  it("calls the end date setter when it changes, with a min of the start date", () => {
    const onEndDateChange = vi.fn();
    render(
      <ScheduleSection
        eventDate="2026-09-24"
        onEventDateChange={vi.fn()}
        startTime="23:00"
        onStartTimeChange={vi.fn()}
        endDate="2026-09-24"
        onEndDateChange={onEndDateChange}
        endTime="03:00"
        onEndTimeChange={vi.fn()}
        onApplyAllDay={vi.fn()}
        venueName=""
        onVenueNameChange={vi.fn()}
        mapsUrl=""
        onMapsUrlChange={vi.fn()}
      />,
    );
    const endDateInput = screen.getByLabelText("Fecha fin");
    expect(endDateInput.getAttribute("min")).toBe("2026-09-24");

    fireEvent.change(endDateInput, { target: { value: "2026-09-25" } });
    expect(onEndDateChange).toHaveBeenCalledWith("2026-09-25");
  });

  it("calls the Maps URL setter when the input changes", () => {
    const onMapsUrlChange = vi.fn();
    render(
      <ScheduleSection
        eventDate="2026-09-19"
        onEventDateChange={vi.fn()}
        startTime=""
        onStartTimeChange={vi.fn()}
        endDate="2026-09-19"
        onEndDateChange={vi.fn()}
        endTime=""
        onEndTimeChange={vi.fn()}
        onApplyAllDay={vi.fn()}
        venueName=""
        onVenueNameChange={vi.fn()}
        mapsUrl=""
        onMapsUrlChange={onMapsUrlChange}
      />,
    );
    const mapsUrlInput = screen.getByLabelText("URL de Google Maps");
    expect(mapsUrlInput.getAttribute("type")).toBe("url");

    fireEvent.change(mapsUrlInput, {
      target: { value: "https://maps.google.com/?q=venue" },
    });
    expect(onMapsUrlChange).toHaveBeenCalledWith(
      "https://maps.google.com/?q=venue",
    );
  });

  it("applies the all-day preset without exposing expo range blocks", () => {
    const onApplyAllDay = vi.fn();
    render(
      <ScheduleSection
        eventDate="2026-09-19"
        onEventDateChange={vi.fn()}
        startTime=""
        onStartTimeChange={vi.fn()}
        endDate="2026-09-19"
        onEndDateChange={vi.fn()}
        endTime=""
        onEndTimeChange={vi.fn()}
        onApplyAllDay={onApplyAllDay}
        venueName=""
        onVenueNameChange={vi.fn()}
        mapsUrl=""
        onMapsUrlChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /todo el día/i }));
    expect(onApplyAllDay).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/mañana|tarde|noche/i)).toBeNull();
  });
});
