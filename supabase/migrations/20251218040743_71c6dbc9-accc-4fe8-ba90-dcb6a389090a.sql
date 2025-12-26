-- Create enum for link types
CREATE TYPE public.link_type AS ENUM ('canva_pro', 'canva_edu');

-- Create enum for protection types
CREATE TYPE public.protection_type AS ENUM ('countdown', 'redirect', 'both');

-- Create enum for rate limit types
CREATE TYPE public.rate_limit_type AS ENUM ('none', 'ip', 'fingerprint');

-- Create enum for app_role (admin roles)
CREATE TYPE public.app_role AS ENUM ('admin');

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    link_type link_type NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Links table
CREATE TABLE public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    canva_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    protection_type protection_type DEFAULT 'countdown',
    ad_url TEXT,
    countdown_seconds INTEGER DEFAULT 30,
    max_slots INTEGER,
    current_slots INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Settings table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Click logs table for analytics
CREATE TABLE public.click_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    fingerprint TEXT,
    country TEXT,
    city TEXT,
    referrer TEXT,
    clicked_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table for admin
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Rate limits configuration
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE,
    rate_limit_type rate_limit_type DEFAULT 'none',
    max_clicks_per_day INTEGER DEFAULT 3,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for links (public read active, admin write)
CREATE POLICY "Anyone can view active links"
ON public.links FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage links"
ON public.links FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for settings (admin only)
CREATE POLICY "Admins can view settings"
ON public.settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for click_logs (insert for anyone, read for admin)
CREATE POLICY "Anyone can insert click logs"
ON public.click_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view click logs"
ON public.click_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can view user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rate_limits
CREATE POLICY "Anyone can view rate limits"
ON public.rate_limits FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rate limits"
ON public.rate_limits FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment slot count
CREATE OR REPLACE FUNCTION public.increment_slot(link_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.links
    SET current_slots = current_slots + 1
    WHERE id = link_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate short code
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('site_title', '"CanvaHub - Chia sẻ link Canva Pro miễn phí"', 'Tiêu đề trang web'),
('site_description', '"Tham gia Canva Pro & Canva Edu miễn phí với link chia sẻ an toàn"', 'Mô tả trang web'),
('default_countdown', '30', 'Thời gian đếm ngược mặc định (giây)'),
('default_ad_url', '""', 'URL quảng cáo mặc định'),
('global_rate_limit', '{"type": "none", "max_per_day": 3}', 'Giới hạn click toàn cục'),
('contact_email', '"admin@canvahub.com"', 'Email liên hệ'),
('social_links', '{"facebook": "", "telegram": "", "zalo": ""}', 'Liên kết mạng xã hội');

-- Insert default categories
INSERT INTO public.categories (name, description, link_type, icon, display_order) VALUES
('Canva Pro Team', 'Tham gia team Canva Pro với đầy đủ tính năng Premium', 'canva_pro', 'crown', 1),
('Canva Pro Individual', 'Link Canva Pro cá nhân', 'canva_pro', 'user', 2),
('Canva Education', 'Link Canva Education cho học sinh, sinh viên', 'canva_edu', 'graduation-cap', 3);