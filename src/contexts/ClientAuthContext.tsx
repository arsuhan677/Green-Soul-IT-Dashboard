import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ClientInfo {
  id: string;
  client_code: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface ClientAuthContextType {
  client: ClientInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (clientCode: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = 'client_session_token';

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem(SESSION_KEY);
  const setSessionToken = (token: string) => localStorage.setItem(SESSION_KEY, token);
  const clearSessionToken = () => localStorage.removeItem(SESSION_KEY);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/client-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-session': sessionToken,
          },
          body: JSON.stringify({ action: 'verify' }),
        });

        const data = await response.json();
        
        if (data.valid && data.client) {
          setClient(data.client);
        } else {
          clearSessionToken();
          setClient(null);
        }
      } catch (error) {
        console.error('Session verification error:', error);
        clearSessionToken();
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (clientCode: string, password: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/client-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          client_code: clientCode,
          password,
        }),
      });

      const data = await response.json();

      if (data.success && data.session_token && data.client) {
        setSessionToken(data.session_token);
        setClient(data.client);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'লগইন ব্যর্থ হয়েছে' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে' };
    }
  };

  const logout = async () => {
    const sessionToken = getSessionToken();
    
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/client-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-session': sessionToken || '',
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSessionToken();
      setClient(null);
    }
  };

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        isAuthenticated: !!client,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

// Helper to get session token for API calls
export function getClientSessionToken() {
  return localStorage.getItem(SESSION_KEY);
}
