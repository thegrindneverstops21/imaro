import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { useBlocker } from "react-router-dom";
import { useFeedback, type ConfirmOptions } from "./Feedback";

export const DISCARD_CHANGES: ConfirmOptions = {
  title: "Discard unsaved changes?",
  message:
    "Your changes have not been saved. Leaving will discard the edits on this screen.",
  confirmLabel: "Discard changes",
  cancelLabel: "Keep editing",
  danger: true,
};

type GuardContext = {
  register: (key: symbol, options: ConfirmOptions) => () => void;
  release: (key: symbol) => void;
  confirmLeave: () => Promise<boolean>;
  clear: () => void;
};
const Context = createContext<GuardContext | null>(null);

export function NavigationGuard({ children }: { children: ReactNode }) {
  const { confirm } = useFeedback();
  const entries = useRef(new Map<symbol, ConfirmOptions>());
  const deciding = useRef(false);
  const register = useCallback((key: symbol, options: ConfirmOptions) => {
    entries.current.set(key, options);
    return () => {
      entries.current.delete(key);
    };
  }, []);
  const release = useCallback((key: symbol) => {
    entries.current.delete(key);
  }, []);
  const clear = useCallback(() => entries.current.clear(), []);
  const confirmLeave = useCallback(async () => {
    const options = entries.current.values().next().value;
    if (!options) return true;
    return confirm(options);
  }, [confirm]);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      entries.current.size > 0 &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (blocker.state !== "blocked" || deciding.current) return;
    deciding.current = true;
    void confirmLeave().then((leave) => {
      deciding.current = false;
      if (leave) blocker.proceed();
      else blocker.reset();
    });
  }, [blocker, confirmLeave]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!entries.current.size) return;
      // Tab close/reload cannot display asynchronous custom UI.
      event.preventDefault();
      event.returnValue = "";
    }
    function externalLink(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href);
      if (
        url.origin === location.origin ||
        !["http:", "https:"].includes(url.protocol) ||
        !entries.current.size
      )
        return;
      event.preventDefault();
      void confirmLeave().then((leave) => {
        if (leave) {
          clear();
          window.location.assign(url.href);
        }
      });
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", externalLink);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", externalLink);
    };
  }, [clear, confirmLeave]);

  return (
    <Context.Provider value={{ register, release, confirmLeave, clear }}>
      {children}
    </Context.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(Context);
  if (!context) throw new Error("NavigationGuard is required");
  return context;
}

export function usePendingChanges(
  active: boolean,
  options: ConfirmOptions = DISCARD_CHANGES,
) {
  const { register, release } = useNavigationGuard();
  const key = useRef(Symbol());
  const { title, message, confirmLabel, cancelLabel, danger } = options;
  useLayoutEffect(() => {
    if (active)
      return register(key.current, {
        title,
        message,
        confirmLabel,
        cancelLabel,
        danger,
      });
  }, [active, register, title, message, confirmLabel, cancelLabel, danger]);
  return useCallback(() => release(key.current), [release]);
}

export function useDraftGuard(value: unknown) {
  const serialized = JSON.stringify(value);
  const baseline = useRef(serialized);
  const release = usePendingChanges(serialized !== baseline.current);
  return () => {
    baseline.current = serialized;
    release();
  };
}
