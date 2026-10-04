// @vitest-environment jsdom
import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeSocialCtaBlock from "../components/ThemeSocialCtaBlock";
import {
  emptySocialCtaForm,
  SocialCtaFormErrors,
  SocialCtaFormState,
  SocialCtaLocale,
  validateSocialCtaForm,
} from "../socialCtaForm";

interface HarnessProps {
  initialForm?: SocialCtaFormState;
  inherited?: boolean;
  cleared?: boolean;
  canUseInherited?: boolean;
  onUseInherited?: () => void;
  onFormChange?: (form: SocialCtaFormState) => void;
  withErrors?: boolean;
}

/** Stateful wrapper so the presentational block can be driven like in the section. */
const Harness = ({
  initialForm = emptySocialCtaForm(),
  inherited = false,
  cleared = false,
  canUseInherited = false,
  onUseInherited = () => undefined,
  onFormChange,
  withErrors = true,
}: HarnessProps) => {
  const [form, setForm] = useState(initialForm);
  const [locale, setLocale] = useState<SocialCtaLocale>("es");
  const errors: SocialCtaFormErrors = withErrors ? validateSocialCtaForm(form) : { socials: {} };
  return (
    <ThemeSocialCtaBlock
      form={form}
      errors={errors}
      locale={locale}
      onLocaleChange={setLocale}
      onChange={(next) => {
        setForm(next);
        onFormChange?.(next);
      }}
      inherited={inherited}
      cleared={cleared}
      canUseInherited={canUseInherited}
      onUseInherited={onUseInherited}
    />
  );
};

const lastForm = (spy: ReturnType<typeof vi.fn>): SocialCtaFormState =>
  spy.mock.calls[spy.mock.calls.length - 1][0];

describe("ThemeSocialCtaBlock", () => {
  it("shows a switch per network and reveals the input only when it is on", () => {
    render(<Harness />);

    for (const name of ["WhatsApp", "Instagram", "TikTok", "Facebook", "Sitio web"]) {
      expect(screen.getByRole("switch", { name })).toBeTruthy();
    }
    expect(screen.queryByLabelText("Usuario o enlace de Instagram")).toBeNull();

    fireEvent.click(screen.getByRole("switch", { name: "Instagram" }));

    const input = screen.getByLabelText("Usuario o enlace de Instagram") as HTMLInputElement;
    expect(input.placeholder).toBe("@usuario");
  });

  it("updates the value and shows the normalized link as a hint", () => {
    const onFormChange = vi.fn();
    render(<Harness onFormChange={onFormChange} />);

    fireEvent.click(screen.getByRole("switch", { name: "Instagram" }));
    fireEvent.change(screen.getByLabelText("Usuario o enlace de Instagram"), {
      target: { value: "@lusso.mx" },
    });

    expect(lastForm(onFormChange).socials.instagram).toEqual({
      enabled: true,
      value: "@lusso.mx",
    });
    expect(screen.getByText("https://instagram.com/lusso.mx")).toBeTruthy();
  });

  it("uses helpful placeholders for whatsapp and website", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("switch", { name: "WhatsApp" }));
    fireEvent.click(screen.getByRole("switch", { name: "Sitio web" }));

    expect((screen.getByLabelText("Número de WhatsApp") as HTMLInputElement).placeholder).toBe(
      "+52 55 1234 5678",
    );
    expect((screen.getByLabelText("Enlace de Sitio web") as HTMLInputElement).placeholder).toBe(
      "tusitio.com",
    );
  });

  it("edits texts per locale with the ES/EN toggle", () => {
    const onFormChange = vi.fn();
    render(<Harness onFormChange={onFormChange} />);

    expect(screen.getByRole("button", { name: "ES" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.change(screen.getByLabelText(/Texto principal/), { target: { value: "¡Gracias!" } });

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByRole("button", { name: "EN" }).getAttribute("aria-pressed")).toBe("true");
    const headline = screen.getByLabelText(/Texto principal/) as HTMLInputElement;
    expect(headline.value).toBe("");
    fireEvent.change(headline, { target: { value: "Thanks!" } });
    fireEvent.change(screen.getByLabelText(/Subtítulo/), { target: { value: "See you" } });
    fireEvent.change(screen.getByLabelText(/síguenos/), { target: { value: "Follow us" } });

    const form = lastForm(onFormChange);
    expect(form.headline).toEqual({ es: "¡Gracias!", en: "Thanks!" });
    expect(form.subtitle).toEqual({ en: "See you" });
    expect(form.followText).toEqual({ en: "Follow us" });
    expect(screen.getAllByText(/\{\{honoreesName\}\}/).length).toBeGreaterThan(0);
  });

  it("limits the CTA channel to enabled networks and shows label/message fields", () => {
    const onFormChange = vi.fn();
    render(<Harness onFormChange={onFormChange} />);

    const select = screen.getByLabelText("Botón principal") as HTMLSelectElement;
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Sin botón",
    ]);
    expect(screen.queryByLabelText(/Texto del botón/)).toBeNull();

    fireEvent.click(screen.getByRole("switch", { name: "WhatsApp" }));
    fireEvent.click(screen.getByRole("switch", { name: "Instagram" }));
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Sin botón",
      "WhatsApp",
      "Instagram",
    ]);

    fireEvent.change(select, { target: { value: "whatsapp" } });
    fireEvent.change(screen.getByLabelText(/Texto del botón/), { target: { value: "Escríbenos" } });
    fireEvent.change(screen.getByLabelText(/Mensaje de WhatsApp/), { target: { value: "Hola" } });

    const form = lastForm(onFormChange);
    expect(form.primaryAction).toEqual({
      channel: "whatsapp",
      label: { es: "Escríbenos" },
      message: { es: "Hola" },
    });

    fireEvent.change(select, { target: { value: "instagram" } });
    expect(screen.queryByLabelText(/Mensaje de WhatsApp/)).toBeNull();
  });

  it("drops the CTA channel when its network is switched off", () => {
    const onFormChange = vi.fn();
    render(<Harness onFormChange={onFormChange} />);

    fireEvent.click(screen.getByRole("switch", { name: "Instagram" }));
    fireEvent.change(screen.getByLabelText("Botón principal"), { target: { value: "instagram" } });
    fireEvent.click(screen.getByRole("switch", { name: "Instagram" }));

    expect(lastForm(onFormChange).primaryAction.channel).toBeNull();
  });

  it("shows inline validation errors", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("switch", { name: "WhatsApp" }));
    fireEvent.change(screen.getByLabelText("Número de WhatsApp"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("Botón principal"), { target: { value: "whatsapp" } });

    expect(screen.getByText("El número de WhatsApp debe tener entre 8 y 15 dígitos.")).toBeTruthy();
    expect(screen.getByText("Escribe el texto del botón en español o inglés.")).toBeTruthy();
  });

  it("shows the inherited note and the 'Usar el heredado' button when allowed", () => {
    const onUseInherited = vi.fn();
    const { rerender } = render(<Harness inherited />);

    expect(screen.getByText(/Heredado del tema/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Usar el heredado" })).toBeNull();

    rerender(<Harness canUseInherited onUseInherited={onUseInherited} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar el heredado" }));
    expect(onUseInherited).toHaveBeenCalledTimes(1);
  });
});
