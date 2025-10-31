import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, user_id } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let userContext = ''
    
    // If user_id is provided, fetch their recent reports and appointments
    if (user_id && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      try {
        // Fetch user's recent reports with summaries
        const { data: reports, error: reportsError } = await supabase
          .from('files')
          .select(`
            id,
            file_name,
            uploaded_at,
            report_summaries!inner (
              id,
              summary_text,
              processing_status,
              created_at
            )
          `)
          .eq('user_id', user_id)
          .eq('report_summaries.processing_status', 'completed')
          .order('uploaded_at', { ascending: false })
          .limit(5)
          
        if (reportsError) {
          console.error('Error fetching reports:', reportsError);
          throw reportsError;
        }

        // Fetch user's appointments
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            doctor_name,
            specialty,
            date,
            time,
            status,
            notes,
            created_at
          `)
          .eq('user_id', user_id)
          .gte('date', new Date().toISOString().split('T')[0]) // Only future appointments
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(5)
          
        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          throw appointmentsError;
        }

        // Build context string
        if (reports && reports.length > 0) {
          userContext += '\n\nUser\'s Recent Medical Reports:\n'
          reports.forEach((report: any) => {
            userContext += `- ${report.file_name} (uploaded ${new Date(report.uploaded_at).toLocaleDateString()})\n`
            const summary = report.report_summaries?.[0]
            if (summary?.processing_status === 'completed' && summary.summary_text) {
              userContext += `  Summary: ${summary.summary_text.substring(0, 200)}...\n`
            }
          })
        }

        if (appointments && appointments.length > 0) {
          userContext += '\n\nUser\'s Upcoming Appointments:\n'
          appointments.forEach((apt: any) => {
            userContext += `- ${apt.doctor_name || 'Doctor'} (${apt.specialty || 'General'}) on ${new Date(apt.date).toLocaleDateString()} at ${apt.time}\n`
            if (apt.notes) {
              userContext += `  Notes: ${apt.notes}\n`
            }
          })
        }
      } catch (error) {
        console.error('Error fetching user context:', error)
        // Continue without context if there's an error
      }
    }

    // Get API key
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Determine API endpoint
    const isOpenRouter = apiKey.startsWith('sk-or-v1-')
    const apiEndpoint = isOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
    
    const modelName = isOpenRouter ? 'openai/gpt-4o' : 'gpt-4o'

    // Read the doctor prompt from file
    let doctorPrompt = ''
    try {
      const promptPath = path.join(process.cwd(), 'app', 'api', 'prompts', 'doctor-prompt.txt')
      doctorPrompt = await fs.readFile(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error reading doctor prompt:', error)
      doctorPrompt = `You are MediAI, an AI assistant designed to provide preliminary health guidance as a junior doctor would. Your primary role is to ask relevant questions about users' health concerns, gather information about their symptoms, provide general health information, suggest when professional medical attention is needed, and offer basic self-care advice when appropriate.`
    }

    // Build system message with context
    const systemMessage: Message = {
      role: 'system',
      content: `${doctorPrompt}

# User Context
${userContext || 'No additional user context available.'}

# Additional Guidelines
- Be conversational, friendly, and helpful while maintaining medical accuracy and appropriate boundaries.
- If the user has medical reports or appointments, help them understand them in simple terms.
- Always prioritize user safety and recommend professional care when needed.`
    }

    // Prepare messages for API
    const apiMessages = [systemMessage, ...messages]

    // Call OpenRouter/OpenAI API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }
    
    if (isOpenRouter) {
      headers['HTTP-Referer'] = 'https://nirogya.app'
      headers['X-Title'] = 'Nirogya Medical Assistant'
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    const assistantMessage = result?.choices?.[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: assistantMessage,
      success: true,
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
