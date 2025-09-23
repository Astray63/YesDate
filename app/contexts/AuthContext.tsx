import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, supabase } from '../services/supabase';
import { customStorage } from '../utils/storage';

interface User {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Vérifier la session au démarrage avec retry et vérification du stockage
    const checkSession = async () => {
      try {
        // Vérifier la sanité du stockage avec retry
        let isStorageHealthy = await customStorage.isStorageHealthy();
        if (!isStorageHealthy) {
          console.warn('Storage is not healthy, attempting to reinitialize...');
          await customStorage.reinitialize();
          isStorageHealthy = await customStorage.isStorageHealthy();
          
          if (!isStorageHealthy) {
            console.warn('Storage is not healthy, session persistence may be affected');
          } else {
            console.log('Storage successfully reinitialized');
          }
        }

        // Nettoyer les sessions expirées
        await customStorage.cleanExpiredSessions();

        // Attendre un peu pour laisser le temps au localStorage de se charger
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session check error:', error.message);
          // Ne pas throw l'erreur, juste logger et continuer
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('Session restored:', session ? 'User logged in' : 'No session');
          
          // Log des informations de debug pour le développement (seulement en dev)
          if (session && __DEV__) {
            if (session.expires_at) {
              console.log('Session expires at:', new Date(session.expires_at * 1000));
            }
            console.log('Session refresh token present:', !!session.refresh_token);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (__DEV__) {
          console.log('Auth state changed:', event, session ? 'Session present' : 'No session');
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Log pour le debug (seulement en dev)
          if (__DEV__) {
            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in, session will persist');
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, session cleared');
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      
      // La mise à jour de l'état sera gérée par le listener onAuthStateChange
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await authService.signUp(email, password, fullName);
      
      // La mise à jour de l'état sera gérée par le listener onAuthStateChange
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
