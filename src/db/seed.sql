-- Illustrative content: addresses, phone numbers and photos are placeholders.

INSERT INTO branches (slug, name, description, address, city, lat, lng, phone, email, star_rating) VALUES
('polokwane', 'Stillmere Polokwane',
 'Our home branch in Limpopo''s capital: a calm base close to the city''s offices, venues and weekend plans.',
 '12 Landdros Mare Street, Polokwane Central, 0699', 'Polokwane', -23.904500, 29.468900,
 '+27 15 000 0001', 'polokwane@stillmere.example', 4),
('pretoria', 'Stillmere Pretoria',
 'A quiet stay in the capital, close to the Church Street corridor and the city''s business districts.',
 '88 Church Street, Pretoria Central, 0002', 'Pretoria', -25.747900, 28.229300,
 '+27 12 000 0002', 'pretoria@stillmere.example', 4),
('sandton', 'Stillmere Sandton',
 'Settle in beside Johannesburg''s business hub, with easy access to the Gautrain, meetings and concerts.',
 '21 Rivonia Road, Sandton, 2196', 'Johannesburg', -26.107600, 28.056700,
 '+27 11 000 0003', 'sandton@stillmere.example', 5);

-- Same placeholder photos for every branch; swap per branch later.
INSERT INTO branch_images (branch_id, url, alt, sort_order)
SELECT b.id, i.url, i.alt, i.sort_order
FROM branches b
CROSS JOIN (VALUES
  ('https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2200&q=85', 'Stillmere Hotel exterior and pool at dusk', 1),
  ('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=85', 'Warm restaurant dining room set for evening service', 2),
  ('https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=85', 'Classic guest room with white linen and warm timber furnishings', 3)
) AS i(url, alt, sort_order);

-- Amenities
INSERT INTO amenities (name, icon, scope) VALUES
  ('Free Wi-Fi', 'wifi', 'hotel'),
  ('Breakfast included', 'coffee', 'hotel'),
  ('Restaurant', 'utensils', 'hotel'),
  ('Secure parking', 'car', 'hotel'),
  ('Air conditioning', 'snowflake', 'hotel'),
  ('24-hour reception', 'bell-ring', 'hotel'),
  ('Swimming pool', 'waves', 'hotel'),
  ('Workspace', 'laptop', 'room'),
  ('Tea & coffee station', 'cup-soda', 'room'),
  ('Espresso station', 'coffee', 'room'),
  ('Lounge area', 'sofa', 'room'),
  ('Separate living room', 'sofa', 'room'),
  ('Bathrobes', 'shirt', 'room'),
  ('Daily housekeeping', 'sparkles', 'room');

INSERT INTO branch_amenities (branch_id, amenity_id)
SELECT b.id, a.id FROM branches b CROSS JOIN amenities a WHERE a.scope = 'hotel';

-- Room types
INSERT INTO room_types (slug, name, tag, description, bed, size_m2, capacity, base_price) VALUES
('classic', 'Classic Room', 'YOUR EVERYDAY ESCAPE',
 'Soft linen, warm oak and a quiet corner to call your own. Everything you need for an unhurried stay.',
 'Queen bed', 28, 2, 1250),
('deluxe', 'Deluxe Room', 'A LITTLE MORE ROOM',
 'Stretch out in a light-filled room with a king bed, a generous seating area and thoughtful details.',
 'King bed', 38, 2, 1480),
('suite', 'Suite', 'MAKE YOURSELF AT HOME',
 'Space for slow mornings and shared moments. A separate living area makes a longer stay feel effortless.',
 'King bed + sofa bed', 58, 4, 2050);

INSERT INTO room_type_images (room_type_id, url, alt, sort_order)
SELECT rt.id, i.url, i.alt, i.sort_order
FROM (VALUES
  ('classic', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=85', 'Classic guest room with white linen and warm timber furnishings', 1),
  ('classic', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1800&q=85', 'Quiet hotel bedroom seating area in warm natural tones', 2),
  ('classic', 'https://images.unsplash.com/photo-1587985064135-0366536eab42?auto=format&fit=crop&w=1800&q=85', 'Bright hotel bathroom with stone finishes', 3),
  ('deluxe',  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1800&q=85', 'Deluxe guest room with king bed and soft neutral furnishings', 1),
  ('deluxe',  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1800&q=85', 'Sunlit deluxe room with upholstered seating', 2),
  ('deluxe',  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1800&q=85', 'Hotel room reading corner beside a large window', 3),
  ('suite',   'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=85', 'Suite with separate lounge and king bed', 1)
) AS i(type_slug, url, alt, sort_order)
JOIN room_types rt ON rt.slug = i.type_slug;

INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM (VALUES
  ('classic', 'Workspace'), ('classic', 'Tea & coffee station'), ('classic', 'Daily housekeeping'),
  ('deluxe',  'Workspace'), ('deluxe',  'Espresso station'),     ('deluxe',  'Lounge area'),
  ('suite',   'Separate living room'), ('suite', 'Espresso station'), ('suite', 'Bathrobes'), ('suite', 'Lounge area')
) AS m(type_slug, amenity_name)
JOIN room_types rt ON rt.slug = m.type_slug
JOIN amenities a ON a.name = m.amenity_name;

-- Per-branch pricing (VAT included)
INSERT INTO branch_room_types (branch_id, room_type_id, price_per_night)
SELECT b.id, rt.id, p.price
FROM (VALUES
  ('polokwane', 'classic', 1250), ('polokwane', 'deluxe', 1480), ('polokwane', 'suite', 2050),
  ('pretoria',  'classic', 1350), ('pretoria',  'deluxe', 1580), ('pretoria',  'suite', 2200),
  ('sandton',   'classic', 1450), ('sandton',   'deluxe', 1680), ('sandton',   'suite', 2350)
) AS p(branch_slug, type_slug, price)
JOIN branches b ON b.slug = p.branch_slug
JOIN room_types rt ON rt.slug = p.type_slug;

-- Physical rooms: 6 Classic (101-106), 4 Deluxe (201-204), 2 Suites (301-302) per branch
INSERT INTO rooms (branch_id, room_type_id, room_number)
SELECT b.id, rt.id, (v.floor * 100 + g)::text
FROM branches b
CROSS JOIN (VALUES ('classic', 1, 6), ('deluxe', 2, 4), ('suite', 3, 2)) AS v(type_slug, floor, qty)
JOIN room_types rt ON rt.slug = v.type_slug
CROSS JOIN LATERAL generate_series(1, v.qty) AS g;

-- Policies (same for every branch for now)
INSERT INTO policies (branch_id, type, title, body, sort_order)
SELECT b.id, p.type, p.title, p.body, p.sort_order
FROM branches b
CROSS JOIN (VALUES
  ('house_rules',  'Check-in and check-out', 'Check-in from 14:00 and check-out by 10:00.', 1),
  ('house_rules',  'Smoking', 'Stillmere is a non-smoking hotel.', 2),
  ('cancellation', 'Cancellation', 'Cancel free until 14:00 SAST two days before check-in. After that, the first night is charged.', 3),
  ('payment',      'Prices and payment', 'Room prices include 15% VAT. There are no additional checkout charges.', 4)
) AS p(type, title, body, sort_order);