// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeSelect } from "./TimeSelect";
import { endTimeOptions, startTimeOptions } from "../utils/timeOptions";

describe("TimeSelect", () => {
  it("shows the plain HH:mm value, not the option label", () => {
    render(
      <TimeSelect
        ariaLabel="Fin"
        value="02:00"
        options={endTimeOptions("18:00")}
        onChange={() => undefined}
      />
    );
    expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
      "02:00"
    );
  });

  it("opens a listbox of duration-labeled options on focus", () => {
    render(
      <TimeSelect
        ariaLabel="Fin"
        value="19:00"
        options={endTimeOptions("19:00")}
        onChange={() => undefined}
      />
    );
    fireEvent.focus(screen.getByLabelText("Fin"));
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByRole("option", { name: "20:00 (1 h)" })).toBeTruthy();
  });

  it("calls onChange with the plain value when an option is picked", () => {
    const onChange = vi.fn();
    render(
      <TimeSelect
        ariaLabel="Fin"
        value="19:00"
        options={endTimeOptions("19:00")}
        onChange={onChange}
      />
    );
    fireEvent.focus(screen.getByLabelText("Fin"));
    fireEvent.click(screen.getByRole("option", { name: "20:30 (1,5 h)" }));
    expect(onChange).toHaveBeenCalledWith("20:30");
  });

  it("forwards typed input immediately", () => {
    const onChange = vi.fn();
    render(
      <TimeSelect
        ariaLabel="Inicio"
        value="12:00"
        options={startTimeOptions()}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "04:00" },
    });
    expect(onChange).toHaveBeenCalledWith("04:00");
  });

  it("reverts an invalid typed value on blur", () => {
    const onChange = vi.fn();
    render(
      <TimeSelect
        ariaLabel="Inicio"
        value="12:00"
        options={startTimeOptions()}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "not-a-time" },
    });
    fireEvent.blur(screen.getByLabelText("Inicio"));
    expect(onChange).toHaveBeenLastCalledWith("12:00");
  });

  it("keeps a value off the 30-minute grid displayed and editable", () => {
    render(
      <TimeSelect
        ariaLabel="Fin"
        value="23:59"
        options={endTimeOptions("18:00")}
        onChange={() => undefined}
      />
    );
    expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
      "23:59"
    );
  });

  it("closes the listbox on Escape", () => {
    render(
      <TimeSelect
        ariaLabel="Fin"
        value="19:00"
        options={endTimeOptions("19:00")}
        onChange={() => undefined}
      />
    );
    fireEvent.focus(screen.getByLabelText("Fin"));
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText("Fin"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
