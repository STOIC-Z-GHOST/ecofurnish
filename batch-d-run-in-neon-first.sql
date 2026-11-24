-- Batch D — product options (colors / sizes) with their own stock and price.
-- Run this in the Neon SQL editor BEFORE deploying the matching code.
-- Safe to run more than once.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS product_variants (
  id          text PRIMARY KEY,
  product_id  text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       text NOT NULL DEFAULT '',
  size        text NOT NULL DEFAULT '',
  price_delta numeric(10,2) NOT NULL DEFAULT 0.00,
  stock       integer NOT NULL DEFAULT 0,
  image_url   text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants (product_id);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id    text,
  ADD COLUMN IF NOT EXISTS variant_label text;
