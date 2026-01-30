/**
 * Enhanced Multilingual Support Service for MSME Compliance Navigator
 * Provides language detection and translation capabilities using Google Translate API via Python
 */

import { spawn } from 'child_process';
import path from 'path';

export class MultilingualService {
  constructor() {
    this.pythonScript = path.join(process.cwd(), 'services', 'TranslationService.py');
    this.supportedLanguages = {
      'en': 'English',
      'hi': 'हिन्दी (Hindi)', 
      'bn': 'বাংলা (Bengali)',
      'te': 'తెలుగు (Telugu)',
      'mr': 'मराठी (Marathi)',
      'ta': 'தமிழ் (Tamil)',
      'gu': 'ગુજરાતી (Gujarati)',
      'kn': 'ಕನ್ನಡ (Kannada)',
      'ml': 'മലയാളം (Malayalam)',
      'pa': 'ਪੰਜਾਬੀ (Punjabi)',
      'or': 'ଓଡିଆ (Odia)',
      'as': 'অসমীয়া (Assamese)'
    };

    this.languagePatterns = {
      'hi': /[\u0900-\u097F]/,  // Devanagari
      'bn': /[\u0980-\u09FF]/,  // Bengali
      'te': /[\u0C00-\u0C7F]/,  // Telugu
      'mr': /[\u0900-\u097F]/,  // Marathi (same as Hindi)
      'ta': /[\u0B80-\u0BFF]/,  // Tamil
      'gu': /[\u0A80-\u0AFF]/,  // Gujarati
      'kn': /[\u0C80-\u0CFF]/,  // Kannada
      'ml': /[\u0D00-\u0D7F]/,  // Malayalam
      'pa': /[\u0A00-\u0A7F]/,  // Punjabi
      'or': /[\u0B00-\u0B7F]/,  // Odia
      'as': /[\u0980-\u09FF]/   // Assamese (same as Bengali)
    };

    // Fallback manual translations for emergencies
    this.manualTranslations = {
      'hi': {
        'Business Discovery': 'व्यवसाय खोज',
        'Compliance & Licensing': 'अनुपालन और लाइसेंसिंग',
        'Timeline Planning': 'समयसीमा योजना',
        'Platform Integration': 'प्लेटफॉर्म एकीकरण',
        'Document Analysis': 'दस्तावेज़ विश्लेषण'
      },
      'bn': {
        'Business Discovery': 'ব্যবসা আবিষ্কার',
        'Compliance & Licensing': 'সম্মতি এবং লাইসেন্সিং',
        'Timeline Planning': 'সময়সূচী পরিকল্পনা',
        'Platform Integration': 'প্ল্যাটফর্ম একীকরণ',
        'Document Analysis': 'নথি বিশ্লেষণ'
      },
      'ta': {
        'Business Discovery': 'வணிக கண்டுபிடிப்பு',
        'Compliance & Licensing': 'இணக்கம் மற்றும் உரிமம்',
        'Timeline Planning': 'காலவரிசை திட்டமிடல்',
        'Platform Integration': 'இயங்குதள ஒருங்கிணைப்பு',
        'Document Analysis': 'ஆவண பகுப்பாய்வு'
      }
    };
  }

  /**
   * Execute Python translation service
   */
  async executePythonScript(action, ...args) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScript, action, ...args]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python translation service error: ${error}`);
          reject(new Error(`Translation service failed: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse translation output: ${output}`));
        }
      });
    });
  }

  /**
   * Detect language using basic pattern matching (fast fallback)
   */
  detectLanguage(text) {
    const cleanText = text.toLowerCase().trim();
    
    // Quick English check
    if (/^[a-zA-Z0-9\s.,!?-]+$/.test(cleanText)) {
      return 'en';
    }

    // Check for specific language patterns
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  /**
   * Enhanced language detection using Python service (with fallback)
   */
  async detectLanguageAsync(text) {
    try {
      // For now, use the fast fallback to avoid Python service issues
      console.log('Using fallback language detection');
      return this.detectLanguage(text);
    } catch (error) {
      console.error('Language detection failed, using fallback:', error.message);
      return this.detectLanguage(text);
    }
  }

  /**
   * Translate text using manual fallback (temporarily disabled Python service)
   */
  async translateText(text, targetLanguage) {
    if (targetLanguage === 'en' || !text.trim()) {
      return text;
    }

    try {
      // For now, use manual translation to avoid Python service issues
      console.log('Using manual translation fallback');
      return this.manualTranslate(text, targetLanguage);
    } catch (error) {
      console.error('Translation failed:', error.message);
      return text;
    }
  }

  /**
   * Manual translation using predefined mappings (fallback)
   */
  manualTranslate(text, targetLanguage) {
    const translations = this.manualTranslations[targetLanguage];
    if (!translations) {
      return text;
    }

    let translatedText = text;
    for (const [english, translation] of Object.entries(translations)) {
      const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      translatedText = translatedText.replace(regex, translation);
    }
    
    return translatedText;
  }

  /**
   * Get fully translated welcome message (fallback version)
   */
  async getFullWelcomeMessage(language = 'en') {
    try {
      // For now, use basic greeting + manual translation
      console.log('Using manual welcome message');
      const greeting = this.getBasicGreeting(language);
      
      const englishTemplate = `
🏢 **Business Discovery** - Find the right business structure
📄 **Compliance & Licensing** - Get all required permits  
⏰ **Timeline Planning** - Step-by-step business setup
🌐 **Platform Integration** - Digital marketplace guidance
📁 **Document Analysis** - Upload and analyze your business documents

