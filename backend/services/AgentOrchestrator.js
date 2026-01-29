import { OllamaService } from './OllamaService.js';
import { DiscoveryAgent } from '../agents/DiscoveryAgent.js';
import { ComplianceAgent } from '../agents/ComplianceAgent.js';
import { TimelineAgent } from '../agents/TimelineAgent.js';
import { PlatformAgent } from '../agents/PlatformAgent.js';

/**
 * Agent Orchestrator - Analyzes user input and routes to specialized agents
 * Uses only Ollama LLM for intelligent, context-aware responses
 */
export class AgentOrchestrator {
  constructor(ruleEngine, complianceService) {
    this.ruleEngine = ruleEngine;
    this.complianceService = complianceService;
    
    // Initialize Ollama service for local AI
    this.ollamaService = new OllamaService();
    
    // Initialize specialized agents
    this.discoveryAgent = new DiscoveryAgent(this.ollamaService, complianceService);
    this.complianceAgent = new ComplianceAgent(this.ollamaService, complianceService, ruleEngine);
    this.timelineAgent = new TimelineAgent(this.ollamaService, complianceService);
    this.platformAgent = new PlatformAgent(this.ollamaService, complianceService);

    console.log('✅ AgentOrchestrator initialized with Ollama-powered agents');
  }

  /**
   * Main orchestration method - analyzes intent and routes to appropriate agent
   */
  async processMessage(message, context = {}) {
    console.log('🎯 Orchestrator: Analyzing user message...');
    
    // Step 1: Analyze user intent
    const intent = await this.analyzeIntent(message, context);
    console.log('🎯 Detected intent:', intent.type);
    
    // Step 2: Route to appropriate agent
    const response = await this.routeToAgent(intent, message, context);
    
    return response;
  }

