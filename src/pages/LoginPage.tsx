import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Leaf } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAILS } from '@/config/adminAccess';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/8125507/pexels-photo-8125507.jpeg')`,
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-elevated p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/products/logo.png"
              alt="AMOR"
              className="mx-auto h-32 w-32 object-contain"
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
                  placeholder={language === 'en' ? 'Enter your password' : 'আপনার পাসওয়ার্ড লিখুন'}
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
  );
};

export default LoginPage;
