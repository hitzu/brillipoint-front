import { ZoomableImage } from "./ZoomableImage";
import styles from "../story.module.css";

export type Shot = { src: string; alt: string; caption?: string };

export const StoryFigure = ({ src, alt, caption }: Shot) => (
  <figure>
    <ZoomableImage className={styles.photo} src={src} alt={alt} />
    {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
  </figure>
);
