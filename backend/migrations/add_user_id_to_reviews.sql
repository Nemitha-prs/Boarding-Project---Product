-- Migration: Add user_id column to reviews table
-- Run this in your Supabase SQL editor
-- 
-- IMPORTANT: Copy and paste this entire file into Supabase SQL Editor and run it
-- This will add the user_id column if it doesn't exist

-- Step 1: Check if user_id column exists, if not add it
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column (nullable first, we'll handle existing data)
        ALTER TABLE reviews 
        ADD COLUMN user_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE reviews
        ADD CONSTRAINT reviews_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
        
        RAISE NOTICE 'user_id column added successfully';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Step 2: Add unique constraint to prevent duplicate reviews (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'reviews_boarding_user_unique'
    ) THEN
        ALTER TABLE reviews
        ADD CONSTRAINT reviews_boarding_user_unique 
        UNIQUE(boarding_id, user_id);
        
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Step 3: Make user_id NOT NULL for new reviews (optional - only if you want to enforce it)
-- WARNING: This will fail if there are existing reviews without user_id
-- Uncomment the lines below ONLY if all existing reviews have user_id
-- ALTER TABLE reviews ALTER COLUMN user_id SET NOT NULL;

-- Verification query (run this to check the result)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'reviews' 
-- ORDER BY ordinal_position;

