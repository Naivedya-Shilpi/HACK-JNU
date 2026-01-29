import express from 'express';
import { ChatSessionManager } from '../services/ChatSessionManager.js';

const router = express.Router();

// Initialize session manager to access chat data
const sessionManager = new ChatSessionManager();

/**
 * GET /api/dashboard
 * Get dashboard data for a user based on their business profile
 */
router.post('/', async (req, res) => {
  try {
    const { userProfile, sessionId } = req.body;
    
    if (!userProfile) {
      return res.status(400).json({ 
        error: 'User profile is required' 
      });
    }

    console.log('📊 Generating dashboard data for:', userProfile.businessType);

    // Try to get data from chat session first
    let dashboardData;
    
    if (sessionId) {
      try {
        dashboardData = sessionManager.getDashboardData(sessionId);
        console.log('📱 Using chat session data for dashboard');
      } catch (error) {
        console.log('⚠️ No chat session found, generating default dashboard');
        dashboardData = generateDefaultDashboardData(userProfile);
      }
    } else {
      dashboardData = generateDefaultDashboardData(userProfile);
    }

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      source: sessionId ? 'chat_session' : 'default'
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to generate dashboard data',
      message: error.message 
    });
  }
});

/**
 * Generate default dashboard data when no session exists
 */
function generateDefaultDashboardData(userProfile) {
  // Generate compliance score based on business profile
  const complianceScore = calculateComplianceScore(userProfile);
  
  // Get applicable compliances
  const compliances = getApplicableCompliances(userProfile);
  
  // Generate dashboard data
  return {
    complianceScore: complianceScore,
    pendingTasks: compliances.filter(c => c.status === 'pending').length,
    upcomingDeadlines: compliances.filter(c => c.urgency === 'high').length,
    chatTopics: 0, // No chat data
    
    complianceBreakdown: generateComplianceBreakdown(userProfile, compliances),
    riskLevels: calculateRiskLevels(compliances),
    pendingTasksList: compliances.filter(c => c.status === 'pending').slice(0, 5),
    chatInsights: generateChatInsights(userProfile, compliances),
    recommendedActions: generateRecommendedActions(compliances)
  };
}

/**
 * Calculate overall compliance score
 */
function calculateComplianceScore(userProfile) {
  const businessType = userProfile.businessType?.toLowerCase() || '';
  const location = userProfile.state?.toLowerCase() || '';
  
  // Base score calculation
  let score = 45; // Starting baseline
  
  // Business type specific scoring
  if (businessType.includes('cafe') || businessType.includes('food')) {
    score += 15; // Food businesses typically need more compliance
  }
  
  // Location based scoring (some states are more compliant)
  if (['karnataka', 'maharashtra', 'gujarat'].includes(location)) {
    score += 10; // Better digital infrastructure
  }
  
  // GST registration status
  if (userProfile.gstNumber) {
    score += 20;
  }
  
  // Random component for demo
  score += Math.floor(Math.random() * 15);
  
  return Math.min(score, 100);
}

/**
 * Get applicable compliances for business
 */
function getApplicableCompliances(userProfile) {
  const compliances = [];
  const businessType = userProfile.businessType?.toLowerCase() || '';
  
  // Universal compliances
  compliances.push({
    id: 'gst',
    name: 'GST Registration',
    status: userProfile.gstNumber ? 'completed' : 'pending',
    priority: 'High',
    deadline: userProfile.gstNumber ? null : '7 days',
    urgency: userProfile.gstNumber ? 'low' : 'high',
    description: 'Goods and Services Tax registration for businesses'
  });
  
  compliances.push({
    id: 'shops_act',
    name: 'Shops & Establishment Registration',
    status: 'pending',
    priority: 'Medium',
    deadline: '10 days',
    urgency: 'medium',
    description: 'State-mandated registration for commercial establishments'
  });
  
  // Food business specific
  if (businessType.includes('cafe') || businessType.includes('food') || businessType.includes('restaurant')) {
    compliances.push({
      id: 'fssai',
      name: 'FSSAI License',
      status: 'completed',
      priority: 'High',
      deadline: null,
      urgency: 'low',
      description: 'Food safety license mandatory for food businesses'
    });
    
    compliances.push({
      id: 'trade_license',
      name: 'Municipal Trade License',
      status: 'pending',
      priority: 'Medium',
      deadline: '15 days',
      urgency: 'medium',
      description: 'Local municipal permission to operate'
    });
  }
  
  // Professional services
  if (businessType.includes('service') || businessType.includes('consulting')) {
    compliances.push({
      id: 'professional_tax',
      name: 'Professional Tax Registration',
      status: 'pending',
      priority: 'Low',
      deadline: '30 days',
      urgency: 'low',
      description: 'State tax for professional services'
    });
  }
  
  return compliances;
}

