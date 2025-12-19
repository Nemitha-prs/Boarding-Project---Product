-- Migration: Add pendingApprovals column to listings table
-- Run this in your Supabase SQL editor

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS "pendingApprovals" INTEGER DEFAULT 0;

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_listings_pending_approvals ON listings("pendingApprovals");

