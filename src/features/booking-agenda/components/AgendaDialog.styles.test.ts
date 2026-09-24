import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const dialogStyles = readFileSync(
  new URL("./AgendaDialog.module.css", import.meta.url),
  "utf8"
);

it("lets a form-wrapped scrollable modal body scroll instead of clipping the footer", () => {
  expect(dialogStyles).toContain(".dialog :global(.modal-content) > form");
  expect(dialogStyles).toMatch(
    /> form \{[^}]*display: flex;[^}]*flex-direction: column;[^}]*min-height: 0;/
  );
});
