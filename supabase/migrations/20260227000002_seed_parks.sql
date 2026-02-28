-- ============================================================
-- Migration 2: Seed parks
-- ============================================================

insert into public.parks (name, lat, lng, description) values
  ('Hollenbeck Park', 34.10202438, -117.89793372, 'Covina pickleball courts'),
  ('Elysian Park',    34.0781,     -118.2351,     'Great courts near Dodger Stadium'),
  ('Griffith Park',   34.1366,     -118.2942,     'Courts near the observatory')
on conflict do nothing;
