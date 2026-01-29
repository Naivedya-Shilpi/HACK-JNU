import OpenAI from 'openai';
import { OllamaService } from './OllamaService.js';
import { DiscoveryAgent } from '../agents/DiscoveryAgent.js';
import { ComplianceAgent } from '../agents/ComplianceAgent.js';
import { TimelineAgent } from '../agents/TimelineAgent.js';
import { PlatformAgent } from '../agents/PlatformAgent.js';

/**
 * Agent Orchestrator - Analyzes user input and routes to specialized agents
 * Implements agentic AI framework for intelligent, context-aware responses
 */
export class AgentOrchestrator {
  constructor(ruleEngine, complianceService) {
    this.ruleEngine = ruleEngine;
    this.complianceService = complianceService;
    
    // Initialize Ollama service for local AI
    this.ollamaService = new OllamaService();
    
    // Initialize specialized agents
    this.discoveryAgent = new DiscoveryAgent(this.ollamaService);
    this.complianceAgent = new ComplianceAgent(this.ollamaService, complianceService, ruleEngine);
    this.timelineAgent = new TimelineAgent(this.ollamaService);
    this.platformAgent = new PlatformAgent(this.ollamaService);
    
    // Keep OpenAI/Grok as fallback
    const useGrok = process.env.USE_GROK === 'true';
    const apiKey = useGrok ? process.env.GROK_API_KEY : process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.llm = new OpenAI({
        apiKey: apiKey,
        baseURL: useGrok ? (process.env.GROK_API_URL || 'https://api.x.ai/v1') : 'https://api.openai.com/v1'
      });
      this.model = process.env.LLM_MODEL || 'grok-2-latest';
      console.log(`🤖 AgentOrchestrator: Using ${useGrok ? 'Grok' : 'OpenAI'} LLM as fallback`);
    } else {
      this.llm = null;
      console.log('🤖 AgentOrchestrator: No external LLM API key - using Ollama only');
    }

