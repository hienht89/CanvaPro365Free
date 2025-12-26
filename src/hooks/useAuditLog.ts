import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogInput {
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
}

export function useAuditLog() {
  return useMutation({
    mutationFn: async (input: AuditLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user logged in, skipping audit log');
        return null;
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          action: input.action,
          entity_type: input.entity_type,
          entity_id: input.entity_id || null,
          old_value: input.old_value || null,
          new_value: input.new_value || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Failed to create audit log:', error);
        return null;
      }

      return data;
    },
  });
}
