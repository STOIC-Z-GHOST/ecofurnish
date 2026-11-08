-- BATCH B — run this ONCE in the Neon SQL editor (the database your Vercel
-- app uses) BEFORE deploying batch-b-update. Safe to run twice.
-- Adds the tables for the editable pages and for guest admin access.

CREATE TABLE IF NOT EXISTS site_pages (
  slug       text PRIMARY KEY,
  title      text NOT NULL,
  body       text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now(),
  updated_by text
);

CREATE TABLE IF NOT EXISTS site_page_revisions (
  id       text PRIMARY KEY,
  slug     text NOT NULL,
  title    text NOT NULL,
  body     text NOT NULL,
  saved_at timestamp NOT NULL DEFAULT now(),
  saved_by text
);
CREATE INDEX IF NOT EXISTS site_page_revisions_slug_idx ON site_page_revisions (slug, saved_at);

CREATE TABLE IF NOT EXISTS admin_guests (
  email      text PRIMARY KEY,
  expires_at timestamp NOT NULL,
  granted_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  revoked_at timestamp
);
