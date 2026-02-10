import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { usePermissions, PermissionKey } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionGateProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function PermissionGate({ 
  permission, 
  children, 
  fallbackMessage = "আপনার এই ফিচারে অনুমতি নেই।" 
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                অ্যাক্সেস নেই
              </h2>
              <p className="text-muted-foreground">
                {fallbackMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
