
-- Create chat_files storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'chat_files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for chat_files bucket
CREATE POLICY "chat_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat_files');

CREATE POLICY "chat_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat_files');
