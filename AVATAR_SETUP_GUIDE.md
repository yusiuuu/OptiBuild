# Avatar & Profile Picture Setup Guide

## Overview
The application now supports:
1. **Automatic avatar generation** from company name or user name (initials)
2. **Custom profile picture upload** via the Profile page

## Features Implemented

### 1. Automatic Avatar Initials
- Avatars automatically display initials based on:
  - **Priority 1**: Company Name (e.g., "OptiBuild Construction" → "OC")
  - **Priority 2**: Full Name (e.g., "John Doe" → "JD")
  - **Priority 3**: Email (e.g., "admin@example.com" → "AD")
  - **Fallback**: "CB" (Construction Builder)

### 2. Profile Picture Upload
- Users can upload custom profile pictures from the Profile page
- Supports image files (JPG, PNG, GIF, etc.)
- Maximum file size: 5MB
- Images are stored in Supabase Storage (with fallback to data URLs)

## Setup Instructions

### Step 1: Set Up Supabase Storage (One-Time)

1. Open your Supabase Dashboard
2. Go to **Storage** section
3. Run the SQL script: `supabase-setup-avatars-storage.sql` in the SQL Editor
   - This creates the `avatars` bucket
   - Sets up proper access policies

**OR** manually create the bucket:
1. Click **"New bucket"**
2. Name: `avatars`
3. Make it **Public**
4. Add policies for authenticated users to upload/update/delete their own avatars

### Step 2: Update Your Profile

1. Navigate to **Profile** page (from sidebar)
2. Click **"Edit"** button
3. Click the **camera icon** on your avatar
4. Select an image file (max 5MB)
5. The image will upload automatically
6. Click **"Save Changes"**

### Step 3: View Your Avatar

- Your avatar will appear in:
  - **Dashboard** top-right corner
  - **Profile** page
  - **User dropdown menu**

## How It Works

### Avatar Display Logic

```typescript
1. If avatar_url exists → Show uploaded image
2. If image fails to load → Fallback to initials
3. If no avatar_url → Show initials based on company/name/email
```

### Initials Generation

- **Company Name**: Takes first letter of first and last word
  - "OptiBuild Construction" → "OC"
  - "ABC Corp" → "AC"
  
- **Full Name**: Takes first letter of first and last name
  - "John Doe" → "JD"
  - "Mary Jane Smith" → "MS"
  
- **Email**: Takes first 2 characters
  - "admin@example.com" → "AD"

## Technical Details

### Files Modified

1. **`lib/utils.ts`**
   - Added `getAvatarInitials()` utility function

2. **`app/dashboard/page.tsx`**
   - Updated avatar to use `userProfile` data
   - Integrated `Avatar` component with fallback

3. **`app/dashboard/profile/page.tsx`**
   - Added `handleAvatarUpload()` function
   - Integrated file upload input with camera button
   - Enhanced avatar display with initials fallback

### Storage Structure

```
Supabase Storage
└── avatars/
    └── {user_id}-{timestamp}.{ext}
        Example: "abc123-1699123456789.jpg"
```

### Fallback Mechanism

If Supabase Storage is not configured:
- Images are stored as **data URLs** (base64 encoded)
- Works without storage setup, but has size limitations
- Recommended: Set up storage for production use

## Troubleshooting

### Avatar Not Showing
- Check if `avatar_url` is set in `user_profiles` table
- Verify Supabase Storage bucket exists and is public
- Check browser console for image loading errors

### Upload Fails
- Ensure file is under 5MB
- Check file is a valid image format (JPG, PNG, GIF, etc.)
- Verify Supabase Storage policies allow uploads
- Check browser console for error messages

### Initials Not Generating
- Ensure `company_name` or `full_name` is set in user profile
- Check `user_profiles` table has the correct data
- Verify `getAvatarInitials()` function is imported correctly

## Database Schema

The `user_profiles` table includes:
- `avatar_url` (TEXT) - URL to the profile picture
- `company_name` (TEXT) - Used for initials if no avatar
- `full_name` (TEXT) - Used for initials if no company name

## Best Practices

1. **Image Size**: Keep profile pictures under 1MB for faster loading
2. **Image Format**: Use JPG or PNG for best compatibility
3. **Aspect Ratio**: Square images (1:1) work best for avatars
4. **Storage**: Set up Supabase Storage for production environments

## Future Enhancements

Potential improvements:
- Image cropping/editing before upload
- Multiple avatar sizes (thumbnail, medium, large)
- Avatar history/versioning
- Default avatar library
- Gravatar integration
