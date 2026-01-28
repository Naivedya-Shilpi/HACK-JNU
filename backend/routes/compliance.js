import express from 'express';

const router = express.Router();

// GET /api/compliance/evaluate - Evaluate compliance requirements
router.get('/evaluate', async (req, res) => {
  try {
    const { businessProfile } = req.query;
    const ruleEngine = req.app.locals.ruleEngine;

    if (!businessProfile) {
      return res.status(400).json({ error: 'Business profile is required' });
    }

    const profile = JSON.parse(businessProfile);
    const evaluation = ruleEngine.evaluateCompliances(profile);

    res.json({
      evaluation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Compliance evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate compliance requirements' });
  }
});

// GET /api/compliance/readiness - Get business readiness score
router.get('/readiness', async (req, res) => {
  try {
    const { businessProfile } = req.query;
    const ruleEngine = req.app.locals.ruleEngine;

    if (!businessProfile) {
      return res.status(400).json({ error: 'Business profile is required' });
    }

    const profile = JSON.parse(businessProfile);
    const readinessScore = ruleEngine.getReadinessScore(profile);

    res.json({
      readinessScore,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Readiness score error:', error);
    res.status(500).json({ error: 'Failed to calculate readiness score' });
  }
});

// GET /api/compliance/details/:id - Get detailed compliance information
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complianceService = req.app.locals.complianceService;

    const details = complianceService.getComplianceDetails(id);

    if (!details) {
      return res.status(404).json({ error: 'Compliance not found' });
    }

    res.json(details);

  } catch (error) {
    req.app.locals.logger.error('Compliance details error:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance details' });
  }
});

// POST /api/compliance/structure-recommendation - Get business structure recommendation
router.post('/structure-recommendation', async (req, res) => {
  try {
    const { businessProfile } = req.body;
    const complianceService = req.app.locals.complianceService;

    if (!businessProfile) {
      return res.status(400).json({ error: 'Business profile is required' });
    }

    const recommendations = complianceService.getBusinessStructureRecommendation(businessProfile);

    res.json({
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Structure recommendation error:', error);
    res.status(500).json({ error: 'Failed to get structure recommendations' });
  }
});

// POST /api/compliance/cost-breakdown - Get cost breakdown analysis
router.post('/cost-breakdown', async (req, res) => {
  try {
    const { evaluation } = req.body;
    const complianceService = req.app.locals.complianceService;

    if (!evaluation) {
      return res.status(400).json({ error: 'Evaluation data is required' });
    }

    const costBreakdown = complianceService.getCostBreakdown(evaluation);

    res.json({
      costBreakdown,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Cost breakdown error:', error);
    res.status(500).json({ error: 'Failed to calculate cost breakdown' });
  }
});

// GET /api/compliance/calendar - Get compliance calendar
router.get('/calendar', async (req, res) => {
  try {
    const { businessProfile, completedCompliances } = req.query;
    const complianceService = req.app.locals.complianceService;

    if (!businessProfile) {
      return res.status(400).json({ error: 'Business profile is required' });
    }

    const profile = JSON.parse(businessProfile);
    const completed = completedCompliances ? JSON.parse(completedCompliances) : [];
    
    const calendar = complianceService.generateComplianceCalendar(profile, completed);

    res.json({
      calendar,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Compliance calendar error:', error);
    res.status(500).json({ error: 'Failed to generate compliance calendar' });
  }
});

// POST /api/compliance/penalty-risks - Calculate penalty risks
router.post('/penalty-risks', async (req, res) => {
  try {
    const { businessProfile, missingCompliances } = req.body;
    const complianceService = req.app.locals.complianceService;

    if (!businessProfile || !missingCompliances) {
      return res.status(400).json({ error: 'Business profile and missing compliances are required' });
    }

    const risks = complianceService.calculatePenaltyRisks(businessProfile, missingCompliances);

    res.json({
      risks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Penalty risks error:', error);
    res.status(500).json({ error: 'Failed to calculate penalty risks' });
  }
});

export default router;
