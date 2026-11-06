import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../types/api";

const STAFF_ROLE = "admin";
const SESSION_KEY = "imaro.session";

function Notice(props: { title: string; body: string; to: string; action: string }) {
  return (
    <section className="page-shell narrow guest-checkout">
      <h1>{props.title}</h1>
      <p>{props.body}</p>
      <Link className="button" to={props.to}>
        {props.action}
      </Link>
    </section>
  );
}

function CheckingAccess() {
  return (
    <section className="page-shell narrow guest-checkout">
      <h1>Staff access</h1>
      <p role="status">Checking your access…</p>
      <Link className="text-button" to="/login?next=%2Fadmin">
        Sign in with a different account
      </Link>
    </section>
  );
}

type Props = { user: User | null; children: ReactNode };

// Three honest states: not signed in, signed in without staff access, and staff.
export function StaffGate({ user, children }: Props) {
  if (user?.role === STAFF_ROLE) return <>{children}</>;
  if (user)
    return (
      <Notice
        title="This account doesn’t have staff access"
        body={`You’re signed in as ${user.email}. Ask a hotel administrator for staff access, or sign in with a different account.`}
        to="/"
        action="Back to home"
      />
    );
  // A stored session means /me is still being checked after a page reload.
  if (localStorage.getItem(SESSION_KEY)) return <CheckingAccess />;
  return (
    <Notice
      title="Staff sign-in required"
      body="Sign in with a staff account to manage reservations and hotel operations."
      to="/login?next=%2Fadmin"
      action="Sign in"
    />
  );
}