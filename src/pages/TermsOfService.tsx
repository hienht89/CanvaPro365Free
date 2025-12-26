import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, RefreshCw } from 'lucide-react';

export default function TermsOfService() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: CheckCircle,
      title: t('terms.sections.acceptance.title'),
      content: t('terms.sections.acceptance.content'),
    },
    {
      icon: FileText,
      title: t('terms.sections.service.title'),
      content: t('terms.sections.service.content'),
    },
    {
      icon: XCircle,
      title: t('terms.sections.prohibited.title'),
      content: t('terms.sections.prohibited.content'),
    },
    {
      icon: AlertTriangle,
      title: t('terms.sections.disclaimer.title'),
      content: t('terms.sections.disclaimer.content'),
    },
    {
      icon: Scale,
      title: t('terms.sections.liability.title'),
      content: t('terms.sections.liability.content'),
    },
    {
      icon: RefreshCw,
      title: t('terms.sections.changes.title'),
      content: t('terms.sections.changes.content'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-cyan-500/10" />
          <div className="container relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-sm">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {t('terms.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('terms.lastUpdated', { date: '21/12/2024' })}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Introduction */}
              <div className="p-6 rounded-xl bg-muted/50">
                <p className="text-muted-foreground leading-relaxed">
                  {t('terms.intro')}
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-13">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
