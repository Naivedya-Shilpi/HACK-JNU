import { COMPLIANCE_DATABASE } from '../data/compliances.js';

/**
 * Timeline Agent - Provides business setup timelines using Ollama LLM
 * Uses real compliance data to calculate accurate timelines
 */
export class TimelineAgent {
  constructor(ollamaService, complianceService) {
    this.ollamaService = ollamaService;
    this.complianceService = complianceService;
    this.name = 'TimelineAgent';
  }

  async process(message, context, session) {
    console.log('⏰ TimelineAgent: Processing timeline query');
    
    const businessProfile = session.businessProfile || {};
    
    // Get compliance timelines from dataset
    const complianceTimelines = this.getComplianceTimelines(businessProfile);
    
    const systemPrompt = `You are a business timeline expert helping users understand how long it takes to start their MSME business in India. Use the provided compliance timeline data to give accurate estimates.

Compliance Timelines:
${complianceTimelines.map(comp => 
  `${comp.name}: ${comp.timeline} (Cost: ${typeof comp.cost === 'object' ? Object.values(comp.cost).join('-') : comp.cost})`
).join('\n')}

Business Profile: ${JSON.stringify(businessProfile, null, 2)}

Guidelines:
- Provide realistic timeline estimates based on real data
- Break down timeline into phases (Documentation, Applications, Approvals)
- Include parallel processing opportunities
- Mention dependencies between registrations
- Keep responses under 250 words
- Use bullet points for clarity
- Be encouraging but realistic`;

    const userPrompt = `User asked: "${message}"

Based on their business profile and the compliance timeline data, provide a comprehensive timeline breakdown for starting their business.

Consider:
1. Documentation gathering phase
2. Application submission phase  
3. Approval waiting periods
4. What can be done in parallel
5. Critical path items

Give a realistic timeline with specific milestones.`;

    try {
      const response = await this.ollamaService.generateResponse(
        userPrompt,
        systemPrompt,
        { temperature: 0.4 }
      );

      const totalTimeline = this.calculateTotalTimeline(complianceTimelines);

      return {
        message: response,
        type: 'timeline',
        agent: this.name,
        data: {
          businessProfile,
          estimatedTimeline: totalTimeline,
          complianceTimelines: complianceTimelines,
          phases: this.getTimelinePhases(complianceTimelines)
        }
      };

    } catch (error) {
      console.error('❌ TimelineAgent Ollama error:', error);
      return this.getFallbackResponse(message, businessProfile);
    }
  }

  getComplianceTimelines(businessProfile) {
    const central = COMPLIANCE_DATABASE.central;
    const relevantCompliances = [];

    for (const [key, compliance] of Object.entries(central)) {
      let applicable = false;

      // Check if applicable to business type
      if (compliance.applicableIf?.businessType) {
        applicable = compliance.applicableIf.businessType.some(type => 
          businessProfile.businessType?.toLowerCase().includes(type)
        );
      }

      // Include mandatory compliances
      if (compliance.mandatory && !compliance.applicableIf) {
        applicable = true;
      }

      // Include GST for most businesses
      if (key === 'GST') {
        applicable = true;
      }

      if (applicable) {
        relevantCompliances.push({
          id: key,
          name: compliance.name,
          timeline: compliance.timeline,
          cost: compliance.cost,
          mandatory: compliance.mandatory,
          documents: compliance.documents?.length || 0
        });
      }
    }

    return relevantCompliances;
  }

  calculateTotalTimeline(compliances) {
    // Extract maximum days from timeline strings
    let maxDays = 0;
    
    for (const compliance of compliances) {
      const timeline = compliance.timeline.toLowerCase();
      const dayMatches = timeline.match(/(\d+)(?:-(\d+))?\s*days?/);
      
      if (dayMatches) {
        const days = parseInt(dayMatches[2] || dayMatches[1]);
        maxDays = Math.max(maxDays, days);
      }
    }

    // Convert to weeks/months for better readability
    if (maxDays <= 30) {
      return `${Math.ceil(maxDays / 7)} weeks`;
    } else {
      return `${Math.ceil(maxDays / 30)} months`;
    }
  }

  getTimelinePhases(compliances) {
    return {
      documentation: '1-2 weeks',
      applications: '2-3 weeks', 
      approvals: this.calculateTotalTimeline(compliances),
      launch: '1 week'
    };
  }

  getFallbackResponse(message, businessProfile) {
    if (!businessProfile.businessType) {
      return {
        message: `⏰ **Timeline Planning Available**

I can provide detailed timeline estimates once I know your business details.

**For accurate timelines, I need:**
• Business type
• Location (state)
• Business scale
• Required licenses

**General Timeline:**
• Documentation: 1-2 weeks
• Applications: 2-4 weeks  
• Approvals: 1-3 months
• Launch: 1 week

What type of business are you starting?`,
        type: 'discovery_redirect',
        agent: this.name,
        data: { nextAgent: 'discovery' }
      };
    }

    return {
      message: `⏰ **Timeline Estimate for ${businessProfile.businessType}**

**Phase 1: Documentation (1-2 weeks)**
• Gather required documents
• Prepare applications
• Get photos/certificates

**Phase 2: Applications (2-3 weeks)**  
• Submit registrations
• Pay fees
• Follow up on status

**Phase 3: Approvals (1-3 months)**
• Wait for government approvals
• Complete inspections if required
• Receive certificates

**Phase 4: Launch (1 week)**
• Final preparations
• Soft opening
• Official launch

**Total: 2-4 months approximately**

Would you like details about any specific phase?`,
      type: 'timeline',
      agent: this.name,
      data: {
        businessProfile,
        estimatedTimeline: '2-4 months',
        phases: {
          documentation: '1-2 weeks',
          applications: '2-3 weeks',
          approvals: '1-3 months', 
          launch: '1 week'
        }
      }
    };
  }
}