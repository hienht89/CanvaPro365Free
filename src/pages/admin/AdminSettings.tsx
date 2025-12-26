import { useState, useEffect } from 'react';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { use2FA } from '@/hooks/use2FA';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Settings, Globe, Shield, Save, Loader2, KeyRound, QrCode, Copy, Check, X, AlertTriangle, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { setup2FA, verifySetup, disable2FA, check2FAStatus, isLoading: is2FALoading } = use2FA();
  const { user } = useAuth();

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [setupData, setSetupData] = useState<{ secret?: string; qrCodeUrl?: string; backupCodes?: string[] } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Account state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [form, setForm] = useState({
    site_title: '',
    site_description: '',
    default_countdown: 30,
    default_ad_url: '',
    contact_email: '',
    global_rate_limit_type: 'none',
    global_rate_limit_max: 3,
    reset_countdown_on_leave: false,
    captcha_enabled: true,
    social_facebook: '',
    social_telegram: '',
    social_zalo: '',
  });

  // Check 2FA status on mount
  useEffect(() => {
    const check = async () => {
      const enabled = await check2FAStatus();
      setIs2FAEnabled(enabled);
    };
    check();
  }, []);

  useEffect(() => {
    if (settings) {
      const socialLinks = settings.social_links || {};
      const rateLimit = settings.global_rate_limit || {};
      
      setForm({
        site_title: settings.site_title?.replace(/"/g, '') || '',
        site_description: settings.site_description?.replace(/"/g, '') || '',
        default_countdown: parseInt(settings.default_countdown) || 30,
        default_ad_url: settings.default_ad_url?.replace(/"/g, '') || '',
        contact_email: settings.contact_email?.replace(/"/g, '') || '',
        global_rate_limit_type: rateLimit.type || 'none',
        global_rate_limit_max: rateLimit.max_per_day || 3,
        reset_countdown_on_leave: settings.reset_countdown_on_leave === true,
        captcha_enabled: settings.captcha_enabled !== false, // Default to true
        social_facebook: socialLinks.facebook || '',
        social_telegram: socialLinks.telegram || '',
        social_zalo: socialLinks.zalo || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'site_title', value: JSON.stringify(form.site_title) }),
        updateSetting.mutateAsync({ key: 'site_description', value: JSON.stringify(form.site_description) }),
        updateSetting.mutateAsync({ key: 'default_countdown', value: form.default_countdown }),
        updateSetting.mutateAsync({ key: 'default_ad_url', value: JSON.stringify(form.default_ad_url) }),
        updateSetting.mutateAsync({ key: 'contact_email', value: JSON.stringify(form.contact_email) }),
        updateSetting.mutateAsync({ 
          key: 'global_rate_limit', 
          value: { type: form.global_rate_limit_type, max_per_day: form.global_rate_limit_max }
        }),
        updateSetting.mutateAsync({ key: 'reset_countdown_on_leave', value: form.reset_countdown_on_leave }),
        updateSetting.mutateAsync({ key: 'captcha_enabled', value: form.captcha_enabled }),
        updateSetting.mutateAsync({ 
          key: 'social_links', 
          value: { 
            facebook: form.social_facebook, 
            telegram: form.social_telegram, 
            zalo: form.social_zalo 
          }
        }),
      ]);
      
      toast.success('Đã lưu tất cả cài đặt');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Vui lòng nhập email mới');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast.success('Đã gửi email xác nhận đến địa chỉ mới. Vui lòng kiểm tra hộp thư.');
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Mật khẩu hiện tại không đúng');
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success('Đã cập nhật mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật mật khẩu');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Cài đặt</h1>
          <p className="text-muted-foreground">Cấu hình chung cho website</p>
        </div>

        <Button 
          onClick={handleSave} 
          className="gap-2 gradient-primary text-primary-foreground"
          disabled={updateSetting.isPending}
        >
          {updateSetting.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu cài đặt
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Cài đặt chung
            </CardTitle>
            <CardDescription>
              Thông tin cơ bản về website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">Tiêu đề website</Label>
              <Input
                id="site_title"
                value={form.site_title}
                onChange={(e) => setForm(prev => ({ ...prev, site_title: e.target.value }))}
                placeholder="CanvaPro365Free - Chia sẻ link Canva Pro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">Mô tả website</Label>
              <Textarea
                id="site_description"
                value={form.site_description}
                onChange={(e) => setForm(prev => ({ ...prev, site_description: e.target.value }))}
                placeholder="Tham gia Canva Pro & Canva Edu miễn phí..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_countdown">Thời gian đếm ngược mặc định (giây)</Label>
                <Input
                  id="default_countdown"
                  type="number"
                  value={form.default_countdown}
                  onChange={(e) => setForm(prev => ({ ...prev, default_countdown: parseInt(e.target.value) || 30 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email liên hệ</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="admin@canvapro365free.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_ad_url">URL quảng cáo mặc định</Label>
              <Input
                id="default_ad_url"
                value={form.default_ad_url}
                onChange={(e) => setForm(prev => ({ ...prev, default_ad_url: e.target.value }))}
                placeholder="https://example.com/ad"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Giới hạn truy cập
            </CardTitle>
            <CardDescription>
              Cấu hình giới hạn click toàn cục
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giới hạn</Label>
                <Select 
                  value={form.global_rate_limit_type} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, global_rate_limit_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không giới hạn</SelectItem>
                    <SelectItem value="ip">Theo IP</SelectItem>
                    <SelectItem value="fingerprint">Theo thiết bị (Fingerprint)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_clicks">Số click tối đa / ngày</Label>
                <Input
                  id="max_clicks"
                  type="number"
                  value={form.global_rate_limit_max}
                  onChange={(e) => setForm(prev => ({ ...prev, global_rate_limit_max: parseInt(e.target.value) || 3 }))}
                  disabled={form.global_rate_limit_type === 'none'}
                />
              </div>
            </div>

            {/* Anti-fraud countdown reset */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="reset_countdown">Reset countdown khi rời tab</Label>
                <p className="text-xs text-muted-foreground">
                  Bật để đếm ngược quay về từ đầu nếu người dùng chuyển tab/thu nhỏ trình duyệt (chống gian lận mạnh hơn)
                </p>
              </div>
              <Switch
                id="reset_countdown"
                checked={form.reset_countdown_on_leave}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, reset_countdown_on_leave: checked }))}
              />
            </div>

            {/* Captcha toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="captcha_enabled">Bật CAPTCHA sau đếm ngược</Label>
                <p className="text-xs text-muted-foreground">
                  Yêu cầu người dùng giải CAPTCHA sau khi đếm ngược hoàn tất để chống bot tự động
                </p>
              </div>
              <Switch
                id="captcha_enabled"
                checked={form.captcha_enabled}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, captcha_enabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Tài khoản Admin
            </CardTitle>
            <CardDescription>
              Quản lý thông tin tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current email display */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Email hiện tại</p>
              <p className="font-medium">{user?.email}</p>
            </div>

            {/* Change Email */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Đổi Email
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Nhập email mới"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button 
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail || !newEmail.trim()}
                >
                  {isUpdatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cập nhật'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Một email xác nhận sẽ được gửi đến địa chỉ mới
              </p>
            </div>

            {/* Change Password */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Đổi Mật khẩu
              </Label>
              
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                <Input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Cập nhật mật khẩu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2FA Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Xác thực 2 bước (2FA)
            </CardTitle>
            <CardDescription>
              Bảo vệ tài khoản admin bằng mã OTP từ ứng dụng xác thực
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {is2FAEnabled ? (
                  <div className="p-2 rounded-full bg-green-500/10">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-yellow-500/10">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {is2FAEnabled ? '2FA đã được bật' : '2FA chưa được bật'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled 
                      ? 'Tài khoản của bạn được bảo vệ bằng xác thực 2 bước' 
                      : 'Bật 2FA để tăng cường bảo mật tài khoản'}
                  </p>
                </div>
              </div>
              {is2FAEnabled ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShow2FADisable(true)}
                  className="text-destructive"
                >
                  Tắt 2FA
                </Button>
              ) : (
                <Button 
                  onClick={async () => {
                    const data = await setup2FA();
                    if (data) {
                      setSetupData(data);
                      setShow2FASetup(true);
                    }
                  }}
                  disabled={is2FALoading}
                >
                  {is2FALoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Bật 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Liên kết mạng xã hội
            </CardTitle>
            <CardDescription>
              Các liên kết hỗ trợ và cộng đồng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={form.social_facebook}
                onChange={(e) => setForm(prev => ({ ...prev, social_facebook: e.target.value }))}
                placeholder="https://facebook.com/canvapro365free"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={form.social_telegram}
                onChange={(e) => setForm(prev => ({ ...prev, social_telegram: e.target.value }))}
                placeholder="https://t.me/canvapro365free"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zalo">Zalo</Label>
              <Input
                id="zalo"
                value={form.social_zalo}
                onChange={(e) => setForm(prev => ({ ...prev, social_zalo: e.target.value }))}
                placeholder="https://zalo.me/canvapro365free"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Thiết lập 2FA
            </DialogTitle>
            <DialogDescription>
              Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy...)
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <img 
                  src={setupData.qrCodeUrl} 
                  alt="QR Code" 
                  className="rounded-lg border"
                />
              </div>

              {/* Manual entry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Hoặc nhập mã thủ công:
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={setupData.secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret || '');
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Backup codes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Mã backup (lưu lại để dùng khi mất điện thoại):
                </Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  {setupData.backupCodes?.map((code, i) => (
                    <code key={i} className="text-xs font-mono">{code}</code>
                  ))}
                </div>
              </div>

              {/* Verify */}
              <div className="space-y-2">
                <Label>Nhập mã OTP để xác nhận:</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShow2FASetup(false);
              setSetupData(null);
              setOtpCode('');
            }}>
              Hủy
            </Button>
            <Button 
              onClick={async () => {
                const success = await verifySetup(otpCode);
                if (success) {
                  setIs2FAEnabled(true);
                  setShow2FASetup(false);
                  setSetupData(null);
                  setOtpCode('');
                }
              }}
              disabled={otpCode.length < 6 || is2FALoading}
            >
              {is2FALoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={show2FADisable} onOpenChange={setShow2FADisable}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Tắt 2FA</DialogTitle>
            <DialogDescription>
              Nhập mã OTP hiện tại để xác nhận tắt xác thực 2 bước
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={6}
              value={disableCode}
              onChange={setDisableCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShow2FADisable(false);
              setDisableCode('');
            }}>
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                const success = await disable2FA(disableCode);
                if (success) {
                  setIs2FAEnabled(false);
                  setShow2FADisable(false);
                  setDisableCode('');
                }
              }}
              disabled={disableCode.length < 6 || is2FALoading}
            >
              {is2FALoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tắt 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
