import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { AgentOrchestrator } from './AgentOrchestrator.js';

export class ChatbotService {
  constructor(ruleEngine, complianceService) {
    this.ruleEngine = ruleEngine;
    this.complianceService = complianceService;
    this.sessions = new Map();
    
    // Initialize Agent Orchestrator for intelligent routing
    this.orchestrator = new AgentOrchestrator(ruleEngine, complianceService);
    
    // Initialize Grok/OpenAI - prioritize Grok if USE_GROK is true
    const useGrok = process.env.USE_GROK === 'true';
    const apiKey = useGrok ? process.env.GROK_API_KEY : process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: useGrok ? (process.env.GROK_API_URL || 'https://api.x.ai/v1') : 'https://api.openai.com/v1'
      });
      console.log(`🤖 ChatbotService: Using ${useGrok ? 'Grok' : 'OpenAI'} LLM`);
    } else {
      this.openai = null;
      console.log('🤖 ChatbotService: No API key found - using fallback responses only');
    }

    this.conversationFlows = {
      DISCOVERY: 'discovery',
      READINESS_CHECK: 'readiness_check',
      STRUCTURE_DECISION: 'structure_decision',
      COMPLIANCE_MAPPING: 'compliance_mapping',
      TIMELINE_GENERATION: 'timeline_generation',
      PLATFORM_ONBOARDING: 'platform_onboarding',
      COST_ANALYSIS: 'cost_analysis',
      MONITORING: 'monitoring'
    };
  }

  async processMessage(message, userProfile, sessionId) {
    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId, userProfile);
    }

    // Add message to history
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Use Agent Orchestrator for intelligent processing
    console.log('🎯 Using Agent Orchestrator for intelligent routing...');
    const response = await this.orchestrator.processMessage(message, {
      businessProfile: session.businessProfile,
      conversationHistory: session.messages,
      currentPhase: session.currentPhase
    });

    // Update session with response data
    if (response.data?.businessProfile) {
      session.businessProfile = { ...session.businessProfile, ...response.data.businessProfile };
    }
    if (response.data?.nextStep) {
      session.currentPhase = response.data.nextStep;
    }

    // Add response to history
    session.messages.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date()
    });

    return response;
  }

  createSession(sessionId, userProfile) {
    const session = {
      id: sessionId,
      userProfile: userProfile || {},
      businessProfile: {
        stage: 'discovery',
        completedSteps: []
      },
      currentPhase: this.conversationFlows.DISCOVERY,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async processPhase(session, message) {
    switch (session.currentPhase) {
      case this.conversationFlows.DISCOVERY:
        return await this.handleDiscoveryPhase(session, message);
      
      case this.conversationFlows.READINESS_CHECK:
        return await this.handleReadinessCheck(session, message);
      
      case this.conversationFlows.STRUCTURE_DECISION:
        return await this.handleStructureDecision(session, message);
      
      case this.conversationFlows.COMPLIANCE_MAPPING:
        return await this.handleComplianceMapping(session, message);
      
      case this.conversationFlows.TIMELINE_GENERATION:
        return await this.handleTimelineGeneration(session, message);
      
      case this.conversationFlows.PLATFORM_ONBOARDING:
        return await this.handlePlatformOnboarding(session, message);
      
      default:
        return await this.handleGeneralQuery(session, message);
    }
  }

  async handleDiscoveryPhase(session, message) {
    const profile = session.businessProfile;

    // Check if this is the first interaction
    if (session.messages.length === 1) {
      return {
        message: `Hi ${session.userProfile.businessOwnerName || 'there'}! 👋\n\nI'll help you start your business — from documents to platform onboarding — in simple steps.\n\nWhat business do you want to start?`,
        type: 'discovery',
        data: {
          options: ['Café', 'Restaurant', 'Online Store', 'Manufacturing', 'IT Services', 'Other'],
          step: 'business_type'
        }
      };
    }

    // Process discovery steps
    if (!profile.businessType) {
      profile.businessType = this.extractBusinessType(message);
      profile.sellsFood = ['cafe', 'restaurant', 'food'].some(type => 
        message.toLowerCase().includes(type)
      );

      return {
        message: `Great! A ${profile.businessType} business. Where will it be located?`,
        type: 'discovery',
        data: {
          step: 'location',
          collected: { businessType: profile.businessType }
        }
      };
    }

    if (!profile.state || !profile.city) {
      const location = this.extractLocation(message);
      profile.state = location.state;
      profile.city = location.city;

      if (profile.businessType === 'cafe' || profile.businessType === 'restaurant') {
        return {
          message: `${profile.city}, ${profile.state} - perfect location!\n\nWill customers dine in, order online, or both?`,
          type: 'discovery',
          data: {
            step: 'operating_model',
            options: ['Dine-in only', 'Online delivery only', 'Both'],
            collected: { businessType: profile.businessType, location: `${profile.city}, ${profile.state}` }
          }
        };
      } else {
        return this.askEmployeeCount(profile);
      }
    }

    if (!profile.operatingModel && (profile.businessType === 'cafe' || profile.businessType === 'restaurant')) {
      profile.dineIn = message.toLowerCase().includes('dine') || message.toLowerCase().includes('both');
      profile.onlineDelivery = message.toLowerCase().includes('online') || message.toLowerCase().includes('delivery') || message.toLowerCase().includes('both');
      profile.operatingModel = message.toLowerCase();

      return this.askEmployeeCount(profile);
    }

    if (!profile.employees) {
      profile.employees = this.extractNumber(message);

      return {
        message: `${profile.employees} employees - noted!\n\nRoughly how much do you expect to earn per month?`,
        type: 'discovery',
        data: {
          step: 'revenue',
          collected: { 
            businessType: profile.businessType, 
            location: `${profile.city}, ${profile.state}`,
            employees: profile.employees
          }
        }
      };
    }

    if (!profile.monthlyRevenueEstimate) {
      profile.monthlyRevenueEstimate = this.extractRevenue(message);

      // Discovery complete - move to readiness check
      session.currentPhase = this.conversationFlows.READINESS_CHECK;
      
      return {
        message: `Got it! 👍\n\nYou want to open a ${profile.businessType} in ${profile.city} with ${profile.onlineDelivery ? 'online delivery and ' : ''}${profile.employees} employees.\n\nLet me analyze your business readiness...`,
        type: 'discovery_complete',
        data: {
          businessProfile: profile,
          nextStep: 'readiness_check'
        }
      };
    }

    return await this.handleReadinessCheck(session, message);
  }

  async handleReadinessCheck(session, message) {
    const profile = session.businessProfile;
    
    // Run rule engine evaluation
    const evaluation = this.ruleEngine.evaluateCompliances(profile);
    const readinessScore = this.ruleEngine.getReadinessScore(profile);

    session.currentPhase = this.conversationFlows.COMPLIANCE_MAPPING;

    const aiExplanation = await this.generateAIExplanation(
      'readiness_check',
      { profile, evaluation, readinessScore }
    );

    return {
      message: aiExplanation,
      type: 'readiness_report',
      data: {
        readinessScore,
        evaluation,
        nextStep: 'compliance_mapping'
      }
    };
  }

  async handleComplianceMapping(session, message) {
    const profile = session.businessProfile;
    const evaluation = this.ruleEngine.evaluateCompliances(profile);

    const aiExplanation = await this.generateAIExplanation(
      'compliance_mapping',
      { profile, evaluation }
    );

    session.currentPhase = this.conversationFlows.TIMELINE_GENERATION;

    return {
      message: aiExplanation,
      type: 'compliance_list',
      data: {
        mandatory: evaluation.mandatory,
        conditional: evaluation.conditional,
        recommended: evaluation.recommended,
        nextStep: 'timeline_generation'
      }
    };
  }

  async handleTimelineGeneration(session, message) {
    const profile = session.businessProfile;
    const evaluation = this.ruleEngine.evaluateCompliances(profile);

    const aiExplanation = await this.generateAIExplanation(
      'timeline_generation',
      { profile, evaluation }
    );

    session.currentPhase = this.conversationFlows.PLATFORM_ONBOARDING;

    return {
      message: aiExplanation,
      type: 'timeline',
      data: {
        timeline: evaluation.timeline,
        totalCost: evaluation.totalCost,
        nextStep: 'platform_onboarding'
      }
    };
  }

  async handlePlatformOnboarding(session, message) {
    const profile = session.businessProfile;
    
    if (message.toLowerCase().includes('swiggy') || message.toLowerCase().includes('zomato')) {
      profile.platforms = this.extractPlatforms(message);
      
      const platformInfo = this.complianceService.getPlatformRequirements(profile.platforms);
      
      const aiExplanation = await this.generateAIExplanation(
        'platform_onboarding',
        { profile, platformInfo }
      );

      return {
        message: aiExplanation,
        type: 'platform_info',
        data: {
          platforms: platformInfo,
          nextStep: 'monitoring'
        }
      };
    }

    return {
      message: "Which platforms would you like to list your business on?\n\n• Swiggy\n• Zomato\n• Amazon\n• Other",
      type: 'platform_selection',
      data: {
        step: 'platform_selection'
      }
    };
  }

  async handleGeneralQuery(session, message) {
    const context = {
      businessProfile: session.businessProfile,
      conversationHistory: session.messages.slice(-5) // Last 5 messages for context
    };

    const aiResponse = await this.generateAIExplanation('general_query', { message, context });

    return {
      message: aiResponse,
      type: 'general_response',
      data: null
    };
  }

  async generateAIExplanation(type, data) {
    // Use Grok LLM if available, otherwise fallback
    if (!this.openai) {
      console.log('🤖 No LLM available - Using fallback response for type:', type);
      return this.getFallbackResponse(type, data);
    }

    try {
      const systemPrompt = this.getSystemPrompt(type);
      const userPrompt = this.getUserPrompt(type, data);

      const completion = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'grok-2-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('❌ Grok API error:', error.message);
      return this.getFallbackResponse(type, data);
    }
  }

  getSystemPrompt(type) {
    const basePrompt = `You are an expert MSME compliance advisor for Indian businesses. You explain complex compliance requirements in simple, friendly language. Always be encouraging and solution-focused.`;

    const typeSpecificPrompts = {
      readiness_check: `${basePrompt} You're analyzing business readiness and explaining what's needed vs what's missing.`,
      compliance_mapping: `${basePrompt} You're explaining mandatory compliance requirements and why they're needed.`,
      timeline_generation: `${basePrompt} You're creating a step-by-step timeline for business setup.`,
      platform_onboarding: `${basePrompt} You're explaining platform requirements and onboarding processes.`,
      general_query: `${basePrompt} You're answering specific questions about compliance and business setup.`
    };

    return typeSpecificPrompts[type] || basePrompt;
  }

  getUserPrompt(type, data) {
    switch (type) {
      case 'readiness_check':
        return `Business Profile: ${JSON.stringify(data.profile)}
        Readiness Score: ${data.readinessScore.score}%
        Missing Requirements: ${data.evaluation.mandatory.length}
        
        Explain the readiness status in a friendly, encouraging way. Mention what's good and what needs attention.`;

      case 'compliance_mapping':
        return `Business: ${data.profile.businessType} in ${data.profile.city}, ${data.profile.state}
        Mandatory Compliances: ${data.evaluation.mandatory.map(c => c.name).join(', ')}
        
        Explain these requirements clearly, why they're needed, and reassure that we'll help with each step.`;

      case 'timeline_generation':
        return `Timeline: ${JSON.stringify(data.evaluation.timeline)}
        Total Cost: ₹${data.evaluation.totalCost}
        
        Present this as a clear week-by-week plan. Make it feel manageable and organized.`;

      case 'platform_onboarding':
        return `Platforms: ${data.profile.platforms?.join(', ')}
        Requirements: ${JSON.stringify(data.platformInfo)}
        
        Explain platform requirements, commission rates, and approval timelines clearly.`;

      case 'general_query':
        return `User Question: ${data.message}
        Business Context: ${JSON.stringify(data.context.businessProfile)}
        
        Answer the question helpfully with specific, actionable advice.`;

      default:
        return JSON.stringify(data);
    }
  }

  getFallbackResponse(type, data) {
    const fallbacks = {
      readiness_check: `📊 Business Readiness Assessment

Great! Your business idea shows promise. Based on your profile:

✅ **Business Concept**: Viable and market-ready
✅ **Location**: ${data.profile?.city || 'Selected'} is business-friendly
⚠️ **Compliance**: Some requirements need attention

**Your Readiness Score**: ${data.readinessScore?.score || 70}%

**Next Steps**:
1. Complete mandatory registrations
2. Get required licenses
3. Set up business banking
4. Plan for ongoing compliance

I'll guide you through each step!`,

      compliance_mapping: `📋 Compliance Requirements for Your ${data.profile?.businessType || 'Business'}

**Mandatory Requirements**:
• Business Registration (Proprietorship/LLP/Pvt Ltd)
• GST Registration (if turnover > ₹40L/year)
• Professional Tax (for employees)
• Shop & Establishment Act Registration

**Industry-Specific**:
• ${data.profile?.businessType === 'cafe' || data.profile?.businessType === 'restaurant' ? 'FSSAI Food License' : 'Industry-specific licenses'}
• Fire Safety Certificate
• Municipal Trade License

**Timeline**: 2-4 weeks for basic setup
**Estimated Cost**: ₹5,000-15,000 for initial setup

Let me create a detailed timeline for you!`,

      timeline_generation: `📅 Your Business Launch Timeline

**Week 1-2**: Foundation
• Finalize business name and structure
• Apply for business registration
• Open current bank account

**Week 3-4**: Compliance
• Complete GST registration (if applicable)
• Get FSSAI license (for food businesses)
• Apply for Shop & Establishment Act

**Week 5-6**: Operations
• Set up accounting systems
• Get professional tax registration
• Apply for fire safety certificate

**Week 7-8**: Launch
• Complete all inspections
• Get final approvals
• Start operations!

**Total Estimated Cost**: ₹8,000-20,000
**Total Timeline**: 6-8 weeks

Ready to start with Week 1?`,

      platform_onboarding: `🛵 Platform Onboarding Guide

**Swiggy Requirements**:
• FSSAI License (mandatory)
• GST Registration (recommended)
• Bank Account for payments
• Menu with pricing
• Restaurant photos

**Zomato Requirements**:
• FSSAI License (mandatory)
• Bank Account for payments
• Menu and photos
• Basic business documents

**Commission Structure**:
• Swiggy: 15-25% of order value
• Zomato: 18-23% of order value

**Approval Timeline**:
• Swiggy: 3-7 days
• Zomato: 2-5 days

**Documents Needed**:
• Business registration proof
• FSSAI certificate
• PAN card
• Bank account details
• Menu with photos

I can help you prepare these documents step by step!`,

      general_query: `🤖 MSME Compliance Assistant

I'm here to help you navigate business compliance in India! I can assist with:

📋 **Business Setup**:
• Registration procedures
• License requirements
• Legal structure advice

🏢 **Compliance Management**:
• GST, FSSAI, Shop Act registrations
• State-specific requirements
• Industry-specific licenses

📊 **Platform Integration**:
• Swiggy, Zomato onboarding
• Amazon seller setup
• E-commerce requirements

💰 **Cost & Timeline**:
• Setup cost estimates
• Implementation timeline
• Ongoing compliance costs

Please tell me about your business idea, and I'll provide personalized guidance!`
    };

    return fallbacks[type] || "I'm here to help you with your business compliance needs. Tell me about your business idea and I'll guide you through the requirements!";
  }

  // Helper methods for data extraction
  extractBusinessType(message) {
    const types = {
      'cafe': 'cafe',
      'restaurant': 'restaurant', 
      'food': 'restaurant',
      'store': 'retail',
      'shop': 'retail',
      'manufacturing': 'manufacturing',
      'factory': 'manufacturing',
      'it': 'it_services',
      'software': 'it_services',
      'service': 'services'
    };

    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(types)) {
      if (lower.includes(key)) return value;
    }
    return 'other';
  }

  extractLocation(message) {
    // Simple extraction - in production, use NLP or location API
    const stateMapping = {
      'karnataka': 'KA', 'bengaluru': 'KA', 'bangalore': 'KA',
      'maharashtra': 'MH', 'mumbai': 'MH', 'pune': 'MH',
      'delhi': 'DL', 'gujarat': 'GJ', 'ahmedabad': 'GJ',
      'tamil nadu': 'TN', 'chennai': 'TN'
    };

    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(stateMapping)) {
      if (lower.includes(key)) {
        return {
          state: value,
          city: key.charAt(0).toUpperCase() + key.slice(1)
        };
      }
    }

    return { state: 'KA', city: 'Bengaluru' }; // Default
  }

  extractNumber(message) {
    const numbers = message.match(/\d+/);
    return numbers ? parseInt(numbers[0]) : 5; // Default
  }

  extractRevenue(message) {
    const numbers = message.match(/\d+/g);
    if (numbers) {
      const amount = parseInt(numbers[0]);
      if (message.includes('lakh')) return amount * 100000;
      if (message.includes('crore')) return amount * 10000000;
      return amount * 1000; // Assume thousands
    }
    return 250000; // Default 2.5 lakhs
  }

  extractPlatforms(message) {
    const platforms = [];
    if (message.toLowerCase().includes('swiggy')) platforms.push('swiggy');
    if (message.toLowerCase().includes('zomato')) platforms.push('zomato');
    if (message.toLowerCase().includes('amazon')) platforms.push('amazon');
    return platforms;
  }

  askEmployeeCount(profile) {
    return {
      message: `Perfect! Will you hire employees?`,
      type: 'discovery',
      data: {
        step: 'employees',
        options: ['Yes', 'No', 'Maybe later'],
        collected: { 
          businessType: profile.businessType, 
          location: `${profile.city}, ${profile.state}`,
          operatingModel: profile.operatingModel
        }
      }
    };
  }
}
