-- Migration: Create reviews table for user reviews on boardings
-- Run this in your Supabase SQL editor
-- 
-- IMPORTANT: Copy and paste this entire file into Supabase SQL Editor and run it

-- Drop table if exists (for clean migration - remove this line if you want to keep existing data)
-- DROP TABLE IF EXISTS reviews CASCADE;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT reviews_boarding_id_fkey FOREIGN KEY (boarding_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_boarding_user_unique UNIQUE(boarding_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_boarding_id ON reviews(boarding_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

