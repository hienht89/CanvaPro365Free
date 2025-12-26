import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisitorInfo {
  ip: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isp: string | null;
  lat: number | null;
  lon: number | null;
}

export function useVisitorInfo() {
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitorInfo = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('get-visitor-info');
        
        if (error) {
          console.error('Error fetching visitor info:', error);
          setError(error.message);
          return;
        }

        setVisitorInfo(data);
      } catch (err) {
        console.error('Error in useVisitorInfo:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitorInfo();
  }, []);

  return { visitorInfo, isLoading, error };
}
