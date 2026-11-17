-- BATCH C — run this ONCE in the Neon SQL editor (the database your Vercel
-- app uses) BEFORE deploying batch-c-update. Safe to run twice.
-- Adds the table for "access managers": people allowed to invite read-only
-- guests. (Batch B's admin_guests table must already exist.)
CREATE TABLE IF NOT EXISTS admin_delegates (
  email      text PRIMARY KEY,
  max_days   integer NOT NULL DEFAULT 7,
  max_active integer NOT NULL DEFAULT 5,
  created_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  revoked_at timestamp
);
