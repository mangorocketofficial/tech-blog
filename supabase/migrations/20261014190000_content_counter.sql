CREATE TABLE IF NOT EXISTS public.content_counters (
  key TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_counters ENABLE ROW LEVEL SECURITY;

INSERT INTO public.content_counters (key, value)
SELECT
  'generated-info',
  COALESCE(MAX((regexp_match(slug, '^테크-([0-9]+)$'))[1]::BIGINT), 0)
FROM public.posts
WHERE slug ~ '^테크-[0-9]+$'
ON CONFLICT (key) DO UPDATE
SET value = GREATEST(public.content_counters.value, EXCLUDED.value),
    updated_at = NOW();

CREATE OR REPLACE FUNCTION public.reserve_content_number(counter_key TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  next_value BIGINT;
BEGIN
  INSERT INTO public.content_counters AS counters (key, value)
  VALUES (counter_key, 1)
  ON CONFLICT (key) DO UPDATE
  SET value = counters.value + 1,
      updated_at = NOW()
  RETURNING value INTO next_value;

  RETURN next_value;
END;
$$;

REVOKE ALL ON TABLE public.content_counters FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_content_number(TEXT) FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.content_counters TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_content_number(TEXT) TO service_role;
