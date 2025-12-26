import { useLinks } from '@/hooks/useLinks';
import { useCategories } from '@/hooks/useCategories';
import { useClickStats } from '@/hooks/useClickLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, FolderOpen, MousePointer, TrendingUp, Users, Clock } from 'lucide-react';
import RealtimeClickChart from '@/components/admin/RealtimeClickChart';

export default function AdminDashboard() {
  const { data: links, isLoading: linksLoading } = useLinks();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: stats, isLoading: statsLoading } = useClickStats();

  const isLoading = linksLoading || categoriesLoading || statsLoading;

  const activeLinks = links?.filter(l => l.is_active).length || 0;
  const totalSlots = links?.reduce((sum, l) => sum + (l.current_slots || 0), 0) || 0;

  const statCards = [
    {
      title: 'Tổng Link',
      value: links?.length || 0,
      subValue: `${activeLinks} đang hoạt động`,
      icon: Link2,
      gradient: 'gradient-primary',
    },
    {
      title: 'Danh mục',
      value: categories?.length || 0,
      subValue: `${categories?.filter(c => c.is_active).length || 0} đang hiển thị`,
      icon: FolderOpen,
      gradient: 'gradient-secondary',
    },
    {
      title: 'Click hôm nay',
      value: stats?.todayClicks || 0,
      subValue: `${stats?.weekClicks || 0} tuần này`,
      icon: MousePointer,
      gradient: 'bg-accent',
    },
    {
      title: 'Tổng người tham gia',
      value: totalSlots,
      subValue: `${stats?.totalClicks || 0} tổng click`,
      icon: Users,
      gradient: 'gradient-primary',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan về website CanvaPro365Free</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.gradient}`}>
                  <stat.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Real-time Click Chart */}
      <RealtimeClickChart />

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Link phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3">
                {links.slice(0, 5).map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{link.title}</p>
                      <p className="text-xs text-muted-foreground">{link.category?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{link.current_slots}</p>
                      <p className="text-xs text-muted-foreground">người tham gia</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có link nào</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Thống kê click
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Hôm nay</span>
                <span className="font-semibold">{stats?.todayClicks || 0} clicks</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Tuần này</span>
                <span className="font-semibold">{stats?.weekClicks || 0} clicks</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Tháng này</span>
                <span className="font-semibold">{stats?.monthClicks || 0} clicks</span>
              </div>
              <div className="flex items-center justify-between p-3 gradient-primary rounded-lg text-primary-foreground">
                <span className="text-sm">Tổng cộng</span>
                <span className="font-semibold">{stats?.totalClicks || 0} clicks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
