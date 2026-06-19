
CREATE TYPE public.job_type AS ENUM ('Internship','Full-time','Part-time');
CREATE TYPE public.application_status AS ENUM ('Applied','Interviewing','Offer','Rejected');

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_type public.job_type NOT NULL DEFAULT 'Full-time',
  status public.application_status NOT NULL DEFAULT 'Applied',
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_job_type ON public.applications(job_type);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX idx_applications_company_lower ON public.applications(lower(company_name));
CREATE INDEX idx_applications_title_lower ON public.applications(lower(job_title));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon, authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.applications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.applications FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few demo rows so the dashboard isn't empty
INSERT INTO public.applications (company_name, job_title, job_type, status, applied_date, notes) VALUES
 ('Vercel','Frontend Engineer Intern','Internship','Interviewing', CURRENT_DATE - 4, 'Technical screen scheduled.'),
 ('Linear','Product Engineer','Full-time','Applied', CURRENT_DATE - 1, 'Referred by ex-colleague.'),
 ('Stripe','Software Engineer Intern','Internship','Offer', CURRENT_DATE - 10, 'Offer received — deciding.'),
 ('Notion','Design Engineer','Full-time','Rejected', CURRENT_DATE - 21, 'Rejected after onsite.'),
 ('Figma','Platform Engineer','Part-time','Applied', CURRENT_DATE - 2, NULL);
