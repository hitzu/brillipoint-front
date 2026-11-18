// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FormDropzone from "./FormDropzone";

afterEach(cleanup);

describe("FormDropzone", () => {
  it("keeps the default call to action when no label is given", () => {
    render(<FormDropzone embedded multiple description="Imágenes" />);

    expect(screen.getByText("Arrastra tus archivos aquí o pulsa para agregarlos")).toBeTruthy();
    expect(screen.getByText("Imágenes")).toBeTruthy();
  });

  it("replaces the call to action with a custom label", () => {
    render(<FormDropzone embedded multiple label="Pulsa aquí para subir tus selfies" />);

    expect(screen.getByText("Pulsa aquí para subir tus selfies")).toBeTruthy();
    expect(screen.queryByText("Arrastra tus archivos aquí o pulsa para agregarlos")).toBeNull();
  });
});