    console.log('✅ AgentOrchestrator initialized with specialized agents');
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
   * Analyze user intent using LLM
   */
  async analyzeIntent(message, context) {
    if (!this.llm) {
      return this.analyzeIntentFallback(message, context);
    }

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
- Business type (cafe, restaurant, retail, etc.)
- Location (city, state)
- Platform names
- Specific compliance items

Respond in JSON format:
{
  "type": "INTENT_TYPE",
  "confidence": 0.0-1.0,
  "entities": {
    "businessType": "...",
    "location": "...",
    "platform": "..."
  },
  "reasoning": "brief explanation"
}`;

      const completion = await this.llm.chat.completions.create({
        model: process.env.LLM_MODEL || 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You are an intent classification expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const response = completion.choices[0].message.content;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.analyzeIntentFallback(message, context);
      
    } catch (error) {
      console.error('❌ Intent analysis error:', error.message);
      return this.analyzeIntentFallback(message, context);
    }
  }

  /**
   * Fallback intent analysis using pattern matching
   */
  analyzeIntentFallback(message, context) {
    const lowerMsg = message.toLowerCase();
    
    // Discovery patterns
    if (lowerMsg.match(/\b(start|open|launch|begin|want to|planning)\b.*\b(business|cafe|restaurant|store|shop)\b/)) {
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
      'retail': 'Retail Store',
      'store': 'Retail Store',
      'shop': 'Retail Store',
      'clothing': 'Retail Store',
      'electronics': 'Retail Store',
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
      'bengaluru': 'Bangalore, Karnataka',
      'delhi': 'Delhi, Delhi',
      'chennai': 'Chennai, Tamil Nadu',
      'kolkata': 'Kolkata, West Bengal',
      'hyderabad': 'Hyderabad, Telangana',
      'pune': 'Pune, Maharashtra',
      'ahmedabad': 'Ahmedabad, Gujarat',
      'surat': 'Surat, Gujarat',
      'jaipur': 'Jaipur, Rajasthan',
      'lucknow': 'Lucknow, Uttar Pradesh'
    };
    
    for (const [key, value] of Object.entries(locations)) {
      if (lowerMsg.includes(key)) {
        entities.city = value;
        break;
      }
    }
    
    // Platforms
    if (lowerMsg.includes('swiggy')) entities.platform = 'swiggy';
    if (lowerMsg.includes('zomato')) entities.platform = 'zomato';
    if (lowerMsg.includes('amazon')) entities.platform = 'amazon';
    
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
    
    // Use Ollama for general responses if available
    if (this.ollamaService.isReady()) {
      try {
        const aiResponse = await this.ollamaService.generateResponse(
          `You are an MSME business advisor. Respond helpfully to: "${message}". Keep it focused and actionable.`
        );
        
        return {
          message: aiResponse,
          type: 'general',
          data: {
            options: [
              'Start business discovery',
              'Check compliance requirements',
              'Plan my timeline',
              'Get platform help'
            ]
          }
        };
      } catch (error) {
        console.error('Ollama error:', error);
      }
    }
    
    // Fallback response
    return {
      message: `I understand you're asking about business setup. Let me help you in a structured way.

**I can assist with:**
• **Business Discovery** - Finding the right business type
• **Compliance** - Licenses and legal requirements
• **Timeline** - Step-by-step planning
• **Platforms** - Government portals and applications

**Which area would you like to explore?**`,
      type: 'general',
      data: {
        options: [
          'Business discovery',
          'Compliance requirements', 
          'Timeline planning',
          'Platform guidance'
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

  /**
   * Create Intent Analyzer Agent
   */
  createIntentAnalyzer() {
    return {
      name: 'IntentAnalyzer',
      process: async (message, context) => {
        return await this.analyzeIntent(message, context);
      }
    };
  }
}
    const self = this;
    return {
      name: 'DiscoveryAgent',
      process: async (message, intent, context) => {
        const entities = intent.entities || {};
        const businessProfile = context.businessProfile || {};
        const conversationHistory = context.conversationHistory || [];

        // Check what information we still need
        const hasBusinessType = businessProfile.businessType || entities.businessType;
        const hasLocation = businessProfile.location || businessProfile.city || entities.city;
        const hasTeamSize = businessProfile.teamSize;
        const hasInvestment = businessProfile.investmentRange;

        // Update business profile with new entities
        if (entities.businessType) businessProfile.businessType = entities.businessType;
        if (entities.city) businessProfile.location = entities.city;

        // Extract team size from message
        if (message.toLowerCase().includes('solo') || message.toLowerCase().includes('just me')) {
          businessProfile.teamSize = 'Solo entrepreneur';
        } else if (message.toLowerCase().includes('2-5') || message.toLowerCase().includes('small team')) {
          businessProfile.teamSize = 'Small team (2-5 people)';
        }

        // Extract investment from message
        if (message.toLowerCase().includes('under') && message.toLowerCase().includes('50')) {
          businessProfile.investmentRange = 'Under ₹50,000';
        } else if (message.toLowerCase().includes('50') && message.toLowerCase().includes('2 lakh')) {
          businessProfile.investmentRange = '₹50,000 - ₹2 Lakhs';
        }

        // Use Ollama for intelligent responses if available
        if (self.ollamaService.isReady()) {
          try {
            const aiResponse = await self.ollamaService.generateDiscoveryResponse(message, context);
            
            // Still follow the structured flow but with AI-enhanced responses
            if (!hasBusinessType) {
              return {
                message: aiResponse || `Great! Let's get started with your business journey.\n\nWhat type of business are you planning to start?`,
                type: 'discovery',
                data: {
                  businessProfile,
                  nextStep: 'business_type',
                  options: [
                    'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
                    'Retail Store (Clothing, Electronics, etc.)', 
                    'Service Business (Consulting, Agency)',
                    'Manufacturing (Small scale production)',
                    'E-commerce (Online selling)',
                    'Other'
                  ]
                }
              };
            }
            
            if (!hasLocation) {
              return {
                message: aiResponse || `Perfect! ${hasBusinessType} is a great choice.\n\nWhich city are you planning to start your business in?`,
                type: 'discovery',
                data: {
                  businessProfile,
                  nextStep: 'location',
                  options: [
                    'Mumbai, Maharashtra',
                    'Bangalore, Karnataka', 
                    'Delhi, Delhi',
                    'Chennai, Tamil Nadu',
                    'Pune, Maharashtra',
                    'Hyderabad, Telangana',
                    'Other city'
                  ]
                }
              };
            }
            
            if (!hasTeamSize) {
              return {
                message: aiResponse || `Excellent! Starting in ${hasLocation} is strategic.\n\nHow many people will be working in your business initially?`,
                type: 'discovery',
                data: {
                  businessProfile,
                  nextStep: 'team_size',
                  options: [
                    'Just me (Solo entrepreneur)',
                    '2-5 people (Small team)',
                    '6-10 people (Medium team)', 
                    '11-20 people (Growing team)',
                    'More than 20 people'
                  ]
                }
              };
            }

            if (!hasInvestment) {
              return {
                message: aiResponse || `Got it! Team planning is important.\n\nWhat's your initial investment budget for starting this business?`,
                type: 'discovery',
                data: {
                  businessProfile,
                  nextStep: 'investment',
                  options: [
                    'Under ₹50,000 (Micro business)',
                    '₹50,000 - ₹2 Lakhs (Small investment)',
                    '₹2 - ₹10 Lakhs (Medium investment)',
                    '₹10 - ₹25 Lakhs (High investment)',
                    'More than ₹25 Lakhs'
                  ]
                }
              };
            }

            // All info collected - AI summary
            return {
              message: aiResponse || `🎉 Perfect! I have all the information I need.\n\n**Your Business Summary:**\n• Type: ${hasBusinessType}\n• Location: ${hasLocation}\n• Team: ${hasTeamSize || 'Solo'}\n• Budget: ${hasInvestment || 'Under ₹50,000'}\n\nNow let me analyze the compliance requirements for your business...`,
              type: 'readiness_check',
              data: {
                businessProfile,
                nextStep: 'compliance_analysis'
              }
            };
            
          } catch (error) {
            console.error('❌ Ollama discovery error:', error.message);
            // Fall back to structured responses
          }
        }

        // Simple conversational flow - ask one question at a time
        if (!hasBusinessType) {
          return {
            message: `Great! Let's get started with your business journey.

What type of business are you planning to start?`,
            type: 'discovery',
            data: {
              businessProfile,
              nextStep: 'business_type',
              options: [
                'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
                'Retail Store (Clothing, Electronics, etc.)', 
                'Service Business (Consulting, Agency)',
                'Manufacturing (Small scale production)',
                'E-commerce (Online selling)',
                'Other'
              ]
            }
          };
        }

        if (!hasLocation) {
          return {
            message: `Perfect! ${hasBusinessType} is a great choice.

Which city are you planning to start your business in?`,
            type: 'discovery',
            data: {
              businessProfile,
              nextStep: 'location',
              options: [
                'Mumbai, Maharashtra',
                'Bangalore, Karnataka', 
                'Delhi, Delhi',
                'Chennai, Tamil Nadu',
                'Pune, Maharashtra',
                'Hyderabad, Telangana',
                'Other city'
              ]
            }
          };
        }

        if (!hasTeamSize) {
          return {
            message: `Excellent! Starting in ${hasLocation} is strategic.

How many people will be working in your business initially?`,
            type: 'discovery',
            data: {
              businessProfile,
              nextStep: 'team_size',
              options: [
                'Just me (Solo entrepreneur)',
                '2-5 people (Small team)',
                '6-10 people (Medium team)', 
                '11-20 people (Growing team)',
                'More than 20 people'
              ]
            }
          };
        }

        if (!hasInvestment) {
          return {
            message: `Got it! Team planning is important.

What's your initial investment budget for starting this business?`,
            type: 'discovery',
            data: {
              businessProfile,
              nextStep: 'investment',
              options: [
                'Under ₹50,000 (Micro business)',
                '₹50,000 - ₹2 Lakhs (Small investment)',
                '₹2 - ₹10 Lakhs (Medium investment)',
                '₹10 - ₹25 Lakhs (High investment)',
                'More than ₹25 Lakhs'
              ]
            }
          };
        }

        // All basic info collected - move to compliance check
        return {
          message: `🎉 Perfect! I have all the information I need.

**Your Business Summary:**
• Type: ${hasBusinessType}
• Location: ${hasLocation}
• Team: ${hasTeamSize || 'Solo'}
• Budget: ${hasInvestment || 'Under ₹50,000'}

Now let me analyze the compliance requirements for your business...`,
          type: 'readiness_check',
          data: {
            businessProfile,
            nextStep: 'compliance_analysis'
          }
        };
      }
    };
  }

  /**
   * Create Compliance Agent - Handles compliance requirements and regulations
   */
  createComplianceAgent() {
    const self = this;
    return {
      name: 'ComplianceAgent',
      process: async (message, intent, context) => {
        const businessProfile = context.businessProfile || {};
        
        // Get compliance requirements from rule engine
        let complianceData = null;
        if (businessProfile.businessType && businessProfile.state) {
          complianceData = self.ruleEngine.evaluateCompliance(businessProfile);
          console.log('🔍 RuleEngine evaluated compliance:', complianceData.mandatory.length, 'mandatory items');
        }
        
        // Use Ollama for intelligent compliance responses
        if (self.ollamaService.isReady()) {
          try {
            const aiResponse = await self.ollamaService.generateComplianceResponse(message, businessProfile);
            
            return {
              message: aiResponse,
              type: 'compliance_mapping',
              data: {
                mandatory: complianceData?.mandatory || [],
                recommended: complianceData?.recommended || [],
                businessProfile
              }
            };
            
          } catch (error) {
            console.error('❌ Ollama compliance error:', error.message);
            // Fall back to structured response
          }
        }
        
        // Generate contextual response using external LLM as fallback
        if (self.llm && complianceData) {
          try {
            const prompt = `You are a compliance expert helping with Indian business regulations.

User asked: "${message}"

Business Profile:
- Type: ${businessProfile.businessType || 'not specified'}
- Location: ${businessProfile.city || 'not specified'}, ${businessProfile.state || 'not specified'}

Mandatory Compliances:
${complianceData.mandatory.slice(0, 5).map(c => `- ${c.name}: ${c.description}`).join('\n')}

Provide a clear, helpful response that:
1. Lists the key mandatory requirements
2. Explains WHY each is needed (briefly)
3. Mentions estimated costs and timeline
4. Keeps it under 200 words

Be specific and actionable.`;

            const completion = await self.llm.chat.completions.create({
              model: self.model,
              messages: [
                { role: 'system', content: 'You are an expert in Indian MSME compliance. Explain requirements clearly and simply.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.6,
              max_tokens: 400
            });

            return {
              message: completion.choices[0].message.content,
              type: 'compliance_mapping',
              data: {
                mandatory: complianceData.mandatory,
                recommended: complianceData.recommended,
                businessProfile
              }
            };
          } catch (error) {
            console.error('❌ Compliance agent LLM error:', error.message);
          }
        }
        
        // Fallback response
        return {
          message: `📋 **Compliance Requirements**

For your ${businessProfile.businessType || 'business'} in ${businessProfile.state || 'India'}:

**🔴 Mandatory Requirements:**

1️⃣ **Business Registration**
   • Proprietorship/LLP/Pvt Ltd
   • Cost: ₹2,000-10,000
   • Timeline: 7-15 days

2️⃣ **GST Registration**
   • Required if turnover > ₹40L/year
   • Cost: ₹500-2,000
   • Timeline: 3-7 days

3️⃣ **Professional Tax**
   • For businesses with employees
   • Cost: ₹2,500/year
   • Timeline: 2-5 days

4️⃣ **Shop & Establishment Act**
   • State-specific registration
   • Cost: ₹500-2,000
   • Timeline: 7-10 days

**🟡 Industry-Specific:**

• ${businessProfile.businessType === 'cafe' || businessProfile.businessType === 'restaurant' ? 'FSSAI Food License (₹2,000-5,000)' : 'Industry-specific licenses'}
• Fire Safety Certificate (₹1,000-3,000)
• Municipal Trade License (₹500-2,000)

**📊 Summary:**
• Timeline: 2-4 weeks for basic setup
• Total Cost: ₹5,000-15,000

Would you like a detailed timeline or cost breakdown?`,
          type: 'compliance_mapping',
          data: {
            mandatory: complianceData?.mandatory || [],
            recommended: complianceData?.recommended || [],
            businessProfile
          }
        };
      }
    };
  }

  /**
   * Create Timeline Agent - Handles timeline and process questions
   */
  createTimelineAgent() {
    const self = this;
    return {
      name: 'TimelineAgent',
      process: async (message, intent, context) => {
        const businessProfile = context.businessProfile || {};
        
        // Generate timeline using rule engine
        let timelineData = null;
        if (businessProfile.businessType && businessProfile.state) {
          const complianceData = self.ruleEngine.evaluateCompliance(businessProfile);
          timelineData = self.ruleEngine.generateTimeline(complianceData.mandatory);
          console.log('📅 RuleEngine generated timeline:', timelineData.totalWeeks, 'weeks');
        }
        
        // Use Ollama for intelligent timeline responses
        if (self.ollamaService.isReady()) {
          try {
            const aiResponse = await self.ollamaService.generateTimelineResponse(message, businessProfile);
            
            return {
              message: aiResponse,
              type: 'timeline_generation',
              data: {
                timeline: timelineData?.timeline || [],
                totalCost: timelineData?.totalCost || 15000,
                totalWeeks: timelineData?.totalWeeks || 8,
                businessProfile
              }
            };
            
          } catch (error) {
            console.error('❌ Ollama timeline error:', error.message);
            // Fall back to structured response
          }
        }
        
        // Generate contextual response using external LLM as fallback
        if (self.llm && timelineData) {
          try {
            const prompt = `You are a business setup advisor creating a timeline for an Indian MSME.

User asked: "${message}"

Business: ${businessProfile.businessType || 'business'} in ${businessProfile.city || 'India'}

Timeline Data:
${timelineData.timeline.slice(0, 6).map(t => `Week ${t.week}: ${t.compliance} (₹${t.cost})`).join('\n')}

Total Cost: ₹${timelineData.totalCost}
Total Duration: ${timelineData.totalWeeks} weeks

Create a clear, actionable timeline response that:
1. Shows week-by-week breakdown
2. Highlights key milestones
3. Mentions total time and cost
4. Keeps it under 200 words

Make it encouraging and practical.`;

            const completion = await self.llm.chat.completions.create({
              model: self.model,
              messages: [
                { role: 'system', content: 'You are a business setup expert. Create clear, actionable timelines.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.6,
              max_tokens: 400
            });

            return {
              message: completion.choices[0].message.content,
              type: 'timeline_generation',
              data: {
                timeline: timelineData.timeline,
                totalCost: timelineData.totalCost,
                totalWeeks: timelineData.totalWeeks,
                businessProfile
              }
            };
          } catch (error) {
            console.error('❌ Timeline agent LLM error:', error.message);
          }
        }
        
        // Fallback response
        return {
          message: `📅 **Your Business Launch Timeline**

**Phase 1: Foundation (Week 1-2)**
1️⃣ Finalize business name and structure
2️⃣ Apply for business registration
3️⃣ Open current bank account
   💰 Cost: ₹2,000-5,000

**Phase 2: Compliance (Week 3-4)**
1️⃣ Complete GST registration (if applicable)
2️⃣ Get FSSAI license (for food businesses)
3️⃣ Apply for Shop & Establishment Act
   💰 Cost: ₹3,000-8,000

**Phase 3: Operations (Week 5-6)**
1️⃣ Set up accounting systems
2️⃣ Get professional tax registration
3️⃣ Apply for fire safety certificate
   💰 Cost: ₹2,000-5,000

**Phase 4: Launch (Week 7-8)**
1️⃣ Complete all inspections
2️⃣ Get final approvals
3️⃣ Start operations! 🚀
   💰 Cost: ₹1,000-2,000

**📊 Summary:**
• Total Cost: ₹8,000-20,000
• Total Timeline: 6-8 weeks
• Key Milestone: Week 4 (All registrations complete)

Ready to start with Phase 1?`,
          type: 'timeline_generation',
          data: {
            timeline: timelineData?.timeline || [],
            totalCost: timelineData?.totalCost || 15000,
            totalWeeks: timelineData?.totalWeeks || 8,
            businessProfile
          }
        };
      }
    };
  }

  /**
   * Create Platform Agent - Handles platform onboarding questions
   */
  createPlatformAgent() {
    const self = this;
    return {
      name: 'PlatformAgent',
      process: async (message, intent, context) => {
        const entities = intent.entities || {};
        const platform = entities.platform || 'all platforms';
        
        // Use Ollama for intelligent platform responses
        if (self.ollamaService.isReady()) {
          try {
            const aiResponse = await self.ollamaService.generatePlatformResponse(message, platform);
            
            return {
              message: aiResponse,
              type: 'platform_onboarding',
              data: {
                platform,
                platforms: {
                  swiggy: { commission: '15-25%', timeline: '3-7 days' },
                  zomato: { commission: '18-23%', timeline: '2-5 days' },
                  amazon: { commission: '5-20%', timeline: '7-14 days' }
                }
              }
            };
            
          } catch (error) {
            console.error('❌ Ollama platform error:', error.message);
            // Fall back to structured response
          }
        }
        
        // Generate contextual response using external LLM as fallback
        if (self.llm) {
          try {
            const prompt = `You are an expert on food delivery and e-commerce platforms in India.

User asked: "${message}"

Platform mentioned: ${platform}

Provide detailed information about:
1. Requirements for ${platform} (FSSAI, GST, documents)
2. Commission structure
3. Approval timeline
4. Tips for success

Keep it under 200 words and actionable.`;

            const completion = await self.llm.chat.completions.create({
              model: self.model,
              messages: [
                { role: 'system', content: 'You are an expert on Swiggy, Zomato, and Amazon seller onboarding in India.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 400
            });

            return {
              message: completion.choices[0].message.content,
              type: 'platform_onboarding',
              data: {
                platform,
                platforms: {
                  swiggy: { commission: '15-25%', timeline: '3-7 days' },
                  zomato: { commission: '18-23%', timeline: '2-5 days' },
                  amazon: { commission: '5-20%', timeline: '7-14 days' }
                }
              }
            };
          } catch (error) {
            console.error('❌ Platform agent LLM error:', error.message);
          }
        }
        
        // Fallback response
        return {
          message: `🛵 **Platform Onboarding Guide**

**1️⃣ Swiggy Requirements:**

📋 **Documents Needed:**
• FSSAI License (mandatory)
• GST Registration (recommended)
• Bank account for payments
• Menu with pricing
• Restaurant photos

💰 **Commission:** 15-25% of order value
⏱️ **Approval Time:** 3-7 days

**2️⃣ Zomato Requirements:**

📋 **Documents Needed:**
• FSSAI License (mandatory)
• Bank account for payments
• Menu and photos
• Basic business documents

💰 **Commission:** 18-23% of order value
⏱️ **Approval Time:** 2-5 days

**📦 Complete Document Checklist:**
✅ Business registration proof
✅ FSSAI certificate
✅ PAN card
✅ Bank account details
✅ Menu with photos
✅ GST registration (if applicable)

**💡 Next Steps:**
I can help you prepare these documents step by step!

Which platform would you like to start with?`,
          type: 'platform_onboarding',
          data: {
            platform,
            platforms: {
              swiggy: { commission: '15-25%', timeline: '3-7 days' },
              zomato: { commission: '18-23%', timeline: '2-5 days' }
            }
          }
        };
      }
    };
  }

  /**
   * Create Readiness Agent - Uses RuleEngine for business readiness scoring
   */
  createReadinessAgent() {
    const self = this;
    return {
      name: 'ReadinessAgent',
      process: async (message, intent, context) => {
        const businessProfile = context.businessProfile || {};
        
        // Use RuleEngine to calculate readiness score
        let readinessScore = null;
        if (businessProfile.businessType && businessProfile.state) {
          const complianceData = self.ruleEngine.evaluateCompliance(businessProfile);
          readinessScore = self.ruleEngine.calculateReadinessScore(businessProfile, complianceData.mandatory);
          console.log('📊 RuleEngine calculated readiness score:', readinessScore.score + '%');
        }
        
        // Generate contextual response using LLM
        if (self.llm && readinessScore) {
          try {
            const prompt = `You are a business readiness advisor analyzing an Indian MSME's preparedness.

User asked: "${message}"

Business Profile:
- Type: ${businessProfile.businessType || 'not specified'}
- Location: ${businessProfile.city || 'not specified'}, ${businessProfile.state || 'not specified'}

Readiness Analysis:
- Score: ${readinessScore.score}%
- Completed: ${readinessScore.completed}/${readinessScore.totalRequired} requirements
- Missing: ${readinessScore.missing.length} items

Provide an encouraging response that:
1. Acknowledges their current readiness level
2. Highlights what they've done well
3. Identifies the most critical missing items
4. Suggests the next 2-3 steps to improve readiness
5. Keeps it under 150 words

Be motivational and actionable.`;

            const completion = await self.llm.chat.completions.create({
              model: self.model,
              messages: [
                { role: 'system', content: 'You are a business readiness coach. Be encouraging and practical.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 300
            });

            return {
              message: completion.choices[0].message.content,
              type: 'readiness_report',
              data: {
                readinessScore,
                businessProfile,
                nextStep: 'compliance_mapping'
              }
            };
          } catch (error) {
            console.error('❌ Readiness agent LLM error:', error.message);
          }
        }
        
        // Fallback response
        return {
          message: `📊 **Business Readiness Assessment**

Your current readiness score: ${readinessScore?.score || 70}%

**What You've Done Well:**
✅ ${readinessScore?.completed || 3} requirements completed
✅ Basic business concept established
✅ Location identified

**Critical Missing Items:**
❌ Business registration
❌ GST registration (if applicable)
❌ Industry-specific licenses

**Next Steps to Improve Readiness:**
1. **Week 1**: Complete business registration
2. **Week 2**: Apply for industry-specific licenses
3. **Week 3**: Set up GST registration

**Target**: Reach 90%+ readiness before launching

Would you like me to help you with the specific compliance requirements?`,
          type: 'readiness_report',
          data: {
            readinessScore: readinessScore || { score: 70, completed: 3, totalRequired: 5, missing: [] },
            businessProfile,
            nextStep: 'compliance_mapping'
          }
        };
      }
    };
  }

  /**
   * Create General Agent - Handles general queries and greetings
   */
  createGeneralAgent() {
    const self = this;
    return {
      name: 'GeneralAgent',
      process: async (message, intent, context) => {
        // Try Ollama first for intelligent responses
        if (self.ollamaService.isReady()) {
          try {
            const aiResponse = await self.ollamaService.generateGeneralResponse(message);
            
            // Check if we should start discovery flow
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.match(/\b(hello|hi|hey|start|help|begin)\b/)) {
              return {
                message: aiResponse || `Hello! I'm your MSME Compliance Navigator.\n\nI'll help you start your business in India with all the right compliance requirements.\n\nWhat type of business are you planning to start?`,
                type: 'discovery',
                data: {
                  businessProfile: {},
                  nextStep: 'business_type',
                  options: [
                    'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
                    'Retail Store (Clothing, Electronics, etc.)', 
                    'Service Business (Consulting, Agency)',
                    'Manufacturing (Small scale production)',
                    'E-commerce (Online selling)',
                    'Other'
                  ]
                }
              };
            }
            
            // For other queries, provide AI response but guide to discovery
            return {
              message: `${aiResponse}\n\nTo provide personalized guidance, let me understand your business better.\n\nWhat type of business are you planning to start?`,
              type: 'discovery',
              data: {
                businessProfile: {},
                nextStep: 'business_type',
                options: [
                  'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
                  'Retail Store (Clothing, Electronics, etc.)', 
                  'Service Business (Consulting, Agency)',
                  'Manufacturing (Small scale production)',
                  'E-commerce (Online selling)',
                  'Other'
                ]
              }
            };
            
          } catch (error) {
            console.error('❌ Ollama general agent error:', error.message);
            // Fall back to structured responses
          }
        }

        // Generate contextual response using external LLM as fallback
        if (self.llm) {
          try {
            const prompt = `You are a friendly MSME compliance assistant for Indian businesses.

User said: "${message}"

Provide a helpful, warm response that:
1. Addresses their query or greeting
2. Offers to help with business setup, compliance, or platform onboarding
3. Asks what they'd like to know more about
4. Keeps it under 100 words

Be conversational and encouraging.`;

            const completion = await self.llm.chat.completions.create({
              model: self.model,
              messages: [
                { role: 'system', content: 'You are a helpful MSME compliance assistant. Be warm, friendly, and concise.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.8,
              max_tokens: 200
            });

            return {
              message: completion.choices[0].message.content,
              type: 'general_response',
              data: null
            };
          } catch (error) {
            console.error('❌ General agent LLM error:', error.message);
          }
        }
        
        // Fallback response - redirect to discovery flow
        const lowerMsg = message.toLowerCase();
        
        // Check if user is greeting or starting conversation
        if (lowerMsg.match(/\b(hello|hi|hey|start|help|begin)\b/)) {
          return {
            message: `Hello! I'm your MSME Compliance Navigator. 

I'll help you start your business in India with all the right compliance requirements.

What type of business are you planning to start?`,
            type: 'discovery',
            data: {
              businessProfile: {},
              nextStep: 'business_type',
              options: [
                'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
                'Retail Store (Clothing, Electronics, etc.)', 
                'Service Business (Consulting, Agency)',
                'Manufacturing (Small scale production)',
                'E-commerce (Online selling)',
                'Other'
              ]
            }
          };
        }
        
        // For other general queries, redirect to discovery
        return {
          message: `I'd love to help you with that! 

First, let me understand your business better so I can provide personalized guidance.

What type of business are you planning to start?`,
          type: 'discovery',
          data: {
            businessProfile: {},
            nextStep: 'business_type',
            options: [
              'Food & Restaurant (Cafe, Restaurant, Cloud Kitchen)',
              'Retail Store (Clothing, Electronics, etc.)', 
              'Service Business (Consulting, Agency)',
              'Manufacturing (Small scale production)',
              'E-commerce (Online selling)',
              'Other'
            ]
          }
        };
      }
    };
  }
}
