CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_not_empty CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE public.income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'CZK')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  split_months INTEGER NOT NULL DEFAULT 1 CHECK (split_months >= 1 AND split_months <= 24),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  monthly_amounts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT income_entries_source_not_empty CHECK (char_length(btrim(source)) > 0),
  CONSTRAINT custom_monthly_amounts_shape CHECK (
    monthly_amounts IS NULL
    OR jsonb_typeof(monthly_amounts) = 'array'
  )
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_entries_updated_at
BEFORE UPDATE ON public.income_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own income entries"
ON public.income_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income entries"
ON public.income_entries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    category_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own income entries"
ON public.income_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    category_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own income entries"
ON public.income_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_income_entries_user_id ON public.income_entries(user_id);
CREATE INDEX idx_income_entries_user_id_date ON public.income_entries(user_id, date);
CREATE INDEX idx_income_entries_category_id ON public.income_entries(category_id);