-- =============================================
-- CANVAHUB SECURITY UPGRADE MIGRATION
-- =============================================

-- 1. Create click_sessions table to track user flow
CREATE TABLE public.click_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    referrer TEXT,
    -- Flow tracking
    ad_visited_at TIMESTAMP WITH TIME ZONE,
    countdown_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    countdown_completed_at TIMESTAMP WITH TIME ZONE,
    captcha_passed_at TIMESTAMP WITH TIME ZONE,
    redirect_token TEXT UNIQUE,
    redirect_token_expires_at TIMESTAMP WITH TIME ZONE,
    redirect_token_used_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.click_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions can be created by anyone (public access for tracking)
CREATE POLICY "Anyone can create click sessions" 
ON public.click_sessions 
FOR INSERT 
WITH CHECK (true);

-- Sessions can be read by the session owner (via session_token) or admins
CREATE POLICY "Anyone can read their own session" 
ON public.click_sessions 
FOR SELECT 
USING (true);

-- Sessions can be updated (for flow tracking)
CREATE POLICY "Anyone can update sessions" 
ON public.click_sessions 
FOR UPDATE 
USING (true);

-- Only admins can delete sessions
CREATE POLICY "Admins can delete sessions" 
ON public.click_sessions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast lookups
CREATE INDEX idx_click_sessions_token ON public.click_sessions(session_token);
CREATE INDEX idx_click_sessions_redirect_token ON public.click_sessions(redirect_token);
CREATE INDEX idx_click_sessions_link_id ON public.click_sessions(link_id);
CREATE INDEX idx_click_sessions_created_at ON public.click_sessions(created_at);

-- 2. Create audit_logs table for admin actions
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (via service role)
CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 3. Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 4. Create function to generate longer short codes (12 chars)
CREATE OR REPLACE FUNCTION public.generate_short_code_v2()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 5. Create function to issue redirect token
CREATE OR REPLACE FUNCTION public.issue_redirect_token(
    p_session_token TEXT,
    p_link_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    redirect_token TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_link RECORD;
    v_token TEXT;
    v_countdown_seconds INTEGER;
    v_elapsed_seconds INTEGER;
BEGIN
    -- Get the session
    SELECT * INTO v_session FROM public.click_sessions 
    WHERE session_token = p_session_token AND link_id = p_link_id;
    
    IF v_session IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid session'::TEXT;
        RETURN;
    END IF;
    
    -- Check if token already issued and still valid
    IF v_session.redirect_token IS NOT NULL AND v_session.redirect_token_expires_at > now() AND v_session.redirect_token_used_at IS NULL THEN
        RETURN QUERY SELECT TRUE, v_session.redirect_token, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get the link
    SELECT * INTO v_link FROM public.links WHERE id = p_link_id AND is_active = true;
    
    IF v_link IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Link not found or inactive'::TEXT;
        RETURN;
    END IF;
    
    -- Check if link is full
    IF v_link.max_slots IS NOT NULL AND v_link.current_slots >= v_link.max_slots THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Link is full'::TEXT;
        RETURN;
    END IF;
    
    -- Check if link is expired
    IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Link has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check countdown requirement
    v_countdown_seconds := COALESCE(v_link.countdown_seconds, 30);
    v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_session.countdown_started_at))::INTEGER;
    
    IF v_elapsed_seconds < v_countdown_seconds THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, format('Countdown not complete. %s seconds remaining', v_countdown_seconds - v_elapsed_seconds)::TEXT;
        RETURN;
    END IF;
    
    -- Generate new token
    v_token := public.generate_secure_token(64);
    
    -- Update session with token
    UPDATE public.click_sessions SET
        redirect_token = v_token,
        redirect_token_expires_at = now() + interval '90 seconds',
        countdown_completed_at = COALESCE(countdown_completed_at, now()),
        updated_at = now()
    WHERE session_token = p_session_token;
    
    RETURN QUERY SELECT TRUE, v_token, NULL::TEXT;
