import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../Icon";
import { EASE } from "../../lib/motion";

type ModernDatePickerProps = {
  label: string;
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  min?: string; // YYYY-MM-DD
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
};
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const monthLabel = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const dayLabel = (key: string) => {
  const { y, m, d } = parseKey(key);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Custom animated calendar picker emitting YYYY-MM-DD strings. */
export function ModernDatePicker({ label, value, onChange, min, className }: ModernDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [view, setView] = useState(() => {
    const base = value || min || "";
    return base ? parseKey(base) : parseKey(new Date().toISOString().slice(0, 10));
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const stopPortalPropagation = useCallback((node: HTMLDivElement | null) => {
    node?.addEventListener("pointerdown", (event) => event.stopPropagation());
  }, []);
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!open) return;
    const base = value || min || todayKey;
    setView(parseKey(base));
  }, [open, value, min, todayKey]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (target.closest?.(".modern-calendar")) return;
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

  function shiftMonth(step: number) {
    setView((current) => {
      const date = new Date(current.y, current.m - 1 + step, 1);
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: 1 };
    });
  }

  function pick(day: number) {
    const key = toKey(view.y, view.m, day);
    if (min && key < min) return;
    onChange(key);
    setOpen(false);
  }

  const firstWeekday = new Date(view.y, view.m - 1, 1).getDay();
  const totalDays = daysInMonth(view.y, view.m);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  return (
    <div ref={rootRef} className={`modern-select modern-datepicker${className ? ` ${className}` : ""}`}>
      <span className="modern-select-label" id={`${listId}-label`}>{label}</span>
      <button
        type="button"
        className="modern-select-trigger"
        aria-haspopup="dialog"
        aria-labelledby={`${listId}-label`}
        data-date-label={label}
        data-date-value={value}
        data-date-min={min}
        aria-expanded={open}
        aria-controls={listId}
        ref={triggerRef}
        onClick={() => {
          setOpen((state) => {
            if (!state) {
              const rect = triggerRef.current?.getBoundingClientRect();
              if (rect) {
                const width = Math.min(320, window.innerWidth - 24);
                const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
                setPos({ top: rect.bottom + 6, left, width });
              }
            }
            return !state;
          });
        }}
      >
        <span className={`modern-select-value${value ? "" : " is-placeholder"}`}>
          {value ? dayLabel(value) : "Select date"}
        </span>
        <Icon name="calendar" />
      </button>
      {open && pos && createPortal(
        <AnimatePresence>
          <motion.div
            id={listId}
            className="modern-calendar"
            role="dialog"
            aria-labelledby={`${listId}-label`}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            ref={stopPortalPropagation}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="modern-calendar-head">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                <Icon name="arrowLeft" />
              </button>
              <strong>{monthLabel(view.y, view.m)}</strong>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <Icon name="arrowRight" />
              </button>
            </div>
            <div className="modern-calendar-grid" role="grid">
              {WEEKDAYS.map((day) => (
                <span key={day} className="modern-calendar-weekday" role="columnheader">
                  {day}
                </span>
              ))}
              {cells.map((day, index) => {
                if (day === null) return <span key={`blank-${index}`} />;
                const key = toKey(view.y, view.m, day);
                const disabled = Boolean(min && key < min);
                const selected = key === value;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    aria-selected={selected}
                    aria-label={key}
                    disabled={disabled}
                    className={`modern-calendar-day${selected ? " selected" : ""}${isToday ? " today" : ""}`}
                    onClick={() => pick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
