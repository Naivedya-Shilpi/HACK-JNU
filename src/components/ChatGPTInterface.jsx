import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiMessageCircle, FiLoader, FiSend, FiPlus, FiMic, FiFile, FiX, FiImage } from 'react-icons/fi'
import { useChatContext } from '../context/ChatContext'
import { useAppContext } from '../context/AppContext'

const ChatGPTInterface = ({ userProfile }) => {
  const { userIntent } = useAppContext()
  const {
    messages,
    isLoading,
    activeChatId,
    sendMessage
  } = useChatContext()

  const [inputMessage, setInputMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize Web Speech API for voice recognition (FREE - browser native)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-IN' // Indian English for MSME context
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setInputMessage(prev => prev + (prev ? ' ' : '') + finalTranscript)
        }
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.')
        }
      }
      
      recognitionInstance.onend = () => {
        setIsRecording(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when starting new chat
  useEffect(() => {
    if (!activeChatId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeChatId])

  // Handle file selection for document upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => {
      const isImage = file.type.startsWith('image/')
      return {
        file,
        type: isImage ? 'image' : 'document',
        name: file.name,
        size: file.size,
        preview: isImage ? URL.createObjectURL(file) : null,
        // Extract document type from filename
        docType: getDocumentType(file.name)
      }
    })
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = '' // Reset input
  }

  // Determine document type from filename
  const getDocumentType = (filename) => {
    const lower = filename.toLowerCase()
    if (lower.includes('gst')) return 'GST Certificate'
    if (lower.includes('pan')) return 'PAN Card'
    if (lower.includes('aadhar') || lower.includes('aadhaar')) return 'Aadhaar Card'
    if (lower.includes('registration') || lower.includes('udyam')) return 'MSME Registration'
    if (lower.includes('license') || lower.includes('licence')) return 'Business License'
    if (lower.includes('incorporation') || lower.includes('moa') || lower.includes('aoa')) return 'Incorporation Document'
    if (lower.includes('bank')) return 'Bank Statement'
    if (lower.includes('invoice')) return 'Invoice'
    return 'Other Document'
  }

  // Remove attachment
  const removeAttachment = (index) => {
    const attachment = attachments[index]
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview)
    }
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Handle voice recording toggle
  const handleVoiceRecord = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      try {
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Failed to start recording:', error)
        setIsRecording(false)
      }
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if ((!inputMessage.trim() && attachments.length === 0) || isLoading) return

    // Build message content including document info
    let messageContent = inputMessage.trim()
    
    if (attachments.length > 0) {
      const docList = attachments.map(att => `${att.docType} (${att.name})`).join(', ')
      
      // If no text message, create a default query about the documents
      if (!messageContent) {
        messageContent = `I have uploaded the following documents: ${docList}. Please analyze these documents and let me know if they are complete for MSME compliance requirements.`
      }
    }
    
    // Store current attachments
    const currentAttachments = [...attachments]
    
    setInputMessage('')
    setAttachments([])

    try {
      await sendMessage(messageContent, userProfile, userIntent, currentAttachments)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user'
    
    // Check for attachments in the message object
    const hasAttachments = message.attachments && message.attachments.length > 0
    
    // Check for document analysis data
    const hasDocumentAnalysis = message.data?.documentSummary || message.data?.extractedFields
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-emerald-500 text-white'
          }`}>
            {isUser ? <FiUser size={16} /> : <FiMessageCircle size={16} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}>
            {/* Document attachments badge */}
            {hasAttachments && (
              <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-blue-400/30 dark:border-slate-600">
                {message.attachments.map((attachment, idx) => (
                  <span 
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isUser 
                        ? 'bg-blue-400/30 text-blue-100' 
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <FiFile size={10} />
                    {attachment.type}
                  </span>
                ))}
              </div>
            )}
            
            {/* Document Analysis Summary (for bot messages) */}
            {!isUser && hasDocumentAnalysis && (
              <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <FiFile className="text-emerald-600 dark:text-emerald-400" size={14} />
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-300 text-xs">Document Analysis</h4>
                </div>
                
                {message.data.documentSummary && (
                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                    <div className="text-center p-1 bg-white dark:bg-slate-700 rounded">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{message.data.documentSummary.totalFiles}</div>
                      <div className="text-slate-600 dark:text-slate-400">Uploaded</div>
                    </div>
                    <div className="text-center p-1 bg-white dark:bg-slate-700 rounded">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">{message.data.documentSummary.processedFiles}</div>
                      <div className="text-slate-600 dark:text-slate-400">Processed</div>
                    </div>
                    <div className="text-center p-1 bg-white dark:bg-slate-700 rounded">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">{message.data.documentSummary.complianceScore}%</div>
                      <div className="text-slate-600 dark:text-slate-400">Score</div>
                    </div>
                  </div>
                )}
                
                {message.data.extractedFields && Object.keys(message.data.extractedFields).length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Extracted Fields:</div>
                    <div className="text-xs space-y-1">
                      {Object.entries(message.data.extractedFields).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">{key}:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono">{value}</span>
                        </div>
                      ))}
                      {Object.keys(message.data.extractedFields).length > 3 && (
                        <div className="text-slate-500 dark:text-slate-400">+ {Object.keys(message.data.extractedFields).length - 3} more...</div>
                      )}
                    </div>
                  </div>
                )}
                
                {message.data.issues && message.data.issues.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-300">Issues: </span>
                    <span className="text-slate-700 dark:text-slate-300">{message.data.issues.length} found</span>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <p className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const WelcomeMessage = () => (
    <div className="text-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <FiMessageCircle className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          MSME Compliance Navigator
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
          I'm here to help you start and grow your business in India with all the right compliance requirements.
        </p>
        {userIntent && (
          <div className="mt-3 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
            Focus: {userIntent.replace('_', ' ')}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {[
          { icon: '📋', title: 'Business Registration', desc: 'GST, PAN, licenses' },
          { icon: '📅', title: 'Compliance Calendar', desc: 'Deadlines & filings' },
          { icon: '🚀', title: 'Platform Onboarding', desc: 'Amazon, Flipkart, etc.' }
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setInputMessage(`Tell me about ${card.title.toLowerCase()}`)}
          >
            <div className="text-xl mb-2">{card.icon}</div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 text-sm">
              {card.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <div className="max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <FiMessageCircle size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiLoader className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Redesigned for better alignment and UX */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Hidden file input for document upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          aria-label="Upload documents"
        />
        
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {/* Attachments Preview - Above input bar */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative group flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      {attachment.preview ? (
                        <img 
                          src={attachment.preview} 
                          alt={attachment.name} 
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FiFile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                          {attachment.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {attachment.docType} • {formatFileSize(attachment.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-md"
                        aria-label={`Remove ${attachment.name}`}
                      >
                        <FiX size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  {attachments.length} document{attachments.length > 1 ? 's' : ''} ready to send
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 
            Main Input Bar Container
            - Unified container for cohesive visual design
            - Flexbox for horizontal alignment
            - items-center for vertical centering
            - gap-2 for consistent spacing between elements
          */}
          <div 
            className={`
              flex items-center gap-2 p-2
              bg-slate-100 dark:bg-slate-800 
              border rounded-2xl
              transition-all duration-200
              ${isRecording 
                ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20' 
                : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/20'
              }
            `}
          >
            {/* Microphone Button - Fixed size, left position */}
            <motion.button
              type="button"
              onClick={handleVoiceRecord}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex-shrink-0 
                w-10 h-10 
                flex items-center justify-center
                rounded-xl
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800
                ${isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white'
                }
              `}
              title={isRecording ? 'Stop recording (Esc)' : 'Start voice input (V)'}
              aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
            >
              <FiMic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </motion.button>

            {/* Document Upload Button - Fixed size */}
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                flex-shrink-0 
                w-10 h-10 
                flex items-center justify-center
                rounded-xl
                bg-white dark:bg-slate-700 
                text-slate-600 dark:text-slate-300 
                hover:bg-slate-50 dark:hover:bg-slate-600
                hover:text-slate-800 dark:hover:text-white
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800
              "
              title="Upload documents (GST, PAN, Registration, etc.)"
              aria-label="Upload documents"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <FiPlus className="w-5 h-5" />
              </motion.div>
            </motion.button>

            {/* Text Input - Flexible width, takes remaining space */}
            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "🎤 Listening... Speak now" : "Message MSME Compliance Navigator..."}
                className="
                  w-full 
                  px-3 py-2.5
                  bg-transparent 
                  border-none 
                  resize-none 
                  focus:outline-none 
                  text-slate-900 dark:text-slate-100 
                  placeholder-slate-400 dark:placeholder-slate-500
                  text-sm leading-5
                "
                rows="1"
                style={{ 
                  minHeight: '40px',
                  maxHeight: '120px',
                  height: '40px'
                }}
                onInput={(e) => {
                  e.target.style.height = '40px'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                disabled={isLoading}
                aria-label="Type your message"
              />
            </div>

            {/* Send Button - Primary action, visually emphasized */}
            <motion.button
              type="submit"
              disabled={(!inputMessage.trim() && attachments.length === 0) || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex-shrink-0 
                w-10 h-10 
                flex items-center justify-center
                rounded-xl
                font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800
                ${(!inputMessage.trim() && attachments.length === 0) || isLoading
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30'
                }
              `}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              {isLoading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          
          {/* Helper Text - Below input bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRecording ? (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-red-500 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Recording... Click mic or press Esc to stop
                </motion.span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">Shift+Enter</kbd> for new line
                </span>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatGPTInterface