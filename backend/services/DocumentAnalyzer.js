class DocumentAnalyzer {
  constructor() {
    this.complianceRules = {
      gst: {
        required: ['GSTIN', 'Legal Name', 'Trade Name', 'Status', 'Registration Date'],
        patterns: {
          gstin: /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/g,
          pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g
        }
      },
      pan: {
        required: ['PAN', 'Name', 'Father Name', 'Date of Birth'],
        patterns: {
          pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
          date: /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g
        }
      },
      aadhaar: {
        required: ['Aadhaar Number', 'Name', 'Date of Birth', 'Gender', 'Address'],
        patterns: {
          aadhaar: /\d{4}\s\d{4}\s\d{4}/g,
          date: /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g
        }
      },
      bank: {
        required: ['Account Number', 'IFSC Code', 'Account Holder Name', 'Bank Name'],
        patterns: {
          ifsc: /[A-Z]{4}0[A-Z0-9]{6}/g,
          accountNumber: /\b\d{9,18}\b/g
        }
      },
      msme: {
        required: ['Udyam Registration Number', 'Enterprise Name', 'Type of Enterprise', 'Date of Incorporation'],
        patterns: {
          udyam: /UDYAM-[A-Z]{2}-\d{2}-\d{7}/g,
          cin: /[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/g
        }
      }
    };
  }

  /**
   * Analyze document text and extract relevant information
   */
  analyzeDocument(text, documentType = 'unknown') {
    const analysis = {
      documentType: this.detectDocumentType(text, documentType),
      extractedFields: {},
      complianceStatus: {},
      recommendations: [],
      issues: [],
      confidence: 0
    };

    // Perform specific analysis based on document type
    switch (analysis.documentType.toLowerCase()) {
      case 'gst certificate':
        this.analyzeGSTDocument(text, analysis);
        break;
      case 'pan card':
        this.analyzePANDocument(text, analysis);
        break;
      case 'aadhaar card':
        this.analyzeAadhaarDocument(text, analysis);
        break;
      case 'bank statement':
        this.analyzeBankDocument(text, analysis);
        break;
      case 'msme registration':
        this.analyzeMSMEDocument(text, analysis);
        break;
      default:
        this.analyzeGeneralDocument(text, analysis);
    }

    // Calculate overall confidence and compliance score
    this.calculateComplianceScore(analysis);
    
    return analysis;
  }

  /**
   * Analyze GST Certificate
   */
  analyzeGSTDocument(text, analysis) {
    const rules = this.complianceRules.gst;
    
    // Extract GSTIN
    const gstinMatches = text.match(rules.patterns.gstin);
    if (gstinMatches) {
      analysis.extractedFields.gstin = gstinMatches[0];
      analysis.complianceStatus.gstin = this.validateGSTIN(gstinMatches[0]);
    } else {
      analysis.issues.push('GSTIN not found or invalid format');
    }

    // Extract PAN from GSTIN
    if (analysis.extractedFields.gstin) {
      analysis.extractedFields.pan = analysis.extractedFields.gstin.substring(2, 12);
    }

    // Extract business name
    const namePattern = /legal\s*name[:\s]*([^\n\r]+)/gi;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      analysis.extractedFields.legalName = nameMatch[0].split(':')[1]?.trim();
    }

    // Extract registration date
    const datePattern = /registration\s*date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      analysis.extractedFields.registrationDate = dateMatch[0].split(':')[1]?.trim();
    }

    // Extract status
    const statusPattern = /status[:\s]*([^\n\r]+)/gi;
    const statusMatch = text.match(statusPattern);
    if (statusMatch) {
      analysis.extractedFields.status = statusMatch[0].split(':')[1]?.trim();
      if (analysis.extractedFields.status.toLowerCase().includes('active')) {
        analysis.complianceStatus.status = { valid: true, message: 'GST status is active' };
      } else {
        analysis.issues.push('GST registration may not be active');
      }
    }

    analysis.recommendations.push(
      'Verify GSTIN on GST portal',
      'Ensure GST filings are up to date',
      'Keep GST certificate accessible for business registrations'
    );
  }

  /**
   * Analyze PAN Card
   */
  analyzePANDocument(text, analysis) {
    const rules = this.complianceRules.pan;
    
    // Extract PAN number
    const panMatches = text.match(rules.patterns.pan);
    if (panMatches) {
      analysis.extractedFields.pan = panMatches[0];
      analysis.complianceStatus.pan = this.validatePAN(panMatches[0]);
    } else {
      analysis.issues.push('PAN number not found');
    }

    // Extract name
    const namePattern = /name[:\s]*([^\n\r]+)/gi;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      analysis.extractedFields.name = nameMatch[0].split(':')[1]?.trim();
    }

    // Extract father's name
    const fatherPattern = /father['\s]*s?\s*name[:\s]*([^\n\r]+)/gi;
    const fatherMatch = text.match(fatherPattern);
    if (fatherMatch) {
      analysis.extractedFields.fatherName = fatherMatch[0].split(':')[1]?.trim();
    }

    // Extract date of birth
    const dobPattern = /date\s*of\s*birth[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      analysis.extractedFields.dateOfBirth = dobMatch[0].split(':')[1]?.trim();
    }

    analysis.recommendations.push(
      'Ensure PAN is linked to Aadhaar',
      'Use PAN for all financial transactions',
      'Keep PAN details consistent across documents'
    );
  }

  /**
   * Analyze Aadhaar Card
   */
  analyzeAadhaarDocument(text, analysis) {
    const rules = this.complianceRules.aadhaar;
    
    // Extract Aadhaar number
    const aadhaarMatches = text.match(rules.patterns.aadhaar);
    if (aadhaarMatches) {
      analysis.extractedFields.aadhaar = aadhaarMatches[0];
      analysis.complianceStatus.aadhaar = { valid: true, message: 'Aadhaar format appears valid' };
    } else {
      analysis.issues.push('Aadhaar number not found');
    }

    // Extract name
    const namePattern = /(?:name[:\s]*|^)([A-Z\s]{3,50})/gm;
    const nameMatches = text.match(namePattern);
    if (nameMatches && nameMatches.length > 0) {
      analysis.extractedFields.name = nameMatches.find(name => 
        name.length > 3 && !name.includes('GOVERNMENT') && !name.includes('INDIA')
      )?.trim();
    }

    analysis.recommendations.push(
      'Link Aadhaar with PAN for tax compliance',
      'Use for KYC verification in banking',
      'Ensure address is current for business registration'
    );
  }

  /**
   * Analyze Bank Statement
   */
  analyzeBankDocument(text, analysis) {
    const rules = this.complianceRules.bank;
    
    // Extract IFSC code
    const ifscMatches = text.match(rules.patterns.ifsc);
    if (ifscMatches) {
      analysis.extractedFields.ifsc = ifscMatches[0];
      analysis.complianceStatus.ifsc = { valid: true, message: 'IFSC code found' };
    }

    // Extract account number
    const accountMatches = text.match(rules.patterns.accountNumber);
    if (accountMatches) {
      analysis.extractedFields.accountNumber = accountMatches[0];
    }

    // Extract bank name
    const bankPattern = /(bank|corporation|cooperative)[^\n\r]*/gi;
    const bankMatch = text.match(bankPattern);
    if (bankMatch) {
      analysis.extractedFields.bankName = bankMatch[0];
    }

    analysis.recommendations.push(
      'Ensure minimum balance requirements are met',
      'Keep recent statements for loan applications',
      'Verify account is active for business transactions'
    );
  }

  /**
   * Analyze MSME Registration
   */
  analyzeMSMEDocument(text, analysis) {
    const rules = this.complianceRules.msme;
    
    // Extract Udyam registration number
    const udyamMatches = text.match(rules.patterns.udyam);
    if (udyamMatches) {
      analysis.extractedFields.udyamNumber = udyamMatches[0];
      analysis.complianceStatus.udyam = { valid: true, message: 'Udyam registration number found' };
    } else {
      analysis.issues.push('Udyam registration number not found');
    }

    // Extract enterprise type
    const typePattern = /type\s*of\s*enterprise[:\s]*([^\n\r]+)/gi;
    const typeMatch = text.match(typePattern);
    if (typeMatch) {
      analysis.extractedFields.enterpriseType = typeMatch[0].split(':')[1]?.trim();
    }

    analysis.recommendations.push(
      'Renew MSME certificate before expiry',
      'Use MSME benefits for loans and subsidies',
      'Keep certificate updated with current business details'
    );
  }

  /**
   * Analyze general documents
   */
  analyzeGeneralDocument(text, analysis) {
    // Look for common business-related information
    const patterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+91|91)?\s*[6-9]\d{9}/g,
      pincode: /\b\d{6}\b/g,
      website: /https?:\/\/[^\s]+/g
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        analysis.extractedFields[key] = matches[0];
      }
    }

    analysis.recommendations.push(
      'Verify if this document is required for compliance',
      'Ensure document is current and valid',
      'Cross-check information with other documents'
    );
  }

  /**
   * Detect document type from content
   */
  detectDocumentType(text, suggestedType) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('gstin') || textLower.includes('goods and services tax')) {
      return 'GST Certificate';
    }
    if (textLower.includes('income tax') && textLower.includes('permanent account number')) {
      return 'PAN Card';
    }
    if (textLower.includes('aadhaar') || textLower.includes('unique identification')) {
      return 'Aadhaar Card';
    }
    if (textLower.includes('account statement') || textLower.includes('ifsc')) {
      return 'Bank Statement';
    }
    if (textLower.includes('udyam') || textLower.includes('msme registration')) {
      return 'MSME Registration';
    }
    if (textLower.includes('invoice') || textLower.includes('bill')) {
      return 'Invoice';
    }
    if (textLower.includes('license') || textLower.includes('permit')) {
      return 'Business License';
    }
    
    return suggestedType || 'General Document';
  }

  /**
   * Validate GSTIN format
   */
  validateGSTIN(gstin) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      return { valid: false, message: 'Invalid GSTIN format' };
    }
    return { valid: true, message: 'GSTIN format is valid' };
  }

  /**
   * Validate PAN format
   */
  validatePAN(pan) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return { valid: false, message: 'Invalid PAN format' };
    }
    return { valid: true, message: 'PAN format is valid' };
  }

  /**
   * Calculate overall compliance score
   */
  calculateComplianceScore(analysis) {
    const totalFields = Object.keys(analysis.extractedFields).length;
    const validFields = Object.values(analysis.complianceStatus).filter(status => status.valid).length;
    const issueCount = analysis.issues.length;
    
    if (totalFields === 0) {
      analysis.confidence = 0;
      return;
    }
    
    // Base confidence from extracted fields
    let confidence = (totalFields * 20); // Each field adds 20% confidence
    
    // Bonus for valid compliance status
    confidence += (validFields * 15);
    
    // Penalty for issues
    confidence -= (issueCount * 10);
    
    // Cap at 100%
    analysis.confidence = Math.min(100, Math.max(0, confidence));
    
    // Add overall assessment
    if (analysis.confidence >= 80) {
      analysis.recommendations.unshift('✅ Document appears complete and valid');
    } else if (analysis.confidence >= 60) {
      analysis.recommendations.unshift('⚠️ Document has some missing information');
    } else {
      analysis.recommendations.unshift('❌ Document may be incomplete or invalid');
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(analysis) {
    const report = {
      summary: `${analysis.documentType} Analysis`,
      confidence: `${analysis.confidence}%`,
      status: analysis.confidence >= 80 ? 'Complete' : analysis.confidence >= 60 ? 'Partial' : 'Incomplete',
      extractedData: analysis.extractedFields,
      issues: analysis.issues,
      recommendations: analysis.recommendations,
      nextSteps: this.generateNextSteps(analysis)
    };
    
    return report;
  }

  /**
   * Generate next steps based on document type
   */
  generateNextSteps(analysis) {
    const steps = [];
    
    switch (analysis.documentType.toLowerCase()) {
      case 'gst certificate':
        steps.push('Verify GST status online', 'Prepare for GST filings', 'Link with other business documents');
        break;
      case 'pan card':
        steps.push('Link PAN with Aadhaar', 'File income tax returns', 'Use for business registration');
        break;
      case 'aadhaar card':
        steps.push('Update address if needed', 'Link with bank account', 'Use for KYC verification');
        break;
      case 'bank statement':
        steps.push('Maintain minimum balance', 'Keep statements updated', 'Use for loan applications');
        break;
      case 'msme registration':
        steps.push('Apply for MSME benefits', 'Register for government schemes', 'Use for business loans');
        break;
    }
    
    return steps;
  }
}

export const documentAnalyzer = new DocumentAnalyzer();
export { DocumentAnalyzer };