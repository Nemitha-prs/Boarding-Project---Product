# Reviews Table Migration Instructions

## Error: "Could not find the table 'public.reviews' in the schema cache"

This error means the `reviews` table hasn't been created in your Supabase database yet.

## How to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Open the file: `Backend/migrations/create_reviews_table.sql`
   - Copy the entire SQL content
   - Paste it into the Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify the Table was Created**
   - Go to **Table Editor** in Supabase
   - You should see a new table called `reviews`
   - It should have columns: `id`, `boarding_id`, `user_id`, `rating`, `comment`, `created_at`

4. **Test the Reviews Feature**
   - Restart your backend server if it's running
   - Visit a boarding detail page
   - The reviews section should now work

## Migration SQL Location

The migration file is located at:
```
Backend/migrations/create_reviews_table.sql
```

## Troubleshooting

- If you get foreign key errors, make sure the `listings` and `users` tables exist first
- If you get permission errors, make sure you're using the service role key in your backend
- After running the migration, wait a few seconds for Supabase to update its schema cache


