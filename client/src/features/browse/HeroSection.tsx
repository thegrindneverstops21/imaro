import type { Ref } from "react";

type HeroSectionProps = {
  image?: string;
  imageAlt: string;
  caption: string;
  heroRef: Ref<HTMLElement>;
};

export function HeroSection({ image, imageAlt, caption, heroRef }: HeroSectionProps) {
  return (
    <section className="hero imaro-hero" ref={heroRef}>
      {image && <div className="hero-image">
        <img key={image} src={image} alt={imageAlt} draggable={false} fetchPriority="high" decoding="async" />
      </div>}
      <div className="hero-copy">
        <h1>Stay a<br />little longer.</h1>
        <p>Discover Imaro. Find your room, choose your dates, and make yourself at home.</p>
        <a className="button" href="#book" draggable={false}>Find your stay</a>
      </div>
      <div className="hero-caption">{caption}</div>
    </section>
  );
}
