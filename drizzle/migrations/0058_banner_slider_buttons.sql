ALTER TABLE public.banners
 ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS know_more_enabled boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS know_more_label text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS know_more_url text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS join_now_enabled boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS join_now_label text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS join_now_url text NOT NULL DEFAULT '';