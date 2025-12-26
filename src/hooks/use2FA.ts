import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Setup2FAResponse {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

export function use2FA() {
  const [isLoading, setIsLoading] = useState(false);

  const setup2FA = async (): Promise<Setup2FAResponse | null> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Chưa đăng nhập');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('admin-2fa', {
        body: { action: 'setup' },
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Setup 2FA error:', err);
      toast.error(err.message || 'Lỗi khi thiết lập 2FA');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-2fa', {
        body: { action: 'verify-setup', token },
      });

      if (error) throw error;
      if (data.success) {
        toast.success('Đã bật 2FA thành công!');
        return true;
      }
      toast.error(data.error || 'Mã xác minh không hợp lệ');
      return false;
    } catch (err: any) {
      console.error('Verify setup error:', err);
      toast.error(err.message || 'Lỗi xác minh');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLogin = async (token: string, userId?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-2fa', {
        body: { action: 'verify-login', token, userId },
      });

      if (error) throw error;
      if (data.success) {
        if (data.usedBackupCode) {
          toast.warning('Đã dùng mã backup. Hãy tạo mã mới trong cài đặt.');
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Verify login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-2fa', {
        body: { action: 'disable', token },
      });

      if (error) throw error;
      if (data.success) {
        toast.success('Đã tắt 2FA');
        return true;
      }
      toast.error(data.error || 'Mã xác minh không hợp lệ');
      return false;
    } catch (err: any) {
      console.error('Disable 2FA error:', err);
      toast.error(err.message || 'Lỗi khi tắt 2FA');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const check2FAStatus = async (userId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-2fa', {
        body: { action: 'check-status', userId },
      });

      if (error) throw error;
      return data.is2FAEnabled || false;
    } catch (err) {
      console.error('Check 2FA status error:', err);
      return false;
    }
  };

  return {
    isLoading,
    setup2FA,
    verifySetup,
    verifyLogin,
    disable2FA,
    check2FAStatus,
  };
}
