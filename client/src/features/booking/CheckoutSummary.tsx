import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../../components/Icon";
import { EASE } from "../../lib/motion";

type CheckoutSummaryProps = {
  title: ReactNode;
  children: ReactNode;
};

/** Collapsible stay/payment summary with an animated open/close transition. */
export function CheckoutSummary({ title, children }: CheckoutSummaryProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="checkout-summary">
      <button
        type="button"
        className="checkout-summary-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{title}</span>
        <Icon name="arrowDown" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="checkout-summary-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
