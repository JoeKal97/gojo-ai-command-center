'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
}

interface Template {
  id: string
  name: string
  content: string
  category: string
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Facebook Ad',
    content: 'Write a compelling Facebook ad for [BUSINESS NAME]. Target audience: [TARGET AUDIENCE]. Key benefits: [BENEFITS]. Include a strong call-to-action and emphasize urgency.',
    category: 'Marketing'
  },
  {
    id: '2',
    name: 'SEO Article',
    content: 'Write a comprehensive SEO-optimized article about [TOPIC]. Target keyword: [KEYWORD]. Include: engaging introduction, H2 and H3 subheadings, actionable tips, and a compelling conclusion. Aim for 800-1200 words.',
    category: 'Content'
  },
  {
    id: '3',
    name: 'Cold Email',
    content: 'Write a personalized cold email to [PROSPECT NAME] at [COMPANY]. Subject: [SUBJECT LINE]. Goal: [GOAL - e.g., book a meeting, introduce service]. Keep it concise, friendly, and include a clear call-to-action.',
    category: 'Sales'
  },
  {
    id: '4',
    name: 'Local Business Audit',
    content: 'Perform a comprehensive local business audit for [BUSINESS NAME] in [CITY]. Analyze: Google Business Profile optimization, local SEO factors, online reputation, website mobile-friendliness, and provide actionable recommendations.',
    category: 'Audit'
  }
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load conversations on mount
  useEffect(() => {
    // Only load data if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321') {
      loadConversations()
      loadTemplates()
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name')

      if (error) throw error
      if (data && data.length > 0) {
        setTemplates(data)
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      // Keep default templates on error
    }
  }

  const createConversation = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title })
        .select()
        .single()

      if (error) throw error
      setConversationId(data.id)
      loadConversations()
      return data.id
    } catch (err) {
      console.error('Error creating conversation:', err)
      return null
    }
  }

  const saveMessage = async (conversationId: string, role: string, content: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, role, content })

      if (error) throw error
    } catch (err) {
      console.error('Error saving message:', err)
    }
  }

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      setMessages(data || [])
      setConversationId(id)
      if (isMobile) setSidebarOpen(false)
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError('Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setIsLoading(true)

    // Create conversation if needed
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
      currentConversationId = await createConversation(title)
      if (!currentConversationId) {
        setError('Failed to create conversation')
        setIsLoading(false)
        return
      }
    }

    // Add user message to state
    const newUserMessage: Message = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, newUserMessage])

    // Save user message
    await saveMessage(currentConversationId, 'user', userMessage)

    try {
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      // Add assistant message
      const assistantMessage: Message = { role: 'assistant', content: data.content }
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message
      await saveMessage(currentConversationId, 'assistant', data.content)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // Remove the user message from state on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTemplateClick = (template: Template) => {
    setInput(template.content)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setInput('')
    setError(null)
    if (isMobile) setSidebarOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isMobile ? 'fixed left-0 top-0 z-50' : 'relative'
        } w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
              G
            </div>
            <span className="font-semibold text-lg">GoJo AI</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Templates Section */}
        <div className="px-4 pb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Templates</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group"
              >
                <div className="font-medium text-sm text-slate-200 group-hover:text-white">
                  {template.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {template.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Section */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">History</h3>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                  conversationId === conv.id 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-300 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(conv.created_at)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-950">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-semibold text-lg">
              {conversationId ? 'Chat' : 'New Chat'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
              Claude 3.5 Sonnet
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to GoJo AI</h2>
              <p className="text-slate-400 max-w-md">
                Your AI-powered marketing assistant. Select a template from the sidebar or start typing to begin.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">You</span>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">AI</span>
              </div>
              <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 pb-2">
            <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2 bg-slate-800 rounded-xl border border-slate-700 p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-0 resize-none max-h-32 min-h-[44px] py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-0"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-slate-500">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
