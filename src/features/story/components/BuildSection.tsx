import styles from "../story.module.css";

const PLAN_URL = "https://github.com/hitzu/brillipoint-ops/blob/main/plan.md";

const today = [
  {
    title: "Plan",
    body: "Every feature starts as a written spec: what it does, the contract between apps, the edge cases. The plan is built against it.",
  },
  {
    title: "Tasks",
    body: "The plan is split into tasks small enough to review, each one tied to the spec items it covers.",
  },
  {
    title: "Tests first",
    body: "Agents write the failing test for each rule before any production code exists.",
  },
  {
    title: "Code",
    body: "Then the implementation, until those tests pass.",
  },
  {
    title: "Automated QA",
    body: "Linter, formatter and the full test suite run on every change, so nothing reaches me broken.",
  },
  {
    title: "My review",
    body: "I read the diff and try it where it will live: the iPad, the printer, the guest's phone.",
  },
  {
    title: "Release",
    body: "Small conventional commits, one per unit of work, so any of them can be reverted alone.",
  },
];

const states = ["needs-plan", "plan-ready", "approved", "in-progress", "pr-open"];

export const BuildSection = () => (
  <section className={styles.section} aria-labelledby="story-build">
    <h2 id="story-build">How I build it</h2>
    <p>
      I lean heavily on AI, but with structure: <strong>spec-driven development</strong>. Agents
      write most of the code; the spec, the order of the steps and the final call stay with me.
      That is the only reason one person can keep a Swift app, an API, a web app and a hardware
      service consistent with each other.
    </p>

    <h3 id="story-build-today" className={`${styles.eyebrow} ${styles.subhead}`}>
      Today
    </h3>
    <ol className={styles.loop} aria-labelledby="story-build-today">
      {today.map((step) => (
        <li key={step.title}>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
    <p className={styles.note}>
      Documentation is still the weak step: it is the next thing I&apos;m adding to this loop.
    </p>

    <h3 className={`${styles.eyebrow} ${styles.subhead}`}>Next: issues worked by agents</h3>
    <p>
      The same loop, started by a cron instead of by me. A scheduled job picks up an issue,
      publishes a plan and waits. Once I approve it, a second job implements it and opens one pull
      request per affected repo. People stay at the two gates that matter: approving the plan and
      reviewing the pull request.
    </p>
    <div
      className={styles.diagram}
      role="img"
      aria-label="An issue moves through five states: needs-plan, plan-ready, approved, in-progress and pr-open. Agents write the plan and the code; a person approves the plan and reviews the pull request. A stuck issue is marked blocked."
    >
      <p className={styles.diagramTitle} aria-hidden="true">
        One issue, five states
      </p>
      <div className={styles.steps} aria-hidden="true">
        {states.map((state, index) => (
          <span key={state} className={styles.steps}>
            {index > 0 ? <span className={styles.arrow}>→</span> : null}
            <span className={`${styles.node} ${state === "approved" ? styles.gate : ""}`}>
              {state}
            </span>
          </span>
        ))}
      </div>
      <p className={styles.legend} aria-hidden="true">
        Agents move it from needs-plan to plan-ready and from approved to pr-open. The approval and
        the pull request review are mine. Anything stuck goes to blocked with the reason.
      </p>
    </div>
    <ul className={`${styles.list} ${styles.spaced}`}>
      <li>
        <strong>Never merges, never deploys.</strong> The agent stops at the pull request.
      </li>
      <li>
        <strong>Only trusted authors.</strong> It ignores issues, comments and labels from anyone
        outside the team, and treats issue text as untrusted input.
      </li>
      <li>
        <strong>The plan rules.</strong> If the code doesn&apos;t match the approved plan, the
        issue goes back for a new plan instead of the agent improvising.
      </li>
      <li>
        <strong>One issue at a time</strong>, with a cost cap per run.
      </li>
    </ul>
    <p className={styles.note}>
      <a className={styles.link} href={PLAN_URL}>
        Read the full design
      </a>
    </p>
  </section>
);
