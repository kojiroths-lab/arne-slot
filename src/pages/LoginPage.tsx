import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Leaf, SprayCan, ShieldCheck, Wind } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAILS } from '@/config/adminAccess';
import { LanguageToggle } from '@/components/LanguageToggle';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || (mode === 'signup' && !phone.trim())) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description:
          language === 'en'
            ? mode === 'signup'
              ? 'Please enter email, phone number and password'
              : 'Please enter email and password'
            : mode === 'signup'
            ? 'অনুগ্রহ করে ইমেইল, ফোন নম্বর এবং পাসওয়ার্ড লিখুন'
            : 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড লিখুন',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const authAction = mode === 'login' ? login : signup;
      const loggedInUser = await authAction(email.trim(), phone.trim(), password);
      if (loggedInUser) {
        toast({
          title: language === 'en' ? 'Success' : 'সফল',
          description:
            language === 'en'
              ? mode === 'login'
                ? 'Login successful!'
                : 'Account created successfully!'
              : mode === 'login'
              ? 'লগইন সফল!'
              : 'অ্যাকাউন্ট তৈরি হয়েছে!'
        });

        const isAdmin = loggedInUser.email && ADMIN_EMAILS.includes(loggedInUser.email);

        if (isAdmin) {
          navigate('/admin');
        } else {
          const targetPath =
            loggedInUser.role === 'salon' || loggedInUser.role === 'collector'
              ? '/dashboard'
              : '/store';

          navigate(targetPath);
        }
      } else {
        toast({
          title: language === 'en' ? 'Error' : 'ত্রুটি',
          description:
            language === 'en'
              ? mode === 'login'
                ? 'Invalid email, phone number or password'
                : 'Sign up failed. Please check your details.'
              : mode === 'login'
              ? 'অবৈধ ইমেইল, ফোন নম্বর বা পাসওয়ার্ড'
              : 'সাইন আপ ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description:
          language === 'en'
            ? 'Login failed. Please try again.'
            : 'লগইন ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden overflow-y-auto">
      {/* SECTION 1: LOGIN HERO (OLD DESIGN) */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4 relative overflow-hidden">
        {/* Language toggle */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageToggle />
        </div>

        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/farmer-hero.jpg')" }}
        />
        {/* Soft white wash overlay to match old design */}
        <div className="absolute inset-0 bg-white/70" />

        <div className="relative z-10 w-full max-w-sm md:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-elevated p-6 md:p-8"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                src="/products/logo.png"
                alt="AMOR"
                className="mx-auto h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain"
              />
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'en' ? 'Email' : 'ইমেইল'}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'en' ? 'you@example.com' : 'you@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-3"
                    required
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={language === 'en' ? '+880 1712-345678' : '+880 1712-345678'}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      language === 'en'
                        ? 'Enter your password'
                        : 'আপনার পাসওয়ার্ড লিখুন'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading
                  ? language === 'en'
                    ? mode === 'login'
                      ? 'Logging in...'
                      : 'Creating account...'
                    : mode === 'login'
                    ? 'লগইন করা হচ্ছে...'
                    : 'অ্যাকাউন্ট তৈরি হচ্ছে...'
                  : language === 'en'
                  ? mode === 'login'
                    ? 'Login'
                    : 'Sign Up'
                  : mode === 'login'
                  ? 'লগইন'
                  : 'সাইন আপ'}
              </Button>
            </form>

            {/* Switch between Login and Sign Up */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  <span>{language === 'en' ? "Don't have an account?" : 'অ্যাকাউন্ট নেই?'}</span>{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-semibold text-primary hover:underline"
                  >
                    {language === 'en' ? 'Sign up' : 'সাইন আপ করুন'}
                  </button>
                </>
              ) : (
                <>
                  <span>{language === 'en' ? 'Already have an account?' : 'আগে থেকেই অ্যাকাউন্ট আছে?'}</span>{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold text-primary hover:underline"
                  >
                    {language === 'en' ? 'Log in' : 'লগইন করুন'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 2: URBAN IMPACT */}
      <section className="relative min-h-[80vh] bg-gradient-to-b from-emerald-50 via-emerald-50 to-emerald-100 text-emerald-950 py-16 md:py-24 px-6 md:px-10 lg:px-16">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="order-2 md:order-1"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-500 mb-3">
              {language === 'en' ? 'Urban Impact' : 'নগরীর সবুজায়ন'}
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              {language === 'en'
                ? "Greening Dhaka's Rooftops."
                : 'ঢাকার ছাদগুলোকে সবুজে রাঙাই।'}
            </h2>
            <p className="text-sm md:text-base text-emerald-900/80 mb-6 max-w-lg">
              {language === 'en'
                ? 'Our odorless, bio-liquid formula is perfect for urban gardening. Safe for your home, safe for the planet.'
                : 'আমাদের গন্ধহীন জৈব তরল সার শহুরে বাগানের জন্য একদম উপযুক্ত—বাড়ির জন্য নিরাপদ, পৃথিবীর জন্যও নিরাপদ।'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/60 p-3 md:p-4 flex flex-col gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Wind className="h-4 w-4" />
                </div>
                <p className="font-medium">{language === 'en' ? 'Odorless' : 'গন্ধহীন'}</p>
                <p className="text-emerald-900/70">
                  {language === 'en'
                    ? 'Ideal for balconies and rooftops in dense city blocks.'
                    : 'ঘনবসতিপূর্ণ শহরে বারান্দা ও ছাদের জন্য উপযোগী।'}
                </p>
              </div>

              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/60 p-3 md:p-4 flex flex-col gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <SprayCan className="h-4 w-4" />
                </div>
                <p className="font-medium">{language === 'en' ? 'Easy Spray' : 'সহজ স্প্রে'}</p>
                <p className="text-emerald-900/70">
                  {language === 'en'
                    ? 'No mixing hassles. Just spray and water as usual.'
                    : 'মিশ্রণের ঝামেলা নেই। শুধু স্প্রে করুন, স্বাভাবিক মতই পানি দিন।'}
                </p>
              </div>

              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/60 p-3 md:p-4 flex flex-col gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="font-medium">{language === 'en' ? 'Non-Toxic' : 'বিষমুক্ত'}</p>
                <p className="text-emerald-900/70">
                  {language === 'en'
                    ? 'Safe around children, pets, and rooftop gatherings.'
                    : 'শিশু, পোষা প্রাণী ও ছাদের আড্ডার জন্য নিরাপদ।'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="order-1 md:order-2 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 bg-emerald-400/30 blur-3xl rounded-3xl" />
              <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-emerald-100/70 bg-emerald-900/10">
                <motion.img
                  src="/products/12.png"
                  alt="Rooftop Garden"
                  initial={{ scale: 1.08, y: 0 }}
                  whileInView={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="h-80 md:h-96 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-emerald-50">
                  <div>
                    <p className="font-medium">
                      {language === 'en'
                        ? 'Urban Gardens Powered by Waste'
                        : 'অবর্জনার শক্তিতে শহুরে বাগান'}
                    </p>
                    <p className="text-emerald-100/80">
                      {language === 'en' ? 'Dhaka • Chattogram • Sylhet' : 'ঢাকা • চট্টগ্রাম • সিলেট'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/80 px-3 py-1 text-[10px] font-semibold shadow-md">
                    {language === 'en' ? 'Live pilot' : 'লাইভ পাইলট'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: THE SCIENCE */}
      <section className="relative min-h-[80vh] bg-[#047857] text-emerald-50 py-16 md:py-24 px-6 md:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.8),_transparent_55%),_radial-gradient(circle_at_80%_80%,_rgba(5,46,22,0.9),_transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-200 mb-2">
              {language === 'en' ? 'The Science' : 'বিজ্ঞানের শক্তি'}
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold">
              {language === 'en'
                ? 'Restoring Mother Earth.'
                : 'মাটির মায়া ফিরিয়ে দেই।'}
            </h2>
            <p className="text-sm md:text-base text-emerald-50/90 max-w-lg">
              {language === 'en'
                ? 'We replace harmful chemical Urea with amino acids derived from Keratin waste. Every liter we produce keeps hair out of landfills and slowly rebuilds soil health for the next generation.'
                : 'আমরা ক্ষতিকর রাসায়নিক ইউরিয়ার বদলে কেরাটিন বর্জ্য থেকে তৈরি অ্যামিনো অ্যাসিড ব্যবহার করি। প্রতিটি লিটার উৎপাদনে ল্যান্ডফিল থেকে চুল বাঁচে এবং ধীরে ধীরে মাটির মান ফিরে আসে ভবিষ্যৎ প্রজন্মের জন্য।'}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
              <div className="rounded-2xl bg-emerald-900/40 border border-emerald-300/40 p-4 flex flex-col gap-1">
                <p className="text-emerald-100/90 font-medium">
                  {language === 'en' ? 'Keratin to Crop' : 'কেরাটিন থেকে ফসলে'}
                </p>
                <p className="text-emerald-100/80">
                  {language === 'en'
                    ? 'Hair and salon waste become high-value amino acids for plants.'
                    : 'চুল ও সেলুন বর্জ্য পরিণত হয় গাছের জন্য উচ্চমূল্য অ্যামিনো অ্যাসিডে।'}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-900/40 border border-emerald-300/40 p-4 flex flex-col gap-1">
                <p className="text-emerald-100/90 font-medium">
                  {language === 'en' ? 'Soil Microbiome' : 'মাটির অণুজীব'}
                </p>
                <p className="text-emerald-100/80">
                  {language === 'en'
                    ? 'Feeds beneficial microbes instead of burning roots with salts.'
                    : 'লবণের ক্ষতির বদলে উপকারী অণুজীবকে পুষ্টি দেয়।'}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-900/40 border border-emerald-300/40 p-4 flex flex-col gap-1">
                <p className="text-emerald-100/90 font-medium">
                  {language === 'en' ? 'Water Efficient' : 'জল সাশ্রয়ী'}
                </p>
                <p className="text-emerald-100/80">
                  {language === 'en'
                    ? 'Improves water holding capacity and reduces runoff.'
                    : 'মাটির পানি ধারণ ক্ষমতা বাড়ায়, পানি অপচয় কমায়।'}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-900/40 border border-emerald-300/40 p-4 flex flex-col gap-1">
                <p className="text-emerald-100/90 font-medium">
                  {language === 'en' ? 'Climate Positive' : 'জলবায়ু ইতিবাচক'}
                </p>
                <p className="text-emerald-100/80">
                  {language === 'en'
                    ? 'Locks carbon in biomass instead of releasing methane from landfills.'
                    : 'ল্যান্ডফিলের মিথেনের বদলে কার্বনকে জৈব ভর হিসেবে ধরে রাখে।'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-6 bg-emerald-300/30 blur-3xl rounded-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-emerald-900/40 shadow-2xl">
                <motion.img
                  src="/products/13.png"
                  alt="Healthy Soil and Sapling"
                  initial={{ scale: 1.1, y: 8 }}
                  whileInView={{ scale: 1.02, y: 0 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="h-80 md:h-96 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-emerald-50">
                  <div>
                    <p className="font-medium">
                      {language === 'en'
                        ? 'Every liter diverts 1kg of waste'
                        : 'প্রতি লিটার বাঁচায় প্রায় ১ কেজি বর্জ্য'}
                    </p>
                    <p className="text-emerald-100/80">
                      {language === 'en'
                        ? 'From landfill to living soil.'
                        : 'ল্যান্ডফিল থেকে জীবন্ত মাটিতে।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* SECTION 3: RURAL EMPOWERMENT / GOLDEN REVOLUTION */}
      <section className="relative min-h-[80vh] bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 text-emerald-950 py-16 md:py-24 px-6 md:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_0%_0%,rgba(245,158,11,0.16),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.25),transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[45%_55%] gap-10 items-stretch">
          {/* Right on desktop, top on mobile: Farmer image */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="order-1 md:order-2"
          >
            <div className="relative w-full h-full max-h-[520px] md:max-h-none">
              <div className="absolute -inset-4 bg-amber-300/30 blur-3xl rounded-3xl" />
              <div className="relative h-full overflow-hidden rounded-3xl shadow-2xl border border-amber-100/70 bg-emerald-900/5">
                <motion.img
                  src="/images/farmer-sunset.jpg"
                  alt="Farmer with AMOR Drum"
                  initial={{ scale: 1.08, y: 6 }}
                  whileInView={{ scale: 1.02, y: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Left on desktop, bottom on mobile: Text / Impact Grid */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="order-2 md:order-1 flex flex-col justify-center space-y-6"
          >
            <div className="space-y-3">
              <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-amber-400">
                RURAL EMPOWERMENT
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-emerald-950 leading-tight">
                Feeding the Nation, Preserving the Soil.
              </h2>
              <p className="text-sm md:text-base text-emerald-900/80 leading-relaxed">
                For decades, our farmers have battled rising costs and degrading soil. AMOR changes the
                equation. By delivering high-potency bio-stimulants directly to the village level, we
                empower the backbone of our economy to grow more, spend less, and heal the land for
                future generations.
              </p>
              <p className="text-sm md:text-base text-emerald-900/90 leading-relaxed">
                যুগ যুগ ধরে আমাদের কৃষকরা মাটির উর্বরতা হারানো এবং সারের দাম বৃদ্ধির সাথে লড়াই করছেন।
                AMOR সেই দিন বদলাচ্ছে। আমরা সরাসরি গ্রামের কৃষকের হাতে পৌঁছে দিচ্ছি উচ্চমানের জৈব সার,
                যা ফলন বাড়ায় এবং মাটির প্রাণ ফিরিয়ে আনে।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/70 p-4 flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-500">Yield</p>
                <p className="text-lg md:text-xl font-semibold text-emerald-950">20% Increase</p>
                <p className="text-emerald-900/70">More grain per acre, season after season.</p>
              </div>

              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/70 p-4 flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-500">Cost</p>
                <p className="text-lg md:text-xl font-semibold text-emerald-950">30% Savings</p>
                <p className="text-emerald-900/70">On chemical urea, without compromising yield.</p>
              </div>

              <div className="rounded-2xl bg-white shadow-sm border border-emerald-100/70 p-4 flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-500">Soil</p>
                <p className="text-lg md:text-xl font-semibold text-emerald-950">100% Regenerative</p>
                <p className="text-emerald-900/70">Restores pH and supports living, breathing soil.</p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-emerald-800 hover:text-emerald-900 group w-fit"
            >
              <span className="border-b border-emerald-700/60 group-hover:border-emerald-900 transition-colors">
                Learn more
              </span>
              <span className="translate-x-0 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: FOOTER */}
      <footer className="bg-black text-emerald-50 py-6 px-6 md:px-10 lg:px-16 text-xs md:text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <Leaf className="h-4 w-4" />
            </span>
            <p className="text-emerald-100/80">AMOR • From Waste to Wealth</p>
          </div>
          <div className="flex items-center gap-4 text-emerald-100/80">
            <button type="button" className="hover:text-emerald-300 transition-colors">
              {language === 'en' ? 'About' : 'আমাদের সম্পর্কে'}
            </button>
            <button type="button" className="hover:text-emerald-300 transition-colors">
              {language === 'en' ? 'Contact' : 'যোগাযোগ'}
            </button>
            <button type="button" className="hover:text-emerald-300 transition-colors">
              {language === 'en' ? 'Terms' : 'শর্তাবলী'}
            </button>
          </div>
          <p className="text-emerald-100/70 text-[11px]">
            © AMOR 2026. {language === 'en' ? 'All rights reserved.' : 'সর্বস্বত্ব সংরক্ষিত।'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
