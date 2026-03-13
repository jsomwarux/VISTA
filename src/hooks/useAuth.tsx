import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { unregisterPushToken } from '../lib/pushNotifications';
import { User } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if auth never resolves, stop loading so the app doesn't hang
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 10000);

    supabase.auth.getSession().then((result) => {
      if (!mounted) return;
      const session = result?.data?.session ?? null;
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, retries = 3): Promise<User | null> => {
    try {
      // Race the Supabase query against a timeout to prevent hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;

      // Profile may not exist yet during signup - retry a few times
      if (!data && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchUserProfile(userId, retries - 1);
      }

      setUser(data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            username: username.toLowerCase(),
            display_name: displayName,
          });

        if (profileError) throw profileError;

        // Immediately fetch and set the user profile
        await fetchUserProfile(authData.user.id, 1);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Race against a timeout so sign-in never hangs indefinitely
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Please try again.')), 15000)
      );

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
      if (error) throw error;

      // Kick off profile fetch in the background — don't await it here.
      // The onAuthStateChange listener will also call fetchUserProfile,
      // so the profile will be ready by the time the tabs screen mounts.
      if (data?.user) {
        fetchUserProfile(data.user.id, 0).catch(() => {});
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (user) {
      await unregisterPushToken(user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updates });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
