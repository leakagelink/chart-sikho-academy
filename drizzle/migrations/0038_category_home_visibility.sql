ALTER TABLE public.course_categories ADD COLUMN is_visible boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.course_categories.is_visible IS 'Controls homepage category tiles only; hiding does not remove courses or admin category selectors.';
GRANT SELECT ON public.course_categories TO anon, authenticated;
GRANT ALL ON public.course_categories TO service_role;