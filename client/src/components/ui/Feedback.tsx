import { message } from "../../lib/api";
import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Icon } from "../Icon";
import { EASE } from "../../lib/motion";

export type FeedbackTone = "success" | "info" | "warning" | "error";

type Toast = {
  id: number;
  tone: FeedbackTone;
  title: string;
  message?: string;
};

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type FeedbackContextValue = {
  notify: (tone: FeedbackTone, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

type IconName = ComponentProps<typeof Icon>["name"];

const TONE_META: Record<FeedbackTone, { icon: IconName; label: string }> = {
  success: { icon: "checkCircle", label: "Success" },
  info: { icon: "infoCircle", label: "Information" },
  warning: { icon: "alertTriangle", label: "Warning" },
  error: { icon: "alertCircle", label: "Error" },
};

let nextToastId = 0;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const confirmation = useRef<((value: boolean) => void) | null>(null);
  const descriptionId = useId();
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
      confirmation.current?.(false);
      confirmation.current = null;
    };
  }, []);

  const pause = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  };

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (tone: FeedbackTone, title: string, message?: string) => {
      const id = ++nextToastId;
      setToasts((current) => [
        ...current.slice(-3),
        { id, tone, title, message },
      ]);
      timers.current.set(
        id,
        setTimeout(
          () => dismiss(id),
          tone === "error" || tone === "warning" ? 7000 : 5000,
        ),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    function rejected(event: PromiseRejectionEvent) {
      if (
        event.reason instanceof DOMException &&
        event.reason.name === "AbortError"
      )
        return;
      notify(
        "error",
        "We couldn't complete that action",
        message(event.reason),
      );
    }
    window.addEventListener("unhandledrejection", rejected);
    return () => window.removeEventListener("unhandledrejection", rejected);
  }, [notify]);

  const confirm = useCallback((options: ConfirmOptions) => {
    // A second click must not replace a decision or leave its promise unresolved.
    if (confirmation.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      confirmation.current = resolve;
      setPending({ options, resolve });
    });
  }, []);

  function settleConfirm(value: boolean) {
    confirmation.current?.(value);
    confirmation.current = null;
    setPending(null);
  }

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      <div className="feedback-toasts" aria-label="Notifications">
        <AnimatePresence>
          {toasts.map((toast) => {
            const meta = TONE_META[toast.tone];
            return (
              <motion.div
                key={toast.id}
                className={`feedback-toast feedback-toast-${toast.tone}`}
                role={toast.tone === "error" ? "alert" : "status"}
                aria-atomic="true"
                onMouseEnter={() => pause(toast.id)}
                onFocus={() => pause(toast.id)}
                onMouseLeave={(event) => {
                  if (!event.currentTarget.contains(document.activeElement)) {
                    pause(toast.id);
                    timers.current.set(
                      toast.id,
                      setTimeout(() => dismiss(toast.id), 5000),
                    );
                  }
                }}
                onBlur={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget) &&
                    !event.currentTarget.matches(":hover")
                  ) {
                    pause(toast.id);
                    timers.current.set(
                      toast.id,
                      setTimeout(() => dismiss(toast.id), 5000),
                    );
                  }
                }}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <span className="feedback-toast-icon" aria-hidden="true">
                  <Icon name={meta.icon} />
                </span>
                <div className="feedback-toast-body">
                  <strong>{toast.title}</strong>
                  {toast.message && <span>{toast.message}</span>}
                </div>
                <button
                  type="button"
                  className="feedback-toast-close"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(toast.id)}
                >
                  <Icon name="close" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <Modal
        isOpen={pending !== null}
        isDismissable={false}
        hideCloseButton
        backdrop="opaque"
        classNames={{
          base: "confirmation-dialog",
          backdrop: "confirmation-backdrop",
        }}
        aria-describedby={descriptionId}
        onOpenChange={(open) => {
          if (!open) settleConfirm(false);
        }}
        placement="center"
        size="sm"
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h2>{pending?.options.title}</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <p id={descriptionId} className="feedback-confirm-message">
              {pending?.options.message}
            </p>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="button button-quiet"
              autoFocus
              onClick={() => settleConfirm(false)}
            >
              {pending?.options.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              className={`button${pending?.options.danger ? " feedback-confirm-danger" : ""}`}
              onClick={() => settleConfirm(true)}
            >
              {pending?.options.confirmLabel ?? "Confirm"}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context)
    throw new Error("useFeedback must be used within FeedbackProvider");
  return context;
}
