-- Migration: Create atomic increment function for pending approvals
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION increment_pending_approvals(listing_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE listings
  SET 
    "pendingApprovals" = COALESCE("pendingApprovals", 0) + 1,
    "updatedAt" = NOW()
  WHERE id = listing_id
  RETURNING "pendingApprovals" INTO new_count;
  
  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

