import { COMPLIANCE_DATABASE } from '../data/compliances.js';

export class ComplianceService {
  constructor() {
    this.complianceDB = COMPLIANCE_DATABASE;
  }

  /**
   * Get platform-specific requirements
   */
  getPlatformRequirements(platforms) {
    const requirements = {};
    
    platforms.forEach(platform => {
      const platformData = this.complianceDB.platformSpecific[platform.toLowerCase()];
      if (platformData) {
        requirements[platform] = {
          ...platformData.requirements,
          commission: platformData.commission,
          timeline: platformData.timeline,
          onboardingSteps: this.getOnboardingSteps(platform)
        };
      }
    });

    return requirements;
  }

  getOnboardingSteps(platform) {
    const steps = {
      swiggy: [
        'Create restaurant partner account',
        'Upload required documents (FSSAI, GST, Bank details)',
        'Menu setup and pricing',
        'Restaurant photos and details',
        'Agreement signing',
        'Account verification',
        'Go live'
      ],
      zomato: [
        'Register on Zomato for Business',
        'Document verification (FSSAI, Bank account)',
        'Restaurant listing creation',
        'Menu upload and pricing',
        'Photo submission',
        'Quality check',
        'Launch'
      ],
      amazon: [
        'Create seller account',
        'Business verification (GST, PAN)',
        'Product catalog setup',
        'Inventory management setup',
        'Shipping configuration',
        'Account approval',
        'Start selling'
      ]
    };

    return steps[platform.toLowerCase()] || [];
  }

  /**
   * Get compliance details by ID
   */
  getComplianceDetails(complianceId) {
    // Search in central compliances
    for (const compliance of Object.values(this.complianceDB.central)) {
      if (compliance.id === complianceId) {
        return {
          ...compliance,
          category: 'central',
          detailedSteps: this.getDetailedSteps(complianceId)
        };
      }
    }

    // Search in state-specific compliances
    for (const state of Object.values(this.complianceDB.stateSpecific)) {
      for (const compliance of Object.values(state)) {
        if (compliance.id === complianceId) {
          return {
            ...compliance,
            category: 'state',
            detailedSteps: this.getDetailedSteps(complianceId)
          };
        }
      }
    }

    return null;
  }

  getDetailedSteps(complianceId) {
    const steps = {
      'GST': [
        'Gather required documents (PAN, Aadhaar, Bank statement)',
        'Visit GST portal (www.gst.gov.in)',
        'Fill GST REG-01 form',
        'Upload documents',
        'Submit application',
        'Track application status',
        'Receive GST certificate'
      ],
      'FSSAI': [
        'Determine license type (Basic/State/Central)',
        'Prepare required documents',
        'Apply online at FSSAI portal',
        'Pay fees',
        'Schedule inspection (if required)',
        'Receive FSSAI license'
      ],
      'MSME_UDYAM': [
        'Visit Udyam portal',
        'Enter Aadhaar number',
        'Fill business details',
        'Submit application',
        'Receive Udyam certificate instantly'
      ]
    };

    return steps[complianceId] || [
      'Gather required documents',
      'Visit relevant portal/office',
      'Fill application form',
      'Submit with fees',
      'Track status',
      'Receive certificate/license'
    ];
  }

  /**
   * Calculate penalty risks
   */
  calculatePenaltyRisks(businessProfile, missingCompliances) {
    const risks = [];

    missingCompliances.forEach(compliance => {
      if (compliance.penalties) {
        const risk = {
          complianceId: compliance.id,
          complianceName: compliance.name,
          riskLevel: this.assessRiskLevel(compliance, businessProfile),
          penalties: compliance.penalties,
          recommendation: this.getRiskRecommendation(compliance)
        };
        risks.push(risk);
      }
    });

    return risks.sort((a, b) => {
      const riskOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
  }

  assessRiskLevel(compliance, businessProfile) {
    // FSSAI for food businesses - critical
    if (compliance.id === 'FSSAI' && businessProfile.sellsFood) {
      return 'critical';
    }

    // GST for high revenue businesses - high
    if (compliance.id === 'GST' && businessProfile.monthlyRevenueEstimate > 300000) {
      return 'high';
    }

    // Labor compliances for businesses with employees - high
    if (['EPF', 'ESI'].includes(compliance.id) && businessProfile.employees > 10) {
      return 'high';
    }

    // State compliances - medium
    if (compliance.category === 'state') {
      return 'medium';
    }

    return 'low';
  }

  getRiskRecommendation(compliance) {
    const recommendations = {
      'FSSAI': 'Apply immediately - food businesses cannot operate without FSSAI license',
      'GST': 'Register before crossing ₹40L turnover to avoid penalties',
      'EPF': 'Register within 30 days of hiring 20th employee',
      'ESI': 'Register within 15 days of hiring 10th employee'
    };

    return recommendations[compliance.id] || 'Complete this compliance to avoid legal issues';
  }

  /**
   * Get compliance calendar for monitoring
   */
  generateComplianceCalendar(businessProfile, completedCompliances) {
    const calendar = [];
    const currentDate = new Date();

    // GST returns (if applicable)
    if (completedCompliances.includes('GST')) {
      calendar.push({
        type: 'GST Return',
        frequency: 'monthly',
        dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 20),
        description: 'File GSTR-1 and GSTR-3B',
        penalty: '₹200 per day delay'
      });
    }

    // Professional Tax (if applicable)
    if (businessProfile.employees > 0) {
      calendar.push({
        type: 'Professional Tax',
        frequency: 'monthly',
        dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15),
        description: 'Pay professional tax for employees',
        penalty: 'Interest @1.5% per month'
      });
    }

    // Annual renewals
    const renewals = [
      { type: 'Trade License', months: 12 },
      { type: 'Shops Act', months: 12 },
      { type: 'FSSAI', months: 12 }
    ];

    renewals.forEach(renewal => {
      if (completedCompliances.includes(renewal.type.replace(' ', '_').toUpperCase())) {
        const renewalDate = new Date(currentDate);
        renewalDate.setMonth(renewalDate.getMonth() + renewal.months);
        
        calendar.push({
          type: `${renewal.type} Renewal`,
          frequency: 'annual',
          dueDate: renewalDate,
          description: `Renew ${renewal.type}`,
          penalty: 'Late fees and potential closure'
        });
      }
    });

    return calendar.sort((a, b) => a.dueDate - b.dueDate);
  }

