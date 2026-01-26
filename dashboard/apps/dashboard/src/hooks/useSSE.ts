"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEEvent {
  type: string;
  data?: any;
  timestamp: string;
}

interface UseSSEOptions {
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export const useSSE = (options: UseSSEOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  
  const {
    onEvent,
    onError,
    onOpen,
    autoReconnect = true,
    reconnectDelay = 5000
  } = options;

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const url = `${baseUrl}/api/v1/events/stream?token=${encodeURIComponent(token)}`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: data.type,
            data: data.data,
            timestamp: data.timestamp
          };
          
          setLastEvent(sseEvent);
          onEvent?.(sseEvent);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        setError('Connection error');
        onError?.(event);

        if (autoReconnect && reconnectAttempts.current < 5) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts.current);
        }
      };

    } catch (err) {
      setError('Failed to establish SSE connection');
      console.error('SSE connection error:', err);
    }
  }, [autoReconnect, onError, onEvent, onOpen, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    connect,
    disconnect
  };
};

// Custom hook for specific event types
export const useSSEEvent = (eventType: string, handler: (data: any) => void) => {
  const { isConnected, error } = useSSE({
    onEvent: (event) => {
      if (event.type === eventType) {
        handler(event.data);
      }
    }
  });

  return { isConnected, error };
};

// Hook for new detections
export const useNewDetections = (onNewDetection: (detection: any) => void) => {
  return useSSEEvent('new_detection', onNewDetection);
};

// Hook for camera status updates
export const useCameraStatus = (onStatusChange: (status: any) => void) => {
  return useSSEEvent('camera_status', onStatusChange);
};

// Hook for system alerts
export const useSystemAlerts = (onAlert: (alert: any) => void) => {
  return useSSEEvent('system_alert', onAlert);
};
