import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import type { User } from "../../types/api";
import { AccountTabs } from "./AccountTabs";

export function ProfilePage({
  user,
  onSignIn,
  saved = false,
}: {
  user: User | null;
  onSignIn: () => void;
  saved?: boolean;
}) {
  if (!user)
    return (
      <section className="page-shell narrow guest-checkout guest-account">
        <h1>Your Imaro account</h1>
        <p>
          Sign in or create an account with your email, or continue with
          Google. You can also manage a reservation with its reference and
          private manage token.
        </p>
        <button className="button" onClick={onSignIn}>
          Sign in or create an account
        </button>
        <p>
          <Link to="/manage">
            Find a booking using its reference <Icon name="arrowRight" />
          </Link>
        </p>
      </section>
    );
  return (
    <section className="page-shell narrow guest-checkout guest-account">
      <h1>Welcome, {user.name.split(" ")[0]}.</h1>
      <AccountTabs key={`${user.id}-${saved}`} user={user} saved={saved} />
    </section>
  );
}
