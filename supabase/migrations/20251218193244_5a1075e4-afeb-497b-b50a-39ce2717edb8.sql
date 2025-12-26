-- Create admin_2fa table to store TOTP secrets
CREATE TABLE public.admin_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update their own 2FA settings
CREATE POLICY "Admins can view own 2FA"
ON public.admin_2fa
FOR SELECT
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own 2FA"
ON public.admin_2fa
FOR UPDATE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert own 2FA"
ON public.admin_2fa
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own 2FA"
ON public.admin_2fa
FOR DELETE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION public.check_2fa_enabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.admin_2fa WHERE user_id = p_user_id),
    false
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_admin_2fa_updated_at
BEFORE UPDATE ON public.admin_2fa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();