// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesSection } from "../NotesSection";

describe("NotesSection", () => {
  it("reports changes to the public note", () => {
    const onPublicNoteChange = vi.fn();
    render(
      <NotesSection publicNote="" onPublicNoteChange={onPublicNoteChange} />,
    );
    fireEvent.change(screen.getByLabelText("Nota pública"), {
      target: { value: "Entrega a las 5pm" },
    });
    expect(onPublicNoteChange).toHaveBeenCalledWith("Entrega a las 5pm");
  });
});
