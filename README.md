# MSME Compliance Navigator

An AI-driven compliance management system for Indian MSMEs (Micro, Small, and Medium Enterprises) to help navigate 1,400+ regulatory obligations with ease.

## 🚀 Features

### Frontend
- 🎨 **Modern Glassmorphism UI** - Beautiful translucent glass effects throughout
- 🌓 **Dark/Light Theme Toggle** - Switch between themes seamlessly
- 💬 **AI-Powered Chat Interface** - Conversational compliance guidance
- 📅 **Compliance Calendar** - Track daily/monthly compliance deadlines
- 📋 **Task Management** - Organize and prioritize compliance tasks
- 🔐 **Google Login** - Secure authentication
- 📱 **Responsive Design** - Works on all devices
- ✨ **Smooth Animations** - Parallax effects and smooth transitions

### Backend & AI
- 🤖 **Intelligent Chatbot** - Grok/OpenAI LLM integration for personalized responses
- 🔍 **Rule Engine** - Smart compliance evaluation based on business profile
- 📊 **Comprehensive Database** - All 36 Indian states/UTs with 1,400+ compliances
- ⚡ **Real-time Communication** - Socket.IO for instant responses
- 🎯 **Agentic AI Architecture** - Multi-phase conversational flow
- 📈 **Business Readiness Scoring** - Automated compliance assessment
- 💰 **Cost Analysis** - Detailed breakdown of compliance costs
- 📋 **Platform Integration** - Swiggy, Zomato, Amazon onboarding guidance

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling with glassmorphism
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication
- **React Icons** - Icon library

### Backend
- **Node.js & Express** - Server framework
- **Socket.IO** - Real-time WebSocket communication
- **OpenAI/Grok API** - LLM integration for AI responses
- **Winston** - Logging system
- **Joi** - Data validation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Quick Start

#### Option 1: Using Batch Files (Windows)
1. **Start Backend**: Double-click `start-backend.bat`
2. **Start Frontend**: Double-click `start-frontend.bat`

#### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
npm install
npm run dev
```

**Frontend Setup (in new terminal):**
```bash
npm install
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Environment Configuration

**IMPORTANT**: Never commit `.env` files with actual API keys!

1. Navigate to backend folder:
```bash
cd backend
```

2. Copy the example file to create your local environment file:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` and add your actual API keys:
   - Get Grok API key from: https://console.x.ai
   - Get OpenAI API key from: https://platform.openai.com

4. Update these variables in `.env.local`:
```env
GROK_API_KEY=your_actual_grok_api_key_here
OPENAI_API_KEY=your_actual_openai_api_key_here
USE_GROK=true
```

📖 **See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration guide**

### Build for Production

```bash
npm run build
```

## Project Structure

```
MSME_Bot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Left navigation sidebar
│   │   │   ├── TopBar.jsx            # Top bar with theme toggle and login
│   │   │   ├── MainContent.jsx       # Main content area with chat integration
│   │   │   ├── ChatInterface.jsx     # AI chat interface with real-time features
│   │   │   ├── EnhancedChatInput.jsx # Advanced chat input with voice & files
│   │   │   ├── WelcomeCard.jsx       # Welcome message card
│   │   │   ├── ProfilePage.jsx       # User profile management
│   │   │   └── TaskList.jsx          # Task management list
│   │   ├── services/
│   │   │   └── chatService.js        # Backend API communication
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── services/
│   │   ├── ChatbotService.js         # AI chatbot logic with LLM integration
│   │   ├── RuleEngine.js             # Compliance rule evaluation engine
│   │   └── ComplianceService.js      # Compliance data management
│   ├── routes/
│   │   ├── chat.js                   # Chat API endpoints
│   │   ├── compliance.js             # Compliance API endpoints
│   │   ├── states.js                 # States/UT data endpoints
│   │   └── user.js                   # User management endpoints
│   ├── data/
│   │   ├── states.js                 # All Indian states & UTs data
│   │   └── compliances.js            # Comprehensive compliance database
│   ├── logs/                         # Application logs
│   ├── server.js                     # Express server with Socket.IO
│   ├── package.json
│   └── .env                          # Environment configuration
├── start-backend.bat                 # Windows batch file to start backend
├── start-frontend.bat                # Windows batch file to start frontend
└── README.md
```

## 🎯 AI Chatbot User Journey

The system follows a structured conversational flow:

### Phase 1: Discovery
- **Business Type**: Café, Restaurant, Manufacturing, IT Services, etc.
- **Location**: State and city selection
- **Operating Model**: Dine-in, online delivery, both
- **Team Size**: Number of employees
- **Revenue Estimate**: Expected monthly earnings

### Phase 2: Business Readiness Check
- Automated evaluation of business viability
- Readiness score calculation
- Identification of missing requirements

### Phase 3: Compliance Mapping
- **Mandatory Compliances**: GST, FSSAI, Shops Act, etc.
- **State-specific Requirements**: Based on location
- **Business-type Specific**: Industry-specific licenses
- **Conditional Requirements**: Based on business model

### Phase 4: Timeline Generation
- Week-by-week implementation plan
- Dependency mapping (e.g., bank account before platform onboarding)
- Cost breakdown and timeline estimates

### Phase 5: Platform Onboarding
- **Swiggy/Zomato**: Food delivery platforms
- **Amazon**: E-commerce marketplace
- Requirements, commission rates, and approval timelines

### Phase 6: Ongoing Monitoring
- Compliance calendar with deadlines
- Renewal reminders
- Penalty risk assessment

## 🤖 AI Features

### Grok/OpenAI Integration
- **Personalized Responses**: Context-aware explanations
- **Natural Language Processing**: Understands business queries
- **Multi-turn Conversations**: Maintains context across interactions
- **Fallback Mechanisms**: Graceful handling of API failures

### Rule Engine
- **Smart Evaluation**: 1,400+ compliance rules
- **Dynamic Assessment**: Based on business profile
- **Risk Scoring**: Penalty risk calculation
- **Cost Analysis**: Detailed financial breakdown

## 📊 Data Coverage

### Geographic Coverage
- **28 States**: Complete compliance data
- **8 Union Territories**: Including Delhi, Chandigarh, etc.
- **Local Variations**: City-specific requirements

### Business Types
- Food & Beverage (Café, Restaurant)
- Manufacturing & Industrial
- IT Services & Software
- Retail & E-commerce
- Professional Services

### Compliance Categories
- **Central**: GST, FSSAI, EPF, ESI, Professional Tax
- **State**: Shops Act, Factories Act, Trade License
- **Local**: Municipal permits, fire clearances
- **Platform**: Swiggy, Zomato, Amazon requirements

## 🚀 Getting Started Guide

1. **Start the Application**
   - Run both backend and frontend servers
   - Access the web interface at `http://localhost:5173`

2. **Begin Conversation**
   - Click on the chat input or use the welcome interface
   - Start with your business idea (e.g., "I want to open a café")

3. **Follow the Journey**
   - Answer questions about location, business model, team size
   - Review the generated compliance requirements
   - Get your personalized timeline and cost breakdown

4. **Platform Integration**
   - Learn about Swiggy/Zomato onboarding requirements
   - Understand commission structures and approval processes

5. **Ongoing Support**
   - Set up compliance monitoring
   - Receive deadline reminders
   - Get penalty risk alerts

## License

MIT
