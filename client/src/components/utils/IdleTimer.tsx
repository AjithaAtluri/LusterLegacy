import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface IdleTimerProps {
  timeout?: number; // Timeout in milliseconds
  onIdle?: () => void;
  warningTime?: number; // Time before timeout to show warning, in milliseconds
}

export function IdleTimer({
  timeout = 60 * 60 * 1000, // Default timeout: 60 minutes (1 hour)
  onIdle,
  warningTime = 5 * 60 * 1000, // Default warning time: 5 minutes before timeout
}: IdleTimerProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [warningTimer, setWarningTimer] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

  // Reset the timer whenever there's user activity
  const resetTimer = () => {
    setLastActivity(Date.now());
    setIsIdle(false);
    setShowWarning(false);
    
    // Clear existing timers
    if (timer) window.clearTimeout(timer);
    if (warningTimer) window.clearTimeout(warningTimer);
    
    // Set new warning timer
    const newWarningTimer = window.setTimeout(() => {
      setShowWarning(true);
      
      // Show warning toast
      toast({
        title: "Session Expiring Soon",
        description: "You'll be logged out in 5 minutes due to inactivity",
        variant: "destructive",
        duration: 30000, // 30 seconds
      });
    }, timeout - warningTime);
    
    // Set new idle timer
    const newTimer = window.setTimeout(() => {
      setIsIdle(true);
      if (onIdle) onIdle();
      
      // If user is logged in, log them out
      if (user) {
        toast({
          title: "Session Expired",
          description: "You've been logged out due to inactivity",
          variant: "destructive",
        });
        logoutMutation.mutate();
      }
    }, timeout);
    
    setWarningTimer(newWarningTimer);
    setTimer(newTimer);
  };

  // Set up event listeners for user activity
  useEffect(() => {
    if (!user) {
      // Only track idle state for logged in users
      return;
    }
    
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'wheel', 'click'
    ];
    
    // Initialize the timer when component mounts
    resetTimer();
    
    // Handler for activity events
    const handleActivity = () => {
      // Only reset if the user isn't already idle
      if (!isIdle) {
        resetTimer();
      }
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Clean up event listeners
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      // Clear timers
      if (timer) window.clearTimeout(timer);
      if (warningTimer) window.clearTimeout(warningTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isIdle]);

  return null; // This component doesn't render anything
}