"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// AI Chatbot component for construction project assistance
// Provides interactive AI-powered help for construction-related queries
export function AIChatbot() {
  // Chat window open/close state
  const [isOpen, setIsOpen] = useState(false)
  // Current chat input value
  const [chatInput, setChatInput] = useState("")
  // Loading state while waiting for AI response
  const [chatLoading, setChatLoading] = useState(false)
  // Latest AI response for display
  const [chatResponse, setChatResponse] = useState("")
  // Complete chat conversation history
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant", content: string }[]>([])
  // Reference to chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added to chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  // Handle sending user message to AI backend and processing response
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    // Add user message to chat history immediately
    const userMessage = chatInput.trim()
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }])
    setChatInput("")
    setChatLoading(true)
    
    try {
      // Send message to AI backend API endpoint
      const response = await fetch("https://cdn.botpress.cloud/webchat/v3.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/11/23/07/20251123073402-UT1AFS8K.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Add AI assistant response to chat history
      setChatHistory(prev => [...prev, { role: "assistant", content: data.response }])
      setChatResponse(data.response)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to get response from AI")
      setChatResponse("Sorry, I couldn't process your request at this time.")
    } finally {
      setChatLoading(false)
    }
  }

  // Handle Enter key press for sending messages
  // Allows Shift+Enter for new lines
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button: Fixed position button to open/close chat */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full h-14 w-14 shadow-lg ${
            isOpen 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {/* Toggle between chat icon and close icon based on state */}
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Chat Window: Main chat interface with animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {/* Chat header with AI assistant branding and status badge */}
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <span>OptiBuild Assistant</span>
                </CardTitle>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Optix
                </Badge>
              </div>
            </CardHeader>
            
            {/* Chat content area with messages and input */}
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Chat messages container with auto-scroll */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px]"
              >
                {/* Welcome message when no chat history exists */}
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
                    <Bot className="h-12 w-12 mb-4 text-blue-500" />
                    <h3 className="text-lg font-medium mb-2">AI Construction Assistant</h3>
                    <p className="text-sm">
                      Ask me anything about your construction projects, resource optimization, or scheduling.
                    </p>
                  </div>
                ) : (
                  /* Render chat message history with user/assistant styling */
                  chatHistory.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Loading indicator while waiting for AI response */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat input area with send button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {/* Show loading spinner or send icon based on state */}
                    {chatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 