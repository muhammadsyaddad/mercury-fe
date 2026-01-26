"use client";

import { useEffect, useState, useCallback } from 'react';

interface UseInactivityDetectionOptions {
  timeoutMs: number;
  onInactive: () => void;
  disabled?: boolean;
}

export const useInactivityDetection = ({ 
  timeoutMs, 
  onInactive, 
  disabled = false 
}: UseInactivityDetectionOptions) => {
  const [isInactive, setIsInactive] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    if (isInactive) {
      setIsInactive(false);
    }
  }, [isInactive]);

  const handleActivity = useCallback(() => {
    if (disabled) return;
    resetTimer();
  }, [resetTimer, disabled]);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Add event listeners
    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Set up interval to check for inactivity
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= timeoutMs && !isInactive) {
        setIsInactive(true);
        onInactive();
      }
    }, 1000); // Check every second

    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
      clearInterval(interval);
    };
  }, [disabled, lastActivity, timeoutMs, isInactive, onInactive, handleActivity]);

  // Reset timer when disabled state changes from true to false
  useEffect(() => {
    if (!disabled) {
      resetTimer();
    }
  }, [disabled, resetTimer]);

  return {
    isInactive,
    resetTimer,
    lastActivity
  };
};
