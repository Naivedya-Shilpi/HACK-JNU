import { createContext, useContext, useState, useEffect } from 'react'

// Create the context
const ChatContext = createContext()

// Custom hook to use the context
export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatContextProvider')
  }
  return context
}

// ChatGPT-style Chat Context Provider
export const ChatContextProvider = ({ children }) => {
  // Core state
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`) // Generate user ID
  const [activeChatId, setActiveChatId] = useState(null)
  const [chatList, setChatList] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  /**
   * Fetch user's chat list for sidebar
   */
  const fetchChatList = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chats?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setChatList(data.allChats || [])
        return data.groupedChats
      }
    } catch (error) {
      console.error('Failed to fetch chat list:', error)
    }
    return null
  }

  /**
   * Load a specific chat
   */
  const loadChat = async (chatId) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/chats/${chatId}?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setActiveChatId(chatId)
        setMessages(data.chat.messages || [])
        return data.chat
      } else {
        console.error('Failed to load chat:', data.error)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    } finally {
      setIsLoading(false)
    }
    return null
  }

  /**
   * Send message to current or new chat with optional file attachments
   */
  const sendMessage = async (messageContent, userProfile = {}, userIntent = null, attachments = []) => {
    try {
      setIsLoading(true)
      
      // Optimistically add user message to UI
      const userMessage = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments.map(att => ({
          name: att.name,
          type: att.docType || 'Document',
          size: att.size
        })) : undefined
      }
      setMessages(prev => [...prev, userMessage])

      let response, data

      // Handle file uploads
      if (attachments && attachments.length > 0) {
        // Create FormData for file upload
        const formData = new FormData()
        
        // Add files
        attachments.forEach(attachment => {
          formData.append('documents', attachment.file)
        })
        
        // Add other data
        formData.append('message', messageContent)
        formData.append('userId', userId)
        formData.append('chatId', activeChatId || '')
        formData.append('userProfile', JSON.stringify(userProfile))
        formData.append('userIntent', userIntent || 'document_analysis')

        // Send with files
        response = await fetch(`${API_BASE}/api/files/chat-upload`, {
          method: 'POST',
          body: formData
        })
        
        data = await response.json()
        
        if (data.success && data.chatResponse) {
          data = data.chatResponse // Use the chat response from the file upload
        }
      } else {
        // Send regular text message
        response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            chatId: activeChatId, // null for new chat
            message: messageContent,
            userProfile,
            userIntent
          })
        })
        
        data = await response.json()
      }
      
      if (data.success) {
        // Update active chat ID if this was a new chat
        if (!activeChatId) {
          setActiveChatId(data.chatId)
        }

        // Add AI response to messages
        const aiMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant', 
          content: data.message,
          timestamp: new Date()
        }
        
        // Replace temp user message with actual messages from server
        const updatedChat = await loadChat(data.chatId)
        if (updatedChat) {
          setMessages(updatedChat.messages)
        } else {
          // Fallback: add AI message to current messages
          setMessages(prev => [...prev, aiMessage])
        }

        // Refresh chat list to show updated chat
        await fetchChatList()
        
        return data
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id.startsWith('temp_')))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Start a new chat
   */
  const startNewChat = () => {
    setActiveChatId(null)
    setMessages([])
  }

  /**
   * Delete a chat
   */
  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`${API_BASE}/api/chats/${chatId}?userId=${userId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // If deleted chat was active, clear current chat
        if (activeChatId === chatId) {
          startNewChat()
        }
        
        // Refresh chat list
        await fetchChatList()
        return true
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
    return false
  }

  /**
   * Update chat title
   */
  const updateChatTitle = async (chatId, newTitle) => {
    try {
      const response = await fetch(`${API_BASE}/api/chats/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: newTitle
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh chat list to show updated title
        await fetchChatList()
        return true
      }
    } catch (error) {
      console.error('Error updating chat title:', error)
    }
    return false
  }

  /**
   * Toggle sidebar
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  // Load chat list on mount
  useEffect(() => {
    fetchChatList()
  }, [userId])

  // Context value
  const value = {
    // State
    userId,
    activeChatId,
    chatList,
    messages,
    isLoading,
    isSidebarOpen,
    
    // Actions
    loadChat,
    sendMessage,
    startNewChat,
    deleteChat,
    updateChatTitle,
    fetchChatList,
    toggleSidebar,
    setActiveChatId,
    setMessages
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export default ChatContext