  /**
   * Get business structure recommendations
   */
  getBusinessStructureRecommendation(businessProfile) {
    const structures = [
      {
        type: 'Proprietorship',
        suitableFor: 'Single owner, small scale, low compliance',
        pros: ['Lowest cost', 'Minimal compliance', 'Easy to start'],
        cons: ['Unlimited liability', 'Limited funding options'],
        cost: '₹5,000 - ₹10,000',
        timeline: '7-15 days',
        recommended: businessProfile.monthlyRevenueEstimate < 500000 && !businessProfile.partners
      },
      {
        type: 'LLP',
        suitableFor: 'Multiple partners, medium scale',
        pros: ['Limited liability', 'Tax benefits', 'Flexible structure'],
        cons: ['More compliance', 'Partner restrictions'],
        cost: '₹15,000 - ₹25,000',
        timeline: '15-30 days',
        recommended: businessProfile.partners && businessProfile.monthlyRevenueEstimate < 2000000
      },
      {
        type: 'Private Limited',
        suitableFor: 'High growth, funding plans, multiple stakeholders',
        pros: ['Limited liability', 'Easy funding', 'Credibility'],
        cons: ['High compliance', 'More expensive'],
        cost: '₹25,000 - ₹50,000',
        timeline: '20-45 days',
        recommended: businessProfile.monthlyRevenueEstimate > 1000000 || businessProfile.fundingPlans
      }
    ];

    return structures.sort((a, b) => b.recommended - a.recommended);
  }

  /**
   * Get document checklist for compliance
   */
  getDocumentChecklist(complianceIds) {
    const allDocuments = new Set();
    const complianceDocuments = {};

    complianceIds.forEach(id => {
      const compliance = this.getComplianceDetails(id);
      if (compliance && compliance.documents) {
        complianceDocuments[id] = compliance.documents;
        compliance.documents.forEach(doc => allDocuments.add(doc));
      }
    });

    return {
      uniqueDocuments: Array.from(allDocuments),
      complianceMapping: complianceDocuments,
      documentPriority: this.prioritizeDocuments(Array.from(allDocuments))
    };
  }

  prioritizeDocuments(documents) {
    const priority = {
      'PAN Card': 1,
      'Aadhaar Card': 1,
      'Bank Statement': 2,
      'Address Proof': 2,
      'ID Proof': 2,
      'Business Registration': 3,
      'NOC from Municipality': 4,
      'Fire NOC': 4,
      'Pollution Clearance': 5
    };

    return documents.sort((a, b) => (priority[a] || 10) - (priority[b] || 10));
  }

  /**
   * Get cost breakdown analysis
   */
  getCostBreakdown(evaluation) {
    const breakdown = {
      government: 0,
      professional: 0,
      platform: 0,
      recurring: 0,
      oneTime: 0
    };

    const details = [];

    evaluation.mandatory.forEach(compliance => {
      const cost = typeof compliance.cost === 'number' ? compliance.cost : 
                  (compliance.cost?.basic || compliance.cost?.state || 0);
      
      breakdown.government += cost;
      breakdown.oneTime += cost;
      
      details.push({
        name: compliance.name,
        cost: cost,
        type: 'government',
        frequency: 'one-time'
      });
    });

    // Add professional service costs (estimated)
    const professionalCosts = {
      'CA for GST': 5000,
      'Legal for registration': 3000,
      'Documentation help': 2000
    };

    Object.entries(professionalCosts).forEach(([service, cost]) => {
      breakdown.professional += cost;
      breakdown.oneTime += cost;
      details.push({
        name: service,
        cost: cost,
        type: 'professional',
        frequency: 'one-time'
      });
    });

    return {
      breakdown,
      details,
      total: breakdown.oneTime + (breakdown.recurring * 12),
      summary: {
        immediate: breakdown.oneTime,
        annual: breakdown.recurring * 12,
        monthly: breakdown.recurring
      }
    };
  }
}