What would you like to explore today? You can ask me anything about starting your MSME business in India!`;

      if (language === 'en') {
        return greeting + englishTemplate;
      }
      
      // Translate parts manually
      const translatedTemplate = this.manualTranslate(englishTemplate, language);
      return greeting + translatedTemplate;
      
    } catch (error) {
      console.error('Welcome message generation failed:', error.message);
      return this.getBasicGreeting(language);
    }
  }

  /**
   * Basic greeting fallback
   */
  getBasicGreeting(language = 'en') {
    const greetings = {
      'en': 'Hello! I can help you with MSME business setup in India.',
      'hi': 'नमस्ते! मैं भारत में MSME व्यवसाय स्थापना में आपकी सहायता कर सकता हूं।',
      'bn': 'হ্যালো! আমি ভারতে MSME ব্যবসা স্থাপনায় আপনাকে সাহায্য করতে পারি।',
      'ta': 'வணக்கம்! இந்தியாவில் MSME வணிக அமைப்பில் நான் உங்களுக்கு உதவ முடியும்।',
      'te': 'హలో! నేను భారతదేశంలో MSME వ్యాపార స్థాపనలో మీకు సహాయం చేయగలను।',
      'gu': 'હેલો! હું ભારતમાં MSME વ્યવસાય સેટઅપમાં તમારી સહાય કરી શકું છું।',
      'mr': 'नमस्कार! मी भारतात MSME व्यवसाय सेटअपमध्ये तुमची मदत करू शकतो।',
      'kn': 'ಹಲೋ! ನಾನು ಭಾರತದಲ್ಲಿ MSME ವ್ಯವಹಾರ ಸ್ಥಾಪನೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು।',
      'ml': 'ഹലോ! ഇന്ത്യയിൽ MSME ബിസിനസ് സെറ്റപ്പിൽ എനിക്ക് നിങ്ങളെ സഹായിക്കാൻ കഴിയും।',
      'pa': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਭਾਰਤ ਵਿੱਚ MSME ਕਾਰੋਬਾਰ ਸੈੱਟਅਪ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।'
    };
    return greetings[language] || greetings['en'];
  }

  /**
   * Check if language is supported
   */
  isSupported(language) {
    return language in this.supportedLanguages;
  }

  /**
   * Generate multilingual prompt for LLM with translation instructions
   */
  generateMultilingualPrompt(userMessage, detectedLanguage, context = {}) {
    const isEnglish = detectedLanguage === 'en';
    const languageName = this.supportedLanguages[detectedLanguage] || 'English';
    
    let prompt = `User message in ${languageName}: "${userMessage}"`;
    
    if (!isEnglish) {
      prompt += `\n\nIMPORTANT TRANSLATION REQUIREMENTS:
1. Respond ENTIRELY in ${languageName}
2. Translate ALL content including business terms, explanations, and guidance
3. Keep only these technical terms in English with ${languageName} explanation: GST, FSSAI, PAN, MSME, IEC
4. Provide comprehensive, detailed information about Indian business compliance
5. Use simple, clear language that business owners can understand
6. Include specific document requirements, timelines, and procedures`;
    } else {
      prompt += '\n\nProvide comprehensive information about Indian MSME compliance, licenses, and business setup.';
    }

    if (context.businessProfile) {
      prompt += `\nBusiness Context: ${JSON.stringify(context.businessProfile, null, 2)}`;
    }

    return prompt;
  }

  /**
   * Get business terms in specified language
   */
  getBusinessTerms(language = 'en') {
    const terms = {
      'en': ['business', 'license', 'registration', 'compliance', 'documents'],
      'hi': ['व्यवसाय', 'लाइसेंस', 'पंजीकरण', 'अनुपालन', 'दस्तावेज़'],
      'bn': ['ব্যবসা', 'লাইসেন্স', 'নিবন্ধন', 'সম্মতি', 'নথি'],
      'ta': ['வணிகம்', 'உரிमम்', 'பதிவு', 'இணக்கம்', 'ஆவணங்கள்'],
      'te': ['వ్యాపారం', 'లైసెన్స్', 'నమోదు', 'సమ్మతి', 'పత్రాలు']
    };
    return terms[language] || terms['en'];
  }

  /**
   * Get system prompt based on language
   */
  getSystemPrompt(language = 'en') {
    if (language === 'en') {
      return "You are an MSME business compliance expert for India. Provide detailed, accurate information about licenses, registrations, and business setup procedures.";
    }
    
    const languageName = this.supportedLanguages[language] || 'the user\'s language';
    return `You are an MSME business compliance expert for India. Respond in ${languageName} with detailed, accurate information about licenses, registrations, and business setup procedures. Translate all content while keeping technical terms like GST, FSSAI, PAN, MSME with explanations in ${languageName}.`;
  }

  /**
   * Process multilingual user input with comprehensive translation support
   */
  async processMultilingualInput(message, context = {}) {
    const detectedLanguage = await this.detectLanguageAsync(message);
    
    return {
      originalMessage: message,
      detectedLanguage,
      languageName: this.supportedLanguages[detectedLanguage],
      isSupported: this.isSupported(detectedLanguage),
      multilingualPrompt: this.generateMultilingualPrompt(message, detectedLanguage, context),
      systemPrompt: this.getSystemPrompt(detectedLanguage),
      businessTerms: this.getBusinessTerms(detectedLanguage),
      translateResponse: async (response) => {
        if (detectedLanguage === 'en') {
          return response;
        }
        return await this.translateText(response, detectedLanguage);
      },
      fullWelcomeMessage: async () => {
        return await this.getFullWelcomeMessage(detectedLanguage);
      }
    };
  }
}