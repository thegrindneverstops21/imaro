CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS availability_notifications (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, email)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_address_line1 TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_province TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_country TEXT;

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Imaro Administrator',
  'admin@imaro.local',
  'scrypt:b58cb1c628cb4b32957326f168af9e56:d0b925d6583ad5ed910ead270d75ee124c06ab5f53608c6a237e8b717318695cac74bf721043390624719ffb9ed5168342247a007e0d7322674d6734dc6531e4',
  'admin'
)
ON CONFLICT (lower(email)) DO NOTHING;

CREATE TABLE IF NOT EXISTS review_reactions (
  review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);
