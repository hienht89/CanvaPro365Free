import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, ProtectionType } from '@/types/database';
import { toast } from 'sonner';

// Admin query - returns all fields including canva_url
export function useLinks() {
  return useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Link & { category: any })[];
    },
  });
}

// Public query - excludes canva_url for security
export function useActiveLinks() {
  return useQuery({
    queryKey: ['active-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select(`
          id,
          category_id,
          title,
          description,
          short_code,
          protection_type,
          ad_url,
          countdown_seconds,
          max_slots,
          current_slots,
          is_active,
          expires_at,
          created_at,
          updated_at,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Cast without canva_url
      return data as (Omit<Link, 'canva_url'> & { category: any })[];
    },
  });
}

// Public query for single link - excludes canva_url
export function useLinkByShortCode(shortCode: string) {
  return useQuery({
    queryKey: ['link', shortCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select(`
          id,
          category_id,
          title,
          description,
          short_code,
          protection_type,
          ad_url,
          countdown_seconds,
          max_slots,
          current_slots,
          is_active,
          expires_at,
          created_at,
          updated_at,
          category:categories(*)
        `)
        .eq('short_code', shortCode)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Omit<Link, 'canva_url'> & { category: any }) | null;
    },
    enabled: !!shortCode,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (link: Omit<Link, 'id' | 'created_at' | 'updated_at' | 'current_slots'>) => {
      const { data, error } = await supabase
        .from('links')
        .insert([link])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['active-links'] });
      toast.success('Link đã được tạo thành công');
    },
    onError: (error) => {
      toast.error('Lỗi khi tạo link: ' + error.message);
    },
  });
}

export function useUpdateLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Link> & { id: string }) => {
      const { data, error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['active-links'] });
      toast.success('Link đã được cập nhật');
    },
    onError: (error) => {
      toast.error('Lỗi khi cập nhật link: ' + error.message);
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['active-links'] });
      toast.success('Link đã được xóa');
    },
    onError: (error) => {
      toast.error('Lỗi khi xóa link: ' + error.message);
    },
  });
}

export function useGenerateShortCode() {
  return useMutation({
    mutationFn: async () => {
      // Generate 12-char secure short code (excluding confusing chars)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  });
}
