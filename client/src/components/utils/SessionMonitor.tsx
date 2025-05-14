import { useEffect, useState } from 'react';
import { IdleTimer } from './IdleTimer';
import { useAuth } from '@/hooks/use-auth';

interface SessionMonitorProps {
  idleTimeout?: number; // Idle timeout in milliseconds (default: 10 minutes)
  warningTime?: number; // Warning time in milliseconds (default: 1 minute)
}

/**
 * SessionMonitor component that handles automatic session logout after a period of inactivity.
 * This component is intended to be included at the application root level.
 */
export function SessionMonitor({
  idleTimeout = 10 * 60 * 1000, // 10 minutes
  warningTime = 60 * 1000, // 1 minute
}: SessionMonitorProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);

  // Only enable the session monitor when a user is logged in
  useEffect(() => {
    if (user) {
      setIsActive(true);
      console.log('Session monitor activated for user:', user.loginID);
    } else {
      setIsActive(false);
      console.log('Session monitor deactivated - no user logged in');
    }
  }, [user]);

  // Handle idle logout
  const handleIdle = () => {
    console.log('User session idle timeout reached, logging out');
    // The IdleTimer component will handle the actual logout
  };

  // Only render the IdleTimer if there's an active user session
  if (!isActive) return null;

  return (
    <IdleTimer 
      timeout={idleTimeout}
      warningTime={warningTime}
      onIdle={handleIdle}
    />
  );
}