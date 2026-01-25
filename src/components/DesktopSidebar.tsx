import { Home, LayoutDashboard, ShoppingBag, MapPin, User, LogOut, Leaf, Menu, FlaskConical, Calculator, Stethoscope } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAILS } from '@/config/adminAccess';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useState } from 'react';

export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    const items: Array<{ icon: typeof Home; label: string; path: string }> = [];

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    if (isAdmin) {
      // Admin owners see only the admin dashboard (plus profile added below)
      items.push({ icon: LayoutDashboard, label: language === 'en' ? 'Admin Dashboard' : 'অ্যাডমিন ড্যাশবোর্ড', path: '/admin' });
    } else if (user?.role === 'farmer') {
      items.push({ icon: ShoppingBag, label: language === 'en' ? 'Store' : 'দোকান', path: '/store' });
      items.push({ icon: LayoutDashboard, label: language === 'en' ? 'Cart' : 'কার্ট', path: '/cart' });
      items.push({ icon: FlaskConical, label: language === 'en' ? 'Our Process' : 'আমাদের প্রক্রিয়া', path: '/process' });
      items.push({ icon: Calculator, label: language === 'en' ? 'Crop Calculator' : 'ফসল ক্যালকুলেটর', path: '/calculator' });
      items.push({ icon: Stethoscope, label: language === 'en' ? 'Crop Doctor AI' : 'ফসল ডাক্তার AI', path: '/doctor' });
    } else if (user?.role === 'salon') {
      items.push({ icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' });
      items.push({ icon: Stethoscope, label: language === 'en' ? 'Leaderboard' : 'লিডারবোর্ড', path: '/leaderboard' });
    } else if (user?.role === 'collector') {
      items.push({ icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' });
      items.push({ icon: MapPin, label: t('map'), path: '/map' });
    }

    items.push({ icon: User, label: t('profile'), path: '/profile' });

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 gradient-primary text-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
            <img
              src="/products/logo.png"
              alt="AMOR"
              className="h-8 w-8 object-contain"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold">{t('appName')}</h1>
              <p className="text-xs text-white/70">Circular Economy</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all',
                isActive
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/80 hover:bg-white/10',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {!collapsed && <LanguageToggle />}
        <Button
          variant="ghost"
          className={cn(
            'w-full text-white/80 hover:text-white hover:bg-white/10',
            collapsed && 'px-2'
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {!collapsed && t('logout')}
        </Button>
      </div>
    </aside>
  );
};
