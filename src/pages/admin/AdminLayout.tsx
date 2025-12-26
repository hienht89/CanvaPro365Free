import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useRealtimeClickNotifications } from '@/hooks/useRealtimeClickNotifications';

export default function AdminLayout() {
  // Enable realtime click notifications for admin
  useRealtimeClickNotifications(true);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
