/**
 * Platform Agent - Handles platform integration queries using Ollama LLM  
 * Provides guidance on Swiggy, Zomato, Amazon and other platforms
 */
export class PlatformAgent {
  constructor(ollamaService, complianceService) {
    this.ollamaService = ollamaService;
    this.complianceService = complianceService;
    this.name = 'PlatformAgent';
    
    // Platform data for context
    this.platformData = {
      'swiggy': {
        name: 'Swiggy',
        type: 'food_delivery',
        requirements: ['FSSAI License', 'GST Registration', 'Bank Account'],
        commission: '15-25%',
        onboarding: '3-7 days',
        documents: ['FSSAI', 'GST Certificate', 'PAN Card', 'Bank Details']
      },
      'zomato': {
        name: 'Zomato',  
        type: 'food_delivery',
        requirements: ['FSSAI License', 'GST Registration', 'Quality Standards'],
        commission: '15-25%',
        onboarding: '5-10 days',
        documents: ['FSSAI', 'GST Certificate', 'Menu', 'Restaurant Photos']
      },
      'amazon': {
        name: 'Amazon',
        type: 'ecommerce', 
        requirements: ['GST Registration', 'Product Compliance', 'Quality Standards'],
        commission: '5-20%',
        onboarding: '7-14 days',
        documents: ['GST Certificate', 'PAN Card', 'Bank Details', 'Product Catalog']
      },
      'flipkart': {
        name: 'Flipkart',
        type: 'ecommerce',
        requirements: ['GST Registration', 'Quality Certifications'],
        commission: '5-15%', 
        onboarding: '10-15 days',
        documents: ['GST Certificate', 'PAN Card', 'Product Images']
      }
    };
  }

  async process(message, context, session) {
    console.log('🛒 PlatformAgent: Processing platform query');
    
    const businessProfile = session.businessProfile || {};
    const detectedPlatforms = this.detectPlatforms(message);
    
    const systemPrompt = `You are a platform integration expert helping MSME businesses get listed on major Indian platforms like Swiggy, Zomato, Amazon, and Flipkart.

Platform Information:
${Object.entries(this.platformData).map(([key, platform]) => 
  `${platform.name}: Commission ${platform.commission}, Onboarding ${platform.onboarding}, Requirements: ${platform.requirements.join(', ')}`
).join('\n')}

Business Profile: ${JSON.stringify(businessProfile, null, 2)}

Detected Platforms in Query: ${detectedPlatforms.join(', ') || 'None specific'}

Guidelines:
- Provide specific platform requirements and processes
- Mention exact commission rates and timelines
- List required documents and compliance
- Give step-by-step onboarding guidance
- Suggest best platforms based on business type
- Keep responses under 250 words
- Use bullet points for clarity`;

    const userPrompt = `User asked: "${message}"

Based on their business profile and platform query, provide specific guidance about:

1. Which platforms are best suited for their business type
2. Exact requirements and documents needed  
3. Commission structure and costs
4. Step-by-step onboarding process
5. Timeline expectations
6. Any compliance prerequisites

Focus on platforms they mentioned or recommend suitable ones for their business type.`;

    try {
      const response = await this.ollamaService.generateResponse(
        userPrompt,
        systemPrompt,
        { temperature: 0.4 }
      );

      const recommendedPlatforms = this.getRecommendedPlatforms(businessProfile, detectedPlatforms);

      return {
        message: response,
        type: 'platform',
        agent: this.name,
        data: {
          businessProfile,
          detectedPlatforms,
          recommendedPlatforms,
          platformRequirements: this.getPlatformRequirements(recommendedPlatforms)
        }
      };

    } catch (error) {
      console.error('❌ PlatformAgent Ollama error:', error);
      return this.getFallbackResponse(message, businessProfile, detectedPlatforms);
    }
  }

  detectPlatforms(message) {
    const lowerMessage = message.toLowerCase();
    const platforms = [];
    
    if (lowerMessage.includes('swiggy')) platforms.push('swiggy');
    if (lowerMessage.includes('zomato')) platforms.push('zomato');
    if (lowerMessage.includes('amazon')) platforms.push('amazon');
    if (lowerMessage.includes('flipkart')) platforms.push('flipkart');
    
    return platforms;
  }

  getRecommendedPlatforms(businessProfile, detectedPlatforms) {
    if (detectedPlatforms.length > 0) {
      return detectedPlatforms;
    }

    const businessType = businessProfile.businessType?.toLowerCase() || '';
    
    if (businessType.includes('cafe') || businessType.includes('restaurant') || businessType.includes('food')) {
      return ['swiggy', 'zomato'];
    } else if (businessType.includes('retail') || businessType.includes('manufacturing') || businessType.includes('textile')) {
      return ['amazon', 'flipkart'];
    }
    
    return ['amazon']; // Default recommendation
  }

  getPlatformRequirements(platforms) {
    return platforms.map(platform => this.platformData[platform]).filter(Boolean);
  }

  getFallbackResponse(message, businessProfile, detectedPlatforms) {
    const businessType = businessProfile.businessType || 'business';
    
    if (businessType.includes('cafe') || businessType.includes('restaurant') || businessType.includes('food')) {
      return {
        message: `🍽️ **Platform Options for ${businessType}**

**Food Delivery Platforms:**

**Swiggy:**
• Commission: 15-25%
• Requirements: FSSAI License, GST
• Onboarding: 3-7 days
• Documents: FSSAI, GST Certificate, Menu

**Zomato:**  
• Commission: 15-25%
• Requirements: FSSAI License, Quality Standards
• Onboarding: 5-10 days
• Documents: FSSAI, GST, Restaurant Photos

**Next Steps:**
1. Complete FSSAI registration first
2. Prepare high-quality menu photos
3. Set competitive pricing (factor in commission)

Which platform interests you more?`,
        type: 'platform',
        agent: this.name,
        data: {
          businessProfile,
          recommendedPlatforms: ['swiggy', 'zomato'],
          platformRequirements: this.getPlatformRequirements(['swiggy', 'zomato'])
        }
      };
    }

    return {
      message: `🛒 **Platform Options for ${businessType}**

**E-commerce Platforms:**

**Amazon:**
• Commission: 5-20% (category dependent)
• Requirements: GST Registration, Quality Standards
• Onboarding: 7-14 days
• Documents: GST, PAN, Bank Details, Catalog

**Flipkart:**
• Commission: 5-15%
• Requirements: GST Registration, Quality Certifications
• Onboarding: 10-15 days
• Documents: GST, PAN, Product Images

**Prerequisites:**
1. GST Registration completed
2. Professional product photos
3. Competitive pricing strategy
4. Inventory management system

Which platform would you like to explore?`,
      type: 'platform',
      agent: this.name,
      data: {
        businessProfile,
        recommendedPlatforms: ['amazon', 'flipkart'],
        platformRequirements: this.getPlatformRequirements(['amazon', 'flipkart'])
      }
    };
  }
}