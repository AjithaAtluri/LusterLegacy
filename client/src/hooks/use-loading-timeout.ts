import { useState, useEffect } from 'react';

/**
 * Custom hook to detect and handle prolonged loading states
 * @param isLoading Current loading state to monitor
 * @param timeoutMs Timeout in milliseconds (default: 5000ms)
 * @returns Object containing timeout state and reset function
 */
export function useLoadingTimeout(isLoading: boolean, timeoutMs = 5000) {
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const [timeoutStarted, setTimeoutStarted] = useState<number | null>(null);
  
  // Reset function to clear timeout state
  const resetTimeout = () => {
    setHasTimedOut(false);
    setTimeoutStarted(null);
  };
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If loading starts, set a timeout
    if (isLoading && !timeoutStarted) {
      const startTime = Date.now();
      setTimeoutStarted(startTime);
      
      timeoutId = setTimeout(() => {
        console.log(`Loading state timed out after ${timeoutMs}ms`);
        setHasTimedOut(true);
      }, timeoutMs);
    } 
    // If loading stops, clear timeout
    else if (!isLoading) {
      if (timeoutStarted) {
        const loadTime = Date.now() - timeoutStarted;
        console.log(`Loading completed in ${loadTime}ms`);
      }
      setTimeoutStarted(null);
      setHasTimedOut(false);
    }
    
    // Clean up timeout on unmount or state change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, timeoutMs, timeoutStarted]);
  
  return {
    hasTimedOut,
    resetTimeout,
    timeoutStarted,
    timeElapsed: timeoutStarted ? Date.now() - timeoutStarted : 0
  };
}