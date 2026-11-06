import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

type Props = {
  title: string;
  busy: boolean;
  onSubmit: () => void;
  onDiscard: () => void;
  children: ReactNode;
};

// Inline editor shared by reservations, rooms and branches. It takes focus when
// it opens so keyboard and screen-reader users land on it.
export function RecordEditor({ title, busy, onSubmit, onDiscard, children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="admin-editor" onSubmit={submit}>
      <h2 ref={heading} tabIndex={-1}>
        {title}
      </h2>
      <fieldset disabled={busy}>
        {children}
        <div className="editor-actions">
          <button className="button">{busy ? "Saving…" : "Save changes"}</button>
          <button type="button" className="text-button" onClick={onDiscard}>
            Discard changes
          </button>
        </div>
      </fieldset>
    </form>
  );
}