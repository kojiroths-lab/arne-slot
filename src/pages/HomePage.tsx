import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Recycle, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const stats = [
    { icon: Recycle, value: '5,240', labelEn: 'Kg Waste Collected', labelBn: 'কেজি বর্জ্য সংগৃহীত' },
    { icon: Users, value: '124', labelEn: 'Partner Salons', labelBn: 'পার্টনার সেলুন' },
    { icon: TrendingUp, value: '৳1.2M', labelEn: 'Earnings Distributed', labelBn: 'বিতরিত আয়' },
  ];

  const getWelcomeMessage = () => {
    const name = user?.name || 'User';
    return language === 'en' ? `Welcome back, ${name}!` : `স্বাগতম, ${name}!`;
  };

  const getRoleMessage = () => {
    switch (user?.role) {
      case 'farmer':
        return language === 'en' 
          ? 'Browse our organic fertilizers made from recycled salon waste.'
          : 'পুনর্ব্যবহৃত সেলুন বর্জ্য থেকে তৈরি আমাদের জৈব সার দেখুন।';
      case 'salon':
        return language === 'en'
          ? 'Track your waste contributions and earnings.'
          : 'আপনার বর্জ্য অবদান এবং আয় ট্র্যাক করুন।';
      case 'collector':
        return language === 'en'
          ? 'View your pickup routes and pending collections.'
          : 'আপনার পিকআপ রুট এবং বকেয়া সংগ্রহ দেখুন।';
      case 'admin':
        return language === 'en'
          ? 'Monitor all operations and partner locations.'
          : 'সমস্ত কার্যক্রম এবং অংশীদার অবস্থান পর্যবেক্ষণ করুন।';
      default:
        return '';
    }
  };

  const getActionButton = () => {
    switch (user?.role) {
      case 'farmer':
        return { path: '/store', label: language === 'en' ? 'Visit Store' : 'দোকানে যান' };
      case 'salon':
        return { path: '/dashboard', label: language === 'en' ? 'View Dashboard' : 'ড্যাশবোর্ড দেখুন' };
      case 'collector':
        return { path: '/map', label: language === 'en' ? 'View Routes' : 'রুট দেখুন' };
      case 'admin':
        return { path: '/map', label: language === 'en' ? 'View Map' : 'মানচিত্র দেখুন' };
      default:
        return { path: '/dashboard', label: t('dashboard') };
    }
  };

  const action = getActionButton();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-nature px-4 pt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow"
            >
              <Leaf className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{getWelcomeMessage()}</h1>
              <p className="text-muted-foreground">{getRoleMessage()}</p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => navigate(action.path)}
          >
            {action.label}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 -mt-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelEn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-card rounded-xl p-4 shadow-card text-center"
            >
              <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">
                {language === 'en' ? stat.labelEn : stat.labelBn}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="earnings-card"
          >
            <h2 className="text-lg font-semibold mb-2">
              {language === 'en' ? 'About AMOR' : 'আমোর সম্পর্কে'}
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              {language === 'en'
                ? 'AMOR transforms salon waste into valuable organic fertilizers, creating a sustainable circular economy. We connect salons, collectors, and farmers to reduce waste and promote eco-friendly agriculture.'
                : 'আমোর সেলুন বর্জ্যকে মূল্যবান জৈব সারে রূপান্তরিত করে, একটি টেকসই চক্রাকার অর্থনীতি তৈরি করে। আমরা বর্জ্য কমাতে এবং পরিবেশ বান্ধব কৃষির প্রচার করতে সেলুন, সংগ্রাহক এবং কৃষকদের সংযুক্ত করি।'}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
