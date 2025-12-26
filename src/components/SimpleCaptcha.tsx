import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleCaptchaProps {
  onSuccess: () => void;
}

type CaptchaType = 'math' | 'text';

interface CaptchaChallenge {
  type: CaptchaType;
  question: string;
  answer: string;
  display?: string; // For text captcha display
}

function generateMathCaptcha(): CaptchaChallenge {
  const operators = ['+', '-', '×'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let a: number, b: number, answer: number;

  switch (operator) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    default:
      a = 5;
      b = 3;
      answer = 8;
  }

  return {
    type: 'math',
    question: `${a} ${operator} ${b} = ?`,
    answer: answer.toString(),
  };
}

function generateTextCaptcha(): CaptchaChallenge {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return {
    type: 'text',
    question: 'Nhập mã hiển thị bên dưới',
    answer: code.toUpperCase(),
    display: code,
  };
}

function generateCaptcha(): CaptchaChallenge {
  // 50% math, 50% text
  return Math.random() > 0.5 ? generateMathCaptcha() : generateTextCaptcha();
}

export function SimpleCaptcha({ onSuccess }: SimpleCaptchaProps) {
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(generateCaptcha);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setUserInput('');
    setError(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const isCorrect = userInput.trim().toUpperCase() === captcha.answer.toUpperCase();
    
    if (isCorrect) {
      onSuccess();
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      
      // Refresh captcha after 3 failed attempts
      if (attempts >= 2) {
        setTimeout(() => {
          refreshCaptcha();
          setAttempts(0);
        }, 1000);
      }
    }
  }, [userInput, captcha.answer, onSuccess, attempts, refreshCaptcha]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  // Clear error when input changes
  useEffect(() => {
    if (error) setError(false);
  }, [userInput]);

  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>{t('captcha.verify')}</span>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-4">
        {/* Captcha display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{captcha.question}</p>
            {captcha.type === 'text' && captcha.display && (
              <div 
                className="font-mono text-2xl font-bold tracking-[0.3em] select-none bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  letterSpacing: '0.3em',
                  fontStyle: 'italic',
                }}
              >
                {captcha.display.split('').map((char, i) => (
                  <span 
                    key={i}
                    style={{
                      display: 'inline-block',
                      transform: `rotate(${Math.random() * 20 - 10}deg) translateY(${Math.random() * 4 - 2}px)`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshCaptcha}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={captcha.type === 'math' ? t('captcha.enterResult') : t('captcha.enterCode')}
            className={cn(
              "text-center text-lg font-mono",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            autoComplete="off"
            autoFocus
          />
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('captcha.wrong')} {attempts >= 2 && t('captcha.generating')}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!userInput.trim()}
        >
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}
