import { SectionHeader } from "../../ui/SectionHeader";
import type { SectionProps } from "../types";
import styles from "./RulesSection.module.css";

/** [what we never do, why] grouped by topic. */
const RULES: Array<{ topic: string; items: Array<[string, string]> }> = [
  {
    topic: "Logo",
    items: [
      ["Redibujar, deformar, estirar o rotar la B.", "Cada versión distinta la debilita."],
      ["Glow en impresión, bordado, llaveros o tamaños chicos.", "Se vuelve una mancha gris."],
      ["Colorearlo con los colores del evento.", "Solo negro, blanco o foil dorado."],
      ["Logos propios para Photobooth o Glitter Bar.", "Se nombran con eyebrow."],
    ],
  },
  {
    topic: "Color",
    items: [
      ["Photobooth en fondo oscuro o Glitter Bar en claro.", "El fondo es lo que distingue a cada línea."],
      ["Un segundo acento (rosa, morado, azul) o degradados arcoíris.", "Parece otra marca."],
      ["Texto gold-500 sobre claro o texto blanco sobre dorado.", "No se lee."],
      ["Dorado en más del 10% de la pieza.", "Si todo brilla, nada brilla."],
    ],
  },
  {
    topic: "Tipografía",
    items: [
      ["Más de dos tipografías.", "Solo Jost y Amsterdam One."],
      ["Amsterdam One en mayúsculas, párrafos o listas.", "Es acento, una vez por pieza."],
      ["Títulos en Black o itálica.", "Van en peso 500, rectos."],
      ["Contorno o sombra paralela en textos.", "Se ve barato y ensucia la lectura."],
    ],
  },
  {
    topic: "Brillo",
    items: [
      ["Glow sobre fondo claro.", "El neón solo existe de noche."],
      ["Más de un protagonista luminoso.", "Un solo elemento con glow por pieza."],
      ["Destellos, gemas y confeti por toda la pieza.", "Máximo 3 a 5, del mismo dorado."],
      ["Diamantes, birretes o globos 3D de stock.", "Usamos fotos reales y nuestro destello."],
    ],
  },
  {
    topic: "Composición",
    items: [
      ["Collages de más de 4 fotos.", "Una foto buena vende más que diez chicas."],
      ["Llenar todos los huecos.", "El aire es parte del lujo: márgenes de space-8 o más."],
      ["Íconos de colores o de estilos mezclados.", "De línea, en ink o gold-700, de un solo set."],
      ["Todo en píldora.", "Solo botones, chips y sello."],
    ],
  },
  {
    topic: "Precios y textos",
    items: [
      ["Precios tachados, porcentajes o “antes / ahora”.", "Un solo precio por paquete."],
      ["“Desde $…” en grande.", "Si hay variación, va en la nota."],
      ["Signos dobles, emojis o MAYÚSCULAS para gritar.", "Hablamos con calma y calidez."],
    ],
  },
  {
    topic: "Fotografía",
    items: [
      ["Fotos borrosas, oscuras o con flash directo duro.", "El portafolio es la prueba de calidad."],
      ["Stock o IA presentadas como eventos reales.", "Vendemos lo que hacemos de verdad."],
      ["Filtros fuertes o marcos de Canva.", "Compiten con la temática del cliente."],
      ["Publicar a invitados sin permiso.", "Con menores, siempre con autorización de los padres."],
    ],
  },
];

export function RulesSection(_props: SectionProps) {
  return (
    <>
      <SectionHeader
        eyebrow="PROHIBICIONES"
        title="Lo que nunca hacemos"
        lead="Si una pieza rompe una de estas reglas, no sale. Cada una lleva su porqué."
      />
      <div className={styles.rules}>
        {RULES.map((group) => (
          <div key={group.topic} className={styles.rule}>
            <h3>{group.topic}</h3>
            <ul>
              {group.items.map(([rule, reason]) => (
                <li key={rule}>
                  <p>
                    {rule} <span>{reason}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
