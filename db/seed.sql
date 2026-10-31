INSERT INTO users (name, email, password_hash)
VALUES ('Seed User', 'seed@example.com', 'not-a-real-hash');

WITH places (idx, city, locality) AS (
  VALUES
    (0, 'mumbai', 'Andheri West'), (1, 'mumbai', 'Bandra East'), (2, 'mumbai', 'Powai'), (3, 'mumbai', 'Juhu'), (4, 'mumbai', 'Worli'),
    (5, 'mumbai', 'Colaba'), (6, 'mumbai', 'Malad'), (7, 'mumbai', 'Borivali'), (8, 'mumbai', 'Goregaon'), (9, 'mumbai', 'Kandivali'),
    (10, 'pune', 'Baner'), (11, 'pune', 'Hinjewadi'), (12, 'pune', 'Kothrud'), (13, 'pune', 'Viman Nagar'), (14, 'pune', 'Wakad'),
    (15, 'pune', 'Hadapsar'), (16, 'pune', 'Aundh'), (17, 'pune', 'Magarpatta'), (18, 'pune', 'Koregaon Park'), (19, 'pune', 'Pimple Saudagar'),
    (20, 'bengaluru', 'Koramangala'), (21, 'bengaluru', 'Whitefield'), (22, 'bengaluru', 'Indiranagar'), (23, 'bengaluru', 'Jayanagar'), (24, 'bengaluru', 'HSR Layout'),
    (25, 'bengaluru', 'Marathahalli'), (26, 'bengaluru', 'Electronic City'), (27, 'bengaluru', 'Hebbal'), (28, 'bengaluru', 'Yelahanka'), (29, 'bengaluru', 'Sarjapur Road'),
    (30, 'delhi', 'Dwarka'), (31, 'delhi', 'Rohini'), (32, 'delhi', 'Saket'), (33, 'delhi', 'Vasant Kunj'), (34, 'delhi', 'Lajpat Nagar'),
    (35, 'delhi', 'Karol Bagh'), (36, 'delhi', 'Janakpuri'), (37, 'delhi', 'Pitampura'), (38, 'delhi', 'Greater Kailash'), (39, 'delhi', 'Mayur Vihar')
)
INSERT INTO properties (owner_id, slug, title, city, locality, type, price, bedrooms)
SELECT
  (SELECT id FROM users WHERE email = 'seed@example.com'),
  'listing-' || n,
  'Listing ' || n,
  places.city,
  places.locality,
  (ARRAY['apartment', 'villa', 'plot', 'commercial'])[1 + floor(random() * 4)::int]::property_type,
  (1000000 + random() * 50000000)::bigint,
  floor(random() * 6)::smallint
FROM generate_series(1, 50000) AS n
JOIN places ON places.idx = n % 40;

-- Bulk inserts sit in the GIN pending list, which makes the planner avoid this index until flushed.
SELECT gin_clean_pending_list('idx_locality_trgm');

ANALYZE properties;
