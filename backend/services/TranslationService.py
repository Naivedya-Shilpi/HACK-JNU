#!/usr/bin/env python3
"""
Translation Service for MSME Compliance Navigator
Provides comprehensive translation using Google Translate API
"""

import sys
import json
import re
from googletrans import Translator, LANGUAGES

class TranslationService:
    def __init__(self):
        """Initialize the translation service"""
        self.translator = Translator()
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi',
            'bn': 'Bengali', 
            'te': 'Telugu',
            'ta': 'Tamil',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'pa': 'Punjabi',
            'or': 'Odia',
            'as': 'Assamese'
        }
        
        # Technical terms that should remain in English with translations
        self.technical_terms = {
            'GST': {'hi': 'वस्तु एवं सेवा कर (GST)', 'bn': 'পণ্য ও পরিষেবা কর (GST)', 'ta': 'பொருட்கள் மற்றும் சேவை வரி (GST)'},
            'FSSAI': {'hi': 'भारतीय खाद्य सुरक्षा मानक प्राधिकरण (FSSAI)', 'bn': 'ভারতীয় খাদ্য নিরাপত্তা মান কর্তৃপক্ষ (FSSAI)', 'ta': 'இந்திய உணவு பாதுகாப்பு தரநிலை ஆணையம் (FSSAI)'},
            'PAN': {'hi': 'स्थायी खाता संख्या (PAN)', 'bn': 'স্থায়ী অ্যাকাউন্ট নম্বর (PAN)', 'ta': 'நிரந்தர கணக்கு எண் (PAN)'},
            'MSME': {'hi': 'सूक्ष्म, लघु एवं मध्यम उद्यम (MSME)', 'bn': 'ক্ষুদ্র, মাঝারি ও ছোট উদ্যোগ (MSME)', 'ta': 'நுண், சிறு மற்றும் நடுத்தர நிறுவனங்கள் (MSME)'}
        }

    def detect_language(self, text):
        """Detect the language of the input text"""
        try:
            detection = self.translator.detect(text)
            detected_lang = detection.lang
            
            # Map some common detection results to our supported languages
            if detected_lang in self.supported_languages:
                return detected_lang
            elif detected_lang == 'mr-IN':
                return 'mr'
            elif detected_lang == 'gu-IN':
                return 'gu'
            else:
                return 'en'  # Default to English
        except:
            return 'en'

    def parse_content_for_translation(self, text):
        """Parse content to separate translatable text from formatting"""
        # Preserve emojis and special characters
        emoji_pattern = r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251]+'
        
        parts = []
        lines = text.split('\n')
        
        for line in lines:
            if not line.strip():
                parts.append({'type': 'format', 'content': '\n'})
                continue
                
            # Check for markdown headers
            if line.startswith('#'):
                parts.append({'type': 'format', 'content': line[:2]})
                parts.append({'type': 'text', 'content': line[2:].strip()})
                parts.append({'type': 'format', 'content': '\n'})
                continue
            
            # Check for bullet points with emojis
            emoji_match = re.match(r'^(\s*[🏢📄⏰🌐📁🎯🔍⚖️💡📊]+\s*\*{0,2})(.*?)(\*{0,2}\s*-\s*(.*?))?$', line)
            if emoji_match:
                parts.append({'type': 'format', 'content': emoji_match.group(1)})
                if emoji_match.group(2).strip():
                    parts.append({'type': 'text', 'content': emoji_match.group(2).strip()})
                if emoji_match.group(4):
                    parts.append({'type': 'format', 'content': ' - '})
                    parts.append({'type': 'text', 'content': emoji_match.group(4).strip()})
                parts.append({'type': 'format', 'content': '\n'})
                continue
            
            # Regular text line
            parts.append({'type': 'text', 'content': line.strip()})
            parts.append({'type': 'format', 'content': '\n'})
        
        return parts

    def translate_text_with_terms(self, text, target_language):
        """Translate text while preserving technical terms"""
        if target_language == 'en':
            return text
            
        try:
            # First, replace technical terms with placeholders
            placeholders = {}
            processed_text = text
            
            for term, translations in self.technical_terms.items():
                if term in processed_text:
                    placeholder = f"__TECH_{len(placeholders)}__"
                    placeholders[placeholder] = translations.get(target_language, f"{term}")
                    processed_text = processed_text.replace(term, placeholder)
            
            # Translate the processed text
            if processed_text.strip():
                translated = self.translator.translate(processed_text, dest=target_language).text
                
                # Restore technical terms with explanations
                for placeholder, explanation in placeholders.items():
                    translated = translated.replace(placeholder, explanation)
                
                return translated
            
            return text
            
        except Exception as e:
            print(f"Translation error: {e}", file=sys.stderr)
            return text

    def translate_full_response(self, message, target_language):
        """Translate entire response while preserving formatting"""
        if target_language == 'en':
            return message
        
        try:
            # Parse content into parts
            parts = self.parse_content_for_translation(message)
            
            translated_parts = []
            for part in parts:
                if part['type'] == 'text' and part['content'].strip():
                    translated_content = self.translate_text_with_terms(part['content'], target_language)
                    translated_parts.append(translated_content)
                else:
                    translated_parts.append(part['content'])
            
            return ''.join(translated_parts)
            
        except Exception as e:
            print(f"Full response translation error: {e}", file=sys.stderr)
            return message

    def get_welcome_message(self, language='en'):
        """Get fully translated welcome message"""
        welcome_base = {
            'en': "Hello! I can help you with MSME business setup in India.",
            'hi': "नमस्ते! मैं भारत में MSME व्यवसाय स्थापना में आपकी सहायता कर सकता हूं।",
            'bn': "হ্যালো! আমি ভারতে MSME ব্যবসা স্থাপনায় আপনাকে সাহায্য করতে পারি।",
            'ta': "வணக்கம்! இந்தியாவில் MSME வணிக அமைப்பில் நான் உங்களுக்கு உதவ முடியும்।",
            'te': "హలో! నేను భారతదేశంలో MSME వ్యాపార స్థాపనలో మీకు సహాయం చేయగలను।",
            'gu': "હેલો! હું ભારતમાં MSME વ્યવસાય સેટઅપમાં તમારી સહાય કરી શકું છું।",
            'mr': "नमस्कार! मी भारतात MSME व्यवसाय सेटअपमध्ये तुमची मदत करू शकतो।",
            'kn': "ಹಲೋ! ನಾನು ಭಾರತದಲ್ಲಿ MSME ವ್ಯವಹಾರ ಸ್ಥಾಪನೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು।",
            'ml': "ഹലോ! ഇന്ത്യയിൽ MSME ബിസിനസ് സെറ്റപ്പിൽ എനിക്ക് നിങ്ങളെ സഹായിക്കാൻ കഴിയും।",
            'pa': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਭਾਰਤ ਵਿੱਚ MSME ਕਾਰੋਬਾਰ ਸੈੱਟਅਪ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।"
        }
        
        full_message = f"""{welcome_base.get(language, welcome_base['en'])}

🏢 **Business Discovery** - Find the right business structure
📄 **Compliance & Licensing** - Get all required permits  
⏰ **Timeline Planning** - Step-by-step business setup
🌐 **Platform Integration** - Digital marketplace guidance
📁 **Document Analysis** - Upload and analyze your business documents

What would you like to explore today? You can ask me anything about starting your MSME business in India!"""

        if language == 'en':
            return full_message
        
        return self.translate_full_response(full_message, language)

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python TranslationService.py <action> <args...>"}))
        return
    
    service = TranslationService()
    action = sys.argv[1]
    
    try:
        if action == "detect":
            text = sys.argv[2]
            result = service.detect_language(text)
            print(json.dumps({"language": result}))
            
        elif action == "translate":
            text = sys.argv[2]
            target_lang = sys.argv[3]
            result = service.translate_full_response(text, target_lang)
            print(json.dumps({"translated": result}))
            
        elif action == "welcome":
            lang = sys.argv[2] if len(sys.argv) > 2 else 'en'
            result = service.get_welcome_message(lang)
            print(json.dumps({"welcome": result}))
            
        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()