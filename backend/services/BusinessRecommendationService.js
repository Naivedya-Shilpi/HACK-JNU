/**
 * Business Recommendation Service
 * Provides personalized business recommendations based on user profile and market data
 */

export class BusinessRecommendationService {
  constructor() {
    this.businessCategories = {
      'food_service': {
        name: 'Food Service',
        businesses: [
          {
            type: 'restaurant',
            name: 'Restaurant',
            investment: { min: 200000, max: 2000000 },
            licenses: ['FSSAI', 'FIRE_NOC', 'SHOPS_ACT', 'GST'],
            timeline: '45-90 days',
            profitMargin: '15-25%',
            trending: true
          },
          {
            type: 'cafe',
            name: 'Cafe/Coffee Shop',
            investment: { min: 150000, max: 800000 },
            licenses: ['FSSAI', 'SHOPS_ACT', 'GST'],
            timeline: '30-60 days',
            profitMargin: '20-30%',
            trending: true
          },
          {
            type: 'cloud_kitchen',
            name: 'Cloud Kitchen',
            investment: { min: 100000, max: 500000 },
            licenses: ['FSSAI', 'GST'],
            timeline: '15-30 days',
            profitMargin: '25-35%',
            trending: true
          },
          {
            type: 'catering',
            name: 'Catering Service',
            investment: { min: 50000, max: 300000 },
            licenses: ['FSSAI', 'GST'],
            timeline: '15-30 days',
            profitMargin: '20-30%'
          }
        ]
      },
      'retail': {
        name: 'Retail',
        businesses: [
          {
            type: 'grocery_store',
            name: 'Grocery Store',
            investment: { min: 100000, max: 1000000 },
            licenses: ['SHOPS_ACT', 'GST', 'FSSAI'],
            timeline: '30-45 days',
            profitMargin: '8-15%'
          },
          {
            type: 'clothing_store',
            name: 'Clothing Store',
            investment: { min: 200000, max: 1500000 },
            licenses: ['SHOPS_ACT', 'GST'],
            timeline: '30-45 days',
            profitMargin: '40-60%'
          },
          {
            type: 'pharmacy',
            name: 'Pharmacy',
            investment: { min: 300000, max: 1000000 },
            licenses: ['DRUG_LICENSE', 'SHOPS_ACT', 'GST'],
            timeline: '60-90 days',
            profitMargin: '15-25%'
          }
        ]
      },
      'manufacturing': {
        name: 'Manufacturing',
        businesses: [
          {
            type: 'textile_manufacturing',
            name: 'Textile Manufacturing',
            investment: { min: 1000000, max: 10000000 },
            licenses: ['GST', 'POLLUTION_CLEARANCE', 'LABOR_LICENSE', 'FIRE_NOC'],
            timeline: '90-180 days',
            profitMargin: '20-35%'
          },
          {
            type: 'food_processing',
            name: 'Food Processing',
            investment: { min: 500000, max: 5000000 },
            licenses: ['FSSAI', 'GST', 'POLLUTION_CLEARANCE', 'FIRE_NOC'],
            timeline: '60-120 days',
            profitMargin: '25-40%'
          },
          {
            type: 'handicrafts',
            name: 'Handicrafts Manufacturing',
            investment: { min: 50000, max: 500000 },
            licenses: ['GST', 'MSME_UDYAM'],
            timeline: '15-30 days',
            profitMargin: '30-50%'
          }
        ]
      },
      'services': {
        name: 'Services',
        businesses: [
          {
            type: 'digital_marketing',
            name: 'Digital Marketing Agency',
            investment: { min: 50000, max: 300000 },
            licenses: ['GST', 'PROFESSIONAL_TAX'],
            timeline: '15-30 days',
            profitMargin: '40-60%',
            trending: true
          },
          {
            type: 'logistics',
            name: 'Logistics Service',
            investment: { min: 200000, max: 2000000 },
            licenses: ['GST', 'GOODS_CARRIAGE_PERMIT'],
            timeline: '45-90 days',
            profitMargin: '15-25%',
            trending: true
          },
          {
            type: 'consulting',
            name: 'Business Consulting',
            investment: { min: 25000, max: 200000 },
            licenses: ['GST', 'PROFESSIONAL_TAX'],
            timeline: '15-30 days',
            profitMargin: '50-70%'
          }
        ]
      },
      'technology': {
        name: 'Technology',
        businesses: [
          {
            type: 'software_development',
            name: 'Software Development',
            investment: { min: 100000, max: 1000000 },
            licenses: ['GST', 'PROFESSIONAL_TAX', 'STARTUP_INDIA'],
            timeline: '30-60 days',
            profitMargin: '35-55%',
            trending: true
          },
          {
            type: 'app_development',
            name: 'Mobile App Development',
            investment: { min: 50000, max: 500000 },
            licenses: ['GST', 'STARTUP_INDIA'],
            timeline: '15-45 days',
            profitMargin: '40-60%',
            trending: true
          },
          {
            type: 'web_design',
            name: 'Web Design Agency',
            investment: { min: 30000, max: 300000 },
            licenses: ['GST'],
            timeline: '15-30 days',
            profitMargin: '45-65%'
          }
        ]
      }
    };

    this.locationFactors = {
      'metro': {
        name: 'Metro Cities',
        cities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad'],
        advantages: ['Large customer base', 'Better infrastructure', 'Access to funding'],
        challenges: ['High rent', 'Intense competition', 'Regulatory complexity'],
        suitableBusinesses: ['technology', 'services', 'food_service']
      },
      'tier2': {
        name: 'Tier 2 Cities',
        cities: ['Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur'],
        advantages: ['Lower costs', 'Growing market', 'Government support'],
        challenges: ['Limited talent pool', 'Infrastructure gaps'],
        suitableBusinesses: ['manufacturing', 'retail', 'services']
      },
      'tier3': {
        name: 'Tier 3 Cities & Towns',
        advantages: ['Very low costs', 'Less competition', 'Local market knowledge'],
        challenges: ['Limited market size', 'Infrastructure issues', 'Access to resources'],
        suitableBusinesses: ['retail', 'food_service', 'manufacturing']
      }
    };
  }

