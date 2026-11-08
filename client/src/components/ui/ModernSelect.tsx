import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../Icon";
import { EASE } from "../../lib/motion";

export type SelectOption = {
  value: string;
  label: string;
};

type ModernSelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Modern animated dropdown: soft popover, keyboard navigation, Imaro styling. */
export function ModernSelect({ label, value, options, onChange, disabled, className }: ModernSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const stopPortalPropagation = useCallback((node: HTMLUListElement | null) => {
    node?.addEventListener("pointerdown", (event) => event.stopPropagation());
  }, []);
  const selected = options.find((option) => option.value === value);
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (target.closest?.(".modern-select-list")) return;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  function openList() {
    if (disabled) return;
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpen(true);
  }

  function choose(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
  }

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) openList();
      else if (event.key === "Enter" || event.key === " ") {
        if (activeOption) choose(activeOption);
      } else {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => (index + step + options.length) % options.length);
      }
    }
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (activeOption) choose(activeOption);
    }
  }

  return (
    <div ref={rootRef} className={`modern-select${className ? ` ${className}` : ""}`}>
      <span className="modern-select-label" id={`${listId}-label`}>{label}</span>
      <button
        type="button"
        className="modern-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="modern-select-value">{selected?.label ?? "Choose…"}</span>
        <Icon name="arrowDown" />
      </button>
      {open && pos && createPortal(
        <AnimatePresence>
          <motion.ul
            id={listId}
            className="modern-select-list"
            role="listbox"
            aria-labelledby={`${listId}-label`}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            ref={stopPortalPropagation}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={onListKeyDown}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`modern-select-option${index === activeIndex ? " active" : ""}${option.value === value ? " selected" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.value === value && <Icon name="arrowRight" />}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
