import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const MAX_TOKENS = 1200
const MAX_PROMPT_LENGTH = 4000

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'claude-sonnet-4-6' } = await req.json()

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Check for empty prompts
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage.content || lastMessage.content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      )
    }

    // Check prompt length
    const totalLength = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0)
    if (totalLength > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Total prompt length exceeds ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Convert messages to Anthropic format
    const systemMessage = messages.find((m: any) => m.role === 'system')
    const conversationMessages: Array<{role: 'user' | 'assistant', content: string}> = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }))

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: MAX_TOKENS,
      system: systemMessage?.content || undefined,
      messages: conversationMessages,
    })

    // Check for empty response
    if (!response.content || response.content.length === 0) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      )
    }

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to process response'

    return NextResponse.json({
      content,
      usage: response.usage,
      model: response.model,
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)

    // Handle specific Anthropic errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your configuration.' },
        { status: 401 }
      )
    }

    if (error.status === 400 && error.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        { error: `Invalid request: ${error.error.message}` },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