  /**
   * Get personalized business recommendations
   */
  getRecommendations(userProfile = {}) {
    const { 
      budget = 100000, 
      experience = 'beginner', 
      location = 'tier2', 
      interests = [], 
      riskTolerance = 'medium',
      timeCommitment = 'full_time'
    } = userProfile;

    const recommendations = [];

    // Filter businesses by budget
    for (const [categoryKey, category] of Object.entries(this.businessCategories)) {
      for (const business of category.businesses) {
        if (budget >= business.investment.min && budget <= business.investment.max * 2) {
          const score = this.calculateRecommendationScore(business, userProfile);
          
          recommendations.push({
            ...business,
            category: category.name,
            categoryKey,
            score,
            reasoning: this.generateReasoning(business, userProfile),
            suitabilityForLocation: this.checkLocationSuitability(categoryKey, location)
          });
        }
      }
    }

    // Sort by score and return top 5
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(rec => ({
        ...rec,
        investmentRange: `₹${rec.investment.min.toLocaleString()} - ₹${rec.investment.max.toLocaleString()}`,
        licensesRequired: rec.licenses.length,
        estimatedROI: this.calculateROI(rec)
      }));
  }

  /**
   * Calculate recommendation score
   */
  calculateRecommendationScore(business, profile) {
    let score = 50; // Base score
    
    // Budget alignment
    const budgetMid = (business.investment.min + business.investment.max) / 2;
    if (profile.budget >= budgetMid) score += 20;
    else score += 10;
    
    // Trending businesses get bonus points
    if (business.trending) score += 15;
    
    // Experience level considerations
    if (profile.experience === 'beginner' && business.licenses.length <= 3) score += 15;
    if (profile.experience === 'experienced' && business.licenses.length > 3) score += 10;
    
    // Risk tolerance
    const profitMarginAvg = this.getAverageMargin(business.profitMargin);
    if (profile.riskTolerance === 'high' && profitMarginAvg > 30) score += 15;
    if (profile.riskTolerance === 'low' && profitMarginAvg < 25) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Generate reasoning for recommendation
   */
  generateReasoning(business, profile) {
    const reasons = [];
    
    if (business.trending) {
      reasons.push('Currently trending in the market');
    }
    
    if (business.licenses.length <= 3) {
      reasons.push('Relatively simple licensing process');
    }
    
    if (business.investment.min <= profile.budget) {
      reasons.push('Fits within your budget range');
    }
    
    const profitMargin = this.getAverageMargin(business.profitMargin);
    if (profitMargin > 25) {
      reasons.push('High profit margin potential');
    }
    
    return reasons;
  }

  /**
   * Check location suitability
   */
  checkLocationSuitability(categoryKey, location) {
    const locationData = this.locationFactors[location];
    if (!locationData) return 'neutral';
    
    return locationData.suitableBusinesses.includes(categoryKey) ? 'highly_suitable' : 'suitable';
  }

  /**
   * Calculate estimated ROI
   */
  calculateROI(business) {
    const avgInvestment = (business.investment.min + business.investment.max) / 2;
    const avgMargin = this.getAverageMargin(business.profitMargin);
    
    // Simplified ROI calculation
    const monthlyRevenue = avgInvestment * 0.3; // Assume 30% of investment as monthly revenue
    const monthlyProfit = monthlyRevenue * (avgMargin / 100);
    const annualProfit = monthlyProfit * 12;
    
    return Math.round((annualProfit / avgInvestment) * 100);
  }

  /**
   * Parse profit margin string to average number
   */
  getAverageMargin(marginString) {
    const match = marginString.match(/(\\d+)-(\\d+)%/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return 20; // Default fallback
  }

  /**
   * Get business insights for a specific type
   */
  getBusinessInsights(businessType) {
    for (const category of Object.values(this.businessCategories)) {
      const business = category.businesses.find(b => b.type === businessType);
      if (business) {
        return {
          ...business,
          marketTrends: this.getMarketTrends(businessType),
          competitionLevel: this.getCompetitionLevel(businessType),
          seasonality: this.getSeasonality(businessType),
          scalabilityPotential: this.getScalabilityPotential(businessType)
        };
      }
    }
    return null;
  }

  /**
   * Get market trends
   */
  getMarketTrends(businessType) {
    const trends = {
      'cloud_kitchen': 'Growing rapidly due to online food delivery boom',
      'digital_marketing': 'High demand as businesses go digital',
      'software_development': 'Consistent growth in digital transformation',
      'app_development': 'Mobile-first approach driving demand'
    };
    
    return trends[businessType] || 'Stable market with steady growth opportunities';
  }

  /**
   * Get competition level
   */
  getCompetitionLevel(businessType) {
    const highCompetition = ['restaurant', 'cafe', 'grocery_store', 'clothing_store'];
    const mediumCompetition = ['catering', 'pharmacy', 'consulting'];
    
    if (highCompetition.includes(businessType)) return 'high';
    if (mediumCompetition.includes(businessType)) return 'medium';
    return 'low';
  }

  /**
   * Get seasonality info
   */
  getSeasonality(businessType) {
    const seasonal = {
      'restaurant': 'Peak during festivals and holidays',
      'clothing_store': 'High during festival seasons',
      'handicrafts': 'Peak during tourist season'
    };
    
    return seasonal[businessType] || 'Consistent demand throughout the year';
  }

  /**
   * Get scalability potential
   */
  getScalabilityPotential(businessType) {
    const highScalability = ['software_development', 'app_development', 'digital_marketing', 'cloud_kitchen'];
    const mediumScalability = ['catering', 'consulting', 'logistics'];
    
    if (highScalability.includes(businessType)) return 'high';
    if (mediumScalability.includes(businessType)) return 'medium';
    return 'limited';
  }
}

export const businessRecommendationService = new BusinessRecommendationService();