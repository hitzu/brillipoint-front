import styles from "../story.module.css";

const lanes = [
  {
    label: "At the booth",
    steps: ["Guest takes the photo", "Saved on the iPad", "Local queue"],
  },
  {
    label: "Mobile hotspot",
    steps: ["Booth finds the print server (Bonjour)", "Print queue", "Printer"],
  },
  {
    label: "When online",
    steps: ["Queue drains with backoff", "API", "Event gallery"],
  },
];

export const OfflineDiagram = () => (
  <div
    className={styles.diagram}
    role="img"
    aria-label="The photo never waits for the network: it is saved on the iPad and queued, printed over the venue's local network, and uploaded to the gallery whenever a connection appears."
  >
    <p className={styles.diagramTitle} aria-hidden="true">
      What happens to one photo
    </p>
    <div className={styles.lanes} aria-hidden="true">
      {lanes.map((lane) => (
        <div key={lane.label} className={styles.lane}>
          <span className={styles.laneLabel}>{lane.label}</span>
          <div className={styles.steps}>
            {lane.steps.map((step, index) => (
              <span key={step} className={styles.steps}>
                {index > 0 ? <span className={styles.arrow}>→</span> : null}
                <span className={styles.node}>{step}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
    <p className={styles.legend} aria-hidden="true">
      Printing only needs the local network. Internet is only needed for the gallery, and the
      guest&apos;s photo is already safe on the iPad before that.
    </p>
  </div>
);
