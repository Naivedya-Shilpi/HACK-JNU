import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import winston from 'winston';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import chatRoutes from './routes/chat.js';
import complianceRoutes from './routes/compliance.js';
import userRoutes from './routes/user.js';
import stateRoutes from './routes/states.js';
import ollamaRoutes from './routes/ollama.js';
import dashboardRoutes from './routes/dashboard.js';

// Import services
import { ChatbotService } from './services/ChatbotService.js';
import { RuleEngine } from './services/RuleEngine.js';
import { ComplianceService } from './services/ComplianceService.js';

// Load environment variables - prioritize .env.local over .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envLocalPath = join(__dirname, '.env.local');
const envPath = join(__dirname, '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('✅ Loaded environment from .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment from .env');
} else {
  console.log('⚠️ No .env file found - using system environment variables');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Initialize services
const ruleEngine = new RuleEngine();
const complianceService = new ComplianceService();
const chatbotService = new ChatbotService(ruleEngine, complianceService);

// Make services available to routes
app.locals.chatbotService = chatbotService;
app.locals.ruleEngine = ruleEngine;
app.locals.complianceService = complianceService;
app.locals.logger = logger;

// Make orchestrator available for Ollama testing
app.set('orchestrator', chatbotService.orchestrator);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      chatbot: 'active',
      ruleEngine: 'active',
      compliance: 'active'
    }
  });
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    logger.info(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on('chat-message', async (data) => {
    try {
      const { sessionId, message, userProfile } = data;
      
      // Process message through chatbot service
      const response = await chatbotService.processMessage(message, userProfile, sessionId);
      
      // Send response back to client
      io.to(sessionId).emit('chat-response', response);
      
      logger.info(`Chat response sent to session ${sessionId}`);
    } catch (error) {
      logger.error('Chat processing error:', error);
      socket.emit('chat-error', { error: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 MSME Compliance Backend running on port ${PORT}`);
  logger.info(`📡 Socket.IO server ready for real-time chat`);
  logger.info(`🤖 AI Chatbot service initialized`);
});

export default app;
