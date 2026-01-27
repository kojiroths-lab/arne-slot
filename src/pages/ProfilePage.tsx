import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { User, Phone, LogOut, Settings, Lock, Edit, Tractor, Scissors, Truck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAILS } from '@/config/adminAccess';

const ProfilePage = () => {
  const { user, logout, updateUser, upgradeAccount } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [salonPhone, setSalonPhone] = useState(user?.phone || '');
  const [salonLat, setSalonLat] = useState<number | null>(null);
  const [salonLng, setSalonLng] = useState<number | null>(null);
  const [salonLocationStatus, setSalonLocationStatus] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState(user?.name || '');
  const [collectorPhone, setCollectorPhone] = useState(user?.phone || '');
  const [collectorNid, setCollectorNid] = useState('');

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Name cannot be empty' : 'নাম খালি থাকতে পারে না',
        variant: 'destructive',
      });
      return;
    }
    await updateUser({ name: newName.trim() });
    setShowNameDialog(false);
    toast({
      title: language === 'en' ? 'Success' : 'সফল',
      description: language === 'en' ? 'Name updated successfully' : 'নাম সফলভাবে আপডেট করা হয়েছে',
    });
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Please fill all fields' : 'অনুগ্রহ করে সব ক্ষেত্র পূরণ করুন',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Passwords do not match' : 'পাসওয়ার্ড মিলছে না',
        variant: 'destructive',
      });
      return;
    }

    await updateUser({ password: newPassword });
    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({
      title: language === 'en' ? 'Success' : 'সফল',
      description: language === 'en' ? 'Password updated successfully' : 'পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে',
    });
  };

  const handleUpgrade = async (newRole: 'salon' | 'collector') => {
    if (newRole === 'salon') {
      if (!salonName.trim() || !salonAddress.trim() || !salonPhone.trim()) {
        toast({
          title: language === 'en' ? 'Error' : 'ত্রুটি',
          description:
            language === 'en'
              ? 'Please fill salon name, address and contact number'
              : 'অনুগ্রহ করে সেলুনের নাম, ঠিকানা এবং যোগাযোগ নম্বর দিন',
          variant: 'destructive',
        });
        return;
      }

      if (salonLat === null || salonLng === null) {
        toast({
          title: language === 'en' ? 'Error' : 'ত্রুটি',
          description:
            language === 'en'
              ? 'Please capture the live salon location before upgrading.'
              : 'আপগ্রেড করার আগে লাইভ সেলুন লোকেশনটি ক্যাপচার করুন।',
          variant: 'destructive',
        });
        return;
      }

      await upgradeAccount('salon', {
        salonName: salonName.trim(),
        salonAddress: salonAddress.trim(),
        salonPhone: salonPhone.trim(),
        salonLat,
        salonLng,
      });
    } else {
      if (!collectorName.trim() || !collectorPhone.trim() || !collectorNid.trim()) {
        toast({
          title: language === 'en' ? 'Error' : 'ত্রুটি',
          description:
            language === 'en'
              ? 'Please fill collector name, NID number and contact number'
              : 'অনুগ্রহ করে সংগ্রাহকের নাম, এনআইডি নম্বর এবং যোগাযোগ নম্বর দিন',
          variant: 'destructive',
        });
        return;
      }

      await upgradeAccount('collector', {
        collectorName: collectorName.trim(),
        collectorPhone: collectorPhone.trim(),
        collectorNid: collectorNid.trim(),
      });
    }

    setShowUpgradeDialog(false);
    toast({
      title: language === 'en' ? 'Success' : 'সফল',
      description: language === 'en' 
        ? `Account upgraded to ${newRole === 'salon' ? 'Salon Partner' : 'Collector'}`
        : `অ্যাকাউন্ট ${newRole === 'salon' ? 'সেলুন পার্টনার' : 'সংগ্রাহক'} এ আপগ্রেড করা হয়েছে`,
    });
    // Redirect based on new role
    if (newRole === 'salon') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'farmer':
        return Tractor;
      case 'salon':
        return Scissors;
      case 'collector':
        return Truck;
      default:
        return User;
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'farmer':
        return language === 'en' ? 'Farmer' : 'কৃষক';
      case 'salon':
        return language === 'en' ? 'Salon Partner' : 'সেলুন পার্টনার';
      case 'collector':
        return language === 'en' ? 'Collector' : 'সংগ্রাহক';
      default:
        return '';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
          <AvatarFallback className="gradient-primary text-white text-2xl">
            {user?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <RoleIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-muted-foreground">{getRoleName()}</span>
        </div>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('phoneNumber')}</p>
                <p className="font-semibold">{user?.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-lg font-semibold px-2">
          {language === 'en' ? 'Settings' : 'সেটিংস'}
        </h2>
        
        {/* Edit Name */}
        <Card 
          className="shadow-card cursor-pointer hover:shadow-elevated transition-all"
          onClick={() => {
            setNewName(user?.name || '');
            setShowNameDialog(true);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Edit className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-medium">
                    {language === 'en' ? 'Change Name' : 'নাম পরিবর্তন করুন'}
                  </span>
                  <p className="text-xs text-muted-foreground">{user?.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card 
          className="shadow-card cursor-pointer hover:shadow-elevated transition-all"
          onClick={() => setShowPasswordDialog(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium">
                {language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Account Section (only for non-admin farmers) */}
      {user?.role === 'farmer' && !isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-lg font-semibold px-2">
            {language === 'en' ? 'Upgrade Account' : 'অ্যাকাউন্ট আপগ্রেড করুন'}
          </h2>
          
          <Card 
            className="shadow-card cursor-pointer hover:shadow-elevated transition-all border-2 border-primary/20"
            onClick={() => setShowUpgradeDialog(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium">
                      {language === 'en' ? 'Upgrade to Salon Partner or Collector' : 'সেলুন পার্টনার বা সংগ্রাহকে আপগ্রেড করুন'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? 'Unlock additional features' : 'অতিরিক্ত বৈশিষ্ট্য আনলক করুন'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          variant="destructive" 
          className="w-full" 
          size="lg"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {t('logout')}
        </Button>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground pt-4"
      >
        <p>{t('appName')} v1.0.0</p>
        <p>{t('tagline')}</p>
      </motion.div>

      {/* Edit Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Change Name' : 'নাম পরিবর্তন করুন'}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Enter your new name' : 'আপনার নতুন নাম লিখুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === 'en' ? 'Name' : 'নাম'}</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={language === 'en' ? 'Enter your name' : 'আপনার নাম লিখুন'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdateName}>
              {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Enter your current and new password' : 'আপনার বর্তমান এবং নতুন পাসওয়ার্ড লিখুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{language === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{language === 'en' ? 'Confirm Password' : 'পাসওয়ার্ড নিশ্চিত করুন'}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdatePassword}>
              {language === 'en' ? 'Update Password' : 'পাসওয়ার্ড আপডেট করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Account Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Upgrade Account' : 'অ্যাকাউন্ট আপগ্রেড করুন'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Choose a role to upgrade your account' 
                : 'আপনার অ্যাকাউন্ট আপগ্রেড করতে একটি ভূমিকা চয়ন করুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="salonName">{language === 'en' ? 'Salon Name' : 'সেলুনের নাম'}</Label>
                <Input
                  id="salonName"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter salon name' : 'সেলুনের নাম লিখুন'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonAddress">{language === 'en' ? 'Salon Address' : 'সেলুনের ঠিকানা'}</Label>
                <Input
                  id="salonAddress"
                  value={salonAddress}
                  onChange={(e) => setSalonAddress(e.target.value)}
                  placeholder={language === 'en' ? 'Enter salon address' : 'সেলুনের ঠিকানা লিখুন'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonPhone">{language === 'en' ? 'Salon Contact Number' : 'সেলুনের যোগাযোগ নম্বর'}</Label>
                <Input
                  id="salonPhone"
                  value={salonPhone}
                  onChange={(e) => setSalonPhone(e.target.value)}
                  placeholder={language === 'en' ? '+8801...' : '+8801...'}
                />
              </div>
              <Button
                variant="outline"
                className="w-full justify-center text-xs"
                onClick={() => {
                  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
                    setSalonLocationStatus(
                      language === 'en'
                        ? 'Location services not available on this device.'
                        : 'এই ডিভাইসে লোকেশন সার্ভিস চালু নয়।'
                    );
                    return;
                  }

                  setSalonLocationStatus(
                    language === 'en'
                      ? 'Getting current location...'
                      : 'বর্তমান অবস্থান নেওয়া হচ্ছে...'
                  );

                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setSalonLat(position.coords.latitude);
                      setSalonLng(position.coords.longitude);
                      setSalonLocationStatus(
                        language === 'en'
                          ? 'Location captured successfully.'
                          : 'লোকেশন সফলভাবে ক্যাপচার হয়েছে।'
                      );
                    },
                    () => {
                      setSalonLocationStatus(
                        language === 'en'
                          ? 'Could not access GPS location.'
                          : 'জিপিএস অবস্থান পাওয়া যায়নি।'
                      );
                    },
                    { enableHighAccuracy: true, timeout: 20000 }
                  );
                }}
              >
                {language === 'en' ? '📍 Use Current Location' : '📍 বর্তমান অবস্থান ব্যবহার করুন'}
              </Button>
              {salonLocationStatus && (
                <p className="text-xs text-muted-foreground">{salonLocationStatus}</p>
              )}
              {salonLat !== null && salonLng !== null && (
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Saved:' : 'সংরক্ষিত:'}{' '}
                  {salonLat.toFixed(4)}, {salonLng.toFixed(4)}
                </p>
              )}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2 w-full"
                onClick={() => handleUpgrade('salon')}
              >
                <Scissors className="h-8 w-8 text-primary" />
                <span className="font-semibold">{language === 'en' ? 'Salon Partner' : 'সেলুন পার্টনার'}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {language === 'en' ? 'Supply hair waste' : 'চুল বর্জ্য সরবরাহ করুন'}
                </span>
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="collectorName">{language === 'en' ? 'Collector Name' : 'সংগ্রাহকের নাম'}</Label>
                <Input
                  id="collectorName"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter collector name' : 'সংগ্রাহকের নাম লিখুন'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectorPhone">{language === 'en' ? 'Collector Contact Number' : 'সংগ্রাহকের যোগাযোগ নম্বর'}</Label>
                <Input
                  id="collectorPhone"
                  value={collectorPhone}
                  onChange={(e) => setCollectorPhone(e.target.value)}
                  placeholder={language === 'en' ? '+8801...' : '+8801...'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectorNid">{language === 'en' ? 'Collector NID Number' : 'সংগ্রাহকের এনআইডি নম্বর'}</Label>
                <Input
                  id="collectorNid"
                  value={collectorNid}
                  onChange={(e) => setCollectorNid(e.target.value)}
                  placeholder={language === 'en' ? 'Enter NID number' : 'এনআইডি নম্বর লিখুন'}
                />
              </div>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2 w-full"
                onClick={() => handleUpgrade('collector')}
              >
                <Truck className="h-8 w-8 text-primary" />
                <span className="font-semibold">{language === 'en' ? 'Collector' : 'সংগ্রাহক'}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {language === 'en' ? 'Collect from salons' : 'সেলুন থেকে সংগ্রহ করুন'}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
