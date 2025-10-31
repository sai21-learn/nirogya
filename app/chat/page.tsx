"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { Send, Bot, User as UserIcon, Menu, X, LogOut, Loader2, Sparkles } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  "How's my blood report?",
  "When is my next appointment?",
  "What do my recent test results mean?",
  "Can you explain my cholesterol levels?",
  "What should I discuss with my doctor?",
]

export default function ChatPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          user_id: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#d4d4c8]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-lg font-semibold text-[#1a1a1a]">Nirogya</span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link href="/dashboard" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/upload" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                  Upload
                </Link>
                <Link
                  href="/appointments"
                  className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
                >
                  Appointments
                </Link>
                <Link href="/chat" className="text-[#1a1a1a] font-medium text-sm">
                  AI Chat
                </Link>
              </div>

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden pb-4 space-y-2">
                <Link href="/" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  Home
                </Link>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Upload
                </Link>
                <Link
                  href="/appointments"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Appointments
                </Link>
                <Link href="/chat" className="block px-4 py-2 text-gray-900 font-medium bg-gray-50 rounded-lg">
                  AI Chat
                </Link>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Chat Container */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#a8b5a0] to-[#1a1a1a] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Nirogya AI Assistant</h1>
                <p className="text-sm text-[#6b6b6b]">Ask me about your health reports and appointments</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 shadow-lg overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#a8b5a0] to-[#1a1a1a] rounded-2xl flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Welcome to Nirogya AI</h2>
                  <p className="text-[#6b6b6b] text-center mb-6 max-w-md">
                    I can help you understand your medical reports, check your appointments, and answer health-related questions.
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="w-full max-w-2xl">
                    <p className="text-sm font-medium text-[#6b6b6b] mb-3">Try asking:</p>
                    <div className="grid gap-2">
                      {SUGGESTED_QUESTIONS.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="text-left px-4 py-3 bg-[#f5f5f0] hover:bg-[#e8e8e0] rounded-xl transition-colors text-sm text-[#1a1a1a] border border-[#d4d4c8]/30"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#a8b5a0] to-[#1a1a1a] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-[#1a1a1a] text-white'
                            : 'bg-[#f5f5f0] text-[#1a1a1a] border border-[#d4d4c8]/30'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-[#6b6b6b] rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#a8b5a0] to-[#1a1a1a] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-[#f5f5f0] rounded-2xl px-4 py-3 border border-[#d4d4c8]/30">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#1a1a1a]" />
                          <span className="text-sm text-[#6b6b6b]">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#d4d4c8]/30 p-4 bg-white/50">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your health..."
                  className="flex-1 px-4 py-3 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] transition-all resize-none text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#d4d4c8] disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[#9b9b9b] mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
