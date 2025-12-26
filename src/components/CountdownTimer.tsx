import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Lock, ExternalLink, Timer, Shield, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  adUrl?: string | null;
  resetOnLeave?: boolean;
}

export function CountdownTimer({ seconds, onComplete, adUrl, resetOnLeave = false }: CountdownTimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasVisitedAd, setHasVisitedAd] = useState(!adUrl);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset when a new countdown is created
  useEffect(() => {
    clearTimer();
    setTimeLeft(seconds);
    setIsCompleted(false);
    setHasVisitedAd(!adUrl);
    setIsPaused(false);
  }, [seconds, adUrl, clearTimer]);

  // Pause or reset timer when tab/window is not active
  useEffect(() => {
    const handleLeave = () => {
      clearTimer();
      if (resetOnLeave) {
        // Reset to beginning when leaving
        setTimeLeft(seconds);
        setIsPaused(false);
      } else {
        // Just pause
        setIsPaused(true);
      }
    };

    const handleReturn = () => {
      setIsPaused(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleLeave();
      else handleReturn();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleLeave);
    window.addEventListener('focus', handleReturn);
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('pageshow', handleReturn);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleLeave);
      window.removeEventListener('focus', handleReturn);
      window.removeEventListener('pagehide', handleLeave);
      window.removeEventListener('pageshow', handleReturn);
    };
  }, [clearTimer, resetOnLeave, seconds]);

  // Countdown timer logic
  useEffect(() => {
    if (isPaused || isCompleted) return;
    if (timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isPaused, isCompleted, timeLeft, clearTimer]);

  // Complete when countdown hits 0 AND ad requirement is satisfied
  useEffect(() => {
    if (isCompleted) return;
    if (timeLeft <= 0 && hasVisitedAd) {
      setIsCompleted(true);
      onComplete();
    }
  }, [timeLeft, hasVisitedAd, isCompleted, onComplete]);

  const handleVisitAd = useCallback(() => {
    if (adUrl) {
      window.open(adUrl, '_blank', 'noopener,noreferrer');
      setHasVisitedAd(true);
    }
  }, [adUrl]);

  const safeTimeLeft = Math.max(0, timeLeft);
  const progress = seconds > 0 ? ((seconds - safeTimeLeft) / seconds) * 100 : 100;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl border overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 space-y-6">
          {/* Timer display */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary">
              <span className={cn(
                "text-3xl font-bold text-primary-foreground",
                timeLeft <= 5 && timeLeft > 0 && "animate-pulse"
              )}>
                {timeLeft}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                {isPaused ? (
                  <>
                    <Pause className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400">{t('countdown.paused')}</span>
                  </>
                ) : (
                  <>
                    <Timer className="w-4 h-4" />
                    {isCompleted ? t('countdown.ready') : t('countdown.pleaseWait')}
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPaused 
                  ? (resetOnLeave 
                      ? t('countdown.resetMessage')
                      : t('countdown.returnToResume'))
                  : isCompleted 
                    ? t('countdown.canAccessNow')
                    : t('countdown.secondsLeft', { count: safeTimeLeft })
                }
              </p>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t('countdown.security')}</p>
              <p>{t('countdown.securityDesc')}</p>
            </div>
          </div>

          {/* Ad button (if required) */}
          {adUrl && !hasVisitedAd && (
            <Button 
              onClick={handleVisitAd}
              variant="outline"
              className="w-full gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {t('countdown.visitAd')}
            </Button>
          )}

          {/* Status indicator */}
          {!isCompleted && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-sm">{t('countdown.protected')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
