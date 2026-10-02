// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ThemeSocialCtaPreview from "../components/ThemeSocialCtaPreview";
import { emptySocialCtaForm, SocialCtaFormState } from "../socialCtaForm";
import type { EventTheme } from "../../../party/types/themeContract";

const buildForm = (patch: (form: SocialCtaFormState) => void = () => undefined) => {
  const form = emptySocialCtaForm();
  form.socials.instagram = { enabled: true, value: "@lusso" };
  form.socials.whatsapp = { enabled: true, value: "5512345678" };
  form.headline = { es: "Gracias por venir, {{honoreesName}}", en: "Thanks for coming" };
  form.primaryAction = {
    channel: "whatsapp",
    label: { es: "Escríbenos" },
    message: {},
  };
  patch(form);
  return form;
};

const EVENT_THEME = {
  id: 1,
  key: "k",
  name: "Kit",
  version: "v1",
  tokens: {
    primary: "#aa0000",
    onPrimary: "#ffffff",
    secondary: "#00aa00",
    background: "#123456",
    surface: "#fefefe",
    text: "#111111",
    textMuted: "#666666",
  },
} as unknown as EventTheme;

const region = () => screen.getByRole("region", { name: "Vista previa de redes sociales y CTA" });

describe("ThemeSocialCtaPreview", () => {
  it("renders the Spanish headline and CTA label from the form", () => {
    render(<ThemeSocialCtaPreview form={buildForm()} locale="es" honoreesNames="Ana" />);

    expect(region()).toBeTruthy();
    expect(screen.getByText("Gracias por venir, Ana")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Escríbenos/ })).toBeTruthy();
    expect(screen.getByText("ES")).toBeTruthy();
  });

  it("switches to the English texts and falls back to Spanish when English is empty", () => {
    render(<ThemeSocialCtaPreview form={buildForm()} locale="en" honoreesNames="Ana" />);

    expect(screen.getByText("Thanks for coming")).toBeTruthy();
    // The CTA label has no English text, so the Spanish one is shown.
    expect(screen.getByRole("link", { name: /Escríbenos/ })).toBeTruthy();
    expect(screen.getByText("EN")).toBeTruthy();
  });

  it("does not repeat the CTA channel as a secondary social link", () => {
    render(<ThemeSocialCtaPreview form={buildForm()} locale="es" />);

    expect(screen.getByRole("link", { name: "Instagram" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "WhatsApp" })).toBeNull();
  });

  it("renders the placeholder as empty when the event has no honorees", () => {
    render(<ThemeSocialCtaPreview form={buildForm()} locale="es" honoreesNames="   " />);

    expect(screen.queryByText(/honoreesName/)).toBeNull();
    expect(screen.getByText(/Gracias por venir/)).toBeTruthy();
  });

  it("interpolates the resolved theme params, letting the event honorees override them", () => {
    const form = buildForm((f) => {
      f.headline = { es: "{{brandName}} celebra a {{honoreesName}}" };
    });
    const theme = {
      ...EVENT_THEME,
      params: { brandName: "Lusso", honoreesName: "Kit" },
    } as EventTheme;

    const { rerender } = render(
      <ThemeSocialCtaPreview form={form} locale="es" honoreesNames="Ana" eventTheme={theme} />,
    );
    expect(screen.getByText("Lusso celebra a Ana")).toBeTruthy();

    rerender(<ThemeSocialCtaPreview form={form} locale="es" honoreesNames="  " eventTheme={theme} />);
    expect(screen.getByText("Lusso celebra a Kit")).toBeTruthy();
  });

  it("shows an empty state when there is nothing to preview", () => {
    render(<ThemeSocialCtaPreview form={emptySocialCtaForm()} locale="es" />);

    expect(screen.getByText("Agrega una red o un texto para ver la vista previa")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("applies the resolved theme CSS variables on the preview surface", () => {
    render(
      <ThemeSocialCtaPreview form={buildForm()} locale="es" eventTheme={EVENT_THEME} />,
    );

    const surface = screen.getByTestId("social-cta-preview-surface");
    expect(surface.style.getPropertyValue("--ep-page-bg")).toBe("#123456");
    expect(surface.style.getPropertyValue("--ep-primary-btn-bg")).toBe("#aa0000");
  });

  it("renders without theme variables when the resolved theme is unavailable", () => {
    render(<ThemeSocialCtaPreview form={buildForm()} locale="es" eventTheme={null} />);

    const surface = screen.getByTestId("social-cta-preview-surface");
    expect(surface.style.getPropertyValue("--ep-page-bg")).toBe("");
    expect(screen.getByRole("link", { name: /Escríbenos/ })).toBeTruthy();
  });
});
