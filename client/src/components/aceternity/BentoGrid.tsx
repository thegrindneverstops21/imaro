import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "../../lib/motion";

type BentoGridProps = {
  children: ReactNode;
  className?: string;
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return <div className={`bento-grid${className ? ` ${className}` : ""}`}>{children}</div>;
}

type BentoCardProps = {
  children: ReactNode;
  className?: string;
};

/** Hotel-amenity card: lifts gently on hover, static under reduced motion. */
export function BentoCard({ children, className }: BentoCardProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`bento-card${className ? ` ${className}` : ""}`}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
