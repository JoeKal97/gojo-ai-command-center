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
  project_id?: string
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  type: string
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
  },
  {
    id: '5',
    name: 'Blog Post / Service Page',
    content: `Generate high-quality, SEO-optimized blog posts or service pages with full AEO (AI Engine Optimization) structure and ready-to-use schema markup.

## INPUT REQUIRED

- Content Type: Blog Post OR Service Page
- Primary Keyword: Main target keyword
- Business Name: Company/brand name
- Business Location: City, State
- Business Contact: Phone, Email, Website URL
- Target Audience: Who is this for?
- Key Services/Products: (for service pages)
- Unique Value Proposition: What makes this business different?

## OUTPUT STRUCTURE

### 1. METADATA BLOCK
Title Tag: [Primary Keyword] | [Business Name]
Meta Description: [150-160 characters with keyword + CTA]
URL Slug: [keyword-optimized-slug]
Estimated Read Time: [X minutes]

### 2. CONTENT BODY

For Blog Posts:
H1: [Primary Keyword in Natural Headline]

Introduction (2-3 paragraphs)
- Hook with problem or promise
- Include primary keyword in first 100 words
- Preview what reader will learn

H2: [Cluster Keyword 1]
- 2-3 paragraphs
- Sub-bullet points for scannability
- Include related keyword naturally

H2: [Cluster Keyword 2]
- 2-3 paragraphs
- Practical examples or case study
- Data or statistics if available

H2: [Cluster Keyword 3]
- 2-3 paragraphs
- Actionable advice
- Common mistakes to avoid

H2: How to Get Started / Next Steps
- Clear CTA
- Contact information
- Link to related service page

Conclusion (1 paragraph)
- Summarize key takeaway
- Reinforce main benefit
- Final CTA

For Service Pages:
H1: [Service Name] in [Location] | [Business Name]

Hero Section (2-3 paragraphs)
- Service overview with primary keyword
- Unique value proposition
- Trust signal (years in business, clients served, etc.)

H2: Why Choose [Business Name] for [Service]
- 3-4 bullet points of differentiators
- Local expertise emphasis

H2: Our [Service] Process
- Numbered steps (3-5 steps)
- Clear, jargon-free language
- Timeline expectations

H2: Who This Service Is For
- Ideal client description
- Problem scenarios
- Outcome expectations

H2: [Service] Benefits
- 4-6 benefit bullets
- Mix of tangible and emotional benefits

H2: Service Areas
- List of locations served
- Local landmarks mentioned naturally

H2: Frequently Asked Questions
- 3-5 Q&A pairs (see AEO Block below)

H2: Get Started Today
- Strong CTA
- Phone number (clickable)
- Contact form or link
- Hours of operation

### 3. AEO BLOCK (FAQ SECTION)

Q: [Natural language question with primary/cluster keyword]
A: [1-3 sentence answer, snippet-optimized, specific and actionable]

Q: [Related question with local modifier if applicable]
A: [Clear, direct answer with specific information]

Q: [Comparison or "how much" question]
A: [Transparent answer with range or factors]

### 4. INTERNAL LINKING SUGGESTIONS
- Link to: [Related blog post URL placeholder]
- Link to: [Related service page URL placeholder]
- Link to: [Contact/About page URL placeholder]

Anchor text suggestions:
- [keyword-rich anchor text]
- [natural phrase with keyword]

### 5. IMAGE RECOMMENDATIONS
- Featured Image: [Description with keyword in alt text suggestion]
- Body Image 1: [Description]
- Body Image 2: [Description]
- Infographic: [If applicable - data visualization suggestion]

## SCHEMA MARKUP (JSON-LD)

### FAQ Schema
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[FAQ Question 1]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[FAQ Answer 1]"
      }
    },
    {
      "@type": "Question",
      "name": "[FAQ Question 2]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[FAQ Answer 2]"
      }
    },
    {
      "@type": "Question",
      "name": "[FAQ Question 3]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[FAQ Answer 3]"
      }
    }
  ]
}
\`\`\`

### Article Schema (if blog)
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[H1 Title]",
  "description": "[Meta Description]",
  "image": "[Featured Image URL]",
  "author": {
    "@type": "Organization",
    "name": "[Business Name]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[Business Name]",
    "logo": {
      "@type": "ImageObject",
      "url": "[Logo URL]"
    }
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[Page URL]"
  }
}
\`\`\`

### LocalBusiness / Service Schema (if service page)
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Business Name]",
  "image": "[Business Image URL]",
  "@id": "[Website URL]",
  "url": "[Website URL]",
  "telephone": "[Phone Number]",
  "email": "[Email Address]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street Address]",
    "addressLocality": "[City]",
    "addressRegion": "[State]",
    "postalCode": "[ZIP Code]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[Latitude]",
    "longitude": "[Longitude]"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "[Opening Time]",
      "closes": "[Closing Time]"
    }
  ],
  "priceRange": "$$",
  "areaServed": {
    "@type": "City",
    "name": "[Primary Service Area]"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "[Service Name]",
          "description": "[Service Description]"
        }
      }
    ]
  }
}
\`\`\`

## QUALITY CHECKLIST
- Primary keyword in H1, first paragraph, and at least one H2
- All business information is accurate (no placeholders)
- FAQ answers are snippet-ready (1-3 sentences, direct)
- Schema markup is valid JSON with no syntax errors
- All URLs in schema are absolute (https://...)
- Local modifiers included for service pages (city, neighborhood)
- CTA is clear and contact info is correct
- Word count: Blog (800-1500 words) / Service Page (600-1200 words)`,
    category: 'AEO Content'
  }
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
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
    console.log('Loading data on mount...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    loadProjects()
    loadConversations()
    loadTemplates()
  }, [])

  // Reload conversations when project changes
  useEffect(() => {
    loadConversations()
  }, [selectedProjectId])

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

  const loadProjects = async () => {
    try {
      console.log('Loading projects from Supabase...')
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error loading projects:', error)
        throw error
      }
      console.log('Loaded projects:', data?.length || 0)
      setProjects(data || [])
      
      // Auto-select General project if exists and no project selected
      if (!selectedProjectId && data && data.length > 0) {
        const generalProject = data.find(p => p.type === 'default')
        if (generalProject) {
          setSelectedProjectId(generalProject.id)
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    }
  }

  const loadConversations = async () => {
    try {
      console.log('Loading conversations from Supabase...')
      let query = supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      // Filter by project if one is selected
      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error loading conversations:', error)
        throw error
      }
      console.log('Loaded conversations:', data?.length || 0)
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }

  const createProject = async (name: string, type: string = 'general') => {
    try {
      console.log('Creating project:', name)
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, type })
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating project:', error)
        throw error
      }
      console.log('Created project:', data.id)
      loadProjects()
      setSelectedProjectId(data.id)
      return data.id
    } catch (err) {
      console.error('Error creating project:', err)
      return null
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
      console.log('Creating conversation:', title)
      const { data, error} = await supabase
        .from('conversations')
        .insert({ 
          title,
          project_id: selectedProjectId 
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating conversation:', error)
        throw error
      }
      console.log('Created conversation:', data.id)
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
      console.log('Saving message:', { conversationId, role, contentLength: content.length })
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, role, content })

      if (error) {
        console.error('Supabase error saving message:', error)
        throw error
      }
      console.log('Message saved successfully')
    } catch (err) {
      console.error('Error saving message:', err)
    }
  }

  const loadConversation = async (id: string) => {
    try {
      console.log('Loading conversation:', id)
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error loading conversation:', error)
        throw error
      }
      
      console.log('Loaded messages:', data?.length || 0)
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

        {/* Projects Section */}
        <div className="px-4 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</h3>
            <button
              onClick={() => {
                const name = prompt('Project name:')
                if (name) createProject(name)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + New
            </button>
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedProjectId === project.id 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30' 
                    : 'hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-medium truncate">{project.name}</span>
              </button>
            ))}
          </div>
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
