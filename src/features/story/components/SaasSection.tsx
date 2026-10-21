import { Carousel, type Slide } from "./Carousel";
import styles from "../story.module.css";

const slides: Slide[] = [
  {
    title: "Agenda",
    src: "/story/saas-agenda.jpg",
    alt: "Monthly agenda showing which hours of each day are already booked by events",
    caption:
      "Every event blocks its date and hours, so we never sell the same slot twice.",
  },
  {
    title: "Contracts",
    src: "/story/saas-contract.jpg",
    alt: "Contract form with a package, an extra linked to it, a gift checkbox and the payment summary",
    caption:
      "Packages, extras linked to them, gifts and payments, quoted the same way every time.",
  },
  {
    title: "Client booking page",
    src: "/story/saas-booking-page.jpg",
    alt: "Public booking page for the client with event dates, contracted services and payment history",
    caption:
      "Each client gets a public page with their dates, services, payments and terms.",
  },
  {
    title: "Brand manual",
    src: "/story/saas-brand-manual.jpg",
    alt: "Interactive brand manual with the Photobooth and Glitter Bar lines and their colors",
    caption:
      "Our brand manual lives in the same app, so every public piece, including this page, follows it.",
  },
];

export const SaasSection = () => (
  <section className={styles.section} aria-labelledby="story-saas">
    <h2 id="story-saas">The SaaS behind the booth</h2>
    <p>
      To run the business I built the internal side too: a sales model with a
      clear hierarchy — <strong>product → package → extras → promotions</strong>{" "}
      — so we can quote, combine and discount consistently, plus the booking,
      client and event management that the team uses to go from a sale to a
      finished event.
    </p>
    <Carousel label="The SaaS behind the booth" slides={slides} wide />
  </section>
);
