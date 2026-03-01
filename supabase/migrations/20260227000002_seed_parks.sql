-- ============================================================
-- Migration 2: Seed parks
-- ============================================================

insert into public.parks (name, lat, lng, description) values
  ('Hollenbeck Park',       34.10202438, -117.89793372, 'Covina pickleball courts'),
  ('Leffingwell Ranch Park', 33.9396,    -117.9951,     null)
on conflict do nothing;
