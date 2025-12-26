import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClickLog } from '@/types/database';

export function useClickLogs() {
  return useQuery({
    queryKey: ['click-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('click_logs')
        .select(`
          *,
          link:links(*)
        `)
        .order('clicked_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as (ClickLog & { link: any })[];
    },
  });
}

export function useClickStats() {
  return useQuery({
    queryKey: ['click-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('click_logs')
        .select('clicked_at, link_id, country, city, user_agent');
      
      if (error) throw error;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const todayClicks = data?.filter(log => new Date(log.clicked_at) >= today).length || 0;
      const weekClicks = data?.filter(log => new Date(log.clicked_at) >= thisWeek).length || 0;
      const monthClicks = data?.filter(log => new Date(log.clicked_at) >= thisMonth).length || 0;
      const totalClicks = data?.length || 0;
      
      // Group by date for chart (last 30 days)
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const clicksByDate: Record<string, number> = {};
      const chartData: { date: string; clicks: number; fullDate: string }[] = [];
      
      // Initialize last 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toLocaleDateString('vi-VN');
        clicksByDate[dateStr] = 0;
      }
      
      data?.forEach(log => {
        const logDate = new Date(log.clicked_at);
        if (logDate >= last30Days) {
          const date = logDate.toLocaleDateString('vi-VN');
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        }
      });
      
      // Convert to array for chart
      Object.entries(clicksByDate).forEach(([date, clicks]) => {
        chartData.push({ date: date.slice(0, 5), clicks, fullDate: date });
      });
      
      // Geographic stats
      const countryStats: Record<string, number> = {};
      const cityStats: Record<string, number> = {};
      const deviceStats: Record<string, number> = { 'Mobile': 0, 'Desktop': 0, 'Tablet': 0, 'Other': 0 };
      const browserStats: Record<string, number> = {};
      
      data?.forEach(log => {
        // Country stats
        const country = log.country || 'Không xác định';
        countryStats[country] = (countryStats[country] || 0) + 1;
        
        // City stats
        const city = log.city || 'Không xác định';
        cityStats[city] = (cityStats[city] || 0) + 1;
        
        // Device detection from user agent
        const ua = log.user_agent?.toLowerCase() || '';
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceStats['Mobile']++;
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceStats['Tablet']++;
        } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
          deviceStats['Desktop']++;
        } else {
          deviceStats['Other']++;
        }
        
        // Browser detection
        if (ua.includes('chrome') && !ua.includes('edg')) {
          browserStats['Chrome'] = (browserStats['Chrome'] || 0) + 1;
        } else if (ua.includes('firefox')) {
          browserStats['Firefox'] = (browserStats['Firefox'] || 0) + 1;
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
          browserStats['Safari'] = (browserStats['Safari'] || 0) + 1;
        } else if (ua.includes('edg')) {
          browserStats['Edge'] = (browserStats['Edge'] || 0) + 1;
        } else {
          browserStats['Other'] = (browserStats['Other'] || 0) + 1;
        }
      });
      
      // Sort and limit
      const topCountries = Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      const topCities = Object.entries(cityStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      return {
        todayClicks,
        weekClicks,
        monthClicks,
        totalClicks,
        clicksByDate,
        chartData,
        topCountries,
        topCities,
        deviceStats,
        browserStats,
      };
    },
  });
}

export function useLogClick() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<ClickLog, 'id' | 'clicked_at'>) => {
      const { data, error } = await supabase
        .from('click_logs')
        .insert([log])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['click-logs'] });
      queryClient.invalidateQueries({ queryKey: ['click-stats'] });
    },
  });
}

export function useCanClick(linkId: string, fingerprint: string | null, rateLimitType: string) {
  return useQuery({
    queryKey: ['can-click', linkId, fingerprint, rateLimitType],
    queryFn: async () => {
      if (rateLimitType === 'none') return true;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let query = supabase
        .from('click_logs')
        .select('id')
        .eq('link_id', linkId)
        .gte('clicked_at', today.toISOString());
      
      if (rateLimitType === 'fingerprint' && fingerprint) {
        query = query.eq('fingerprint', fingerprint);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Default max 3 clicks per day
      return (data?.length || 0) < 3;
    },
    enabled: !!linkId && (rateLimitType !== 'fingerprint' || !!fingerprint),
  });
}
