import { Router } from 'express';

const router = Router();

/**
 * Test Ollama integration
 */
router.get('/status', async (req, res) => {
  try {
    // Get orchestrator from app context (will be set in server.js)
    const orchestrator = req.app.get('orchestrator');
    
    if (!orchestrator || !orchestrator.ollamaService) {
      return res.status(500).json({
        error: 'Orchestrator or Ollama service not available'
      });
    }

    const status = orchestrator.ollamaService.getStatus();
    
    res.json({
      success: true,
      ollama: status,
      message: status.available ? 'Ollama is ready!' : 'Ollama not available'
    });
    
  } catch (error) {
    console.error('❌ Ollama status check error:', error);
    res.status(500).json({
      error: 'Failed to check Ollama status',
      details: error.message
    });
  }
});

/**
 * Test Ollama response generation
 */
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const orchestrator = req.app.get('orchestrator');
    
    if (!orchestrator || !orchestrator.ollamaService) {
      return res.status(500).json({
        error: 'Orchestrator or Ollama service not available'
      });
    }

    if (!orchestrator.ollamaService.isReady()) {
      return res.status(503).json({
        error: 'Ollama service is not ready'
      });
    }

    const response = await orchestrator.ollamaService.generateGeneralResponse(message);
    
    res.json({
      success: true,
      message: response,
      model: orchestrator.ollamaService.defaultModel
    });
    
  } catch (error) {
    console.error('❌ Ollama test error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

export default router;