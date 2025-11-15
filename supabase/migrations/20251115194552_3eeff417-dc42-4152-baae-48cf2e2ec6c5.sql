-- Create storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true);

-- Create policy for users to upload their own photos
CREATE POLICY "Users can upload own meal photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view own photos
CREATE POLICY "Users can view own meal photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete own photos
CREATE POLICY "Users can delete own meal photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);