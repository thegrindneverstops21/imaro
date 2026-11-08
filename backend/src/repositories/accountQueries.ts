export const PROFILE = `SELECT id,name,email,phone,role FROM users WHERE id=$1`;

export const UPDATE_PROFILE = `UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone)
  WHERE id=$1 RETURNING id,name,email,phone,role`;

// A booking belongs to a guest if it is linked to their account OR was made with their email address while signed out.
export const MY_BOOKINGS = `SELECT b.reference FROM bookings b JOIN users u ON u.id=$1
  WHERE b.user_id=u.id OR lower(b.guest_email)=lower(u.email) ORDER BY b.created_at DESC,b.id DESC`;

export const FAVOURITES = `SELECT b.slug,b.name,b.city,
  (SELECT url FROM branch_images WHERE branch_id=b.id ORDER BY sort_order LIMIT 1) AS "imageUrl"
  FROM favourites f JOIN branches b ON b.id=f.branch_id WHERE f.user_id=$1 AND b.is_published ORDER BY b.name`;

export const SAVE_FAVOURITE = `INSERT INTO favourites (user_id,branch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`;

export const DELETE_FAVOURITE = `DELETE FROM favourites WHERE user_id=$1 AND branch_id=(SELECT id FROM branches WHERE slug=$2)`;

export const BRANCH_SOCIAL = `SELECT b.slug,
  COALESCE((SELECT avg(r.rating)::float8 FROM reviews r JOIN bookings bk ON bk.id=r.booking_id WHERE bk.branch_id=b.id),0) AS "ratingAverage",
  (SELECT count(*)::int FROM reviews r JOIN bookings bk ON bk.id=r.booking_id WHERE bk.branch_id=b.id) AS "reviewCount",
  EXISTS(SELECT 1 FROM favourites f WHERE f.branch_id=b.id AND f.user_id=$2) AS "isFavourite"
  FROM branches b WHERE b.slug=ANY($1::text[])`;
