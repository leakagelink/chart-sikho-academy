CREATE TABLE public.demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_slot TEXT NOT NULL DEFAULT 'evening',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demo_bookings TO anon;
GRANT INSERT ON public.demo_bookings TO authenticated;
GRANT ALL ON public.demo_bookings TO service_role;
ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can book a demo class" ON public.demo_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);