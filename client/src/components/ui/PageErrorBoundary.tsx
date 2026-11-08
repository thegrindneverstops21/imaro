import { Component, type ReactNode } from "react";

export class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="panel" role="alert">
        <h1>We couldn’t display this page</h1>
        <p>
          Something went wrong on our end. Please reload the page to try again.
          If you were making a payment, check your booking status before paying
          again.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload page
        </button>
        <a className="text-button" href="/manage">
          Find my booking
        </a>
      </main>
    );
  }
}
