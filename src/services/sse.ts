class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  connect(onEvent: (event: any) => void, onError?: (error: Event) => void) {
    this.disconnect(); // Close any existing connection

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      // Create SSE connection with token in URL since EventSource doesn't support headers
      const getApiBaseUrl = () => {
        const envUrl = import.meta.env.VITE_API_URL;
        if (envUrl) {
          return envUrl;
        }
        // If empty, use current origin (handles HTTPS correctly)
        return window.location.origin;
      };
      
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/v1/events/stream?token=${encodeURIComponent(token)}`;
      
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        onError?.(error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(onEvent, onError);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
    }
  }

  private scheduleReconnect(onEvent: (event: any) => void, onError?: (error: Event) => void) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect SSE (attempt ${this.reconnectAttempts})`);
      this.connect(onEvent, onError);
    }, delay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const sseService = new SSEService();
export default sseService;