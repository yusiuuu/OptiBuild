<<<<<<< HEAD
# Supabase Database Setup

## Step 1: Access Your Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `ydmdxvwtwjqzklbptzqm`

## Step 2: Run the Database Setup Script

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-setup.sql` into the editor
4. Click **Run** to execute the script

## Step 3: Verify the Setup

After running the script, you should see:

### Tables Created:
- ✅ `user_profiles` - Stores user profile information
- ✅ `projects` - Stores construction projects
- ✅ `team_members` - Stores team member information
- ✅ `certifications` - Stores company certifications
- ✅ `documents` - Stores uploaded documents

### Security Features:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Automatic profile creation when users sign up

## Step 4: Test the Setup

1. **Sign up a new user** in your application
2. **Check the database** - Go to **Table Editor** in Supabase
3. **Verify** that a new row was created in the `user_profiles` table

## What Happens When Users Sign Up:

1. User signs up with email/password
2. Supabase creates an entry in `auth.users`
3. The trigger `on_auth_user_created` automatically fires
4. A new row is created in `user_profiles` table
5. User can now access and update their profile

## Database Schema Overview:

### user_profiles
- `id` - References auth.users(id)
- `email` - User's email address
- `full_name` - User's full name
- `company_name` - Company name
- `phone`, `role`, `department`, `location`, `address`
- `gst`, `pan`, `cin` - Business registration numbers
- `website`, `about` - Company information
- `avatar_url` - Profile picture URL

### projects
- `id` - Unique project identifier
- `user_id` - References the user who owns the project
- `name`, `location`, `type`, `status`
- `start_date`, `end_date`, `budget`, `progress`

### team_members, certifications, documents
- Similar structure with `user_id` foreign key
- Each user can only see their own data

## Troubleshooting:

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that the RLS policies were created correctly
- Verify that the `handle_new_user()` function exists

### If profiles aren't created automatically:
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is working
- Check the Supabase logs for any errors

## Next Steps:

After setting up the database:
1. Your application will automatically create user profiles
2. Users can update their profiles through the dashboard
3. All data will be properly secured and isolated per user
4. You can extend the schema by adding more tables as needed

## Security Notes:

- All tables have Row Level Security enabled
- Users can only access their own data
- The `auth.uid()` function ensures data isolation
- No user can see another user's information
=======
# Supabase Database Setup

## Step 1: Access Your Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `ydmdxvwtwjqzklbptzqm`

## Step 2: Run the Database Setup Script

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-setup.sql` into the editor
4. Click **Run** to execute the script

## Step 3: Verify the Setup

After running the script, you should see:

### Tables Created:
- ✅ `user_profiles` - Stores user profile information
- ✅ `projects` - Stores construction projects
- ✅ `team_members` - Stores team member information
- ✅ `certifications` - Stores company certifications
- ✅ `documents` - Stores uploaded documents

### Security Features:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Automatic profile creation when users sign up

## Step 4: Test the Setup

1. **Sign up a new user** in your application
2. **Check the database** - Go to **Table Editor** in Supabase
3. **Verify** that a new row was created in the `user_profiles` table

## What Happens When Users Sign Up:

1. User signs up with email/password
2. Supabase creates an entry in `auth.users`
3. The trigger `on_auth_user_created` automatically fires
4. A new row is created in `user_profiles` table
5. User can now access and update their profile

## Database Schema Overview:

### user_profiles
- `id` - References auth.users(id)
- `email` - User's email address
- `full_name` - User's full name
- `company_name` - Company name
- `phone`, `role`, `department`, `location`, `address`
- `gst`, `pan`, `cin` - Business registration numbers
- `website`, `about` - Company information
- `avatar_url` - Profile picture URL

### projects
- `id` - Unique project identifier
- `user_id` - References the user who owns the project
- `name`, `location`, `type`, `status`
- `start_date`, `end_date`, `budget`, `progress`

### team_members, certifications, documents
- Similar structure with `user_id` foreign key
- Each user can only see their own data

## Troubleshooting:

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that the RLS policies were created correctly
- Verify that the `handle_new_user()` function exists

### If profiles aren't created automatically:
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is working
- Check the Supabase logs for any errors

## Next Steps:

After setting up the database:
1. Your application will automatically create user profiles
2. Users can update their profiles through the dashboard
3. All data will be properly secured and isolated per user
4. You can extend the schema by adding more tables as needed

## Security Notes:

- All tables have Row Level Security enabled
- Users can only access their own data
- The `auth.uid()` function ensures data isolation
- No user can see another user's information
>>>>>>> 34d06b5 (Updated the +New Project section)
