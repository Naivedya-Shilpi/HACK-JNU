export const COMPLIANCE_DATABASE = {
  "central": {
    "GST": {
      "id": "GST",
      "name": "Goods and Services Tax",
      "category": "taxation",
      "mandatory": true,
      "applicableIf": {
        "annualTurnover": { "greaterThan": 4000000 }
      },
      "documents": ["PAN Card", "Aadhaar Card", "Bank Statement", "Business Registration"],
      "authority": "GST Council",
      "validity": "Permanent",
      "cost": 0,
      "timeline": "7-15 days",
      "penalties": {
        "lateRegistration": "10% of tax liability or ₹10,000 whichever is higher",
        "nonCompliance": "₹10,000 per return"
      }
    },
    "FSSAI": {
      "id": "FSSAI",
      "name": "Food Safety and Standards Authority License",
      "category": "food_safety",
      "mandatory": true,
      "applicableIf": {
        "businessType": ["restaurant", "cafe", "food_processing", "catering"]
      },
      "documents": ["Form A", "ID Proof", "Address Proof", "NOC from Municipality"],
      "authority": "Food Safety and Standards Authority of India",
      "validity": "1-5 years",
      "cost": { "basic": 100, "state": 2000, "central": 7500 },
      "timeline": "7-60 days",
      "penalties": {
        "operatingWithoutLicense": "₹25,000 to ₹5,00,000"
      }
    },
    "MSME_UDYAM": {
      "id": "MSME_UDYAM",
      "name": "Udyam Registration",
      "category": "business_registration",
      "mandatory": false,
      "benefits": ["Priority sector lending", "Collateral-free loans", "Government tenders"],
      "documents": ["Aadhaar Card", "PAN Card"],
      "authority": "Ministry of MSME",
      "validity": "Permanent",
      "cost": 0,
      "timeline": "1 day"
    },
    "EPF": {
      "id": "EPF",
      "name": "Employee Provident Fund",
      "category": "labor",
      "mandatory": true,
      "applicableIf": {
        "employees": { "greaterThanOrEqual": 20 }
      },
      "documents": ["Form 1", "Salary Register", "Employee Details"],
      "authority": "Employees' Provident Fund Organisation",
      "validity": "Ongoing",
      "cost": 0,
      "timeline": "30 days"
    },
    "ESI": {
      "id": "ESI",
      "name": "Employee State Insurance",
      "category": "labor",
      "mandatory": true,
      "applicableIf": {
        "employees": { "greaterThanOrEqual": 10 }
      },
      "documents": ["Form 1", "Employee Details", "Salary Register"],
      "authority": "Employees' State Insurance Corporation",
      "validity": "Ongoing",
      "cost": 0,
      "timeline": "30 days"
    },
    "PROFESSIONAL_TAX": {
      "id": "PROFESSIONAL_TAX",
      "name": "Professional Tax",
      "category": "taxation",
      "mandatory": true,
      "applicableIf": {
        "employees": { "greaterThan": 0 }
      },
      "stateSpecific": true,
      "authority": "State Government",
      "validity": "Annual",
      "cost": "Varies by state"
    }
  },
  "stateSpecific": {
    "KA": {
      "SHOPS_ACT": {
        "id": "KA_SHOPS_ACT",
        "name": "Karnataka Shops and Commercial Establishments Act",
        "category": "business_registration",
        "mandatory": true,
        "applicableIf": {
          "businessType": ["retail", "office", "commercial"]
        },
        "documents": ["Application Form", "Rent Agreement", "ID Proof"],
        "authority": "Labour Department, Karnataka",
        "validity": "Annual",
        "cost": 500,
        "timeline": "15 days"
      },
      "FACTORIES_ACT": {
        "id": "KA_FACTORIES_ACT",
        "name": "Karnataka Factories Act",
        "category": "manufacturing",
        "mandatory": true,
        "applicableIf": {
          "businessType": ["manufacturing"],
          "employees": { "greaterThanOrEqual": 10 }
        },
        "documents": ["Factory Plan", "NOC from Fire Department", "Pollution Clearance"],
        "authority": "Directorate of Factories and Boilers",
        "validity": "Annual",
        "cost": 2000,
        "timeline": "30-45 days"
      },
      "TRADE_LICENSE": {
        "id": "KA_TRADE_LICENSE",
        "name": "Trade License",
        "category": "local_permit",
        "mandatory": true,
        "authority": "BBMP/Local Municipality",
        "validity": "Annual",
        "cost": 1000,
        "timeline": "15-30 days"
      }
    },
    "MH": {
      "SHOPS_ACT": {
        "id": "MH_SHOPS_ACT",
        "name": "Maharashtra Shops and Establishments Act",
        "category": "business_registration",
        "mandatory": true,
        "authority": "Labour Department, Maharashtra",
        "validity": "Annual",
        "cost": 200,
        "timeline": "7-15 days"
      }
    },
    "DL": {
      "SHOPS_ACT": {
        "id": "DL_SHOPS_ACT",
        "name": "Delhi Shops and Establishments Act",
        "category": "business_registration",
        "mandatory": true,
        "authority": "Labour Department, Delhi",
        "validity": "Annual",
        "cost": 300,
        "timeline": "7-10 days"
      }
    },
    "GJ": {
      "SHOPS_ACT": {
        "id": "GJ_SHOPS_ACT",
        "name": "Gujarat Shops and Establishments Act",
        "category": "business_registration",
        "mandatory": true,
        "authority": "Labour Department, Gujarat",
        "validity": "Annual",
        "cost": 400,
        "timeline": "10-15 days"
      }
    },
    "TN": {
      "SHOPS_ACT": {
        "id": "TN_SHOPS_ACT",
        "name": "Tamil Nadu Shops and Establishments Act",
        "category": "business_registration",
        "mandatory": true,
        "authority": "Labour Department, Tamil Nadu",
        "validity": "Annual",
        "cost": 250,
        "timeline": "15-20 days"
      }
    }
  },
  "businessTypeSpecific": {
    "restaurant": {
      "required": ["FSSAI", "FIRE_NOC", "POLLUTION_NOC", "MUSIC_LICENSE"],
      "conditional": ["LIQUOR_LICENSE", "OUTDOOR_SEATING_PERMIT"]
    },
    "cafe": {
      "required": ["FSSAI", "FIRE_NOC"],
      "conditional": ["MUSIC_LICENSE", "OUTDOOR_SEATING_PERMIT"]
    },
    "manufacturing": {
      "required": ["FACTORIES_ACT", "POLLUTION_CLEARANCE", "FIRE_NOC"],
      "conditional": ["BOILER_LICENSE", "HAZARDOUS_WASTE_PERMIT"]
    },
    "it_services": {
      "required": ["SHOPS_ACT"],
      "conditional": ["SEZ_REGISTRATION", "STPI_REGISTRATION"]
    },
    "retail": {
      "required": ["SHOPS_ACT", "TRADE_LICENSE"],
      "conditional": ["WEIGHT_MEASURE_LICENSE"]
    }
  },
  "platformSpecific": {
    "swiggy": {
      "requirements": {
        "mandatory": ["FSSAI", "GST", "BANK_ACCOUNT"],
        "documents": ["Menu", "Restaurant Photos", "Owner ID"],
        "commission": "15-25%",
        "timeline": "3-7 days"
      }
    },
    "zomato": {
      "requirements": {
        "mandatory": ["FSSAI", "BANK_ACCOUNT"],
        "optional": ["GST"],
        "documents": ["Menu", "Restaurant Photos", "Owner ID"],
        "commission": "18-23%",
        "timeline": "2-5 days"
      }
    },
    "amazon": {
      "requirements": {
        "mandatory": ["GST", "BANK_ACCOUNT", "PAN"],
        "documents": ["Product Catalog", "Brand Authorization"],
        "commission": "5-20%",
        "timeline": "7-15 days"
      }
    }
  }
};
