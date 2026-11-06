export const INSERT_REVIEW = `INSERT INTO reviews (booking_id,rating,comment) VALUES ($1,$2,$3)
  RETURNING id,rating,comment,to_char(created_at,'YYYY-MM-DD') AS "createdAt"`;
  
export const LIST_REVIEWS = `WITH matched AS (
  SELECT r.id,r.rating,r.comment,to_char(r.created_at,'YYYY-MM-DD') AS "createdAt",
    split_part(trim(b.guest_name),' ',1) AS "firstName"
  FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.branch_id=$1
), page AS (SELECT * FROM matched ORDER BY id DESC LIMIT $2 OFFSET $3)
SELECT (SELECT count(*)::int FROM matched) AS total,
  COALESCE((SELECT json_agg(page ORDER BY id DESC) FROM page),'[]'::json) AS data`;
