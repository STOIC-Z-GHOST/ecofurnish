-- Batch E: choose which products appear in the homepage "Featured products" row.
-- Run this in the Neon SQL editor BEFORE deploying the matching code.
-- Safe to run more than once.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
