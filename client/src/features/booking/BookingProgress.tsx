const steps = ["Room details", "Guest details", "Review & payment", "Confirmation"];

export function BookingProgress({ current }: { current: number }) {
  return <ol className="booking-progress" aria-label="Booking progress">
    {steps.map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined}>
      <span aria-hidden="true">{index + 1}</span> {label}
    </li>)}
  </ol>;
}
