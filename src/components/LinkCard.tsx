import { useTranslation } from 'react-i18next';
import { Link } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, GraduationCap, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Public link type - excludes sensitive canva_url
type PublicLink = Omit<Link, 'canva_url'> & { category?: any };

interface LinkCardProps {
  link: PublicLink;
}

export function LinkCard({ link }: LinkCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isCanvaPro = link.category?.link_type === 'canva_pro';
  const slots = link.max_slots ? `${link.current_slots}/${link.max_slots}` : t('link.noLimit');
  const isFull = link.max_slots ? link.current_slots >= link.max_slots : false;

  const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
  const isExpiringSoon = link.expires_at 
    ? (new Date(link.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60) <= 24 && !isExpired
    : false;

  const handleClick = () => {
    if (!isFull && !isExpired) {
      navigate(`/link/${link.short_code}`);
    }
  };

  const Icon = isCanvaPro ? Crown : GraduationCap;
  const isDisabled = isFull || isExpired;

  return (
    <div className={cn(
      "group relative p-6 rounded-2xl bg-card border transition-all duration-200",
      isDisabled ? "opacity-60" : "hover:shadow-lg hover:border-primary/20"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          isCanvaPro ? "bg-primary/10" : "bg-teal-500/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isCanvaPro ? "text-primary" : "text-teal-500"
          )} />
        </div>
        
        {isCanvaPro && (
          <Crown className="w-6 h-6 text-amber-500" />
        )}
      </div>

      {/* Category label */}
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        <Users className="w-3 h-3" />
        {link.category?.name || (isCanvaPro ? 'Canva Pro' : 'Canva Education')}
      </p>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
        {link.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
        {link.description || `${t('link.joinTeam')} ${isCanvaPro ? 'Canva Pro' : 'Canva Education'} ${t('link.free')}`}
      </p>

      {/* Slots info */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge 
          variant={isFull ? "destructive" : "secondary"} 
          className="text-xs"
        >
          {slots} {t('link.slot')}
        </Badge>
        <span className="text-xs text-muted-foreground">
          • {t('link.waitSeconds')} {link.countdown_seconds}s
        </span>
        {isExpiringSoon && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            {t('home.expiringSoon')}
          </Badge>
        )}
      </div>

      {/* CTA Button */}
      <Button 
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "w-full rounded-lg",
          isDisabled && "bg-muted text-muted-foreground"
        )}
      >
        {isExpired ? t('home.expired') : isFull ? t('home.full') : t('home.joinNow')}
      </Button>
    </div>
  );
}