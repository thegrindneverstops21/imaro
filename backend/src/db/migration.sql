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

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Imaro Administrator',
  'admin@imaro.local',
  'scrypt:b58cb1c628cb4b32957326f168af9e56:d0b925d6583ad5ed910ead270d75ee124c06ab5f53608c6a237e8b717318695cac74bf721043390624719ffb9ed5168342247a007e0d7322674d6734dc6531e4',
  'admin'
)
ON CONFLICT (lower(email)) DO NOTHING;
