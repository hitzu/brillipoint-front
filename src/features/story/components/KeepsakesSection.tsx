import { Carousel, type Slide } from "./Carousel";
import styles from "../story.module.css";

const slides: Slide[] = [
  {
    title: "Print server",
    src: "/story/print-server.jpg",
    alt: "Print server dashboard during an event: automatic printing, nothing printing now and no pending jobs",
    caption: "A Python service on a Mac drives the dye-sublimation printer, with a live queue the team can pause or recover from.",
  },
  {
    title: "Template system",
    src: "/story/template-designer.jpg",
    alt: "Template designer listing a wedding book keychain template and a mini polaroid template, both published",
    caption: "Print layouts are templates edited in the browser, with the printer's safe margins drawn as guides.",
  },
  {
    title: "Polaroid photos",
    src: "/story/keepsakes-polaroid.jpg",
    alt: "A photo keychain, a polaroid print and a card with the couple's names, the date and a QR to download the digital session",
    caption: "The same session as a polaroid, a keychain and a card with the QR back to the digital gallery.",
  },
  {
    title: "Minibook",
    src: "/story/keepsakes-minibook.jpg",
    alt: "A small glitter photo album open on two prints from a birthday party",
    caption: "A small printed book of one guest's photos.",
  },
];

export const KeepsakesSection = () => (
  <section className={styles.section} aria-labelledby="story-keepsakes">
    <h2 id="story-keepsakes">Prints and keepsakes</h2>
    <p>
      The gallery is half of what guests take home. The other half is paper, and it runs on its
      own stack next to the booth.
    </p>
    <p>
      Owning that stack gives us <strong>total control over the design</strong>, so we can
      experiment with new print formats: keychains, polaroids, minichicks, minibooks and whatever
      the next event asks for.
    </p>
    <Carousel label="Prints and keepsakes" slides={slides} />
  </section>
);
