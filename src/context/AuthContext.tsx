'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserProfileStats } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  stats: UserProfileStats | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = async (currentUser: User) => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setProfile(json.profile);
        }
        if (json.stats) {
          setStats(json.stats);
        }
        return;
      }
    } catch {
      // Fallback to client
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Sync new user into live public.profiles in Supabase
        const newProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || '',
          phone: currentUser.user_metadata?.phone || '',
          state: currentUser.user_metadata?.state || 'Abuja (FCT)',
          address: currentUser.user_metadata?.address || '',
        };
        await supabase.from('profiles').upsert(newProfile);
        setProfile(newProfile);
      }
    } catch (e) {
      console.warn('Error fetching live profile from Supabase:', e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setProfile(json.profile);
          return { data: json.profile, error: null };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          return { data: null, error: errJson.error };
        }
      }
    } catch {
      // Fallback to direct client
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
        return { data, error: null };
      }
      return { data: null, error: error?.message || 'Update failed' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Update failed' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_password', newPassword }),
      });

      if (res.ok) {
        return { success: true, error: null };
      }
      const json = await res.json().catch(() => ({}));
      if (json.error) {
        return { success: false, error: json.error };
      }
    } catch {
      // Fallback to client
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password update failed' };
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchProfile(session.user);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setProfile(null);
            setStats(null);
          }
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    initializeAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setStats(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        stats,
        isLoading,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
