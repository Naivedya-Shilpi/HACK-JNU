import Tesseract from 'tesseract.js';
import fs from 'fs/promises';
import { createRequire } from 'module';
import sharp from 'sharp';
import { documentAnalyzer } from './DocumentAnalyzer.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class TextExtractionService {
  constructor() {
    this.supportedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    this.supportedDocTypes = ['.pdf', '.txt'];
  }

  /**
   * Extract text from uploaded file
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractText(file) {
    try {
      const fileExtension = this.getFileExtension(file.originalname);
      const documentType = this.detectDocumentType(file.originalname);
      
      let extractedText = '';
      let confidence = 0;
      let metadata = {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentType,
        uploadedAt: new Date().toISOString()
      };

      if (this.supportedImageTypes.includes(fileExtension)) {
        const result = await this.extractFromImage(file);
        extractedText = result.text;
        confidence = result.confidence;
      } else if (fileExtension === '.pdf') {
        const result = await this.extractFromPDF(file);
        extractedText = result.text;
        metadata.pages = result.pages;
      } else if (fileExtension === '.txt') {
        extractedText = await this.extractFromTextFile(file);
        confidence = 100;
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Clean and structure the text
      const cleanedText = this.cleanExtractedText(extractedText);
      
      // Perform advanced document analysis
      const documentAnalysis = documentAnalyzer.analyzeDocument(cleanedText, documentType);
      const complianceReport = documentAnalyzer.generateComplianceReport(documentAnalysis);
      
      return {
        success: true,
        text: cleanedText,
        confidence,
        metadata,
        documentAnalysis: {
          ...documentAnalysis,
          complianceReport
        }
      };

    } catch (error) {
      console.error('Text extraction error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          fileName: file?.originalname || 'unknown',
          fileSize: file?.size || 0,
          mimeType: file?.mimetype || 'unknown',
          documentType: 'unknown'
        }
      };
    }
  }

  /**
   * Extract text from images using OCR
   */
  async extractFromImage(file) {
    try {
      // Optimize image for better OCR results
      const optimizedImageBuffer = await sharp(file.buffer)
        .resize(null, 1200, { withoutEnlargement: true })
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const result = await Tesseract.recognize(optimizedImageBuffer, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return {
        text: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractFromPDF(file) {
    try {
      console.log('📄 Extracting text from PDF...');
      
      // Try PDF text extraction first
      try {
        const pdfData = await pdfParse(file.buffer);
        if (pdfData.text && pdfData.text.trim().length > 10) {
          console.log('✅ PDF text extraction successful');
          return {
            text: pdfData.text,
            pages: pdfData.numpages,
            info: pdfData.info
          };
        }
        console.log('⚠️ PDF text extraction returned minimal text, trying OCR fallback...');
      } catch (pdfError) {
        console.log('⚠️ PDF text extraction failed, trying OCR fallback:', pdfError.message);
      }
      
      // If PDF text extraction fails or returns little text, try OCR as fallback
      console.log('🔄 Using OCR fallback for PDF...');
      const ocrResult = await this.extractFromImage(file);
      return {
        text: ocrResult.text,
        pages: 1, // Estimated
        info: { Title: 'OCR Extracted PDF' },
        extractionMethod: 'OCR_FALLBACK'
      };
      
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  async extractFromTextFile(file) {
    try {
      return file.buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Text file extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  cleanExtractedText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n')      // Remove empty lines
      .trim();
  }

  /**
   * Analyze document content for MSME compliance context
   */
  analyzeDocumentContent(text, documentType) {
    const analysis = {
      documentType,
      detectedFields: [],
      complianceRelevant: false,
      suggestedActions: []
    };

    const textLower = text.toLowerCase();

    // GST Certificate Analysis
    if (textLower.includes('gstin') || textLower.includes('goods and services tax')) {
      analysis.detectedFields.push('GST Number');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('GST certificate detected - verify GST number format');
    }

    // PAN Card Analysis
    if (textLower.includes('income tax department') || /[a-z]{5}[0-9]{4}[a-z]{1}/i.test(text)) {
      analysis.detectedFields.push('PAN Number');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('PAN card detected - verify PAN format');
    }

    // Aadhaar Analysis
    if (textLower.includes('aadhaar') || textLower.includes('unique identification')) {
      analysis.detectedFields.push('Aadhaar Number');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('Aadhaar document detected');
    }

    // Bank Statement Analysis
    if (textLower.includes('account statement') || textLower.includes('ifsc')) {
      analysis.detectedFields.push('Bank Details');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('Bank statement detected - verify account details');
    }

    // Business License Analysis
    if (textLower.includes('license') || textLower.includes('registration certificate')) {
      analysis.detectedFields.push('Business License');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('Business license detected - check validity dates');
    }

    // MSME/Udyam Registration
    if (textLower.includes('udyam') || textLower.includes('msme registration')) {
      analysis.detectedFields.push('MSME Registration');
      analysis.complianceRelevant = true;
      analysis.suggestedActions.push('MSME registration detected - verify registration details');
    }

    return analysis;
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename) {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  /**
   * Detect document type from filename
   */
  detectDocumentType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('gst')) return 'GST Certificate';
    if (name.includes('pan')) return 'PAN Card';
    if (name.includes('aadhar') || name.includes('aadhaar')) return 'Aadhaar Card';
    if (name.includes('udyam') || name.includes('msme')) return 'MSME Registration';
    if (name.includes('license') || name.includes('licence')) return 'Business License';
    if (name.includes('bank')) return 'Bank Statement';
    if (name.includes('invoice')) return 'Invoice';
    if (name.includes('tax') || name.includes('itr')) return 'Tax Document';
    
    return 'General Document';
  }

  /**
   * Check if file type is supported
   */
  isSupported(filename) {
    const extension = this.getFileExtension(filename);
    return [...this.supportedImageTypes, ...this.supportedDocTypes].includes(extension);
  }
}

export const textExtractionService = new TextExtractionService();
export { TextExtractionService };