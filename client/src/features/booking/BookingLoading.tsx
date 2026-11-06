type Shape = "checkout" | "receipt";
type Props = { label?: string; shape?: Shape; embedded?: boolean };

const RECEIPT_ROWS = 6;

function Skeleton({ shape }: { shape: Shape }) {
  if (shape === "receipt")
    return (
      <div className="booking-skeleton receipt-skeleton" aria-hidden="true">
        <div>
          {Array.from({ length: RECEIPT_ROWS }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      </div>
    );
  return (
    <div className="booking-skeleton" aria-hidden="true">
      <div>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function BookingLoading({
  label = "Loading your reservation…",
  shape = "checkout",
  embedded = false,
}: Props) {
  const content = (
    <>
      <p>{label}</p>
      <Skeleton shape={shape} />
    </>
  );
  if (embedded)
    return (
      <div role="status" aria-busy="true">
        {content}
      </div>
    );
  const width = shape === "receipt" ? "page-shell narrow" : "page-shell";
  return (
    <section
      className={`${width} guest-checkout`}
      role="status"
      aria-busy="true"
    >
      {content}
    </section>
  );
}
