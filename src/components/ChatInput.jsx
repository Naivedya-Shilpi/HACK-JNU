import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiSend, FiFile, FiX, FiMic } from 'react-icons/fi'

const ChatInput = ({ onSubmit, sidebarCollapsed }) => {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const fileInputRef = useRef(null)

  // Determine document type from filename for MSME compliance
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
    if (lower.includes('itr') || lower.includes('tax')) return 'Tax Document'
    if (lower.includes('shop') || lower.includes('establishment')) return 'Shop & Establishment'
    if (lower.includes('fssai') || lower.includes('food')) return 'FSSAI License'
    if (lower.includes('trademark')) return 'Trademark Certificate'
    return 'Other Document'
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  useEffect(() => {
    // Initialize Web Speech API for voice recognition (FREE - browser native)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-IN' // Indian English for MSME context
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript)
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() || attachments.length > 0) {
      // Build message content including document info
      let messageContent = message.trim()
      
      if (attachments.length > 0) {
        const docList = attachments.map(att => `${att.docType} (${att.name})`).join(', ')
        const docContext = `\n\n[Uploaded Documents: ${docList}]`
        
        if (!messageContent) {
          messageContent = `I have uploaded the following documents: ${docList}. Please check if these documents are required for compliance or registration, and let me know if anything is missing.`
        } else {
          messageContent += docContext
        }
      }
      
      onSubmit(messageContent, attachments)
      setMessage('')
      setAttachments([])
    }
  }

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
        docType: getDocumentType(file.name)
      }
    })
    setAttachments([...attachments, ...newAttachments])
    e.target.value = ''
  }

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

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    // Revoke object URLs to prevent memory leaks
    if (attachments[index].preview) {
      URL.revokeObjectURL(attachments[index].preview)
    }
    setAttachments(newAttachments)
  }

  return (
    <>
      {/* Hidden file input - accepts both images and documents */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        aria-label="Upload documents"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <form onSubmit={handleSubmit} className="relative">
          {/* Attachments preview - Above input bar */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700"
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative group flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                    >
                      {attachment.preview ? (
                        <img src={attachment.preview} alt={attachment.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FiFile className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-200 max-w-[120px] truncate">
                          {attachment.name}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-slate-400">
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
            Main Input Bar - Unified container
            - All elements in single row with consistent alignment
            - Fixed-size buttons (40x40), flexible input
            - items-center for perfect vertical centering
          */}
          <div 
            className={`
              flex items-center gap-2 p-2
              bg-white dark:bg-slate-900/95 
              border rounded-2xl
              shadow-lg dark:shadow-[0_18px_45px_rgba(15,23,42,0.85)]
              transition-all duration-200
              ${isRecording 
                ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20' 
                : 'border-gray-200 dark:border-slate-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/20'
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
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white'
                }
              `}
              title={isRecording ? 'Stop recording (Esc)' : 'Start voice input'}
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
                bg-gray-100 dark:bg-slate-800 
                text-gray-600 dark:text-slate-300 
                hover:bg-gray-200 dark:hover:bg-slate-700
                hover:text-gray-800 dark:hover:text-white
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
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
            
            {/* Text Input - Flexible width, vertically centered */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={isRecording ? "🎤 Listening... Speak now" : "Ask about compliance requirements..."}
              className="
                flex-1 min-w-0
                h-10
                px-3
                bg-transparent 
                border-none outline-none
                text-gray-700 dark:text-slate-100 
                placeholder-gray-400 dark:placeholder-slate-500 
                text-sm
              "
              aria-label="Type your message"
            />
            
            {/* Send Button - Primary action, visually emphasized */}
            <motion.button
              type="submit"
              whileHover={{ scale: (!message.trim() && attachments.length === 0) ? 1 : 1.05 }}
              whileTap={{ scale: (!message.trim() && attachments.length === 0) ? 1 : 0.95 }}
              disabled={!message.trim() && attachments.length === 0}
              className={`
                flex-shrink-0 
                w-10 h-10 
                flex items-center justify-center
                rounded-xl
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${(!message.trim() && attachments.length === 0)
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30'
                }
              `}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <FiSend className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Status indicator - Below input bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isRecording ? (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-red-500 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Recording... Click mic to stop
                </motion.span>
              ) : (
                <span className="text-gray-400 dark:text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-mono">Enter</kbd> to send
                </span>
              )}
            </p>
          </div>
        </form>
      </motion.div>
    </>
  )
}

export default ChatInput
