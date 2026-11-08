import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "../../components/Icon";
import { json, message, request, requestPage } from "../../lib/api";
import { displayBrand, formatDate } from "../../lib/format";
import { signInLink } from "../../lib/authIntent";
import type { Review, ReviewReaction } from "../../types/api";
import type { RootState } from "../../app/store";

const PAGE_SIZE = 25;

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="review-stars"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= rating ? "on" : "off"}>
          <Icon name={value <= rating ? "star" : "starOff"} />
        </span>
      ))}
    </span>
  );
}

type CardProps = {
  review: Review;
  signedIn: boolean;
  busy: boolean;
  onReact: (review: Review) => void;
};

function ReviewCard({ review, signedIn, busy, onReact }: CardProps) {
  return (
    <article className="panel review-card">
      <Stars rating={review.rating} />
      {review.comment && <p className="review-comment">{review.comment}</p>}
      <p className="review-meta">
        {review.firstName} stayed at{" "}
        <Link to={`/hotel?branch=${encodeURIComponent(review.branchSlug)}`}>
          {displayBrand(review.branchName)}
        </Link>{" "}
        · {formatDate(review.createdAt)}
      </p>
      <button
        type="button"
        className={`text-button review-helpful${review.reacted ? " is-active" : ""}`}
        aria-pressed={review.reacted}
        disabled={busy}
        onClick={() => onReact(review)}
      >
        <Icon name="thumbsUp" />
        Helpful{review.helpfulCount > 0 ? ` · ${review.helpfulCount}` : ""}
      </button>
      {!signedIn && (
        <span className="small-note"> Sign in to react to reviews.</span>
      )}
    </article>
  );
}

export function ReviewsPage() {
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [meta, setMeta] = useState<{
    total: number;
    ratingAverage?: number | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(0);

  const load = useCallback(async (target: number) => {
    setError("");
    try {
      // One extra row tells us whether a next page exists without reading meta.total.
      const result = await requestPage<Review[]>(
        `/reviews?limit=${PAGE_SIZE + 1}&offset=${target * PAGE_SIZE}`,
      );
      setReviews(result.data);
      setMeta(result.meta);
    } catch (cause) {
      setError(message(cause));
    }
  }, []);

  useEffect(() => {
    setReviews(null);
    void load(page);
  }, [load, page]);

  async function react(review: Review) {
    if (!user) {
      navigate(signInLink("/reviews"));
      return;
    }
    setBusyId(review.id);
    try {
      const result = await request<ReviewReaction>(
        `/reviews/${review.id}/reactions`,
        json("POST"),
      );
      setReviews(
        (current) =>
          current?.map((item) =>
            item.id === review.id
              ? {
                  ...item,
                  reacted: result.reacted,
                  helpfulCount: result.helpfulCount,
                }
              : item,
          ) ?? current,
      );
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusyId(0);
    }
  }

  const hasNext = (reviews?.length ?? 0) > PAGE_SIZE;
  const shown = reviews?.slice(0, PAGE_SIZE) ?? [];

  return (
    <section className="page-shell reviews-page">
      <h1>Guest reviews</h1>
      <p>
        Honest notes from guests who have stayed with us. Reviews can be left
        from <Link to="/manage">Manage booking</Link> once a stay is over.
      </p>
      {meta && meta.total > 0 && (
        <p className="small-note">
          {meta.ratingAverage != null &&
            `Average rating ${meta.ratingAverage.toFixed(1)} · `}
          {meta.total} review{meta.total === 1 ? "" : "s"}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => void load(page)}
          >
            Try again
          </button>
        </p>
      )}
      {!reviews && !error && <p role="status">Loading reviews…</p>}
      {reviews && shown.length === 0 && (
        <div className="panel">
          <p>No reviews yet.</p>
          <p className="small-note">
            Reviews appear here after guests finish their stay and share their
            experience.
          </p>
        </div>
      )}
      <div className="account-list">
        {shown.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            signedIn={Boolean(user)}
            busy={busyId === review.id}
            onReact={(item) => void react(item)}
          />
        ))}
      </div>
      {(page > 0 || hasNext) && (
        <nav className="review-pagination" aria-label="Review pages">
          <button
            type="button"
            className="button button-outline"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            type="button"
            className="button button-outline"
            disabled={!hasNext}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
