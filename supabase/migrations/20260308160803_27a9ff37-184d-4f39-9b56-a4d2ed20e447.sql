-- Add profile columns to employee_profiles
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS profile_image_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'offline';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);