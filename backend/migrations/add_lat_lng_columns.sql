-- Migration: Add lat and lng columns to listings table
-- Run this in your Supabase SQL editor

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- Optional: Add indexes for better query performance on geographical data
CREATE INDEX IF NOT EXISTS idx_listings_lat ON listings("lat");
CREATE INDEX IF NOT EXISTS idx_listings_lng ON listings("lng");

