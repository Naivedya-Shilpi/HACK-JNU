import { COMPLIANCE_DATABASE } from '../data/compliances.js';
import { INDIAN_STATES_DATA } from '../data/states.js';

export class RuleEngine {
  constructor() {
    this.complianceDB = COMPLIANCE_DATABASE;
    this.statesDB = INDIAN_STATES_DATA;
  }

  /**
   * Evaluate compliance requirements based on business profile
   */
  evaluateCompliances(businessProfile) {
    const results = {
      mandatory: [],
      conditional: [],
      recommended: [],
      future: [],
      timeline: [],
      totalCost: 0,
      warnings: []
    };

    // Central compliances
    this.evaluateCentralCompliances(businessProfile, results);
    
    // State-specific compliances
    this.evaluateStateCompliances(businessProfile, results);
    
    // Business type specific
    this.evaluateBusinessTypeCompliances(businessProfile, results);
    
    // Platform specific (if applicable)
    if (businessProfile.platforms) {
      this.evaluatePlatformCompliances(businessProfile, results);
    }

    // Generate timeline
    this.generateTimeline(results);
    
    // Calculate costs
    this.calculateCosts(results);

    return results;
  }

  evaluateCentralCompliances(profile, results) {
    const central = this.complianceDB.central;

    // GST evaluation
    if (this.checkCondition(central.GST.applicableIf, profile)) {
      results.mandatory.push({
        ...central.GST,
        priority: 'high',
        reason: 'Annual turnover exceeds ₹40 lakhs'
      });
    } else {
      results.future.push({
        ...central.GST,
        trigger: 'When annual turnover exceeds ₹40 lakhs',
        priority: 'medium'
      });
    }

    // FSSAI evaluation
    if (this.checkCondition(central.FSSAI.applicableIf, profile)) {
      results.mandatory.push({
        ...central.FSSAI,
        priority: 'critical',
        reason: 'Food business requires FSSAI license'
      });
    }

    // MSME Udyam (always recommended)
    results.recommended.push({
      ...central.MSME_UDYAM,
      priority: 'high',
      reason: 'Benefits include priority lending and government schemes'
    });

    // EPF evaluation
    if (this.checkCondition(central.EPF.applicableIf, profile)) {
      results.mandatory.push({
        ...central.EPF,
        priority: 'high',
        reason: '20+ employees require EPF registration'
      });
    }

    // ESI evaluation
    if (this.checkCondition(central.ESI.applicableIf, profile)) {
      results.mandatory.push({
        ...central.ESI,
        priority: 'high',
        reason: '10+ employees require ESI registration'
      });
    }

    // Professional Tax
    if (profile.employees > 0) {
      results.mandatory.push({
        ...central.PROFESSIONAL_TAX,
        priority: 'medium',
        reason: 'Businesses with employees must pay professional tax'
      });
    }
  }

  evaluateStateCompliances(profile, results) {
    const stateCode = profile.state;
    const stateCompliances = this.complianceDB.stateSpecific[stateCode];

    if (!stateCompliances) {
      results.warnings.push(`State-specific compliances for ${stateCode} not found in database`);
      return;
    }

    // Shops Act (usually mandatory for most businesses)
    if (stateCompliances.SHOPS_ACT) {
      results.mandatory.push({
        ...stateCompliances.SHOPS_ACT,
        priority: 'high',
        reason: 'Required for commercial establishments'
      });
    }

    // Factories Act (for manufacturing)
    if (stateCompliances.FACTORIES_ACT && 
        this.checkCondition(stateCompliances.FACTORIES_ACT.applicableIf, profile)) {
      results.mandatory.push({
        ...stateCompliances.FACTORIES_ACT,
        priority: 'critical',
        reason: 'Manufacturing business with 10+ employees'
      });
    }

    // Trade License
    if (stateCompliances.TRADE_LICENSE) {
      results.mandatory.push({
        ...stateCompliances.TRADE_LICENSE,
        priority: 'high',
        reason: 'Local municipal requirement'
      });
    }
  }

