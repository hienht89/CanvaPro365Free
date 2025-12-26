import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { format, subHours, startOfHour } from 'date-fns';
import { vi } from 'date-fns/locale';

interface HourlyData {
  hour: string;
  clicks: number;
  fullTime: Date;
}

export default function RealtimeClickChart() {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [lastHourClicks, setLastHourClicks] = useState(0);
  const [spike, setSpike] = useState<{ detected: boolean; hour: string; count: number } | null>(null);
  const [isLive, setIsLive] = useState(true);

  // Calculate average and detect spikes
  const calculateStats = (data: HourlyData[]) => {
    if (data.length < 2) return { avg: 0, stdDev: 0 };
    
    const clicks = data.map(d => d.clicks);
    const avg = clicks.reduce((a, b) => a + b, 0) / clicks.length;
    const variance = clicks.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / clicks.length;
    const stdDev = Math.sqrt(variance);
    
    return { avg, stdDev };
  };

  // Detect spike (if click count > avg + 2*stdDev)
  const detectSpike = (data: HourlyData[]) => {
    const { avg, stdDev } = calculateStats(data);
    const threshold = avg + 2 * stdDev;
    
    // Check if last hour has a spike
    if (data.length > 0) {
      const lastHour = data[data.length - 1];
      if (lastHour.clicks > threshold && lastHour.clicks > 5) {
        setSpike({ detected: true, hour: lastHour.hour, count: lastHour.clicks });
        return;
      }
    }
    setSpike(null);
  };

  // Fetch initial data
  const fetchHourlyData = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const { data, error } = await supabase
      .from('click_logs')
      .select('clicked_at')
      .gte('clicked_at', today.toISOString())
      .order('clicked_at', { ascending: true });

    if (error) {
      console.error('Error fetching click data:', error);
      return;
    }

    // Group by hour
    const hourlyMap: Record<string, number> = {};
    
    // Initialize 24 hours
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(today);
      hourStart.setHours(i, 0, 0, 0);
      const key = format(hourStart, 'HH:mm');
      hourlyMap[key] = 0;
    }

    // Count clicks per hour
    data?.forEach(log => {
      const date = new Date(log.clicked_at);
      const hour = startOfHour(date);
      const key = format(hour, 'HH:mm');
      hourlyMap[key] = (hourlyMap[key] || 0) + 1;
    });

    // Convert to array
    const chartData: HourlyData[] = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(today);
      hourStart.setHours(i, 0, 0, 0);
      const key = format(hourStart, 'HH:mm');
      chartData.push({
        hour: key,
        clicks: hourlyMap[key] || 0,
        fullTime: hourStart,
      });
    }

    setHourlyData(chartData);
    setTotalToday(data?.length || 0);
    
    // Get last hour clicks
    const currentHour = format(startOfHour(now), 'HH:mm');
    setLastHourClicks(hourlyMap[currentHour] || 0);
    
    // Detect spikes
    detectSpike(chartData);
  };

  useEffect(() => {
    fetchHourlyData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('realtime-clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'click_logs',
        },
        (payload) => {
          console.log('New click:', payload);
          
          // Update data on new click
          const clickedAt = new Date(payload.new.clicked_at);
          const hourKey = format(startOfHour(clickedAt), 'HH:mm');
          
          setHourlyData(prev => {
            const updated = prev.map(item => 
              item.hour === hourKey 
                ? { ...item, clicks: item.clicks + 1 }
                : item
            );
            detectSpike(updated);
            return updated;
          });
          
          setTotalToday(prev => prev + 1);
          
          // Update last hour if it's current hour
          const currentHourKey = format(startOfHour(new Date()), 'HH:mm');
          if (hourKey === currentHourKey) {
            setLastHourClicks(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Refresh data every minute
    const interval = setInterval(fetchHourlyData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const { avg } = calculateStats(hourlyData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Click theo giờ (Hôm nay)
            </CardTitle>
            <CardDescription>
              Biểu đồ real-time hiển thị số lượng click theo từng giờ
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {spike?.detected && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Spike: {spike.count} clicks lúc {spike.hour}
              </Badge>
            )}
            <Badge variant={isLive ? 'default' : 'secondary'} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              {isLive ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Zap className="w-4 h-4" />
              Giờ này
            </div>
            <p className="text-2xl font-bold">{lastHourClicks}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              Trung bình/giờ
            </div>
            <p className="text-2xl font-bold">{avg.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-lg gradient-primary text-primary-foreground">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Activity className="w-4 h-4" />
              Tổng hôm nay
            </div>
            <p className="text-2xl font-bold">{totalToday}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                interval={2}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} clicks`, 'Số click']}
                labelFormatter={(label) => `Lúc ${label}`}
              />
              {avg > 0 && (
                <ReferenceLine 
                  y={avg} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'TB', 
                    position: 'right',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorClicks)"
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
