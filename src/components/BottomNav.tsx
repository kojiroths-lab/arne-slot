import { Home, LayoutDashboard, ScanLine, User, ShoppingBag, MapPin, FlaskConical, Calculator, Stethoscope } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAILS } from '@/config/adminAccess';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const getNavItems = () => {
    const baseItems: Array<{ icon: typeof Home; label: string; path: string }> = [];

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    if (isAdmin) {
      baseItems.push({ icon: LayoutDashboard, label: language === 'en' ? 'Admin' : 'অ্যাডমিন', path: '/admin' });
    } else if (user?.role === 'farmer') {
      baseItems.push({ icon: ShoppingBag, label: language === 'en' ? 'Store' : 'দোকান', path: '/store' });
      baseItems.push({ icon: LayoutDashboard, label: language === 'en' ? 'Cart' : 'কার্ট', path: '/cart' });
      baseItems.push({ icon: FlaskConical, label: language === 'en' ? 'Process' : 'প্রক্রিয়া', path: '/process' });
      baseItems.push({ icon: Calculator, label: language === 'en' ? 'Calculator' : 'ক্যালকুলেটর', path: '/calculator' });
      baseItems.push({ icon: Stethoscope, label: language === 'en' ? 'Doctor' : 'ডাক্তার', path: '/doctor' });
    } else if (user?.role === 'salon') {
      baseItems.push({ icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' });
      baseItems.push({ icon: Stethoscope, label: language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড', path: '/leaderboard' });
    } else if (user?.role === 'collector') {
      baseItems.push({ icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' });
      baseItems.push({ icon: MapPin, label: t('map'), path: '/map' });
    }

    baseItems.push({ icon: User, label: t('profile'), path: '/profile' });

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'animate-bounce-subtle')} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
