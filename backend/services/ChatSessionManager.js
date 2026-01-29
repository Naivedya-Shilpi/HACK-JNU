/**
 * Chat Session Manager - Tracks conversation data to build dynamic dashboard
 */
export class ChatSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Initialize or get session
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        businessProfile: {},
        conversationData: {
          totalMessages: 0,
          topicsDiscussed: [],
          complianceQueries: [],
          timelineQueries: [],
          platformQueries: [],
          lastActivity: new Date()
        },
        discoveryProgress: {
          businessType: null,
          location: null,
          scale: null,
          investment: null,
          completionPercentage: 0
        },
        complianceStatus: {
          identified: [],
          pending: [],
          completed: []
        },
        actionItems: [],
        createdAt: new Date()
      });
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Update session with chat interaction
   */
  updateSession(sessionId, message, response) {
    const session = this.getSession(sessionId);
    
    // Update conversation stats
    session.conversationData.totalMessages++;
    session.conversationData.lastActivity = new Date();
    
    // Analyze message content
    this.analyzeUserMessage(session, message);
    
    // Analyze response to extract business data
    this.analyzeResponse(session, response);
    
    // Update completion percentage
    this.updateDiscoveryProgress(session);
    
    return session;
  }

  /**
   * Analyze user message for insights
   */
  analyzeUserMessage(session, message) {
    const msg = message.toLowerCase();
    
    // Track business type mentions
    if (msg.includes('textile') || msg.includes('garment')) {
      session.businessProfile.businessType = 'Textile Business';
      session.discoveryProgress.businessType = 'Textile Business';
      this.addActionItem(session, 'Complete textile business licensing requirements', 'high');
    }
    
    if (msg.includes('cafe') || msg.includes('restaurant')) {
      session.businessProfile.businessType = 'Food Business';
      session.discoveryProgress.businessType = 'Food Business';
      this.addActionItem(session, 'Apply for FSSAI license', 'high');
    }
    
    // Track location mentions
    const cities = ['mumbai', 'delhi', 'bangalore', 'pune', 'patna', 'kolkata'];
    for (const city of cities) {
      if (msg.includes(city)) {
        session.businessProfile.location = city.charAt(0).toUpperCase() + city.slice(1);
        session.discoveryProgress.location = session.businessProfile.location;
        break;
      }
    }
    
    // Track compliance interest
    if (msg.includes('license') || msg.includes('registration') || msg.includes('gst')) {
      if (!session.conversationData.complianceQueries.includes('general')) {
        session.conversationData.complianceQueries.push('general');
      }
    }
    
    // Track timeline interest
    if (msg.includes('timeline') || msg.includes('how long') || msg.includes('steps')) {
      if (!session.conversationData.timelineQueries.includes('general')) {
        session.conversationData.timelineQueries.push('general');
      }
    }
  }

  /**
   * Analyze bot response for data extraction
   */
  analyzeResponse(session, response) {
    if (!response.data) return;
    
    // Update business profile from response data
    if (response.data.businessProfile) {
      Object.assign(session.businessProfile, response.data.businessProfile);
    }
    
    // Track response type for topics
    const topics = session.conversationData.topicsDiscussed;
    if (response.type && !topics.includes(response.type)) {
      topics.push(response.type);
    }
    
    // Extract compliance requirements
    if (response.type === 'compliance_overview' || response.type === 'compliance_details') {
      const mandatory = response.data.mandatory || response.data.evaluation?.mandatory || [];
      mandatory.forEach(compliance => {
        if (!session.complianceStatus.identified.find(c => c.name === compliance.name)) {
          session.complianceStatus.identified.push({
            name: compliance.name,
            type: 'mandatory',
            deadline: compliance.timeline || '30 days',
            priority: 'high'
          });
        }
      });
    }
    
    // Extract timeline data
    if (response.type === 'timeline_generation' || response.type === 'quick_timeline') {
      const duration = response.data.duration || '60 days';
      this.addActionItem(session, `Complete business setup in ${duration}`, 'medium');
    }
  }

  /**
   * Update discovery progress percentage
   */
  updateDiscoveryProgress(session) {
    const progress = session.discoveryProgress;
    let completed = 0;
    const total = 4; // businessType, location, scale, investment
    
    if (progress.businessType) completed++;
    if (progress.location) completed++;
    if (progress.scale) completed++;
    if (progress.investment) completed++;
    
    progress.completionPercentage = Math.round((completed / total) * 100);
  }

  /**
   * Add action item to session
   */
  addActionItem(session, task, priority = 'medium') {
    const existingItem = session.actionItems.find(item => item.task === task);
    if (!existingItem) {
      session.actionItems.push({
        id: Date.now(),
        task,
        priority,
        status: 'pending',
        createdAt: new Date()
      });
    }
  }

  /**
   * Get dashboard data for session
   */
  getDashboardData(sessionId) {
    const session = this.getSession(sessionId);
    
    // Calculate compliance score based on conversation
    const complianceScore = this.calculateComplianceScore(session);
    
    // Generate dynamic insights
    const insights = this.generateInsights(session);
    
    return {
      complianceScore,
      pendingTasks: session.actionItems.filter(item => item.status === 'pending').length,
      upcomingDeadlines: session.complianceStatus.identified.length,
      chatTopics: session.conversationData.topicsDiscussed.length,
      
      businessProfile: session.businessProfile,
      discoveryProgress: session.discoveryProgress,
      
      complianceBreakdown: this.generateComplianceBreakdown(session),
      riskLevels: this.calculateRiskLevels(session),
      pendingTasksList: this.generatePendingTasks(session),
      chatInsights: insights,
      recommendedActions: this.generateRecommendedActions(session)
    };
  }

  /**
   * Calculate compliance score based on conversation progress
   */
  calculateComplianceScore(session) {
    let score = 20; // Base score
    
    // Business type identified
    if (session.businessProfile.businessType) score += 25;
    
    // Location identified  
    if (session.businessProfile.location) score += 15;
    
    // Compliance discussed
    if (session.conversationData.complianceQueries.length > 0) score += 20;
    
    // Timeline discussed
    if (session.conversationData.timelineQueries.length > 0) score += 10;
    
    // Active conversation (recent activity)
    const hoursSinceLastActivity = (Date.now() - session.conversationData.lastActivity) / (1000 * 60 * 60);
    if (hoursSinceLastActivity < 1) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Generate compliance breakdown chart data
   */
  generateComplianceBreakdown(session) {
    const businessType = session.businessProfile.businessType?.toLowerCase() || '';
    const breakdown = [];
    
    if (businessType.includes('textile') || businessType.includes('garment')) {
      breakdown.push(
        { name: 'GST Registration', value: 60, color: 'bg-yellow-500' },
        { name: 'Factory License', value: 40, color: 'bg-red-500' },
        { name: 'Labor Laws', value: 70, color: 'bg-green-500' },
        { name: 'Environment Clearance', value: 30, color: 'bg-red-500' }
      );
    } else if (businessType.includes('food')) {
      breakdown.push(
        { name: 'FSSAI License', value: 80, color: 'bg-green-500' },
        { name: 'GST Registration', value: 60, color: 'bg-yellow-500' },
        { name: 'Trade License', value: 45, color: 'bg-red-500' }
      );
    } else {
      breakdown.push(
        { name: 'GST Registration', value: 50, color: 'bg-yellow-500' },
        { name: 'Business Registration', value: 75, color: 'bg-green-500' },
        { name: 'Trade License', value: 40, color: 'bg-red-500' }
      );
    }
    
    return breakdown;
  }

  /**
   * Calculate risk levels
   */
  calculateRiskLevels(session) {
    const risks = { low: 0, medium: 0, high: 0 };
    
    // High risk if no business type
    if (!session.businessProfile.businessType) risks.high++;
    
    // Medium risk items
    if (session.complianceStatus.identified.length > 0) risks.medium += session.complianceStatus.identified.length;
    
    // Low risk - completed items
    risks.low = session.conversationData.topicsDiscussed.length;
    
    return [
      { level: 'Low', count: risks.low, color: 'bg-green-500' },
      { level: 'Medium', count: risks.medium, color: 'bg-yellow-500' },
      { level: 'High', count: risks.high, color: 'bg-red-500' }
    ];
  }

  /**
   * Generate pending tasks list
   */
  generatePendingTasks(session) {
    const tasks = session.actionItems.filter(item => item.status === 'pending').map(item => ({
      id: item.id,
      title: item.task,
      priority: item.priority,
      deadline: '7 days', // Default
      status: 'pending'
    }));
    
    // Add business-specific tasks
    if (session.businessProfile.businessType) {
      const businessType = session.businessProfile.businessType.toLowerCase();
      
      if (businessType.includes('textile')) {
        tasks.push({
          id: 'textile-1',
          title: 'Apply for Factory License',
          priority: 'High',
          deadline: '15 days',
          status: 'pending'
        });
      }
      
      if (businessType.includes('food')) {
        tasks.push({
          id: 'food-1',
          title: 'Complete FSSAI Registration',
          priority: 'High', 
          deadline: '10 days',
          status: 'pending'
        });
      }
    }
    
    return tasks.slice(0, 5);
  }

  /**
   * Generate insights from conversation
   */
  generateInsights(session) {
    const insights = [];
    
    if (session.businessProfile.businessType) {
      insights.push(`Business type identified: ${session.businessProfile.businessType}`);
    }
    
    if (session.businessProfile.location) {
      insights.push(`Operating location: ${session.businessProfile.location}`);
    }
    
    if (session.conversationData.complianceQueries.length > 0) {
      insights.push('Compliance requirements discussed');
    }
    
    if (session.discoveryProgress.completionPercentage > 0) {
      insights.push(`Discovery ${session.discoveryProgress.completionPercentage}% complete`);
    }
    
    return insights;
  }

  /**
   * Generate recommended actions
   */
  generateRecommendedActions(session) {
    const actions = [];
    
    if (!session.businessProfile.businessType) {
      actions.push({
        title: 'Complete Business Type Selection',
        priority: 'High',
        description: 'Define your business type to get specific compliance requirements'
      });
    }
    
    if (!session.businessProfile.location) {
      actions.push({
        title: 'Select Business Location',
        priority: 'Medium',
        description: 'Choose location to identify state-specific requirements'
      });
    }
    
    if (session.complianceStatus.identified.length > 0) {
      actions.push({
        title: 'Start Compliance Process',
        priority: 'High',
        description: 'Begin applying for identified licenses and registrations'
      });
    }
    
    return actions;
  }
}