END;
$$;

-- 6. Create function to consume redirect token and get target URL
CREATE OR REPLACE FUNCTION public.consume_redirect_token(p_redirect_token TEXT)
RETURNS TABLE(
    success BOOLEAN,
    target_url TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_link RECORD;
BEGIN
    -- Get the session with this token
    SELECT * INTO v_session FROM public.click_sessions 
    WHERE redirect_token = p_redirect_token;
    
    IF v_session IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid token'::TEXT;
        RETURN;
    END IF;
    
    -- Check if token is expired
    IF v_session.redirect_token_expires_at < now() THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Token expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check if token already used
    IF v_session.redirect_token_used_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Token already used'::TEXT;
        RETURN;
    END IF;
    
    -- Get the link
    SELECT * INTO v_link FROM public.links WHERE id = v_session.link_id AND is_active = true;
    
    IF v_link IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Link not found'::TEXT;
        RETURN;
    END IF;
    
    -- Mark token as used
    UPDATE public.click_sessions SET
        redirect_token_used_at = now(),
        updated_at = now()
    WHERE redirect_token = p_redirect_token;
    
    -- Increment slot
    UPDATE public.links SET
        current_slots = current_slots + 1,
        updated_at = now()
    WHERE id = v_session.link_id;
    
    -- Log the click
    INSERT INTO public.click_logs (
        link_id, ip_address, user_agent, fingerprint, country, city, referrer
    ) VALUES (
        v_session.link_id, v_session.ip_address, v_session.user_agent, 
        v_session.fingerprint, v_session.country, v_session.city, v_session.referrer
    );
    
    RETURN QUERY SELECT TRUE, v_link.canva_url, NULL::TEXT;
END;
$$;

-- 7. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_link_id UUID,
    p_fingerprint TEXT,
    p_ip_address TEXT
)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    clicks_today INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate_limit RECORD;
    v_click_count INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Check for global rate limit first
    SELECT * INTO v_rate_limit FROM public.rate_limits WHERE is_global = true LIMIT 1;
    
    -- If no global, check link-specific
    IF v_rate_limit IS NULL THEN
        SELECT * INTO v_rate_limit FROM public.rate_limits WHERE link_id = p_link_id LIMIT 1;
    END IF;
    
    -- If no rate limit configured, allow
    IF v_rate_limit IS NULL OR v_rate_limit.rate_limit_type = 'none' THEN
        RETURN QUERY SELECT TRUE, NULL::TEXT, 0;
        RETURN;
    END IF;
    
    -- Count clicks based on rate limit type
    IF v_rate_limit.rate_limit_type = 'fingerprint' AND p_fingerprint IS NOT NULL THEN
        SELECT COUNT(*) INTO v_click_count
        FROM public.click_sessions
        WHERE link_id = p_link_id
        AND fingerprint = p_fingerprint
        AND DATE(created_at) = v_today;
    ELSIF v_rate_limit.rate_limit_type = 'ip' AND p_ip_address IS NOT NULL THEN
        SELECT COUNT(*) INTO v_click_count
        FROM public.click_sessions
        WHERE link_id = p_link_id
        AND ip_address = p_ip_address
        AND DATE(created_at) = v_today;
    ELSE
        v_click_count := 0;
    END IF;
    
    IF v_click_count >= COALESCE(v_rate_limit.max_clicks_per_day, 3) THEN
        RETURN QUERY SELECT FALSE, 'Rate limit exceeded'::TEXT, v_click_count;
    ELSE
        RETURN QUERY SELECT TRUE, NULL::TEXT, v_click_count;
    END IF;
END;
$$;

-- 8. Add trigger for updated_at on click_sessions
CREATE TRIGGER update_click_sessions_updated_at
    BEFORE UPDATE ON public.click_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable realtime for click_sessions (for admin monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.click_sessions;