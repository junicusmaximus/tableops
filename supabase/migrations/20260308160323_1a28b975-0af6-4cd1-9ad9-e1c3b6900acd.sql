ALTER TABLE public.notification_preferences
  ADD COLUMN enable_schedule_new boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_schedule_change boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_checklist boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_inventory boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_document_sign boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_announcement boolean NOT NULL DEFAULT true;