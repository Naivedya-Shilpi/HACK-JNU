import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.isConnected = false;
  }

  // Initialize socket connection
  initializeSocket(sessionId) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.baseURL, {
      transports: ['websocket', 'polling']
    });

    this.sessionId = sessionId;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.socket.emit('join-session', sessionId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
    });

    return this.socket;
  }

  // Send message via HTTP API (fallback)
  async sendMessage(message, userProfile, sessionId = null) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userProfile,
          sessionId: sessionId || this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      return data;

    } catch (error) {
      console.error('Chat service error:', error);
      throw new Error('Failed to send message. Please check your connection.');
    }
  }

  // Send message via Socket.IO (real-time)
  sendMessageRealtime(message, userProfile) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected. Using fallback method.');
    }

    this.socket.emit('chat-message', {
      sessionId: this.sessionId,
      message,
      userProfile
    });
  }

  // Listen for real-time responses
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('chat-response', callback);
    }
  }

  // Listen for errors
  onError(callback) {
    if (this.socket) {
      this.socket.on('chat-error', callback);
    }
  }

  // Get session data
  async getSession(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Reset session
  async resetSession(userProfile) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat/session/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      return data;

    } catch (error) {
      console.error('Reset session error:', error);
      throw error;
    }
  }

  // Get chat history
  async getChatHistory(sessionId, limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/chat/history/${sessionId}?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get chat history error:', error);
      return { messages: [], total: 0 };
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get compliance evaluation
  async getComplianceEvaluation(businessProfile) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/compliance/evaluate?businessProfile=${encodeURIComponent(JSON.stringify(businessProfile))}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Compliance evaluation error:', error);
      throw error;
    }
  }

  // Get readiness score
  async getReadinessScore(businessProfile) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/compliance/readiness?businessProfile=${encodeURIComponent(JSON.stringify(businessProfile))}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Readiness score error:', error);
      throw error;
    }
  }

  // Get all states
  async getStates() {
    try {
      const response = await fetch(`${this.baseURL}/api/states`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get states error:', error);
      throw error;
    }
  }
}

export default new ChatService();
