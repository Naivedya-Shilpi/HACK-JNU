# MSME Compliance Navigator

An AI-driven compliance management system for Indian MSMEs (Micro, Small, and Medium Enterprises) to help navigate 1,400+ regulatory obligations with ease.

## Features

- 🎨 **Modern Glassmorphism UI** - Beautiful translucent glass effects throughout
- 🌓 **Dark/Light Theme Toggle** - Switch between themes seamlessly
- 💬 **Interactive Chat Interface** - Ask questions about compliance requirements
- 📅 **Compliance Calendar** - Track daily/monthly compliance deadlines
- 📋 **Task Management** - Organize and prioritize compliance tasks
- 🔐 **Google Login** - Secure authentication (UI ready)
- 📱 **Responsive Design** - Works on all devices
- ✨ **Smooth Animations** - Parallax effects and smooth transitions

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling with glassmorphism
- **Framer Motion** - Animations
- **React Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Left navigation sidebar
│   ├── TopBar.jsx           # Top bar with theme toggle and login
│   ├── MainContent.jsx      # Main content area
│   ├── WelcomeCard.jsx      # Welcome message card
│   ├── FileCard.jsx         # Previously viewed files
│   ├── MeetingCard.jsx      # Meeting summary card
│   ├── TaskCard.jsx         # Suggested task cards
│   ├── TaskList.jsx         # Task management list
│   └── ChatInput.jsx        # Chat input with parallax animation
├── App.jsx                  # Main app component
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

## Key Features Implementation

### Glassmorphism Effects
All cards and UI elements use glassmorphism with:
- Translucent backgrounds
- Backdrop blur effects
- Subtle borders
- Theme-aware colors

### Parallax Animation
When you type in the chat and hit enter:
- All content cards fade out with parallax effect
- Smooth transition to chat interface
- Staggered animations for visual appeal

### Theme System
- Toggle between light and dark themes
- All components adapt automatically
- Smooth color transitions

### Smooth Scrolling
- Custom scrollbar styling
- Smooth scroll behavior
- Optimized for performance

## Future Enhancements

- Backend integration for compliance data
- OCR functionality for document reading
- Automated form filling
- Notification system for deadlines
- Integration with government portals

## License

MIT
