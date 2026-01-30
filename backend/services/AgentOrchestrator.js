import { OllamaService } from './OllamaService.js';
import { DiscoveryAgent } from '../agents/DiscoveryAgent.js';
import { ClassificationAgent } from '../agents/ClassificationAgent.js';
import { ComplianceAgent } from '../agents/ComplianceAgent.js';
import { TimelineAgent } from '../agents/TimelineAgent.js';
import { PlatformAgent } from '../agents/PlatformAgent.js';
import { MultilingualService } from './MultilingualService.js';

export class AgentOrchestrator {
  constructor(ruleEngine, complianceService) {
    this.ruleEngine = ruleEngine;
    this.complianceService = complianceService;
    this.ollamaService = new OllamaService();
    
    this.discoveryAgent = new DiscoveryAgent(this.ollamaService, complianceService);
    this.classificationAgent = new ClassificationAgent();
    this.complianceAgent = new ComplianceAgent(this.ollamaService);
    this.timelineAgent = new TimelineAgent(this.ollamaService, complianceService);
    this.platformAgent = new PlatformAgent(this.ollamaService, complianceService);
    this.multilingualService = new MultilingualService();

    console.log('✅ AgentOrchestrator initialized - Clean Architecture');
  }

  async processMessage(message, context = {}) {
    console.log('🎯 Orchestrator: Processing request with conversation memory...');
    
    // Process multilingual input
    const multilingualResult = await this.multilingualService.processMultilingualInput(message, context);
    console.log(`🌐 Detected language: ${multilingualResult.languageName} (${multilingualResult.detectedLanguage})`);
    
    // Add multilingual context
    context.language = multilingualResult.detectedLanguage;
    context.multilingualResult = multilingualResult;
    
    // Log memory context if available
    if (context.memoryContext && context.memoryContext.length > 0) {
      console.log(`💭 Memory: Found ${context.memoryContext.length} previous messages`);
    }
    
    try {
      const intent = await this._extractIntent(message, context);
      return await this._routeToAgent(intent, message, context);
    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      return { 
        message: this.multilingualService.getBasicGreeting(context.language), 
        type: 'error' 
      };
    }
  }

  async _extractIntent(message, context) {
    try {
      // Enhanced intent extraction with conversation and document context
      const systemPrompt = 'Extract intent: DISCOVERY, COMPLIANCE, TIMELINE, PLATFORM, DOCUMENT_ANALYSIS, or GENERAL. Return only the intent type.';
      let userPrompt = `Message: "${message}".`;
      
      // Add document analysis context if available
      if (context.documentContext) {
        userPrompt += `\nDocument Analysis: User uploaded ${context.documentContext.uploadedFiles} documents with ${context.documentContext.combinedAnalysis?.complianceScore || 0}% compliance score.`;
      }
      
      // Add conversation context if available
      if (context.conversationContext && context.conversationContext !== 'This is the start of a new conversation.') {
        userPrompt += `\nConversation Context: ${context.conversationContext}`;
      }
      
      userPrompt += '\nIntent:';
      
      // Add user intent context if provided from frontend
      if (context.userIntent) {
        userPrompt += ` User's declared intent: ${context.userIntent}.`;
      }
      
      userPrompt += ` Intent:`;
      
      const response = await this.ollamaService.generateResponse(userPrompt, systemPrompt, { temperature: 0.2 });
      const intentType = response.trim().toUpperCase();
      const validIntents = ['DISCOVERY', 'COMPLIANCE', 'TIMELINE', 'PLATFORM', 'DOCUMENT_ANALYSIS', 'GENERAL'];
      
      return { type: validIntents.includes(intentType) ? intentType : 'GENERAL' };
    } catch (error) {
      return this._fallbackIntent(message, context);
    }
  }

  _fallbackIntent(message, context = {}) {
    const lowerMsg = message.toLowerCase();
    
    // Check if we have document context - likely document analysis intent
    if (context.documentContext) {
      return { type: 'DOCUMENT_ANALYSIS' };
    }
    
    // FSSAI specific patterns
    if (lowerMsg.match(/\b(fssai|food.*safety|food.*license|food.*permit|food.*registration)\b/)) {
      return { type: 'FSSAI' };
    }
    
    // Discovery patterns
    if (lowerMsg.match(/\b(start|begin|open|launch|want.*start|planning.*business|business.*type|what.*business)\b/)) {
      return { type: 'DISCOVERY' };
    }
    
    // Compliance patterns (broader and more specific)
    if (lowerMsg.match(/\b(license|permit|registration|gst|compliance|legal|requirement|documents.*required|what.*documents|certificate|approval)\b/)) {
      return { type: 'COMPLIANCE' };
    }
    
    // Timeline patterns
    if (lowerMsg.match(/\b(timeline|duration|how.*long|when|steps|process|time.*take|how.*much.*time)\b/)) {
      return { type: 'TIMELINE' };
    }
    
    // Platform patterns
    if (lowerMsg.match(/\b(swiggy|zomato|amazon|platform|online|delivery|marketplace)\b/)) {
      return { type: 'PLATFORM' };
    }
    
    // Document upload/analysis patterns
    if (lowerMsg.match(/\b(upload|document|pdf|image|analyze|scan|extract)\b/)) {
      return { type: 'DOCUMENT_ANALYSIS' };
    }
    
    return { type: 'GENERAL' };
  }

