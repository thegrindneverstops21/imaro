import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setFavorites } from "../../app/store";
import { json, message, request } from "../../lib/api";
import { displayBrand } from "../../lib/format";
import { REMOVE_SAVED, SAVED_STAYS } from "../../lib/labels";
import type { Branch } from "../../types/api";
import { AccountState } from "./AccountState";
import { useAccountData } from "./useAccountData";

type CardProps = {
  branch: Branch;
  disabled: boolean;
  onRemove: (slug: string) => void;
};

function SavedCard({ branch, disabled, onRemove }: CardProps) {
  const slug = encodeURIComponent(branch.slug);
  return (
    <article className="panel">
      <h3>{displayBrand(branch.name)}</h3>
      <p>{branch.city}</p>
      <Link to={`/rooms?branch=${slug}`}>Explore rooms</Link>{" "}
      <Link to={`/hotel?branch=${slug}`}>Hotel information</Link>{" "}
      <button
        type="button"
        className="text-button"
        disabled={disabled}
        onClick={() => onRemove(branch.slug)}
      >
        {REMOVE_SAVED}
      </button>
    </article>
  );
}

export function SavedStays() {
  const { data, error, reload } = useAccountData<Branch[]>("/me/favourites");
  const dispatch = useDispatch();
  const [removing, setRemoving] = useState("");
  const [failure, setFailure] = useState("");

  async function remove(slug: string) {
    setRemoving(slug);
    setFailure("");
    try {
      await request(
        `/me/favourites/${encodeURIComponent(slug)}`,
        json("DELETE"),
      );
      const remaining = (data ?? []).filter((branch) => branch.slug !== slug);
      dispatch(setFavorites(remaining.map((branch) => branch.slug)));
      reload();
    } catch (cause) {
      setFailure(message(cause));
    } finally {
      setRemoving("");
    }
  }

  return (
    <section className="account-section" aria-labelledby="saved-stays-title">
      <h2 id="saved-stays-title">{SAVED_STAYS}</h2>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <AccountState
        data={data}
        error={error}
        loadingLabel="Loading saved stays…"
        empty={
          <p>
            Nothing saved yet. Save a location from the{" "}
            <Link to="/rooms">rooms page</Link> and it will appear here.
          </p>
        }
        onRetry={reload}
      >
        {(branches) => (
          <div className="account-list">
            {branches.map((branch) => (
              <SavedCard
                key={branch.slug}
                branch={branch}
                disabled={Boolean(removing)}
                onRemove={(slug) => void remove(slug)}
              />
            ))}
          </div>
        )}
      </AccountState>
    </section>
  );
}
