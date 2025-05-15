import { useState, useEffect, useRef } from 'react';

/**
 * A type defining the return value of the useLoadingTimeout hook
 */
export interface LoadingTimeoutHook {
  /**
   * Indicates if the loading operation has exceeded the timeout threshold
   */
  hasTimedOut: boolean;
  
  /**
   * The time elapsed since loading started (in milliseconds)
   */
  timeElapsed: number;
  
  /**
   * Function to manually reset the timeout state
   */
  reset: () => void;
}

/**
 * Custom hook to detect and handle prolonged loading states
 * @param isLoading Current loading state to monitor
 * @param timeoutMs Timeout in milliseconds (default: 5000ms)
 * @returns Object containing timeout state and reset function
 */
export function useLoadingTimeout(isLoading: boolean, timeoutMs = 5000): LoadingTimeoutHook {
  // State to track if loading has timed out
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // State to track elapsed time
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Ref to store the start time of loading
  const loadingStartTime = useRef<number | null>(null);
  
  // Ref to store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to reset the timeout state
  const reset = () => {
    setHasTimedOut(false);
    setTimeElapsed(0);
    loadingStartTime.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  useEffect(() => {
    // When loading starts
    if (isLoading && !loadingStartTime.current) {
      loadingStartTime.current = Date.now();
      
      // Set up interval to update elapsed time
      intervalRef.current = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsed = Date.now() - loadingStartTime.current;
          setTimeElapsed(elapsed);
          
          // Check if we've exceeded the timeout
          if (elapsed >= timeoutMs && !hasTimedOut) {
            setHasTimedOut(true);
          }
        }
      }, 100); // Update every 100ms
    }
    
    // When loading ends
    if (!isLoading && loadingStartTime.current) {
      reset();
    }
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading, timeoutMs, hasTimedOut]);
  
  return { hasTimedOut, timeElapsed, reset };
}