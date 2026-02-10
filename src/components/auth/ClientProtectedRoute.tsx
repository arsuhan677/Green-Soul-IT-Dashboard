import { Navigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Loader2 } from 'lucide-react';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { isAuthenticated, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/client-login" replace />;
  }

  return <>{children}</>;
}
