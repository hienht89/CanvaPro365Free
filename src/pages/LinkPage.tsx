import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLinkByShortCode } from '@/hooks/useLinks';
import { useLinkSession } from '@/hooks/useLinkSession';
import { useFingerprint } from '@/hooks/useFingerprint';
import { useSettings } from '@/hooks/useSettings';
import { CountdownTimer } from '@/components/CountdownTimer';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Crown, 
  GraduationCap, 
  ExternalLink, 
  ArrowLeft, 
  Shield, 
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FlowState = 'loading' | 'init' | 'countdown' | 'captcha' | 'ready' | 'redirecting' | 'error';

export default function LinkPage() {
  const { t } = useTranslation();
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { data: link, isLoading, error } = useLinkByShortCode(shortCode || '');
  const { data: settings } = useSettings();
  const fingerprint = useFingerprint();
  const { session, createSession, issueRedirectToken, isCreatingSession, isIssuingToken, error: sessionError } = useLinkSession();
  
  const resetOnLeave = settings?.reset_countdown_on_leave === true;
  const captchaEnabled = settings?.captcha_enabled !== false;
  
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionInitialized = useRef(false);

  // Security: Disable right-click and dev tools shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialize session when link loads
  useEffect(() => {
    if (link && !sessionInitialized.current && fingerprint) {
      sessionInitialized.current = true;
      initSession();
    }
  }, [link, fingerprint]);

  const initSession = async () => {
    if (!link) return;
    
    setFlowState('init');
    const result = await createSession(
      link.id,
      fingerprint,
      navigator.userAgent,
      document.referrer || null
    );
    
    if (result) {
      setFlowState('countdown');
    } else {
      setFlowState('error');
      setErrorMessage(sessionError || 'Failed to initialize session');
    }
  };

  const handleCountdownComplete = useCallback(() => {
    if (captchaEnabled) {
      setFlowState('captcha');
    } else {
      setFlowState('ready');
    }
  }, [captchaEnabled]);

  const handleCaptchaSuccess = useCallback(() => {
    setFlowState('ready');
  }, []);

  const handleJoinClick = useCallback(async () => {
    if (!link || !session || flowState !== 'ready') return;

    setFlowState('redirecting');

    const result = await issueRedirectToken(session.sessionToken, link.id);
    
    if (result) {
      toast.success(t('link.redirecting'), {
        description: t('link.openingCanva'),
      });
      
      // Open the secure redirect URL
      window.location.href = result.redirectUrl;
    } else {
      setFlowState('error');
      setErrorMessage(sessionError || 'Failed to get redirect token');
      toast.error(t('link.redirectFailed'));
    }
  }, [link, session, flowState, issueRedirectToken, sessionError, t]);

  // Update flow state when loading completes
  useEffect(() => {
    if (!isLoading && link) {
      if (flowState === 'loading') {
        // Wait for fingerprint before initializing
        if (fingerprint) {
          initSession();
        }
      }
    }
  }, [isLoading, link, flowState, fingerprint]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">{t('link.notFound')}</h1>
            <p className="text-muted-foreground">
              {t('link.notFoundDesc')}
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('link.backToHome')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCanvaPro = link.category?.link_type === 'canva_pro';
  const Icon = isCanvaPro ? Crown : GraduationCap;
  const isFull = link.max_slots ? link.current_slots >= link.max_slots : false;

  if (isFull) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <Users className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">{t('link.fullSlots')}</h1>
            <p className="text-muted-foreground">
              {t('link.fullSlotsDesc')}
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('link.findOther')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (flowState === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">{t('link.error')}</h1>
            <p className="text-muted-foreground">
              {errorMessage || t('link.errorDesc')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('link.backToHome')}
              </Button>
              <Button onClick={() => window.location.reload()}>
                {t('common.retry')}
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background no-select">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('link.back')}
          </Button>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 space-y-4">
              <div className={cn(
                "inline-flex items-center justify-center w-14 h-14 rounded-2xl",
                isCanvaPro ? "bg-primary" : "bg-teal-500"
              )}>
                <Icon className="w-7 h-7 text-white" />
              </div>

              <div>
                <Badge variant="secondary" className="mb-3">
                  {link.category?.name || 'Canva Pro'}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {link.title}
                </h1>
                {link.description && (
                  <p className="text-muted-foreground mt-2">{link.description}</p>
                )}
              </div>

              {link.max_slots && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {link.max_slots - link.current_slots} / {link.max_slots} {t('link.slotsRemaining')}
                  </span>
                </div>
              )}
            </div>

            {/* Flow states */}
            {(flowState === 'loading' || flowState === 'init' || isCreatingSession) && (
              <div className="max-w-md mx-auto">
                <div className="bg-card rounded-2xl border p-8 text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">{t('link.initializing')}</p>
                </div>
              </div>
            )}

            {flowState === 'countdown' && (
              <CountdownTimer
                seconds={link.countdown_seconds}
                onComplete={handleCountdownComplete}
                adUrl={link.protection_type !== 'countdown' ? link.ad_url : null}
                resetOnLeave={resetOnLeave}
              />
            )}

            {flowState === 'captcha' && (
              <div className="max-w-md mx-auto">
                <div className="bg-card rounded-2xl border p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('link.countdownComplete')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('link.completeVerification')}
                    </p>
                  </div>
                  <SimpleCaptcha onSuccess={handleCaptchaSuccess} />
                </div>
              </div>
            )}

            {flowState === 'ready' && (
              <div className="max-w-md mx-auto">
                <div className="bg-card rounded-2xl border p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('link.unlocked')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('link.unlockedDesc')}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">{t('link.instructions')}</p>
                      <p>{t('link.instructionsDesc')}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleJoinClick}
                    disabled={isIssuingToken}
                    size="lg"
                    className="w-full gap-2"
                  >
                    {isIssuingToken ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('link.processing')}
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        {t('link.joinNow')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {flowState === 'redirecting' && (
              <div className="max-w-md mx-auto">
                <div className="bg-card rounded-2xl border p-8 text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-green-500" />
                  <h3 className="text-lg font-semibold">{t('link.redirectingTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('link.redirectingDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
