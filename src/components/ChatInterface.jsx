import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBot, FiLoader, FiAlertCircle, FiCheckCircle, FiClock, FiInfo } from 'react-icons/fi';
import chatService from '../services/chatService';
import EnhancedChatInput from './EnhancedChatInput';

const ChatInterface = ({ userProfile, sessionId, onSessionUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('discovery');
  const [businessProfile, setBusinessProfile] = useState({});
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with a conversational welcome flow
  useEffect(() => {
    const startConversation = async () => {
      // First welcome message
      const welcomeMessage = {
        id: 'welcome-1',
        role: 'assistant',
        content: `👋 Hello! I'm your MSME Compliance Navigator.

I'm here to help you start and grow your business in India with all the right compliance requirements.`,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);

      // Simulate typing and add follow-up questions
      setTimeout(() => {
        const followUpMessage = {
          id: 'welcome-2',
          role: 'assistant',
          content: `To get started, I'd like to understand your business better.

What type of business are you planning to start?`,
          type: 'discovery',
          data: {
            options: [
              'Food & Restaurant Business (Cafe, Restaurant, Cloud Kitchen)',
              'Retail Store (Clothing, Electronics, General Store)',
              'Service Business (Consulting, Agency, Freelancing)',
              'Manufacturing Business (Small scale production)',
              'E-commerce Business (Online selling)',
              'Other Business Type'
            ]
          },
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, followUpMessage]);
      }, 2000);
    };

    startConversation();
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const socket = chatService.initializeSocket(sessionId);
    
  // Listen for real-time responses with typing effect
    chatService.onMessage((response) => {
      setIsLoading(false);
      
      // Start typing effect for bot message
      setIsTyping(true);
      simulateTyping(response.message, (finalMessage) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          content: finalMessage,
          type: response.type,
          data: response.data,
          timestamp: new Date()
        }]);
        
        setCurrentPhase(response.data?.nextStep || currentPhase);
        if (response.data?.businessProfile) {
          setBusinessProfile(response.data.businessProfile);
          onSessionUpdate?.(response.data.businessProfile);
        }
        
        setIsTyping(false);
        setTypingMessage('');
      });
    });

    // Listen for errors
    chatService.onError((error) => {
      setError(error.error || 'Something went wrong');
      setIsLoading(false);
    });

    return () => {
      chatService.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when user is typing
  const handleInputFocus = () => {
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleInputChange = () => {
    // Scroll down when user starts typing
    setTimeout(() => scrollToBottom(), 50);
  };

  // Simulate typing effect
  const simulateTyping = (message, callback) => {
    setTypingMessage('');
    const words = message.split(' ');
    let currentIndex = 0;
    
    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setTypingMessage(prev => {
          const newMessage = prev + (prev ? ' ' : '') + words[currentIndex];
          currentIndex++;
          return newMessage;
        });
        
        // Vary speed based on word length and punctuation
        const currentWord = words[currentIndex - 1];
        const delay = currentWord.includes('.') || currentWord.includes('!') || currentWord.includes('?') 
          ? 200 : Math.random() * 100 + 50;
        
        setTimeout(typeNextWord, delay);
      } else {
        callback(message);
      }
    };
    
    typeNextWord();
  };

  const sendMessage = async (message) => {
    if (!message.trim() || isLoading || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Try real-time first, fallback to HTTP
      if (chatService.isConnected) {
        chatService.sendMessageRealtime(message, userProfile);
      } else {
        const response = await chatService.sendMessage(message, userProfile, sessionId);
        
        setIsLoading(false);
        
        // Start typing effect for bot message
        setIsTyping(true);
        simulateTyping(response.message, (finalMessage) => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'assistant',
            content: finalMessage,
            type: response.type,
            data: response.data,
            timestamp: new Date()
          }]);
          
          setCurrentPhase(response.data?.nextStep || currentPhase);
          if (response.data?.businessProfile) {
            setBusinessProfile(response.data.businessProfile);
            onSessionUpdate?.(response.data.businessProfile);
          }
          
          setIsTyping(false);
          setTypingMessage('');
        });
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          }`}>
            {isUser ? <FiUser size={18} /> : <FiBot size={18} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-5 py-4 relative ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg'
              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-lg border border-gray-100 dark:border-slate-700'
          }`}>
            
            {/* Message text with better formatting */}
            <div className={`leading-relaxed ${message.isWelcome ? 'space-y-3' : ''}`}>
              {formatMessageContent(message.content)}
            </div>
            
            {/* Special UI for different message types */}
            {message.type && message.data && renderSpecialContent(message)}
            
            {/* Timestamp */}
            <div className={`text-xs mt-3 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {/* Message tail */}
            <div className={`absolute top-4 ${
              isUser 
                ? 'right-0 transform translate-x-2' 
                : 'left-0 transform -translate-x-2'
            }`}>
              <div className={`w-3 h-3 rotate-45 ${
                isUser 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-white dark:bg-slate-800 border-l border-t border-gray-100 dark:border-slate-700'
              }`}></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

      // Handle special content based on message type
      const formatMessageContent = (content) => {
        if (!content) return null;
        
        // Split content by lines and format
        const lines = content.split('\n');
        
        return lines.map((line, index) => {
          if (!line.trim()) return <br key={index} />;
          
          // Handle headers with **
          if (line.includes('**') && line.split('**').length >= 3) {
            const parts = line.split('**');
            return (
              <div key={index} className="font-semibold text-lg mb-2 text-indigo-600 dark:text-indigo-400">
                {parts.map((part, i) => i % 2 === 1 ? part : part)}
              </div>
            );
          }
          
          // Handle bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="flex items-start gap-2 mb-1">
                <span className="text-indigo-500 mt-1">•</span>
                <span>{line.replace(/^[•-]\s*/, '')}</span>
              </div>
            );
          }
          
          // Handle emoji bullets with business info
          if (line.match(/^[�📋🏢💰].+/) || line.match(/^[•]\s*[A-Z].+:/)) {
            const [emoji, ...rest] = line.split(' ');
            return (
              <div key={index} className="flex items-start gap-3 mb-2">
                <span className="text-xl">{emoji}</span>
                <span className="font-medium">{rest.join(' ')}</span>
              </div>
            );
          }
          
          // Handle numbered questions
          if (line.match(/^\d+[️⃣]/)) {
            return (
              <div key={index} className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                {line}
              </div>
            );
          }
          
          // Handle questions
          if (line.trim().endsWith('?')) {
            return (
              <div key={index} className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                {line}
              </div>
            );
          }
          
          // Regular text
          return (
            <div key={index} className="mb-1">
              {line}
            </div>
          );
        });
      };

  const renderSpecialContent = (message) => {
    switch (message.type) {
      case 'discovery':
        return renderDiscoveryOptions(message.data);
      case 'readiness_report':
        return renderReadinessReport(message.data);
      case 'compliance_list':
        return renderComplianceList(message.data);
      case 'timeline':
        return renderTimeline(message.data);
      case 'platform_info':
        return renderPlatformInfo(message.data);
      default:
        return null;
    }
  };

  const renderDiscoveryOptions = (data) => {
    if (!data.options) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Choose an option:
        </div>
        <div className="space-y-2">
          {data.options.map((option, index) => (
            <button
              key={index}
              onClick={() => sendMessage(option)}
              className="flex items-center justify-between w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:from-slate-800 dark:via-slate-750 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:via-slate-650 dark:hover:to-slate-600 text-sm transition-all duration-300 border border-blue-200 dark:border-slate-600 hover:shadow-lg hover:scale-105 group"
            >
              <span className="text-gray-700 dark:text-gray-300 font-medium">{option}</span>
              <span className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderReadinessReport = (data) => {
    const { readinessScore } = data;
    
    return (
      <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <FiCheckCircle className="text-green-500" />
          <span className="font-medium text-sm">Business Readiness Score</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${readinessScore.score}%` }}
            />
          </div>
          <span className="text-sm font-bold">{readinessScore.score}%</span>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
          {readinessScore.completed}/{readinessScore.totalRequired} requirements completed
        </div>
      </div>
    );
  };

  const renderComplianceList = (data) => {
    const { mandatory, recommended } = data;
    
    return (
      <div className="mt-3 space-y-3">
        {mandatory.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="text-red-500" />
              <span className="font-medium text-sm text-red-700 dark:text-red-300">Mandatory Compliances</span>
            </div>
            <div className="space-y-1">
              {mandatory.slice(0, 3).map((compliance, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-400">
                  • {compliance.name}
                </div>
              ))}
              {mandatory.length > 3 && (
                <div className="text-xs text-red-500">+{mandatory.length - 3} more</div>
              )}
            </div>
          </div>
        )}
        
        {recommended.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <FiCheckCircle className="text-blue-500" />
              <span className="font-medium text-sm text-blue-700 dark:text-blue-300">Recommended</span>
            </div>
            <div className="space-y-1">
              {recommended.slice(0, 2).map((compliance, index) => (
                <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                  • {compliance.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = (data) => {
    const { timeline, totalCost } = data;
    
    return (
      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <FiClock className="text-green-500" />
          <span className="font-medium text-sm text-green-700 dark:text-green-300">Implementation Timeline</span>
        </div>
        <div className="space-y-2">
          {timeline.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-green-600 dark:text-green-400">Week {item.week}: {item.compliance}</span>
              <span className="text-green-500">₹{item.cost}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-green-200 dark:border-green-700">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-green-700 dark:text-green-300">Total Cost:</span>
              <span className="text-green-600 dark:text-green-400">₹{totalCost}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlatformInfo = (data) => {
    const { platforms } = data;
    
    return (
      <div className="mt-3 space-y-2">
        {Object.entries(platforms).map(([platform, info]) => (
          <div key={platform} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="font-medium text-sm text-purple-700 dark:text-purple-300 capitalize mb-1">
              {platform}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Commission: {info.commission} • Timeline: {info.timeline}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Phase Indicator */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-b border-gray-200 dark:border-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {currentPhase.replace('_', ' ')} Phase
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        <AnimatePresence>
          {messages.map(renderMessage)}
          
          {/* Typing indicator */}
          {isTyping && typingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <FiBot size={18} />
                </div>
                <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-lg border border-gray-100 dark:border-slate-700 relative">
                  <div className="leading-relaxed">
                    {formatMessageContent(typingMessage)}
                    <span className="inline-block w-2 h-5 bg-indigo-500 ml-1 typing-cursor"></span>
                  </div>
                  <div className="absolute top-4 left-0 transform -translate-x-2">
                    <div className="w-3 h-3 rotate-45 bg-white dark:bg-slate-800 border-l border-t border-gray-100 dark:border-slate-700"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {isLoading && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <FiBot size={18} className="text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FiLoader className="animate-spin text-indigo-500" size={18} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="text-red-500" size={16} />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Chat Input */}
      <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <EnhancedChatInput
          onSubmit={sendMessage}
          userProfile={userProfile}
          sessionId={sessionId}
          disabled={isLoading || isTyping}
          onInputFocus={handleInputFocus}
          onInputChange={handleInputChange}
        />
        
        {/* Status indicator */}
        {(isLoading || isTyping) && (
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {isLoading && <><FiLoader className="animate-spin" /> Processing...</>}
              {isTyping && <><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> AI is typing...</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
