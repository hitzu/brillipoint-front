import { useState } from "react";
import { reviewCopy, VOICE_BAD_SAMPLE, VOICE_GOOD_SAMPLE } from "../../../utils/rules";
import { SectionHeader } from "../../ui/SectionHeader";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./VoiceSection.module.css";

const SAY_INSTEAD: Array<[string, string]> = [
  ["Agenda tu fecha", "¡¡APARTA YA!!"],
  ["Set fotográfico estilo gala", "Cabina de fotos barata"],
  ["Un recuerdo que tus invitados se llevan", "El mejor precio del mercado"],
  ["Experiencia, momento, recuerdo, brillo, invitados", "Promoción, oferta, súper, increíble, ganga"],
  ["Incluye galería digital personalizada", "¡Y además te regalamos…!"],
  ["$X,XXX por evento", "Precios tachados o “desde”"],
];

export function VoiceSection(_props: SectionProps) {
  const [text, setText] = useState(VOICE_BAD_SAMPLE);
  const review = reviewCopy(text);
  const count = review.flags.length;

  return (
    <>
      <SectionHeader
        eyebrow="VOZ"
        title="Hablamos de tú"
        lead="Con calidez y sin exagerar. Explicamos el porqué de las cosas y damos un solo precio por paquete."
      />

      <div className={styles.checker}>
        <label className={ui.label} htmlFor="voice-input">
          REVISA UN TEXTO ANTES DE PUBLICARLO
        </label>
        <textarea
          id="voice-input"
          className={ui.input}
          rows={3}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className={ui.row}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall}`}
            onClick={() => setText(VOICE_BAD_SAMPLE)}
          >
            Ejemplo a corregir
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall}`}
            onClick={() => setText(VOICE_GOOD_SAMPLE)}
          >
            Ejemplo correcto
          </button>
        </div>
        <div data-testid="voice-result">
          {review.status === "empty" && (
            <VerdictBox kind="warn" label="VACÍO" className={styles.result}>
              Escribe o pega un texto para revisarlo.
            </VerdictBox>
          )}
          {review.status === "ok" && (
            <VerdictBox kind="ok" className={styles.result}>
              Suena a Brillipoint: claro, cálido y sin gritar.
            </VerdictBox>
          )}
          {review.status === "flags" && (
            <>
              <VerdictBox kind="no" label={`${count} ${count === 1 ? "COSA" : "COSAS"}`} className={styles.result}>
                Cambia esto antes de publicar.
              </VerdictBox>
              <ul className={styles.flags}>
                {review.flags.map((flag) => (
                  <li key={flag.match}>
                    <mark>{flag.match}</mark>
                    <span>{flag.fix}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SÍ DECIMOS</th>
              <th>NO DECIMOS</th>
            </tr>
          </thead>
          <tbody>
            {SAY_INSTEAD.map(([yes, no]) => (
              <tr key={yes}>
                <td>{yes}</td>
                <td>{no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={ui.block}>
        <span className={ui.label}>FRASES QUE YA SUENAN A NOSOTROS</span>
        <div className={styles.quotes}>
          <blockquote>Más que una foto… un recuerdo que sí se queda.</blockquote>
          <blockquote>Momentos hoy, recuerdos siempre.</blockquote>
        </div>
      </div>
    </>
  );
}
