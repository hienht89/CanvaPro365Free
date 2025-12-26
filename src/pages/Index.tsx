import { useTranslation } from 'react-i18next';
import { useActiveLinks } from '@/hooks/useLinks';
import { useActiveCategories } from '@/hooks/useCategories';
import { LinkCard } from '@/components/LinkCard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, GraduationCap, Sparkles, Shield, Zap, Users, Check, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

function SEOHead() {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = 'CanvaPro365Free - ' + t('home.title');
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('home.subtitle'));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t('home.subtitle');
      document.head.appendChild(meta);
    }
  }, [t]);
  
  return null;
}

export default function Index() {
  const { t } = useTranslation();
  const { data: links, isLoading: linksLoading, refetch: refetchLinks } = useActiveLinks();
  const { data: categories, isLoading: categoriesLoading } = useActiveCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const filteredLinks = selectedCategory 
    ? links?.filter(link => link.category_id === selectedCategory)
    : links;

  const isLoading = linksLoading || categoriesLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['links'] });
    await refetchLinks();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const features = [
    { key: 'free', label: t('home.features.free') },
    { key: 'instant', label: t('home.features.instantAccess') },
    { key: 'full', label: t('home.features.fullFeatures') }
  ];

  const whyFeatures = [
    { icon: Shield, title: t('home.secure'), description: t('home.secureDesc') },
    { icon: Zap, title: t('home.fast'), description: t('home.fastDesc') },
    { icon: Users, title: t('home.community'), description: t('home.communityDesc') }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead />
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 gradient-hero overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                {t('home.title')}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('home.subtitle')}
              </p>

              <div className="flex flex-wrap justify-center gap-6 pt-4">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="py-8 border-b bg-background sticky top-16 z-40">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/50 border">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                    selectedCategory === null 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('common.all')}
                </button>
                
                {categories?.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                      selectedCategory === category.id 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {category.link_type === 'canva_pro' 
                      ? <Crown className="w-4 h-4" /> 
                      : <GraduationCap className="w-4 h-4" />
                    }
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Links Grid */}
        <section id="links-section" className="py-12 md:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold">
                {selectedCategory 
                  ? categories?.find(c => c.id === selectedCategory)?.name 
                  : t('home.availableLinks')}
                {filteredLinks && ` (${filteredLinks.length})`}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                {t('common.refresh')}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-6 border rounded-2xl bg-card">
                    <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-7 w-32 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-6" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredLinks && filteredLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLinks.map((link, index) => (
                  <div 
                    key={link.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <LinkCard link={link} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                  <Crown className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.noLinks')}</h3>
                <p className="text-muted-foreground">
                  {t('home.checkBackLater')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t('home.whyCanvaPro365Free')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {whyFeatures.map((feature, i) => (
                <div 
                  key={i}
                  className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <div id="faq-section">
          <FAQ />
        </div>

        {/* CTA Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t('home.readyToExplore')}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t('home.readyDesc')}
              </p>
              <Button 
                size="lg"
                className="rounded-full px-8"
                onClick={() => document.getElementById('links-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('home.exploreNow')}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}