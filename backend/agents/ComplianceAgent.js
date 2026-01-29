import { INDIAN_STATES_DATA } from '../data/states.js';
import { COMPLIANCE_DATABASE } from '../data/compliances.js';

/**
 * Compliance Agent - Handles compliance requirements using Ollama LLM
 * Uses real compliance datasets to provide accurate legal guidance
 */
export class ComplianceAgent {
  constructor(ollamaService, complianceService, ruleEngine) {
    this.ollamaService = ollamaService;
    this.complianceService = complianceService;
    this.ruleEngine = ruleEngine;
    this.name = 'ComplianceAgent';
  }

  async process(message, context, session) {
    console.log('⚖️ ComplianceAgent: Processing compliance query');
    
    const businessProfile = session.businessProfile || {};
    
    // Get relevant compliance data from datasets
    const centralCompliances = COMPLIANCE_DATABASE.central;
    const stateData = this.getStateData(businessProfile.state);
    
    const systemPrompt = `You are a compliance expert helping MSME businesses in India understand their legal requirements. Use the provided compliance database to give accurate guidance.

Available Central Compliances:
${Object.entries(centralCompliances).map(([key, compliance]) => 
  `${key}: ${compliance.name} - ${compliance.category} (Mandatory: ${compliance.mandatory})`
).join('\n')}

Business Profile: ${JSON.stringify(businessProfile, null, 2)}

State Information: ${stateData ? JSON.stringify(stateData, null, 2) : 'Not specified'}

Guidelines:
- Provide specific compliance requirements based on business type and location
- Mention exact costs, timelines, and documents needed
- Use bullet points for clarity
- Be precise and reference real data from compliance database
- Keep responses under 250 words
- Prioritize mandatory compliances first`;

    const userPrompt = `User asked: "${message}"

Based on their business profile, what compliance requirements should they know about?

If business type is:
- Restaurant/Cafe: Focus on FSSAI, GST, local permits
- Manufacturing: Focus on Factories Act, Pollution clearance, GST
- Textile: Focus on GST, labor laws, export regulations
- Retail: Focus on shops act, GST, local licenses

Provide specific guidance with actual costs, timelines, and documents from the compliance database.`;

    try {
      const response = await this.ollamaService.generateResponse(
        userPrompt,
        systemPrompt,
        { temperature: 0.3 }
      );

      // Get applicable compliances for the business
      const applicableCompliances = this.getApplicableCompliances(businessProfile);

      return {
        message: response,
        type: 'compliance',
        agent: this.name,
        data: {
          businessProfile,
          applicableCompliances,
          complianceCount: applicableCompliances.length
        }
      };

    } catch (error) {
      console.error('❌ ComplianceAgent Ollama error:', error);
      return this.getFallbackResponse(message, businessProfile);
    }
  }

  getApplicableCompliances(businessProfile) {
    const compliances = [];
    const central = COMPLIANCE_DATABASE.central;

    for (const [key, compliance] of Object.entries(central)) {
      let applicable = false;

      // Check business type applicability
      if (compliance.applicableIf?.businessType) {
        applicable = compliance.applicableIf.businessType.some(type => 
          businessProfile.businessType?.toLowerCase().includes(type)
        );
      }

      // Check turnover applicability (assume medium business has 50L+ turnover)
      if (compliance.applicableIf?.annualTurnover) {
        const threshold = compliance.applicableIf.annualTurnover.greaterThan;
        if (businessProfile.scale === 'medium' || businessProfile.scale === 'large') {
          applicable = applicable || (threshold <= 5000000); // 50L assumption for medium+
        }
      }

      // Always include mandatory general compliances
      if (compliance.mandatory && !compliance.applicableIf) {
        applicable = true;
      }

      if (applicable) {
        compliances.push({
          ...compliance,
          priority: compliance.mandatory ? 'high' : 'medium'
        });
      }
    }

    return compliances;
  }

  getStateData(stateName) {
    if (!stateName) return null;
    return INDIAN_STATES_DATA.states.find(state => 
      state.name.toLowerCase() === stateName.toLowerCase()
    );
  }

  getFallbackResponse(message, businessProfile) {
    if (!businessProfile.businessType) {
      return {
        message: `⚠️ **Business Information Needed**

I need to understand your business better to provide compliance guidance.

**Please tell me:**
• What type of business are you starting?
• Which state/city in India?
• What's your expected scale?

Let's start with your business type!`,
        type: 'discovery_redirect',
        agent: this.name,
        data: { nextAgent: 'discovery' }
      };
    }

    const basicCompliances = ['GST Registration', 'MSME Udyam Registration', 'Shop & Establishment License'];
    
    return {
      message: `📋 **Basic Compliance Requirements for ${businessProfile.businessType}**

**Essential Registrations:**
• GST Registration (if turnover > 40L)
• MSME Udyam Registration (Free, online)
• Shop & Establishment License
• Professional Tax Registration

**Next Steps:**
1. Gather required documents
2. Start with free registrations first
3. Plan for mandatory licenses

Would you like details about any specific compliance?`,
      type: 'compliance',
      agent: this.name,
      data: {
        businessProfile,
        basicCompliances,
        complianceCount: 4
      }
    };
  }
}