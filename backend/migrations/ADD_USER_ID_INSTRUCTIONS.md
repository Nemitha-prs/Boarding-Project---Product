# How to Add user_id Column to Reviews Table

## Problem
The `reviews` table might be missing the `user_id` column, which is needed to identify which user created each review.

## Solution
Run the migration SQL in your Supabase dashboard.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **SQL Editor** (in the left sidebar)

### 2. Run the Migration
- Open the file: `backend/migrations/add_user_id_to_reviews_READY_TO_RUN.sql`
- Copy the entire contents
- Paste it into the Supabase SQL Editor
- Click **Run** or press `Ctrl+Enter`

### 3. Verify the Migration
After running, verify the column was added by running this query in the SQL Editor:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;
```

You should see `user_id` in the list of columns.

### 4. Handle Existing Reviews (if any)
If you have existing reviews without `user_id`, you have two options:

**Option A: Delete old reviews (if they're test data)**
```sql
DELETE FROM reviews WHERE user_id IS NULL;
```

**Option B: Keep them but they won't show delete buttons**
- Old reviews without `user_id` will still display
- But users won't be able to delete them (since we can't identify the owner)

### 5. Test
1. Create a new review (while logged in)
2. Check the browser console - you should see the `user_id` in the logs
3. The delete button should appear on your own reviews

## What the Migration Does:
- ✅ Adds `user_id` column (UUID type)
- ✅ Creates foreign key relationship to `users` table
- ✅ Adds index for better query performance
- ✅ Adds unique constraint to prevent duplicate reviews from same user
- ✅ Safe to run multiple times (won't break if column already exists)

## Notes:
- The migration is **safe** - it checks if the column exists before adding it
- It won't delete any existing data
- New reviews will automatically have `user_id` set
- Old reviews without `user_id` will have `null` (which is okay for now)

