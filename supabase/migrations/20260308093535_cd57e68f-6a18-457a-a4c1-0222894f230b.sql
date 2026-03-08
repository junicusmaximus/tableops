
-- Add new role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'boss';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'full_time';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'part_time';
