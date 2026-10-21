import styles from "../story.module.css";

const BACKLOG_URL = "https://github.com/hitzu/brillipoint-ops/issues";

export const OperatorsSection = () => (
  <section className={styles.section}>
    <h2>The product we didn&apos;t plan: galleries for other operators</h2>
    <p className={styles.highlight}>
      It came up naturally: the photobooth operators we talk to don&apos;t have personalized
      galleries, and they want to deliver their own sessions through ours. Nobody planned it,
      and it may be the most sellable thing we have.
    </p>
    <div className={styles.cards}>
      <div className={styles.card}>
        <h3>Why it matters</h3>
        <p>
          It turns the gallery from a feature of our booth into a product on its own. We can sell
          it to the whole market, including operators we compete with, and it earns without our
          booth being at the event.
        </p>
      </div>
      <div className={styles.card}>
        <h3>Where it stands</h3>
        <p>
          Today it runs by hand: our scripts process the partner&apos;s photos and register them
          against an event. Next, events that don&apos;t need one of our contracts or bookings,
          and a pipeline a non-technical operator can run alone.
        </p>
        <p className={styles.issueLinks}>
          {[1, 2].map((issue) => (
            <a key={issue} className={styles.chip} href={`${BACKLOG_URL}/${issue}`}>
              #{issue}
            </a>
          ))}
        </p>
      </div>
    </div>
  </section>
);
