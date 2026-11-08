export const INSERT_REVIEW = `INSERT INTO reviews (booking_id,rating,comment) VALUES ($1,$2,$3)
  RETURNING id,rating,comment,to_char(created_at,'YYYY-MM-DD') AS "createdAt"`;
  
export const LIST_REVIEWS = `WITH matched AS (
  SELECT r.id,r.rating,r.comment,to_char(r.created_at,'YYYY-MM-DD') AS "createdAt",
    split_part(trim(b.guest_name),' ',1) AS "firstName"
  FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.branch_id=$1
), page AS (SELECT * FROM matched ORDER BY id DESC LIMIT $2 OFFSET $3)
SELECT (SELECT count(*)::int FROM matched) AS total,
  COALESCE((SELECT json_agg(page ORDER BY id DESC) FROM page),'[]'::json) AS data`;

export const LIST_ALL_REVIEWS = `WITH matched AS (
  SELECT r.id,r.rating,r.comment,to_char(r.created_at,'YYYY-MM-DD') AS "createdAt",
    split_part(trim(bk.guest_name),' ',1) AS "firstName",
    br.slug AS "branchSlug", br.name AS "branchName",
    (SELECT count(*)::int FROM review_reactions rr WHERE rr.review_id=r.id) AS "helpfulCount",
    EXISTS(SELECT 1 FROM review_reactions rr WHERE rr.review_id=r.id AND rr.user_id=$3) AS "reacted"
  FROM reviews r
  JOIN bookings bk ON bk.id=r.booking_id
  JOIN branches br ON br.id=bk.branch_id
), page AS (SELECT * FROM matched ORDER BY id DESC LIMIT $1 OFFSET $2)
SELECT (SELECT count(*)::int FROM matched) AS total,
  (SELECT avg(rating)::float8 FROM matched) AS "ratingAverage",
  COALESCE((SELECT json_agg(page ORDER BY id DESC) FROM page),'[]'::json) AS data`;

export const REVIEW_EXISTS = `SELECT 1 FROM reviews WHERE id=$1`;

export const ADD_REACTION = `INSERT INTO review_reactions (review_id,user_id) VALUES ($1,$2)
  ON CONFLICT DO NOTHING RETURNING review_id`;

export const REMOVE_REACTION = `DELETE FROM review_reactions WHERE review_id=$1 AND user_id=$2`;

export const REACTION_COUNT = `SELECT count(*)::int AS count FROM review_reactions WHERE review_id=$1`;
