import { Ollama } from 'ollama';

/**
 * Ollama Service - Local AI integration for MSME Compliance Navigator
 * Provides local AI capabilities without external API dependencies
 */
export class OllamaService {
  constructor() {
    this.ollama = new Ollama({ 
      host: process.env.OLLAMA_HOST || 'http://localhost:11434' 
    });
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3:latest';
    this.isAvailable = false;
    
    this.init();
  }

  async init() {
    try {
      // Test if Ollama is running and model is available
      const models = await this.ollama.list();
      const hasModel = models.models.some(model => model.name === this.defaultModel);
      
      if (hasModel) {
        this.isAvailable = true;
        console.log(`🦙 OllamaService: Connected with model ${this.defaultModel}`);
      } else {
        console.log(`⚠️ OllamaService: Model ${this.defaultModel} not found`);
        await this.pullModel();
      }
    } catch (error) {
      console.log(`❌ OllamaService: Not available - ${error.message}`);
      this.isAvailable = false;
    }
  }

  async pullModel() {
    try {
      console.log(`⬇️ OllamaService: Pulling model ${this.defaultModel}...`);
      await this.ollama.pull({ model: this.defaultModel });
      this.isAvailable = true;
      console.log(`✅ OllamaService: Model ${this.defaultModel} ready`);
    } catch (error) {
      console.log(`❌ OllamaService: Failed to pull model - ${error.message}`);
      this.isAvailable = false;
    }
  }

  async generateResponse(prompt, systemPrompt = '', options = {}) {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const response = await this.ollama.chat({
        model: this.defaultModel,
        messages: messages.filter(msg => msg.content), // Filter empty messages
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 500,
          ...options
        }
      });

      return response.message.content;
    } catch (error) {
      console.error('❌ OllamaService: Generation error:', error.message);
      throw error;
    }
  }

  /**
   * Generate business discovery response
   */
  async generateDiscoveryResponse(userMessage, context) {
    const systemPrompt = `You are a friendly MSME business advisor in India. Help entrepreneurs start their businesses with proper compliance.

Guidelines:
- Keep responses under 150 words
- Be warm and encouraging
- Ask one question at a time
- Focus on practical next steps
- Use simple language`;

    const prompt = `User said: "${userMessage}"

Context: ${JSON.stringify(context.businessProfile || {})}

Generate a helpful response that guides them through business setup. If they haven't specified their business type or location, ask for that information. Be conversational and encouraging.`;

    return await this.generateResponse(prompt, systemPrompt, { temperature: 0.8 });
  }

  /**
   * Generate compliance analysis response
   */
  async generateComplianceResponse(userMessage, businessProfile) {
    const systemPrompt = `You are an expert in Indian MSME compliance and business regulations. Provide accurate, actionable advice about licenses, registrations, and legal requirements.

Guidelines:
- Be specific about costs and timelines
- Mention mandatory vs optional requirements
- Keep responses practical and organized
- Use bullet points for clarity`;

    const prompt = `Business: ${businessProfile.businessType || 'business'} in ${businessProfile.location || 'India'}

User asked: "${userMessage}"

Provide specific compliance requirements including:
1. Mandatory licenses and registrations
2. Estimated costs and timelines  
3. Application process
4. Documents needed

Be specific to their business type and location.`;

    return await this.generateResponse(prompt, systemPrompt, { temperature: 0.6 });
  }

  /**
   * Generate timeline and process response
   */
  async generateTimelineResponse(userMessage, businessProfile) {
    const systemPrompt = `You are a business setup expert who creates practical timelines for Indian entrepreneurs.

Guidelines:
- Provide week-by-week breakdowns
- Include realistic timelines and costs
- Highlight key milestones
- Be encouraging and actionable`;

    const prompt = `Business: ${businessProfile.businessType || 'business'} in ${businessProfile.location || 'India'}
Budget: ${businessProfile.investmentRange || 'Not specified'}

User asked: "${userMessage}"

Create a practical startup timeline showing:
1. Week-by-week breakdown
2. Key tasks and milestones
3. Cost estimates
4. Dependencies between steps

Make it encouraging and actionable.`;

    return await this.generateResponse(prompt, systemPrompt, { temperature: 0.7 });
  }

  /**
   * Generate platform onboarding response
   */
  async generatePlatformResponse(userMessage, platform) {
    const systemPrompt = `You are an expert on Indian food delivery and e-commerce platforms (Swiggy, Zomato, Amazon, etc.).

Guidelines:
- Provide specific requirements and documents
- Include commission structures and timelines
- Mention approval processes
- Give practical tips for success`;

    const prompt = `Platform: ${platform || 'food delivery platforms'}

User asked: "${userMessage}"

Provide detailed guidance on:
1. Required documents and licenses
2. Commission structure
3. Approval timeline
4. Success tips
5. Common mistakes to avoid

Be specific and practical.`;

    return await this.generateResponse(prompt, systemPrompt, { temperature: 0.7 });
  }

  /**
   * Generate general business advice
   */
  async generateGeneralResponse(userMessage) {
    const systemPrompt = `You are a helpful MSME compliance assistant for Indian businesses. Be friendly, concise, and helpful.

Guidelines:
- Keep responses under 100 words
- Be warm and encouraging
- Offer to help with specific aspects
- Guide users toward discovering their business needs`;

    const prompt = `User said: "${userMessage}"

Provide a helpful response that:
1. Addresses their query
2. Offers relevant assistance
3. Guides them to share more about their business plans

Be conversational and friendly.`;

    return await this.generateResponse(prompt, systemPrompt, { temperature: 0.8 });
  }

  /**
   * Check if Ollama service is ready
   */
  isReady() {
    return this.isAvailable;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      model: this.defaultModel,
      host: this.ollama.config.host
    };
  }
}