/**
 * Generate compliance breakdown for charts
 */
function generateComplianceBreakdown(userProfile, compliances) {
  const breakdown = [];
  
  // GST Compliance
  const gstCompliance = compliances.find(c => c.id === 'gst');
  breakdown.push({
    name: 'GST Compliance',
    value: gstCompliance?.status === 'completed' ? 85 : 40,
    color: gstCompliance?.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
  });
  
  // Food Safety (if applicable)
  const businessType = userProfile.businessType?.toLowerCase() || '';
  if (businessType.includes('cafe') || businessType.includes('food')) {
    const fssaiCompliance = compliances.find(c => c.id === 'fssai');
    breakdown.push({
      name: 'Food Safety',
      value: fssaiCompliance?.status === 'completed' ? 90 : 30,
      color: fssaiCompliance?.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
    });
  }
  
  // Labor Laws
  breakdown.push({
    name: 'Labor Laws',
    value: 60,
    color: 'bg-yellow-500'
  });
  
  // Trade License
  const tradeLicense = compliances.find(c => c.id === 'trade_license');
  if (tradeLicense) {
    breakdown.push({
      name: 'Trade License',
      value: tradeLicense.status === 'completed' ? 80 : 45,
      color: tradeLicense.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
    });
  }
  
  return breakdown;
}

/**
 * Calculate risk levels
 */
function calculateRiskLevels(compliances) {
  const risks = { low: 0, medium: 0, high: 0 };
  
  compliances.forEach(compliance => {
    if (compliance.urgency === 'high') risks.high++;
    else if (compliance.urgency === 'medium') risks.medium++;
    else risks.low++;
  });
  
  return [
    { level: 'Low', count: risks.low, color: 'bg-green-500' },
    { level: 'Medium', count: risks.medium, color: 'bg-yellow-500' },
    { level: 'High', count: risks.high, color: 'bg-red-500' }
  ];
}

/**
 * Generate chat insights based on compliance status
 */
function generateChatInsights(userProfile, compliances) {
  const insights = [];
  
  // GST insight
  const gstCompliance = compliances.find(c => c.id === 'gst');
  if (gstCompliance?.status === 'completed') {
    insights.push('GST registered but monthly filing reminders needed');
  } else {
    insights.push('GST registration pending - required for business operations');
  }
  
  // Business type specific insights
  const businessType = userProfile.businessType?.toLowerCase() || '';
  if (businessType.includes('cafe') || businessType.includes('food')) {
    const fssai = compliances.find(c => c.id === 'fssai');
    if (fssai?.status === 'completed') {
      insights.push('FSSAI license active - ensure renewal tracking');
    } else {
      insights.push('FSSAI license required for food business operations');
    }
  }
  
  // Trade license insight
  const tradeLicense = compliances.find(c => c.id === 'trade_license');
  if (tradeLicense && tradeLicense.status === 'pending') {
    insights.push('Municipal trade license application pending');
  }
  
  // Location specific insight
  if (userProfile.state) {
    insights.push(`State-specific ${userProfile.state} compliance requirements identified`);
  }
  
  return insights;
}

/**
 * Generate recommended actions
 */
function generateRecommendedActions(compliances) {
  const actions = [];
  
  // High priority pending items
  const highPriorityPending = compliances.filter(c => 
    c.status === 'pending' && c.priority === 'High'
  );
  
  highPriorityPending.forEach(compliance => {
    actions.push({
      title: `Complete ${compliance.name}`,
      priority: compliance.priority,
      description: `${compliance.description} - Due in ${compliance.deadline || 'soon'}`
    });
  });
  
  // Medium priority items
  const mediumPriorityPending = compliances.filter(c => 
    c.status === 'pending' && c.priority === 'Medium'
  ).slice(0, 2); // Limit to 2
  
  mediumPriorityPending.forEach(compliance => {
    actions.push({
      title: `Apply for ${compliance.name}`,
      priority: compliance.priority,
      description: `${compliance.description} - Deadline: ${compliance.deadline}`
    });
  });
  
  return actions.slice(0, 5); // Limit total recommendations
}

export default router;