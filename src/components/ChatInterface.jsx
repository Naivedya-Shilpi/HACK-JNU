import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBot, FiLoader, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import chatService from '../services/chatService';
import EnhancedChatInput from './EnhancedChatInput';

const ChatInterface = ({ userProfile, sessionId, onSessionUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('discovery');
  const [businessProfile, setBusinessProfile] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = chatService.initializeSocket(sessionId);
    
    // Listen for real-time responses
    chatService.onMessage((response) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: response.message,
        type: response.type,
        data: response.data,
        timestamp: new Date()
      }]);
      
      setCurrentPhase(response.data?.nextStep || currentPhase);
      if (response.data?.businessProfile) {
        setBusinessProfile(response.data.businessProfile);
        onSessionUpdate?.(response.data.businessProfile);
      }
      
      setIsLoading(false);
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
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

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
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.message,
          type: response.type,
          data: response.data,
          timestamp: new Date()
        }]);
        
        setCurrentPhase(response.data?.nextStep || currentPhase);
        if (response.data?.businessProfile) {
          setBusinessProfile(response.data.businessProfile);
          onSessionUpdate?.(response.data.businessProfile);
        }
        
        setIsLoading(false);
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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          }`}>
            {isUser ? <FiUser size={16} /> : <FiBot size={16} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-slate-700'
          }`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Special UI for different message types */}
            {message.type && message.data && renderSpecialContent(message)}
            
            <div className={`text-xs mt-2 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </motion.div>
    );
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
      <div className="mt-3 space-y-2">
        {data.options.map((option, index) => (
          <button
            key={index}
            onClick={() => sendMessage(option)}
            className="block w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm transition-colors"
          >
            {option}
          </button>
        ))}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(renderMessage)}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FiBot size={16} className="text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FiLoader className="animate-spin text-gray-500" size={16} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
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
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
