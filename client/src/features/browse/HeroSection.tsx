import type { Ref } from "react";
import { Icon } from "../../components/Icon";

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
        <img key={image} src={image} alt={imageAlt} fetchPriority="high" decoding="async" />
      </div>}
      <div className="hero-copy">
        <h1>Stay a<br />little longer.</h1>
        <p>Discover Imaro. Find your room, choose your dates, and make yourself at home.</p>
        <a className="button" href="#book">Find your stay <Icon name="arrowDown" /></a>
      </div>
      <div className="hero-caption">{caption}</div>
    </section>
  );
}
