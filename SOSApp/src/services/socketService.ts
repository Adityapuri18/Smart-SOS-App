import io, { Socket } from 'socket.io-client';
import { getPreferredBackendUrl } from './backendConfig';

const BACKEND_URL = getPreferredBackendUrl();

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  async connect(token: string) {
    try {
      this.token = token;

      this.socket = io(BACKEND_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('Error connecting socket:', error);
      return null;
    }
  }

  // Listen for real-time alert updates
  onAlertTriggered(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('alert:triggered', callback);
    }
  }

  // Listen for location updates (every 5 seconds)
  onAlertLocation(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('alert:location', callback);
    }
  }

  // Listen for alert stopped
  onAlertStopped(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('alert:stopped', callback);
    }
  }

  // Remove specific listeners
  offAlertTriggered() {
    if (this.socket) {
      this.socket.off('alert:triggered');
    }
  }

  offAlertLocation() {
    if (this.socket) {
      this.socket.off('alert:location');
    }
  }

  offAlertStopped() {
    if (this.socket) {
      this.socket.off('alert:stopped');
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