  /**
   * Analyze user intent using Ollama LLM
   */
  async analyzeIntent(message, context) {
    try {
      const prompt = `Analyze this user message and determine their intent. Consider the conversation context.

User Message: "${message}"

Context: ${JSON.stringify(context.businessProfile || {})}

Classify the intent into ONE of these categories:
1. DISCOVERY - User wants to start a business or asking about business types
2. COMPLIANCE - User asking about licenses, registrations, legal requirements
3. TIMELINE - User asking about setup timeline, steps, process
4. PLATFORM - User asking about Swiggy, Zomato, Amazon, online platforms
5. COST - User asking about costs, fees, expenses
6. LOCATION - User specifying or asking about location/state
7. READINESS - User asking about readiness, preparation, how ready they are
8. GENERAL - General questions or greetings

Also extract any key entities:
- Business type (cafe, restaurant, retail, textile, manufacturing, etc.)
- Location (city, state)
- Platform names
- Specific compliance items

Return in JSON format:
{
  "type": "INTENT_TYPE",
  "confidence": 0.8,
  "entities": {
    "businessType": "extracted_type",
    "city": "extracted_city",
    "platform": "extracted_platform"
  },
  "reasoning": "brief explanation"
}`;

      const response = await this.ollamaService.generateResponse(
        prompt,
        'You are an intent analysis AI for MSME compliance. Return valid JSON only.',
        { temperature: 0.3 }
      );

      // Try to parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (parseError) {
        // If JSON parsing fails, extract from text response
        const typeMatch = response.match(/"type":\s*"([^"]+)"/);
        const businessTypeMatch = response.match(/"businessType":\s*"([^"]+)"/);
        const cityMatch = response.match(/"city":\s*"([^"]+)"/);
        
        parsed = {
          type: typeMatch ? typeMatch[1] : 'GENERAL',
          confidence: 0.7,
          entities: {
            businessType: businessTypeMatch ? businessTypeMatch[1] : null,
            city: cityMatch ? cityMatch[1] : null,
            platform: null
          },
          reasoning: 'Ollama response parsed'
        };
      }
      
      console.log('🧠 Ollama Intent Analysis:', parsed);
      return parsed;

    } catch (error) {
      console.error('❌ Ollama intent analysis failed:', error.message);
      return this.analyzeIntentFallback(message, context);
    }
  }

  /**
   * Fallback intent analysis using pattern matching
   */
  analyzeIntentFallback(message, context) {
    console.log('🔍 Using fallback intent analysis...');
    const lowerMsg = message.toLowerCase();
    
    // Discovery patterns
    if (lowerMsg.match(/\b(start|beginning|new business|cafe|restaurant|shop|store|business type|textile|garment|fabric|manufacturing|production)\b/)) {
      return {
        type: 'DISCOVERY',
        confidence: 0.8,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: business startup intent'
      };
    }
    
    // Compliance patterns
    if (lowerMsg.match(/\b(license|registration|permit|gst|fssai|compliance|legal|requirement)\b/)) {
      return {
        type: 'COMPLIANCE',
        confidence: 0.8,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: compliance inquiry'
      };
    }
    
    // Timeline patterns
    if (lowerMsg.match(/\b(timeline|how long|steps|process|when|duration|time)\b/)) {
      return {
        type: 'TIMELINE',
        confidence: 0.7,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: timeline inquiry'
      };
    }
    
    // Platform patterns
    if (lowerMsg.match(/\b(swiggy|zomato|amazon|platform|online|delivery)\b/)) {
      return {
        type: 'PLATFORM',
        confidence: 0.8,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: platform inquiry'
      };
    }
    
    // Cost patterns
    if (lowerMsg.match(/\b(cost|price|fee|expense|money|budget|how much)\b/)) {
      return {
        type: 'COST',
        confidence: 0.7,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: cost inquiry'
      };
    }
    
    // Readiness patterns
    if (lowerMsg.match(/\b(ready|prepared|readiness|score|assessment|how ready|am i ready|preparedness)\b/)) {
      return {
        type: 'READINESS',
        confidence: 0.8,
        entities: this.extractEntities(message),
        reasoning: 'Pattern match: readiness inquiry'
      };
    }
    
    return {
      type: 'GENERAL',
      confidence: 0.5,
      entities: this.extractEntities(message),
      reasoning: 'Default: general inquiry'
    };
  }

  /**
   * Extract entities from message
   */
  extractEntities(message) {
    const entities = {};
    const lowerMsg = message.toLowerCase();
    
    // Business types - more comprehensive detection
    const businessTypes = {
      'food': 'Food & Restaurant Business',
      'restaurant': 'Food & Restaurant Business',
      'cafe': 'Food & Restaurant Business',
      'cloud kitchen': 'Food & Restaurant Business',
      'textile': 'Textile Business',
      'garment': 'Textile Business',
      'fabric': 'Textile Business',
      'clothing': 'Textile Business',
      'retail': 'Retail Store',
      'store': 'Retail Store',
      'shop': 'Retail Store',
      'electronics': 'Electronics Store',
      'service': 'Service Business',
      'consulting': 'Service Business',
      'agency': 'Service Business',
      'freelancing': 'Service Business',
      'manufacturing': 'Manufacturing Business',
      'production': 'Manufacturing Business',
      'factory': 'Manufacturing Business',
      'e-commerce': 'E-commerce Business',
      'online': 'E-commerce Business'
    };
    
    for (const [key, value] of Object.entries(businessTypes)) {
      if (lowerMsg.includes(key)) {
        entities.businessType = value;
        break;
      }
    }
    
    // Cities and states
    const locations = {
      'mumbai': 'Mumbai, Maharashtra',
      'bangalore': 'Bangalore, Karnataka',
      'delhi': 'Delhi, Delhi',
      'chennai': 'Chennai, Tamil Nadu',
      'pune': 'Pune, Maharashtra',
      'hyderabad': 'Hyderabad, Telangana',
      'kolkata': 'Kolkata, West Bengal',
      'ahmedabad': 'Ahmedabad, Gujarat'
    };
    
    for (const [city, fullLocation] of Object.entries(locations)) {
      if (lowerMsg.includes(city)) {
        entities.city = fullLocation;
        break;
      }
    }
    
    // Platforms
    if (lowerMsg.includes('swiggy')) entities.platform = 'Swiggy';
    if (lowerMsg.includes('zomato')) entities.platform = 'Zomato';
    if (lowerMsg.includes('amazon')) entities.platform = 'Amazon';
    
    return entities;
  }

  /**
   * Route to appropriate agent based on intent
   */
  async routeToAgent(intent, message, context) {
    console.log(`🤖 Routing to agent for intent: ${intent.type}...`);
    
    // Initialize session if needed
    if (!context.session) {
      context.session = {
        businessProfile: context.businessProfile || {},
        conversationHistory: context.conversationHistory || [],
        currentStep: null
      };
    }

    try {
      // Route to specialized agents
      switch (intent.type) {
        case 'DISCOVERY':
        case 'LOCATION':
          return await this.discoveryAgent.process(message, context, context.session);
          
        case 'COMPLIANCE':
        case 'COST':
          return await this.complianceAgent.process(message, context, context.session);
          
        case 'TIMELINE':
          return await this.timelineAgent.process(message, context, context.session);
          
        case 'PLATFORM':
          return await this.platformAgent.process(message, context, context.session);
          
        case 'READINESS':
          return await this.handleReadinessQuery(message, context, context.session);
          
        case 'GENERAL':
        default:
          return await this.handleGeneralQuery(message, context, context.session);
      }
    } catch (error) {
      console.error(`Error in agent routing: ${error.message}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Handle readiness assessment queries
   */
  async handleReadinessQuery(message, context, session) {
    const businessProfile = session.businessProfile || {};
    
    // Calculate readiness score
    const readinessScore = this.calculateReadinessScore(businessProfile);
    
    return {
      message: `📊 **Your Business Readiness Assessment**

**Current Readiness Score: ${readinessScore.total}/100**

**📋 Information Completeness (${readinessScore.info}/25)**
${readinessScore.details.info.map(item => `${item.status} ${item.label}`).join('\n')}

**💰 Financial Preparedness (${readinessScore.financial}/25)**
${readinessScore.details.financial.map(item => `${item.status} ${item.label}`).join('\n')}

**📄 Legal Knowledge (${readinessScore.legal}/25)**
${readinessScore.details.legal.map(item => `${item.status} ${item.label}`).join('\n')}

**🎯 Execution Plan (${readinessScore.execution}/25)**
${readinessScore.details.execution.map(item => `${item.status} ${item.label}`).join('\n')}

**${readinessScore.recommendation}**

**What would you like to improve first?**`,
      type: 'readiness_assessment',
      data: {
        score: readinessScore.total,
        businessProfile,
        recommendations: readinessScore.nextSteps,
        options: [
          'Help me complete business information',
          'Show compliance requirements',
          'Create timeline plan',
          'Financial planning guidance'
        ]
      }
    };
  }

  /**
   * Handle general queries and greetings
   */
  async handleGeneralQuery(message, context, session) {
    const lowerMsg = message.toLowerCase();
    
    // Greeting responses
    if (lowerMsg.match(/\b(hi|hello|hey|good morning|good afternoon)\b/)) {
      return {
        message: `👋 **Hello! Welcome to MSME Compliance Navigator**

I'm here to help you start your business in India with confidence.

**What I can help with:**
• **Business Discovery** - Find the right business for you
• **Compliance Guidance** - All licenses and registrations  
• **Timeline Planning** - Step-by-step setup process
• **Platform Assistance** - Government portals and applications

**Let's start:** What type of business are you planning to start?`,
        type: 'greeting',
        data: {
          options: [
            'I want to start a food business',
            'Help me choose business type',
            'Show me compliance requirements',
            'I need timeline planning'
          ]
        }
      };
    }
    
    // Business inquiry - redirect to discovery
    if (lowerMsg.includes('business') || lowerMsg.includes('start') || lowerMsg.includes('open')) {
      return {
        message: `🚀 **Let's Start Your Business Journey!**

I can help you with step-by-step guidance.

**First, let me know:**
What type of business are you planning to start?

**Popular Options:**
• Food & Restaurant Business
• Retail Store  
• Manufacturing Business
• Service Business
• E-commerce Business
• Other`,
        type: 'business_inquiry',
        data: {
          redirectToDiscovery: true,
          options: [
            'Food & Restaurant Business',
            'Retail Store',
            'Manufacturing Business', 
            'Service Business',
            'E-commerce Business',
            'Other business type'
          ]
        }
      };
    }
    
    // Default helpful response with points
    return {
      message: `🤔 **I'd love to help you!**

Let me guide you through starting your business:

**I can help with:**
• **Step 1:** Business type selection and planning
• **Step 2:** Required licenses and registrations
• **Step 3:** Timeline and process planning
• **Step 4:** Platform onboarding (Amazon, Swiggy, etc.)

**To get started:**
Simply tell me what type of business you want to start.

**Popular choices:**
• Food business (cafe, restaurant)
• Retail store
• Manufacturing
• Services`,
      type: 'general_help',
      data: {
        options: [
          'I want to start a food business',
          'Help me with retail store',
          'Manufacturing business guidance',
          'Service business planning'
        ]
      }
    };
  }

  /**
   * Calculate business readiness score
   */
  calculateReadinessScore(businessProfile) {
    const scores = { info: 0, financial: 0, legal: 0, execution: 0 };
    const details = {
      info: [],
      financial: [],
      legal: [],
      execution: []
    };

    // Information completeness
    if (businessProfile.businessType) {
      scores.info += 8;
      details.info.push({ status: '✅', label: 'Business type identified' });
    } else {
      details.info.push({ status: '❌', label: 'Business type needed' });
    }

    if (businessProfile.location) {
      scores.info += 8;
      details.info.push({ status: '✅', label: 'Location selected' });
    } else {
      details.info.push({ status: '❌', label: 'Location needed' });
    }

    if (businessProfile.teamSize) {
      scores.info += 5;
      details.info.push({ status: '✅', label: 'Team size planned' });
    } else {
      details.info.push({ status: '❌', label: 'Team size needed' });
    }

    if (businessProfile.targetAudience) {
      scores.info += 4;
      details.info.push({ status: '✅', label: 'Target audience defined' });
    } else {
      details.info.push({ status: '❌', label: 'Target audience needed' });
    }

    // Financial preparedness
    if (businessProfile.investmentRange) {
      scores.financial += 10;
      details.financial.push({ status: '✅', label: 'Investment budget set' });
    } else {
      details.financial.push({ status: '❌', label: 'Investment budget needed' });
    }

    if (businessProfile.fundingSource) {
      scores.financial += 10;
      details.financial.push({ status: '✅', label: 'Funding source identified' });
    } else {
      details.financial.push({ status: '❌', label: 'Funding source needed' });
    }

    if (businessProfile.expectedRevenue) {
      scores.financial += 5;
      details.financial.push({ status: '✅', label: 'Revenue projections done' });
    } else {
      details.financial.push({ status: '❌', label: 'Revenue projections needed' });
    }

    // Legal knowledge (basic assumptions)
    details.legal.push({ status: '❌', label: 'Compliance requirements understanding' });
    details.legal.push({ status: '❌', label: 'Legal structure decision' });
    details.legal.push({ status: '❌', label: 'Tax obligations awareness' });

    // Execution plan
    details.execution.push({ status: '❌', label: 'Detailed timeline created' });
    details.execution.push({ status: '❌', label: 'Task prioritization done' });
    details.execution.push({ status: '❌', label: 'Risk mitigation planned' });

    const total = scores.info + scores.financial + scores.legal + scores.execution;

    let recommendation = '';
    let nextSteps = [];

    if (total < 30) {
      recommendation = '🚀 **Getting Started Phase** - Let\'s build your foundation!';
      nextSteps = ['Complete business discovery', 'Set investment budget', 'Learn compliance basics'];
    } else if (total < 60) {
      recommendation = '💪 **Building Momentum** - You\'re making good progress!';
      nextSteps = ['Complete remaining planning', 'Start compliance process', 'Create detailed timeline'];
    } else if (total < 80) {
      recommendation = '🎯 **Almost Ready** - Just a few more steps to go!';
      nextSteps = ['Finalize legal requirements', 'Execute timeline', 'Launch preparation'];
    } else {
      recommendation = '🏆 **Ready to Launch** - You\'re well prepared!';
      nextSteps = ['Execute launch plan', 'Monitor progress', 'Scale operations'];
    }

    return {
      total,
      info: scores.info,
      financial: scores.financial,
      legal: scores.legal,
      execution: scores.execution,
      details,
      recommendation,
      nextSteps
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(error) {
    return {
      message: `⚠️ **Something went wrong**

I encountered an issue while processing your request. Let me help you differently.

**What I can still help with:**
• Business discovery and planning
• Compliance requirements
• Timeline creation
• Platform guidance

**Please try asking:** "Help me start my business" or choose from the options below.`,
      type: 'error',
      error: error.message,
      data: {
        options: [
          'Start business discovery',
          'Show compliance requirements',
          'Create timeline',
          'Get platform help'
        ]
      }
    };
  }
}