CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP TABLE IF EXISTS availability_notifications, password_reset_tokens, notifications, favourites, review_reactions, reviews, payments, booking_rooms, bookings, policies, rooms, branch_room_types, room_type_images, room_type_amenities, branch_amenities, amenities, room_types, branch_images, branches, users CASCADE;

-- ---------- Users ---------- 
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  google_id TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emails are compared case-insensitively: Bob@x.com and bob@x.com are the same account.
CREATE UNIQUE INDEX users_email_lower
ON users (lower(email));

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- ---------- Branches ---------- 
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  star_rating SMALLINT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  check_in_time TIME NOT NULL DEFAULT '14:00',
  check_out_time TIME NOT NULL DEFAULT '10:00',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX branches_city
ON branches (city);

CREATE TABLE availability_notifications (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, email)
);

CREATE TABLE branch_images (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- ---------- Amenities (scope: hotel-wide or in-room) ----------
-- `scope` = "hotel" means the whole property has it (pool, parking), "room" means a specific room type includes it (bathrobes, espresso machine).
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('hotel', 'room'))
);

CREATE TABLE branch_amenities (
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (branch_id, amenity_id)
);

-- ---------- Room types (shared) + per-branch pricing ----------
-- A room TYPE ("Deluxe") is shared by every branch; only its price differs per branch, which is why prices live in branch_room_types instead of here.
CREATE TABLE room_types (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tag TEXT,
  description TEXT NOT NULL,
  bed TEXT NOT NULL,
  size_m2 INT NOT NULL CHECK (size_m2 > 0),
  capacity INT NOT NULL CHECK (capacity > 0),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0)
);

CREATE TABLE room_type_images (
  id SERIAL PRIMARY KEY,
  room_type_id INT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE room_type_amenities (
  room_type_id INT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

-- Price per night (VAT included) for a room type at a branch 
CREATE TABLE branch_room_types (
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  room_type_id INT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
  PRIMARY KEY (branch_id, room_type_id)
);

-- ---------- Physical rooms ---------- 
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  room_type_id INT NOT NULL REFERENCES room_types(id),
  room_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  UNIQUE (branch_id, room_number)
);

CREATE INDEX rooms_branch_type
ON rooms (branch_id, room_type_id);

-- ---------- Policies (house rules, cancellation, payment) ---------- 
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('house_rules', 'cancellation', 'payment')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- ---------- Bookings ---------- 
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  branch_id INT NOT NULL REFERENCES branches(id),
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_province TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests SMALLINT NOT NULL CHECK (guests > 0),
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'pending_approval', 'confirmed', 'cancelled', 'completed', 'expired')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  access_token_hash TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX bookings_branch_dates
ON bookings (branch_id, check_in, check_out);

CREATE INDEX bookings_guest_email
ON bookings (lower(guest_email));

CREATE INDEX bookings_user
ON bookings (user_id);

-- One row per room IN a booking. The exclusion constraint makes double-booking impossible at the database level.
-- Set active = false on cancel/expire to free the room.

CREATE TABLE booking_rooms (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  room_id INT NOT NULL REFERENCES rooms(id),
  price_per_night NUMERIC(10, 2) NOT NULL,
  stay DATERANGE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT no_double_booking EXCLUDE USING gist (room_id WITH = , stay WITH &&) WHERE (active)
);

CREATE INDEX booking_rooms_booking
ON booking_rooms (booking_id);

-- ---------- Payments ---------- 
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'payfast',
  provider_ref TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed', 'refunded')),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Reviews, favourites, notifications ---------- 
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One "helpful" reaction per signed-in user per review; the row's existence is the reaction.
CREATE TABLE review_reactions (
  review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE favourites (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, branch_id)
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
