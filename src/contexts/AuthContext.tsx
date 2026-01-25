import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'farmer' | 'salon' | 'collector';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  nid?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, phone: string, password: string) => Promise<User | null>;
  signup: (email: string, phone: string, password: string) => Promise<User | null>;
  updateUser: (updates: { name?: string; password?: string }) => Promise<void>;
  upgradeAccount: (
    newRole: 'salon' | 'collector',
    options?: {
      salonName?: string;
      salonAddress?: string;
      salonPhone?: string;
      collectorName?: string;
      collectorPhone?: string;
      collectorNid?: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'amor_current_user';

const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

const saveCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());

  const login = async (email: string, phone: string, password: string): Promise<User | null> => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // First try normal sign-in
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    // If sign-in fails because the user doesn't exist or password is wrong,
    // try to sign the user up (Lovable-style auto-registration on first login).
    // Supabase usually returns 400/invalid_grant for wrong credentials.
    if (signInError || !signInData.user) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError || !signUpData.user) {
        return null;
      }

      signInData = { user: signUpData.user, session: signUpData.session } as typeof signInData;
      signInError = null;
    }

    const authUser = signInData.user!;

    // Ensure phone is also stored on the auth user so it shows up in Supabase Auth UI
    if (authUser.phone !== trimmedPhone) {
      await supabase.auth.updateUser({
        phone: trimmedPhone,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    let userRole: UserRole = 'farmer';
    let userName = 'User';

    if (!profileError && profile) {
      userRole = (profile.role as UserRole) || 'farmer';
      userName = profile.full_name || 'User';

      if (profile.phone !== trimmedPhone) {
        await supabase
          .from('profiles')
          .update({ phone: trimmedPhone })
          .eq('id', authUser.id);
      }
    } else {
      await supabase.from('profiles').insert({
        id: authUser.id,
        full_name: userName,
        phone: trimmedPhone,
        role: userRole,
      });
    }

    const appUser: User = {
      id: authUser.id,
      email: authUser.email || trimmedEmail,
      name: userName,
      phone: trimmedPhone,
      role: userRole,
    };

    setUser(appUser);
    saveCurrentUser(appUser);
    return appUser;
  };

  const signup = async (email: string, phone: string, password: string): Promise<User | null> => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (signUpError || !signUpData.user) {
      return null;
    }

    const authUser = signUpData.user;

    if (authUser.phone !== trimmedPhone) {
      await supabase.auth.updateUser({
        phone: trimmedPhone,
      });
    }

    let userRole: UserRole = 'farmer';
    let userName = 'User';

    await supabase.from('profiles').insert({
      id: authUser.id,
      full_name: userName,
      phone: trimmedPhone,
      role: userRole,
    });

    const appUser: User = {
      id: authUser.id,
      email: authUser.email || trimmedEmail,
      name: userName,
      phone: trimmedPhone,
      role: userRole,
    };

    setUser(appUser);
    saveCurrentUser(appUser);
    return appUser;
  };

  const updateUser = async (updates: { name?: string; password?: string }) => {
    if (!user) return;

    let updatedUser: User = { ...user };

    if (updates.name) {
      await supabase
        .from('profiles')
        .update({ full_name: updates.name })
        .eq('id', user.id);

      updatedUser = {
        ...updatedUser,
        name: updates.name,
      };
    }

    if (updates.password) {
      await supabase.auth.updateUser({
        password: updates.password,
      });
    }

    setUser(updatedUser);
    saveCurrentUser(updatedUser);
  };

  const upgradeAccount = async (
    newRole: 'salon' | 'collector',
    options?: {
      salonName?: string;
      salonAddress?: string;
      salonPhone?: string;
      collectorName?: string;
      collectorPhone?: string;
      collectorNid?: string;
    }
  ) => {
    if (!user) return;

    const profileUpdates: Record<string, any> = { role: newRole };

    if (newRole === 'salon') {
      if (options?.salonName) profileUpdates.salon_name = options.salonName;
      if (options?.salonAddress) profileUpdates.salon_address = options.salonAddress;
      if (options?.salonPhone) profileUpdates.phone = options.salonPhone;
    } else if (newRole === 'collector') {
      if (options?.collectorName) profileUpdates.full_name = options.collectorName;
      if (options?.collectorPhone) profileUpdates.phone = options.collectorPhone;
      if (typeof options?.collectorNid !== 'undefined') profileUpdates.nid = options.collectorNid;
    }

    await supabase.from('profiles').update(profileUpdates).eq('id', user.id);

    if (newRole === 'salon') {
      await supabase.from('salons').insert({
        profile_id: user.id,
        name: options?.salonName || user.name || 'Salon',
        address: options?.salonAddress || '',
        phone: options?.salonPhone || user.phone,
        week1_kg: 0,
        week2_kg: 0,
        week3_kg: 0,
        week4_kg: 0,
      });
    }

    const updatedUser: User = {
      ...user,
      role: newRole,
      name:
        newRole === 'salon'
          ? options?.salonName || user.name
          : options?.collectorName || user.name,
      phone:
        newRole === 'salon'
          ? options?.salonPhone || user.phone
          : options?.collectorPhone || user.phone,
      nid: newRole === 'collector' ? options?.collectorNid || user.nid : user.nid,
    };

    setUser(updatedUser);
    saveCurrentUser(updatedUser);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    saveCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      signup,
      updateUser,
      upgradeAccount,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
