-- COPY AND PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR
-- Then click "Run" or press Ctrl+Enter
--
-- This will add the user_id column to the reviews table if it doesn't exist

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE reviews ADD COLUMN user_id UUID;
        ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    END IF;
END $$;

-- Add unique constraint to prevent duplicate reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'reviews_boarding_user_unique'
    ) THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_boarding_user_unique UNIQUE(boarding_id, user_id);
    END IF;
END $$;

