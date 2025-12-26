import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { use2FA } from '@/hooks/use2FA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const authSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export default function AdminLogin() {
  const { user, isAdmin, isLoading, signIn, signUp, signOut } = useAuth();
  const { verifyLogin, check2FAStatus, isLoading: is2FALoading } = use2FA();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Check if user needs 2FA verification
  useEffect(() => {
    const check2FA = async () => {
      if (user && isAdmin && !requires2FA) {
        const is2FAEnabled = await check2FAStatus(user.id);
        if (is2FAEnabled) {
          setRequires2FA(true);
          setPendingUserId(user.id);
        }
      }
    };
    check2FA();
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show 2FA verification if required
  if (user && isAdmin && requires2FA) {
    const handle2FAVerify = async () => {
      if (otpCode.length < 6) {
        toast.error('Vui lòng nhập đủ 6 số');
        return;
      }

      setIsSubmitting(true);
      const success = await verifyLogin(otpCode, pendingUserId || undefined);
      
      if (success) {
        setRequires2FA(false);
        toast.success('Xác minh 2FA thành công!');
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error('Mã xác minh không đúng');
      }
      setIsSubmitting(false);
    };

    const handleBackupCode = async () => {
      const code = prompt('Nhập mã backup (8 ký tự):');
      if (!code) return;
      
      setIsSubmitting(true);
      const success = await verifyLogin(code.trim(), pendingUserId || undefined);
      
      if (success) {
        setRequires2FA(false);
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error('Mã backup không đúng');
      }
      setIsSubmitting(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Xác minh 2FA</CardTitle>
              <CardDescription>
                Nhập mã từ ứng dụng xác thực của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
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

              <Button 
                onClick={handle2FAVerify}
                className="w-full"
                disabled={isSubmitting || otpCode.length < 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xác minh...
                  </>
                ) : (
                  'Xác minh'
                )}
              </Button>

              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={handleBackupCode}
                  className="text-muted-foreground"
                >
                  Sử dụng mã backup
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setRequires2FA(false);
                  signOut();
                }}
              >
                Đăng xuất
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (user && isAdmin && !requires2FA) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <div className="w-full max-w-md text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Không có quyền truy cập</CardTitle>
              <CardDescription>
                Tài khoản {user.email} không có quyền admin. Vui lòng liên hệ quản trị viên.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
              <Button variant="destructive" onClick={() => signOut()}>
                Đăng xuất
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Đăng nhập thất bại: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Đăng nhập thành công!');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else {
        toast.error('Đăng ký thất bại: ' + error.message);
      }
      setIsSubmitting(false);
      return;
    }

    toast.success('Đăng ký thành công! Vui lòng liên hệ admin để được cấp quyền.');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <CardDescription>
              Đăng nhập hoặc đăng ký tài khoản admin
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="signup">Đăng ký</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      'Đăng nhập'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mật khẩu</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang đăng ký...
                      </>
                    ) : (
                      'Đăng ký tài khoản'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Sau khi đăng ký, liên hệ admin để được cấp quyền truy cập
        </p>
      </div>
    </div>
  );
}
