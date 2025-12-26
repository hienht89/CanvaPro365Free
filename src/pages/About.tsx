import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LogoIcon } from '@/components/Logo';
import { Shield, Zap, Users, Heart, CheckCircle, Globe } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('about.features.safe'),
      description: t('about.features.safeDesc'),
    },
    {
      icon: Zap,
      title: t('about.features.fast'),
      description: t('about.features.fastDesc'),
    },
    {
      icon: Users,
      title: t('about.features.community'),
      description: t('about.features.communityDesc'),
    },
    {
      icon: Globe,
      title: t('about.features.global'),
      description: t('about.features.globalDesc'),
    },
  ];

  const stats = [
    { value: '10K+', label: t('about.stats.users') },
    { value: '500+', label: t('about.stats.links') },
    { value: '7', label: t('about.stats.languages') },
    { value: '24/7', label: t('about.stats.support') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-cyan-500/10" />
          <div className="container relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-sm">
                <LogoIcon size={64} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('about.title')}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('about.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
                {t('about.mission.title')}
              </h2>
              <p className="text-muted-foreground text-center leading-relaxed mb-8">
                {t('about.mission.description')}
              </p>
              
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <CheckCircle className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{t(`about.mission.point${i}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t('about.whyChoose')}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 rounded-xl bg-background border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t('about.howItWorks.title')}
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                      {step}
                    </div>
                    <h3 className="font-semibold mb-2">{t(`about.howItWorks.step${step}`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`about.howItWorks.step${step}Desc`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-pink-500/10 to-cyan-500/10">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t('about.cta.title')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('about.cta.description')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
