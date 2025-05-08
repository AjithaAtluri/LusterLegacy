import { useState, useEffect } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ImpersonationBanner() {
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for impersonation cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies['impersonating_user']) {
      setImpersonatingUser(decodeURIComponent(cookies['impersonating_user']));
    }
  }, []);

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin/stop-impersonation');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Impersonation Ended',
          description: data.message || 'You have returned to your admin account.',
          variant: 'default',
        });
        
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
      } else {
        throw new Error(data.message || 'Failed to stop impersonation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop impersonation',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (!impersonatingUser) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-100 text-amber-800 py-2 px-4 flex items-center justify-between z-50 shadow-md border-t border-amber-200">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <span>
          <strong>Impersonation Mode:</strong> You are currently viewing the site as{' '}
          <span className="font-bold">{impersonatingUser}</span>
        </span>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleStopImpersonation}
        disabled={isLoading}
        className="bg-white hover:bg-amber-50 border-amber-300 text-amber-800"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Returning...
          </span>
        ) : (
          <span className="flex items-center">
            <RotateCcw className="mr-1 h-4 w-4" />
            Return to Admin Account
          </span>
        )}
      </Button>
    </div>
  );
}