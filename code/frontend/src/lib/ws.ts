/**
 * WebSocket service for real-time updates
 * Falls back to polling if WebSocket is unavailable
 */

type MessageHandler = (data: any) => void;
type EventType = 'cluster_update' | 'new_opinion' | 'chat_message' | 'cluster_created';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private handlers: Map<EventType, Set<MessageHandler>> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private topicUuid: string | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(topicUuid?: string): Promise<void> {
    this.topicUuid = topicUuid || '';
    
    return new Promise((resolve, reject) => {
      if (!this.isWebSocketSupported()) {
        console.warn('WebSocket not supported, falling back to polling');
        this.startPolling(topicUuid || '');
        resolve();
        return;
      }

      try {
        const wsUrl = `${this.config.url}/ws/${topicUuid || ''}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          if (this.isPolling) {
            this.stopPolling();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (topicUuid) {
            this.reconnect(topicUuid);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.startPolling(topicUuid || '');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, handler: MessageHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: any): void {
    const { type, payload } = data;
    const handlers = this.handlers.get(type as EventType);
    
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  /**
   * Reconnect logic
   */
  private reconnect(topicUuid: string): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached, falling back to polling');
      this.startPolling(topicUuid);
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect(topicUuid);
    }, this.config.reconnectInterval);
  }

  /**
   * Start polling fallback
   */
  private startPolling(topicUuid: string): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    const pollInterval = 5000; // Poll every 5 seconds

    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for updates (you'll need to implement the polling endpoint)
        const response = await fetch(`/api/poll/${topicUuid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.updates) {
            data.updates.forEach((update: any) => {
              this.handleMessage(update);
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollInterval);
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  /**
   * Check if WebSocket is supported
   */
  private isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }
}

// Create singleton instance
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4200';
export const wsService = new WebSocketService({ url: WS_URL });

/**
 * Get WebSocket service instance
 */
export const getWebSocketService = () => wsService;

/**
 * Hook for using WebSocket service in React components
 */
export const useWebSocket = (topicUuid: string | null, handlers?: Partial<Record<EventType, MessageHandler>>) => {
  // Import useEffect and useRef when using in React
  // For now, this is a utility export
  
  if (topicUuid && handlers) {
    Object.entries(handlers).forEach(([eventType, handler]) => {
      if (handler) {
        wsService.on(eventType as EventType, handler);
      }
    });
  }
  
  return wsService;
};