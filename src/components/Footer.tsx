import { useTranslation } from 'react-i18next';
import { Heart, ExternalLink, Mail, MessageCircle, Facebook, Send, Home, Link2, HelpCircle, Sparkles, Shield, FileText, Info } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useSettings } from '@/hooks/useSettings';

export function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  
  const isHomePage = location.pathname === '/';
  
  const contactEmail = settings?.contact_email || 'admin@canvapro365free.com';
  const telegramLink = settings?.telegram_link || '';
  const facebookLink = settings?.facebook_link || '';
  const zaloLink = settings?.zalo_link || '';

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickLinks = [
    { label: t('nav.home'), action: () => isHomePage ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'), icon: Home },
    { label: t('nav.links'), action: () => scrollToSection('links-section'), icon: Link2 },
    { label: t('nav.features'), action: () => scrollToSection('features-section'), icon: Sparkles },
    { label: t('nav.faq'), action: () => scrollToSection('faq-section'), icon: HelpCircle },
    { label: t('nav.about'), action: () => navigate('/about'), icon: Info },
  ];

  const legalLinks = [
    { label: t('footer.privacy'), to: '/privacy', icon: Shield },
    { label: t('footer.terms'), to: '/terms', icon: FileText },
    { label: t('footer.contactUs'), to: '/contact', icon: Mail },
  ];

  const supportLinks = [
    { label: 'Email', href: `mailto:${contactEmail}`, icon: Mail, show: true },
    { label: 'Telegram', href: telegramLink, icon: Send, show: !!telegramLink },
    { label: 'Facebook', href: facebookLink, icon: Facebook, show: !!facebookLink },
    { label: 'Zalo', href: zaloLink, icon: MessageCircle, show: !!zaloLink },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-muted-foreground max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-3">
              {supportLinks.filter(link => link.show && link.href).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.quickLinks')}</h3>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Support & Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.support')}</h3>
            <nav className="flex flex-col gap-2">
              <a 
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t('footer.contact')}
              </a>
              <a 
                href="https://canva.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Canva.com
              </a>
              <Link 
                to="/admin"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="w-4 h-4" />
                {t('nav.admin')}
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-10 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{t('footer.madeWith')}</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="w-3 h-3" />
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Disclaimer */}
            <p className="text-xs text-center text-muted-foreground max-w-lg">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
