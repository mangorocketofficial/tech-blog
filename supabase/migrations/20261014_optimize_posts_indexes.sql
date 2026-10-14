-- Optimize the read patterns used by the public blog and admin search.
-- Safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_published_category_date
  ON public.posts (category, published_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_posts_published_view_count
  ON public.posts (view_count DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON public.posts USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_description_trgm
  ON public.posts USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_product_name_trgm
  ON public.posts USING gin (product_name gin_trgm_ops);

ANALYZE public.posts;

