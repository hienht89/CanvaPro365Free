import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Moon, Sun, Shield, Menu, Home, Link2, HelpCircle, Sparkles, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transition');
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Home, action: () => isHomePage ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/') },
    { id: 'links-section', label: t('nav.links'), icon: Link2, action: () => scrollToSection('links-section') },
    { id: 'features-section', label: t('nav.features'), icon: Sparkles, action: () => scrollToSection('features-section') },
    { id: 'faq-section', label: t('nav.faq'), icon: HelpCircle, action: () => scrollToSection('faq-section') },
    { id: 'about', label: t('nav.about'), icon: Info, action: () => { navigate('/about'); setMobileMenuOpen(false); } },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${
      scrolled 
        ? 'bg-background/95 backdrop-blur-sm border-b shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full relative overflow-hidden"
            onClick={toggleTheme}
          >
            <Sun className={`w-5 h-5 absolute transition-all duration-300 ${
              isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
            }`} />
            <Moon className={`w-5 h-5 transition-all duration-300 ${
              isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`} />
          </Button>
          
          <Link to="/admin" className="hidden sm:block">
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <Shield className="w-4 h-4" />
              {t('nav.admin')}
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 mt-6">
                <Logo size="sm" />
                
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}
                  
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    {t('nav.admin')}
                  </Link>
                </nav>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground px-4 mb-4">{t('footer.disclaimer')}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
