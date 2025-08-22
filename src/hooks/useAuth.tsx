import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin';

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('Attempting sign in with email:', email);
      
      // Clean up any existing auth state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.log('Sign out error (ignored):', signOutError);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      console.log('Sign in response:', { data: !!data.user, error });

      if (error) {
        console.error('Sign in error details:', error);
        throw error;
      }

      if (data.user) {
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        // Force reload to ensure clean state
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('invalid') && error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address (e.g., user@example.com).';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('Attempting sign up with email:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      console.log('Sign up response:', { data: !!data.user, error });

      if (error) {
        console.error('Sign up error details:', error);
        throw error;
      }

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign up failed:', error);
      
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message?.includes('invalid') && error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address (e.g., user@example.com).';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (error.message?.includes('Password should be')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Signed out successfully",
        description: "See you again soon!",
      });
      
      // Force reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile loading to prevent deadlocks
          setTimeout(() => {
            loadProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          loadProfile(session.user.id);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};