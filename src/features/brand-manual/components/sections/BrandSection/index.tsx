import { themeVars } from "../../../constants/tokens";
import type { Line } from "../../../types";
import { SparkList } from "../../ui/SparkList";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./BrandSection.module.css";

const LINE_CARDS: Array<{
  line: Line;
  eyebrow: string;
  title: string;
  description: string;
  rows: Array<[string, string]>;
}> = [
  {
    line: "light",
    eyebrow: "PHOTOBOOTH · CLARO",
    title: "Set de gala",
    description: "Luz de recepción y un recuerdo impreso.",
    rows: [
      ["Fondo", "Marfil o blanco"],
      ["Texto", "Ink negro"],
      ["Dorado", "gold-500 en formas, gold-700 en texto"],
      ["Logo", "Negro plano"],
    ],
  },
  {
    line: "dark",
    eyebrow: "GLITTER BAR · NOCHE",
    title: "Pista de noche",
    description: "Brillo en la piel y luz de neón.",
    rows: [
      ["Fondo", "Negro cálido o negro"],
      ["Texto", "Ink crema"],
      ["Dorado", "gold-500 en formas y texto"],
      ["Logo", "Blanco plano; glow solo en pantalla"],
    ],
  },
];

const WE_ARE = ["boutique", "elegante", "nocturno", "cálido", "luminoso", "letrero neón", "set estilo gala", "destellos"];
const WE_ARE_NOT = [
  "look infantil",
  "saturación",
  "más de dos tipografías",
  "sombras en textos",
  "precios tachados",
  "ilustraciones genéricas",
];
const ALWAYS = [
  "El isotipo B en la esquina de cada foto impresa",
  "Jost en los textos",
  "El dorado como único acento de marca",
  "El uniforme negro del staff",
];
const ADAPTS = ["Los colores del evento", "Las ilustraciones", "Los nombres"];
const PENDING = [
  "Versión plana del logo y logo vectorizado (SVG)",
  "Isotipo B suelto, en archivo",
  "Lockups PHOTOBOOTH y GLITTER BAR",
  "Recurso gráfico propio (destello, halo, glitter)",
  "Licencia comercial de Amsterdam One",
  "Pantone o foil para el dorado",
  "Paquetes y precios del Glitter Bar y precios finales del Photobooth",
  "Fotos de portafolio seleccionadas",
];

export function BrandSection({ line, onLineChange }: SectionProps) {
  return (
    <>
      <header className={ui.header}>
        <span className={ui.eyebrow}>BRILLIPOINT EXPERIENCE</span>
        <h2 className={ui.heroTitle}>Brillo nocturno, cálido y elegante.</h2>
        <span className={ui.heroScript}>un recuerdo que sí se queda</span>
        <p className={ui.lead}>
          Servicios boutique para eventos en Puebla, Cholula y Cuautlancingo: bodas, XV años, baby showers y
          celebraciones sociales. Hacemos pocas fechas, con ticket alto. Trabajamos dentro de la temática de cada
          cliente, así que la marca se reconoce por pocas constantes que nunca cambian.
        </p>
      </header>

      <div className={ui.block}>
        <h3 className={ui.blockTitle}>Dos líneas, dos luces</h3>
        <p className={ui.note}>
          Comparten logo, tipografías y el mismo dorado. Lo que las distingue es el fondo. Toca una para ver todo el
          manual con su luz.
        </p>
        <div className={styles.lines}>
          {LINE_CARDS.map((card) => (
            <button
              key={card.line}
              type="button"
              className={styles.lineCard}
              style={themeVars(card.line)}
              aria-pressed={line === card.line}
              onClick={() => onLineChange(card.line)}
            >
              <span className={ui.eyebrow}>{card.eyebrow}</span>
              <span className={styles.lineTitle}>{card.title}</span>
              <span className={styles.lineDescription}>{card.description}</span>
              <span className={styles.lineRows}>
                {card.rows.map(([key, value]) => (
                  <span key={key}>
                    <i>{key}</i>
                    {value}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className={ui.note}>
          Cuando una pieza habla de las dos líneas (tarjeta, post general, banner de expo), va en claro o en dos
          mitades, una por línea. Nunca mezcladas en el mismo bloque.
        </p>
      </div>

      <div className={ui.two}>
        <div>
          <span className={ui.label}>SÍ SOMOS</span>
          <div className={ui.chips}>
            {WE_ARE.map((word) => (
              <span key={word} className={ui.chip}>
                {word}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className={ui.label}>NO SOMOS</span>
          <div className={ui.chips}>
            {WE_ARE_NOT.map((word) => (
              <span key={word} className={`${ui.chip} ${ui.chipOff}`}>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={ui.two}>
        <div>
          <span className={ui.label}>SIEMPRE, EN CADA EVENTO</span>
          <SparkList items={ALWAYS} />
        </div>
        <div>
          <span className={ui.label}>SE ADAPTA AL CLIENTE</span>
          <SparkList items={ADAPTS} />
        </div>
      </div>

      <div className={ui.block}>
        <span className={ui.label}>PENDIENTES DEL BORRADOR 0.1</span>
        <ul className={styles.todo}>
          {PENDING.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
