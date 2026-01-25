import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { LanguageToggle } from './LanguageToggle';
import { Leaf } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 glass border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
                <img
                  src="/products/logo.png"
                  alt="AMOR"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-primary">{t('appName')}</span>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
};
