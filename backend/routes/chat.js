import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/chat/message - Process chat message
router.post('/message', async (req, res) => {
  try {
    const { message, userProfile, sessionId } = req.body;
    const chatbotService = req.app.locals.chatbotService;
    const logger = req.app.locals.logger;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const finalSessionId = sessionId || uuidv4();
    
    logger.info(`Processing chat message for session: ${finalSessionId}`);

    const response = await chatbotService.processMessage(message, userProfile, finalSessionId);

    res.json({
      ...response,
      sessionId: finalSessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Chat message error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: 'I apologize, but I encountered an error. Please try again.'
    });
  }
});

// GET /api/chat/session/:sessionId - Get session data
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatbotService = req.app.locals.chatbotService;

    const session = chatbotService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.id,
      businessProfile: session.businessProfile,
      currentPhase: session.currentPhase,
      messageCount: session.messages.length,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    });

  } catch (error) {
    req.app.locals.logger.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// POST /api/chat/session/reset - Reset or create new session
router.post('/session/reset', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const chatbotService = req.app.locals.chatbotService;
    
    const newSessionId = uuidv4();
    const session = chatbotService.createSession(newSessionId, userProfile);

    res.json({
      sessionId: newSessionId,
      message: 'New session created successfully',
      businessProfile: session.businessProfile
    });

  } catch (error) {
    req.app.locals.logger.error('Reset session error:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

// GET /api/chat/history/:sessionId - Get chat history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const chatbotService = req.app.locals.chatbotService;

    const session = chatbotService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = session.messages
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        data: msg.data
      }));

    res.json({
      messages,
      total: session.messages.length,
      sessionId
    });

  } catch (error) {
    req.app.locals.logger.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

export default router;
