import Head from "next/head";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { BuildSection } from "../components/BuildSection";
import { KeepsakesSection } from "../components/KeepsakesSection";
import { LoopVideo } from "../components/LoopVideo";
import { OfflineDiagram } from "../components/OfflineDiagram";
import { OperatorsSection } from "../components/OperatorsSection";
import { RoadmapSection } from "../components/RoadmapSection";
import { SaasSection } from "../components/SaasSection";
import { StoryFigure } from "../components/StoryFigure";
import styles from "../story.module.css";

const loop = [
  {
    title: "Discovery",
    body: "I'm at the venue when guests use the booth, so I see the gap between what a client asks for and what guests actually do.",
  },
  {
    title: "Prioritize without complete data",
    body: "Event samples are small and never conclusive. I pick one bet per cycle and write down why the others wait.",
  },
  {
    title: "Align people who don't think like me",
    body: "Clients, venue staff, the team running the booth and the operators we partner with all want different things from the same night.",
  },
  {
    title: "Measure behavior",
    body: "Before an experiment ships I decide which number has to move, like WhatsApp clicks right after a guest downloads a photo.",
  },
];


export const StoryPage = () => (
  <div className={styles.page}>
    <Head>
      <title>Brillipoint — Story</title>
      <meta
        name="description"
        content="How a photobooth became a product: the build log behind Brillipoint."
      />
    </Head>

    <article className={styles.article}>
      <header>
        <span className={styles.script}>build log</span>
        <h1 className={styles.title}>Brillipoint — how a photobooth became a product</h1>
        <p className={styles.lede}>
          This is the business I run on the side, and my training ground as an AI product
          engineer. Everything here runs at real events, with real guests, most weekends.
        </p>
        <p className={styles.byline}>
          <strong>Roberto Torres</strong>
          <span>Senior Backend Engineer → AI Product Engineer</span>
          <a className={styles.link} href="mailto:robert.torres.lopez@gmail.com">
            robert.torres.lopez@gmail.com
          </a>
        </p>
      </header>

      <section className={styles.section}>
        <h2>In one line</h2>
        <p className={styles.highlight}>
          Brillipoint is a photobooth plus a personalized photo-gallery platform for events
          (birthdays, weddings, baby showers, brand activations). Guests take a photo at the
          booth, scan a QR code, and get every photo of the night in a gallery designed for that
          specific event.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Why a photobooth and not another SaaS</h2>
        <p>
          I wanted something I could <strong>sell face to face</strong>. Most side projects I saw
          were software built by people who never sold it, all competing for the same online
          customers. A photobooth flips that: I sit in front of the client, I close the deal, and
          then I watch people use the product live, every weekend, with no analytics dashboard in
          between.
        </p>
        <p>
          The software ecosystem grows around a physical product people already understand. We
          started small and kept adding.
        </p>
        <p>
          It also turned out to be a school for <strong>sales funnels</strong>. A lead can start as
          a social media post, as a pitch to a family planning a party, or as a conversation at a
          mass event like a baby expo, where we convince people face to face. Every channel is an
          experiment in finding the next lead, and the software grows to support the ones that
          work.
        </p>
      </section>

      <section className={styles.section}>
        <h2>v0 — the iPad we already had</h2>
        <div className={styles.split}>
          <StoryFigure
            src="/story/v0-ipad-booth.jpg"
            alt="First version: an iPad on a pole running the booth as a web app, at an outdoor evening event"
            caption="October 2025. An iPad clamped to a pole, running the booth as a web app."
          />
          <div>
            <p>
              The first booth was an iPad we already owned, clamped to a pole, running the booth
              as a web app. No custom hardware, no budget. The only question was: will people pay
              for this, and will guests actually use it?
            </p>
            <p>
              They did, and the events immediately surfaced problems that don&apos;t exist in
              normal backend work:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Venues with no internet.</strong> Gardens, ranches and halls with no
                signal, and the photos still have to reach every guest&apos;s phone.
              </li>
              <li>
                <strong>Hardware in the loop.</strong> Printers, lighting and the device itself
                fail in front of paying clients. Failure handling stops being theoretical when a
                printer jams in the middle of a wedding.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>v1 — a real enclosure</h2>
        <p>
          Not everything was software. As the booth software improved, so did everything around
          it: we designed and built a wooden enclosure, and kept improving the backdrops and the
          overall presentation. In this business the product is the whole experience, not the
          app.
        </p>
        <div className={styles.pair}>
          <LoopVideo
            src="/story/enclosure.mp4"
            poster="/story/v1-enclosure.jpg"
            label="Custom wooden enclosure with the Brillipoint logo on the front"
            caption="The wooden enclosure we designed and built."
          />
          <StoryFigure
            src="/story/v1-enclosure-backdrop.jpg"
            alt="The painted enclosure set up at a venue in front of a draped red backdrop"
            caption="Enclosure and backdrop, set up at a venue."
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="story-flow">
        <h2 id="story-flow">The flow guests actually see</h2>
        <p>
          One baby shower, end to end: booth → QR code → a gallery themed for that event, with the
          name, the date, the colors and the typography.
        </p>
        <div className={styles.flow}>
          <LoopVideo
            src="/story/booth-in-use.mp4"
            poster="/story/booth-countdown.jpg"
            label="Guests use the wooden booth at a baby shower: countdown, photo and the themed result"
            caption="1 · The booth, at a real baby shower"
          />
          <LoopVideo
            src="/story/booth-result.mp4"
            poster="/story/booth-result.jpg"
            label="The booth app on the iPad: welcome screen, two photos framed with the event's theme, then the result with the QR to download, share or print"
            caption="2 · The photo, framed with the same theme as the event"
          />
          <LoopVideo
            src="/story/gallery-babyshower.mp4"
            poster="/story/gallery-babyshower-hero.jpg"
            label="Scrolling the same baby shower's gallery: intro animation, name, date and every themed photo"
            caption="3 · The gallery guests open from the QR"
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="story-themes">
        <h2 id="story-themes">Galleries 100% configurable, adapted to each event&apos;s theme</h2>
        <p>
          No gallery is designed by hand. The name, the date, the colors, the typography, the
          frames, the intro and the cover photos all come from the event&apos;s theme. The booth
          inherits that same theme, so the screen guests pose in front of, the printed photo and
          the gallery on their phone feel like one experience: a 360 of the event, not three
          separate products.
        </p>
        <div className={`${styles.pair} ${styles.narrow}`}>
          <LoopVideo
            src="/story/gallery-quince.mp4"
            poster="/story/gallery-quince-hero.jpg"
            label="Scrolling a birthday gallery: the guest of honor's name and date, the booking section and every themed photo"
            caption="A birthday, with its own theme."
          />
          <StoryFigure
            src="/story/gallery-wedding.jpg"
            alt="Wedding gallery demo whose cover is a collage of the couple's own photos with the event's illustrations"
            caption="A wedding demo, with the couple's own photos as the cover."
          />
        </div>
        <p className={styles.spaced}>
          Under the hood it is one contract: four surfaces read the same{" "}
          <strong>theme definition</strong>, owned by the API. Change the theme once, and the booth
          screen, the printed photo and the phone gallery all match.
        </p>
        <ArchitectureDiagram />
      </section>

      <section className={styles.section}>
        <h2>Built to work with no internet</h2>
        <p>
          The rule is simple: <strong>the guest&apos;s photo never waits for the network</strong>.
          Taking photos, printing them and keeping them safe all work with zero signal. Only the
          gallery needs internet, and it catches up on its own.
        </p>
        <OfflineDiagram />
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>The event lives on the iPad</h3>
            <p>
              Before the event starts, the booth downloads everything it needs to run it: the
              theme, the frames, the event itself. A session at a ranch with no signal works the
              same as one in a city hall.
            </p>
          </div>
          <div className={styles.card}>
            <h3>A queue that never blocks the line</h3>
            <p>
              Each photo is saved locally and queued, and a background worker uploads it. The next
              guest is already posing while the previous photo is still waiting for a connection.
            </p>
          </div>
          <div className={styles.card}>
            <h3>Printing over our own network</h3>
            <p>
              We never depend on the venue&apos;s Wi-Fi. The booth and a Mac running the print
              service share a mobile hotspot we bring to every event; the booth finds the print
              service through Bonjour and sends the print there, with no internet involved.
            </p>
          </div>
          <div className={styles.card}>
            <h3>Retries that don&apos;t drain the battery</h3>
            <p>
              Failures are classified. No network pauses the queue and waits longer each time
              without ever giving up on the photo. Server rejections and server errors each get
              their own limited budget. Backing off instead of retrying in a loop keeps the radio,
              and the battery, quiet at a venue with no signal.
            </p>
          </div>
        </div>
      </section>

      <KeepsakesSection />

      <section className={styles.section}>
        <h2>Turning the most emotional moment into a sales channel</h2>
        <div className={styles.split}>
          <StoryFigure
            src="/story/gallery-booking-cta.jpg"
            alt="Gallery section asking guests if the next photos could be theirs, with a WhatsApp booking button"
          />
          <div>
            <p>
              The best moment of the night isn&apos;t at the booth. It&apos;s later, when a guest
              opens the gallery and finds their own photo. That&apos;s where the offer lives: a
              gift for the guest, &ldquo;what if the next photos are yours?&rdquo; with a button
              to book a date over WhatsApp, and our social links.
            </p>
            <p>
              The gallery is the delivery channel and{" "}
              <strong>the acquisition channel at the same time</strong>: every event we cover puts
              our product in dozens of guests&apos; phones.
            </p>
            <p>
              It started with a number: <strong>about 40% of guests open their photos after the
              event</strong>. Once we knew the gallery was actually being used, we turned it into a
              sales page. Now we&apos;re measuring where the call to action converts best, and
              after which action.
            </p>
            <p>
              The copy, the placement and the offer change all the time, so the galleries send
              their own events per event: downloads, shares, the gift being opened, WhatsApp
              clicks right after a download, social clicks. Each change is an experiment with a
              number attached, not a guess.
            </p>
          </div>
        </div>
      </section>

      <OperatorsSection />

      <section className={styles.section}>
        <h2>The loop I work in</h2>
        <p>Running the business is the job description of a product engineer, every weekend:</p>
        <ol className={styles.loop}>
          {loop.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <SaasSection />

      <BuildSection />

      <section className={styles.section}>
        <h2>Where it&apos;s going</h2>
        <ul className={styles.list}>
          <li>
            <strong>B2C</strong> — birthdays, weddings, baby showers, quinceañeras.
          </li>
          <li>
            <strong>B2B: activations</strong> — brands and businesses using the booth at their
            events.
          </li>
          <li>
            <strong>B2B: other photobooth operators</strong> — our galleries as a product of their
            own, sold to the operators we talk to. The one that came up without planning it.
          </li>
        </ul>
      </section>

      <RoadmapSection />

      <footer className={styles.footer}>
        <p>
          Happy to walk through any part of this live — the offline sync, the theme system, or
          the sales model.
        </p>
      </footer>
    </article>
  </div>
);