  async _routeToAgent(intent, message, context) {
    console.log(`🤖 Routing to ${intent.type} agent`);

    switch (intent.type) {
      case 'DISCOVERY':
        return await this.discoveryAgent.process(message, context, context.session);
      case 'COMPLIANCE':
        return await this._handleCompliance(message, context);
      case 'FSSAI':
        return await this._handleFSSAI(message, context);
      case 'TIMELINE':
        return await this.timelineAgent.process(message, context, context.session);
      case 'PLATFORM':
        return await this.platformAgent.process(message, context, context.session);
      case 'DOCUMENT_ANALYSIS':
        return await this._handleDocumentAnalysis(message, context);
      default:
        return await this._handleGeneral(message, context);
    }
  }

  async _handleCompliance(message, context) {
    const businessProfile = context.session?.businessProfile;
    
    if (!businessProfile?.businessType) {
      return {
        message: 'I need your business details first. What type of business are you starting?',
        type: 'redirect'
      };
    }

    const classification = this.classificationAgent.classify(businessProfile);
    const complianceContext = { ...context, classification: classification.classification };
    
    return await this.complianceAgent.process(message, complianceContext, context.session);
  }

  async _handleGeneral(message, context) {
    try {
      // Use multilingual processing
      const multilingualResult = context.multilingualResult || await this.multilingualService.processMultilingualInput(message, context);
      const detectedLanguage = multilingualResult.detectedLanguage;
      
      // Better context-aware general handling
      let userPrompt = multilingualResult.multilingualPrompt;
      let systemPrompt = multilingualResult.systemPrompt;
      
      // Check for business context to provide relevant guidance
      const businessProfile = context.session?.businessProfile;
      if (businessProfile && Object.keys(businessProfile).length > 0) {
        userPrompt += `\nBusiness Context: ${JSON.stringify(businessProfile, null, 2)}`;
        systemPrompt += ' Use the business context to provide relevant advice.';
      }
      
      // Add conversation context for better continuity
      if (context.conversationContext && context.conversationContext !== 'This is the start of a new conversation.') {
        userPrompt += `\nConversation Context: ${context.conversationContext}`;
        systemPrompt += ' Continue the conversation naturally based on previous context.';
      }
      
      // Detect if this is a greeting or introduction
      const isGreeting = message.toLowerCase().match(/^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings?|नमस्ते|নমস্কার|வணக்கம்)$/i);
      
      if (isGreeting) {
        // Get fully translated welcome message using new Python translation service
        const fullWelcomeMessage = await multilingualResult.fullWelcomeMessage();
        
        return {
          message: fullWelcomeMessage,
          type: 'greeting',
          data: {
            language: detectedLanguage,
            suggestions: [
              'I want to start a restaurant business',
              'What documents do I need for GST registration?',
              'How long does it take to get FSSAI license?',
              'Help me analyze my business documents'
            ]
          }
        };
      }
      
      userPrompt += '\nProvide helpful, specific guidance. If unsure about the topic, offer to help with business discovery, compliance, timelines, or platform guidance.';
      
      const response = await this.ollamaService.generateResponse(
        userPrompt,
        systemPrompt,
        { temperature: 0.4, max_tokens: 300 }
      );
      
      return { 
        message: response, 
        type: 'general',
        data: { language: detectedLanguage }
      };
    } catch (error) {
      console.error('❌ General handler error:', error);
      const language = context.language || 'en';
      const greeting = multilingualService.getGreeting(language);
      
      return { 
        message: `${greeting}

• **Business Discovery** - What type of business should you start?
• **Compliance Help** - Licenses, registrations, and requirements
• **Timeline Planning** - How long will each step take?
• **Platform Guidance** - Getting on Swiggy, Zomato, Amazon, etc.
• **Document Analysis** - Upload and analyze your business documents

What specific area would you like help with?`, 
        type: 'general',
        data: { language }
      };
    }
  }

  async _handleDocumentAnalysis(message, context) {
    try {
      console.log('📄 Processing document analysis request...');
      
      if (!context.documentContext) {
        return {
          message: 'I\'m ready to analyze your documents! Please upload your business documents (GST certificate, PAN card, Aadhaar, bank statements, etc.) and I\'ll help you understand their compliance status.',
          type: 'document_prompt'
        };
      }

      const docCtx = context.documentContext;
      const combinedAnalysis = docCtx.combinedAnalysis;
      
      // Build comprehensive analysis prompt
      let analysisPrompt = `Analyze the following document processing results and provide MSME compliance guidance:

📊 DOCUMENT SUMMARY:
- Total uploaded: ${docCtx.uploadedFiles} documents
- Successfully processed: ${docCtx.successfulExtractions} documents  
- Overall compliance score: ${combinedAnalysis?.complianceScore || 0}%

📋 EXTRACTED INFORMATION:
${JSON.stringify(combinedAnalysis?.extractedFields || {}, null, 2)}

⚠️ IDENTIFIED ISSUES:
${combinedAnalysis?.allIssues?.join('\n- ') || 'No major issues detected'}

💡 RECOMMENDATIONS:
${combinedAnalysis?.allRecommendations?.join('\n- ') || 'Standard compliance procedures apply'}

🗂️ DOCUMENT DETAILS:
${docCtx.fileResults?.map((file, index) => {
  return `${index + 1}. ${file.fileName || file.documentType}
   - Type: ${file.documentType || 'Unknown'}
   - Status: ${file.confidence >= 80 ? 'Complete ✅' : file.confidence >= 60 ? 'Partial ⚠️' : 'Incomplete ❌'}
   - Confidence: ${file.confidence || 0}%`;
}).join('\n')}

User Question: "${message}"

Please provide:
1. Validation of the extracted information
2. Compliance status assessment for MSME registration
3. What documents are missing or need improvement  
4. Specific next steps
5. Any regulatory concerns or opportunities

Be specific about MSME compliance requirements and actionable next steps.`;

      const response = await this.ollamaService.generateResponse(
        analysisPrompt,
        'You are an expert MSME compliance advisor. Analyze document extraction results and provide specific, actionable compliance guidance for Indian businesses.',
        { temperature: 0.2, max_tokens: 800 }
      );

      return {
        message: response,
        type: 'document_analysis',
        data: {
          documentSummary: {
            totalFiles: docCtx.uploadedFiles,
            processedFiles: docCtx.successfulExtractions,
            complianceScore: combinedAnalysis?.complianceScore || 0
          },
          extractedFields: combinedAnalysis?.extractedFields || {},
          issues: combinedAnalysis?.allIssues || [],
          recommendations: combinedAnalysis?.allRecommendations || []
        }
      };
      
    } catch (error) {
      console.error('❌ Document analysis error:', error);
      return {
        message: 'I encountered an issue analyzing your documents. Please try uploading them again or contact support if the problem persists.',
        type: 'error'
      };
    }
  }

  async _handleFSSAI(message, context) {
    try {
      console.log('🍲 Processing FSSAI compliance request...');
      
      const businessProfile = context.session?.businessProfile || {};
      
      const fssaiPrompt = `Provide detailed information about FSSAI (Food Safety and Standards Authority of India) license requirements.

Business Context: ${JSON.stringify(businessProfile, null, 2)}

User Question: "${message}"

Please provide:
1. Types of FSSAI licenses (Basic, State, Central)
2. Required documents for each type
3. Application process and timelines
4. Fees and costs
5. Specific requirements based on business type
6. Digital application process

Be comprehensive and include practical guidance for Indian food businesses.`;

      const response = await this.ollamaService.generateResponse(
        fssaiPrompt,
        'You are an expert in Indian food business compliance, specifically FSSAI regulations. Provide accurate, actionable guidance.',
        { temperature: 0.3, max_tokens: 800 }
      );

      return {
        message: response,
        type: 'fssai_compliance',
        data: {
          licenseTypes: ['Basic Registration', 'State License', 'Central License'],
          businessProfile,
          nextSteps: [
            'Determine your FSSAI license type based on turnover',
            'Gather required documents',
            'Apply online at foscos.fssai.gov.in',
            'Pay applicable fees',
            'Schedule inspection if required'
          ]
        }
      };
      
    } catch (error) {
      console.error('❤️ FSSAI handler error:', error);
      return {
        message: `🍲 **FSSAI License Information**

**License Types:**
• **Basic Registration**: Turnover < ₹12 lakh/year
• **State License**: Turnover ₹12 lakh - 20 crore/year  
• **Central License**: Turnover > ₹20 crore/year

**Required Documents:**
• Form A (Application)
• Food safety management plan
• List of food products
• NOC from municipality
• Water test report
• Medical certificate
• ID proof & address proof
• Partnership deed (if applicable)

**Process:**
1. Apply online at foscos.fssai.gov.in
2. Upload documents
3. Pay fees (₹100 for Basic to ₹7,500 for Central)
4. Inspection (if required)
5. License issuance (14-60 days)

Would you like specific guidance for your business type?`,
        type: 'fssai_compliance'
      };
    }
  }
}