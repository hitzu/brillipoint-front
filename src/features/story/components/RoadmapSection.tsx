import styles from "../story.module.css";

const BACKLOG_URL = "https://github.com/hitzu/brillipoint-ops/issues";

type RoadmapItem = { title: string; body: string; issues?: number[] };

const product: RoadmapItem[] = [
  {
    title: "Validate video in the field",
    body: "Boomerang and slow-motion clips are in development on the booth. Next is taking them end to end and proving them at real events: file size on mobile data, and whether guests actually share them.",
    issues: [3],
  },
  {
    title: "A page for weddings",
    body: "A personalized landing per couple or wedding planner that shows our services and lets them get a quote right there, on the same partner landing system we already use for other occasions.",
  },
  {
    title: "Galleries for other operators",
    body: "Events that don't need one of our contracts or bookings, and a photo pipeline an operator can run alone.",
    issues: [1, 2],
  },
  {
    title: "Closing deals at expos",
    body: "Zero-cost extras so a promo or a gift can be added on the spot while negotiating live.",
    issues: [5],
  },
];

const tech: RoadmapItem[] = [
  {
    title: "Jitter and a circuit breaker for the booth queue",
    body: "Today retries follow a fixed ladder, so photos that failed together retry together. Next: jitter, and a breaker that stops every attempt while the venue network is clearly down, without ever dropping a photo.",
    issues: [6],
  },
  {
    title: "Issues worked by agents",
    body: "A cron that runs my build loop on its own: it plans an issue, waits for my approval, implements it and opens the pull requests. Described in How I build it.",
  },
  {
    title: "Bookings in Google Calendar",
    body: "One-way sync so the team sees every booking where they already plan their week.",
    issues: [4],
  },
];

const RoadmapGroup = ({ title, items }: { title: string; items: RoadmapItem[] }) => (
  <div className={styles.roadmapGroup}>
    <h3 className={styles.eyebrow}>{title}</h3>
    <div className={styles.cards}>
      {items.map((item) => (
        <div key={item.title} className={styles.card}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          {item.issues ? (
            <p className={styles.issueLinks}>
              {item.issues.map((issue) => (
                <a key={issue} className={styles.chip} href={`${BACKLOG_URL}/${issue}`}>
                  #{issue}
                </a>
              ))}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);

export const RoadmapSection = () => (
  <section className={styles.section}>
    <h2>Roadmap</h2>
    <p>
      The backlog is public. Every item is a GitHub issue written as a spec, split into what
      changes for guests and clients, and what changes under the hood.
    </p>
    <RoadmapGroup title="Product" items={product} />
    <RoadmapGroup title="Tech" items={tech} />
    <p className={styles.note}>
      <a className={styles.link} href={BACKLOG_URL}>
        See all open issues
      </a>
    </p>
  </section>
);
