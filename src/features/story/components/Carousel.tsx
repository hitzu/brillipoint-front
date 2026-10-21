import { ZoomableImage } from "./ZoomableImage";
import styles from "../story.module.css";

export type Slide = { title: string; src: string; alt: string; caption: string };

type CarouselProps = { label: string; slides: Slide[]; wide?: boolean };

/** Native horizontal scroll with snap: swipe on phones, scroll or tab on desktop. */
export const Carousel = ({ label, slides, wide = false }: CarouselProps) => (
  <ul
    className={`${styles.carousel} ${wide ? styles.carouselWide : ""}`}
    aria-label={`${label} carousel`}
    tabIndex={0}
  >
    {slides.map((slide) => (
      <li key={slide.title} className={styles.slide}>
        <figure>
          <ZoomableImage className={styles.photo} src={slide.src} alt={slide.alt} />
          <figcaption className={styles.slideText}>
            <h3>{slide.title}</h3>
            <p>{slide.caption}</p>
          </figcaption>
        </figure>
      </li>
    ))}
  </ul>
);