  evaluateBusinessTypeCompliances(profile, results) {
    const businessType = profile.businessType?.toLowerCase();
    const typeCompliances = this.complianceDB.businessTypeSpecific[businessType];

    if (!typeCompliances) return;

    // Add required compliances
    typeCompliances.required?.forEach(complianceId => {
      const compliance = this.findComplianceById(complianceId);
      if (compliance) {
        results.mandatory.push({
          ...compliance,
          priority: 'critical',
          reason: `Required for ${businessType} business`
        });
      }
    });

    // Add conditional compliances
    typeCompliances.conditional?.forEach(complianceId => {
      const compliance = this.findComplianceById(complianceId);
      if (compliance) {
        results.conditional.push({
          ...compliance,
          priority: 'medium',
          reason: `May be required based on specific operations`
        });
      }
    });
  }

  evaluatePlatformCompliances(profile, results) {
    profile.platforms?.forEach(platform => {
      const platformReqs = this.complianceDB.platformSpecific[platform.toLowerCase()];
      if (platformReqs) {
        results.conditional.push({
          id: `${platform.toUpperCase()}_ONBOARDING`,
          name: `${platform} Platform Onboarding`,
          category: 'platform',
          requirements: platformReqs.requirements,
          commission: platformReqs.commission,
          timeline: platformReqs.timeline,
          priority: 'medium',
          reason: `Required for ${platform} integration`
        });
      }
    });
  }

  generateTimeline(results) {
    const allCompliances = [...results.mandatory, ...results.recommended];
    
    // Sort by priority and dependencies
    const timeline = allCompliances
      .filter(c => c.timeline)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .map((compliance, index) => ({
        week: Math.floor(index / 2) + 1,
        compliance: compliance.name,
        id: compliance.id,
        timeline: compliance.timeline,
        cost: compliance.cost || 0,
        priority: compliance.priority
      }));

    results.timeline = timeline;
  }

  calculateCosts(results) {
    let totalCost = 0;
    
    [...results.mandatory, ...results.recommended].forEach(compliance => {
      if (typeof compliance.cost === 'number') {
        totalCost += compliance.cost;
      } else if (typeof compliance.cost === 'object') {
        // Take the basic cost for calculation
        totalCost += compliance.cost.basic || compliance.cost.state || 0;
      }
    });

    results.totalCost = totalCost;
  }

  checkCondition(condition, profile) {
    if (!condition) return true;

    for (const [key, rule] of Object.entries(condition)) {
      const profileValue = profile[key];
      
      if (rule.greaterThan && profileValue <= rule.greaterThan) return false;
      if (rule.greaterThanOrEqual && profileValue < rule.greaterThanOrEqual) return false;
      if (rule.lessThan && profileValue >= rule.lessThan) return false;
      if (rule.lessThanOrEqual && profileValue > rule.lessThanOrEqual) return false;
      if (Array.isArray(rule) && !rule.includes(profileValue)) return false;
    }

    return true;
  }

  findComplianceById(id) {
    // Search in central compliances
    for (const compliance of Object.values(this.complianceDB.central)) {
      if (compliance.id === id) return compliance;
    }

    // Search in state-specific compliances
    for (const state of Object.values(this.complianceDB.stateSpecific)) {
      for (const compliance of Object.values(state)) {
        if (compliance.id === id) return compliance;
      }
    }

    return null;
  }

  /**
   * Get business readiness score
   */
  getReadinessScore(businessProfile) {
    const evaluation = this.evaluateCompliances(businessProfile);
    const totalRequired = evaluation.mandatory.length;
    const completed = 0; // This would come from user's completion status
    
    return {
      score: totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 100,
      totalRequired,
      completed,
      pending: totalRequired - completed,
      criticalMissing: evaluation.mandatory.filter(c => c.priority === 'critical').length
    };
  }

  /**
   * Validate business profile completeness
   */
  validateBusinessProfile(profile) {
    const required = ['businessType', 'state', 'city'];
    const missing = required.filter(field => !profile[field]);
    
    return {
      isValid: missing.length === 0,
      missing,
      suggestions: this.getProfileSuggestions(profile)
    };
  }

  getProfileSuggestions(profile) {
    const suggestions = [];
    
    if (!profile.monthlyRevenue) {
      suggestions.push('Add expected monthly revenue for better compliance recommendations');
    }
    
    if (!profile.employees) {
      suggestions.push('Specify number of employees for labor law compliance');
    }
    
    if (!profile.businessModel) {
      suggestions.push('Specify business model (B2B, B2C, online, offline)');
    }

    return suggestions;
  }
}
