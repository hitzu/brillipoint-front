import styles from "../story.module.css";

const surfaces = [
  { name: "Booth app", tech: "Swift", body: "Camera, capture, printing, offline queue and sync." },
  { name: "API", tech: "NestJS", body: "Events, tenants, photos, sales catalog." },
  { name: "Galleries", tech: "Next.js", body: "The per-event pages guests open from the QR." },
  { name: "Print service", tech: "Python", body: "Talks to the printer hardware at the venue." },
];

export const ArchitectureDiagram = () => (
  <div
    className={styles.diagram}
    role="img"
    aria-label="Four surfaces read one theme: the booth app, the API, the galleries and the print service all interpret the same theme definition owned by the backend."
  >
    <p className={styles.diagramTitle} aria-hidden="true">
      One theme, four surfaces
    </p>
    <div className={styles.hub} aria-hidden="true">
      <div className={styles.hubCore}>
        <strong>Theme definition</strong>
        <span>One JSON of colors, fonts and component styles, owned by the API</span>
      </div>
      {surfaces.map((surface) => (
        <div key={surface.name} className={`${styles.node} ${styles.hubNode}`}>
          <span className={styles.chip}>{surface.tech}</span>
          <strong>{surface.name}</strong>
          <span>{surface.body}</span>
        </div>
      ))}
    </div>
  </div>
);
