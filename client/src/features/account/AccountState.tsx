import type { ReactNode } from "react";

type FailureProps = { message: string; onRetry: () => void };

function Failure({ message, onRetry }: FailureProps) {
  return (
    <p className="form-error" role="alert">
      {message}{" "}
      <button type="button" className="text-button" onClick={onRetry}>
        Try again
      </button>
    </p>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true">
      <p>{label}</p>
      <div className="account-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

type Props<T> = {
  data: T[] | null;
  error: string;
  loadingLabel: string;
  empty: ReactNode;
  onRetry: () => void;
  children: (items: T[]) => ReactNode;
};

export function AccountState<T>({
  data,
  error,
  loadingLabel,
  empty,
  onRetry,
  children,
}: Props<T>) {
  if (error && !data) return <Failure message={error} onRetry={onRetry} />;
  if (!data) return <Loading label={loadingLabel} />;
  if (!data.length) return <>{empty}</>;
  return (
    <>
      {error && <Failure message={error} onRetry={onRetry} />}
      {children(data)}
    </>
  );
}
