import { useClickLogs, useClickStats } from '@/hooks/useClickLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  MousePointer, 
  TrendingUp, 
  Calendar, 
  Globe, 
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Chrome
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminAnalytics() {
  const { data: logs, isLoading: logsLoading } = useClickLogs();
  const { data: stats, isLoading: statsLoading } = useClickStats();

  const isLoading = logsLoading || statsLoading;

  // Get top links
  const linkCounts: Record<string, { title: string; count: number }> = {};
  logs?.forEach(log => {
    if (log.link?.title) {
      if (!linkCounts[log.link_id!]) {
        linkCounts[log.link_id!] = { title: log.link.title, count: 0 };
      }
      linkCounts[log.link_id!].count++;
    }
  });
  const topLinks = Object.values(linkCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Prepare device chart data
  const deviceChartData = stats?.deviceStats 
    ? Object.entries(stats.deviceStats)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  // Prepare browser chart data
  const browserChartData = stats?.browserStats
    ? Object.entries(stats.browserStats)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="w-4 h-4" />;
      case 'Desktop': return <Monitor className="w-4 h-4" />;
      case 'Tablet': return <Tablet className="w-4 h-4" />;
      default: return <Chrome className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thống kê chi tiết</h1>
        <p className="text-muted-foreground">Phân tích chi tiết về lượt truy cập và hành vi người dùng</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Hôm nay</span>
                </div>
                <p className="text-3xl font-bold">{stats?.todayClicks || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tuần này</span>
                </div>
                <p className="text-3xl font-bold">{stats?.weekClicks || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tháng này</span>
                </div>
                <p className="text-3xl font-bold">{stats?.monthClicks || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="w-4 h-4" />
                  <span className="text-sm opacity-90">Tổng cộng</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalClicks || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Clicks Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Biểu đồ clicks theo thời gian (30 ngày gần nhất)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : stats?.chartData && stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chưa có dữ liệu
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="links">Top Links</TabsTrigger>
          <TabsTrigger value="geographic">Địa lý</TabsTrigger>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Top Links Tab */}
        <TabsContent value="links">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Link được click nhiều nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topLinks.length > 0 ? (
                  <div className="space-y-3">
                    {topLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                              index === 1 ? 'bg-gray-400 text-gray-900' : 
                              index === 2 ? 'bg-amber-600 text-amber-950' : 
                              'bg-muted text-muted-foreground'}
                          `}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm truncate max-w-[200px]">{link.title}</span>
                        </div>
                        <Badge variant="secondary">{link.count} clicks</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart for Top Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Biểu đồ top links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : topLinks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topLinks.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="title" 
                        tick={{ fontSize: 11 }} 
                        width={120}
                        tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Quốc gia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : stats?.topCountries && stats.topCountries.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topCountries.map(([country, count], index) => (
                      <div key={country} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(count / (stats.topCountries[0]?.[1] || 1)) * 100}%` 
                              }}
                            />
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu địa lý</p>
                )}
              </CardContent>
            </Card>

            {/* Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Thành phố
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : stats?.topCities && stats.topCities.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topCities.map(([city, count], index) => (
                      <div key={city} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ 
                                width: `${(count / (stats.topCities[0]?.[1] || 1)) * 100}%` 
                              }}
                            />
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu thành phố</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Loại thiết bị
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : deviceChartData.length > 0 ? (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width="50%" height={250}>
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {deviceChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {deviceChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(item.name)}
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-5 h-5" />
                  Trình duyệt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : browserChartData.length > 0 ? (
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width="50%" height={250}>
                      <PieChart>
                        <Pie
                          data={browserChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {browserChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {browserChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}
                          />
                          <span className="text-sm">{item.name}</span>
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Lịch sử click gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Link</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Quốc gia</TableHead>
                        <TableHead>Thành phố</TableHead>
                        <TableHead>Fingerprint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 50).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.link?.title || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.clicked_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {log.country || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {log.city || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs px-2 py-1 bg-muted rounded">
                              {log.fingerprint?.slice(0, 8)}...
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Chưa có click nào</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}