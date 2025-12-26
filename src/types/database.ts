export type LinkType = 'canva_pro' | 'canva_edu';
export type ProtectionType = 'countdown' | 'redirect' | 'both';
export type RateLimitType = 'none' | 'ip' | 'fingerprint';
export type AppRole = 'admin';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  link_type: LinkType;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  canva_url: string;
  short_code: string;
  protection_type: ProtectionType;
  ad_url: string | null;
  countdown_seconds: number;
  max_slots: number | null;
  current_slots: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClickLog {
  id: string;
  link_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  fingerprint: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  clicked_at: string;
  link?: Link;
}

export interface RateLimit {
  id: string;
  link_id: string | null;
  rate_limit_type: RateLimitType;
  max_clicks_per_day: number;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}
