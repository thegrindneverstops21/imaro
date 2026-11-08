import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main className="page-shell narrow">
      <h1>Privacy at Imaro</h1>
      <p>
        We collect the details needed to create and manage your account and
        reservation. We do not require a home address to create an account.
      </p>
      <p>
        Your booking contact details are used to communicate about your stay and
        are handled according to applicable data-protection requirements.
      </p>
      <Link className="button button-outline" to="/login">
        Return to sign in
      </Link>
    </main>
  );
}
