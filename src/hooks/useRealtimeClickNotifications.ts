import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClickLog {
  id: string;
  link_id: string | null;
  clicked_at: string | null;
  country: string | null;
  city: string | null;
  fingerprint: string | null;
}

export function useRealtimeClickNotifications(enabled: boolean = true) {
  const lastClickIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('Setting up realtime click notifications...');

    const channel = supabase
      .channel('click-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'click_logs',
        },
        async (payload) => {
          console.log('New click detected:', payload);
          
          const newClick = payload.new as ClickLog;
          
          // Prevent duplicate notifications
          if (lastClickIdRef.current === newClick.id) return;
          lastClickIdRef.current = newClick.id;

          // Fetch link info
          let linkTitle = 'Unknown Link';
          if (newClick.link_id) {
            const { data: link } = await supabase
              .from('links')
              .select('title')
              .eq('id', newClick.link_id)
              .maybeSingle();
            
            if (link) {
              linkTitle = link.title;
            }
          }

          // Build location string
          const location = [newClick.city, newClick.country]
            .filter(Boolean)
            .join(', ') || 'Không xác định';

          // Show notification
          toast.info(`Click mới: ${linkTitle}`, {
            description: `Vị trí: ${location}`,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
