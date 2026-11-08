import { useReducedMotion } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

export { useReducedMotion };
export type { Transition, Variants };

/** Shared easing for Imaro motion: calm, never bouncy. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Views that must render instantly when the guest prefers reduced motion. */
export const reduced = { duration: 0 } satisfies Transition;
