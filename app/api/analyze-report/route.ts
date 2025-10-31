import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

// Ensure Node.js runtime so server-only env vars are available
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { report_id, file_path, user_id } = await request.json()

    if (!report_id || !file_path || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Initialize a server-safe Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are not configured' },
        { status: 500 }
      )
    }

    // Diagnostics: confirm which key type is active (no secrets logged)
    const usingServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim())
    console.log('[analyze-report] Using service role key:', usingServiceRole)
    console.log('[analyze-report] Supabase URL present:', Boolean(supabaseUrl))

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create initial summary record with pending status
    let summaryRecord: { id: string } | null = null
    let canPersist = true
    {
      const { data, error: insertError } = await supabase
        .from('report_summaries')
        .insert({
          report_id,
          user_id,
          processing_status: 'processing'
        })
        .select()
        .single()

      if (insertError) {
        // If RLS blocks insert, continue without persistence
        console.error('Error creating summary record:', insertError)
        canPersist = false
      } else {
        summaryRecord = data as any
      }
    }

    try {
      // 1. Download the uploaded file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('uploads')
        .download(file_path)

      if (downloadError || !fileData) {
        throw new Error('File not found in storage')
      }

      // 2. Prepare content for GPT-4o Vision (via OpenRouter)
      const lower = file_path.toLowerCase()
      const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY
      
      if (!apiKey) {
        console.error('[analyze-report] API key is missing from environment variables')
        throw new Error('API key not configured. Please add OPENAI_API_KEY or OPENROUTER_API_KEY to your .env.local file')
      }
      
      console.log('[analyze-report] API key found, length:', apiKey.length)
      console.log('[analyze-report] Processing file:', file_path)

      let summary = ''
      if (lower.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/)) {
        const blobArrayBuffer = await fileData.arrayBuffer()
        const b64 = Buffer.from(blobArrayBuffer).toString('base64')
        const ext = (lower.split('.').pop() || 'png') as string
        summary = await generateAISummaryFromImage(b64, ext)
      } else if (lower.endsWith('.pdf')) {
        // PDFs are not yet supported without conversion; surface a clear error
        throw new Error('PDF analysis not yet supported. Please upload an image (JPG, PNG, GIF, BMP, TIFF).')
      } else {
        throw new Error('Unsupported file type for analysis')
      }

      // 4. Update summary record with results (only if initial insert succeeded)
      if (canPersist && summaryRecord?.id) {
        const { error: updateError } = await supabase
          .from('report_summaries')
          .update({
            summary_text: summary,
            processing_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', summaryRecord.id)

        if (updateError) {
          console.error('Error updating summary record:', updateError)
          // Do not fail the request; return non-persisted success
          canPersist = false
        }
      }

      return NextResponse.json({ 
        success: true, 
        summary,
        summary_id: summaryRecord?.id ?? null,
        persisted: Boolean(canPersist && summaryRecord?.id)
      })

    } catch (error) {
      console.error('Error processing report:', error)
      
      // Update summary record with error status if we created one
      if (canPersist && summaryRecord?.id) {
        await supabase
          .from('report_summaries')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', summaryRecord.id)
      }

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process report' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateAISummaryFromImage(base64: string, ext: string): Promise<string> {
  const prompt = `Analyze this medical report image and provide a comprehensive summary in simple, layman language. 

Please include:
1. Key health metrics and test results
2. Normal vs abnormal findings
3. Any concerning values or patterns
4. Overall health assessment
5. Recommendations (if any are visible in the report)

Keep the summary friendly, clear, and easy to understand for non-medical professionals.`

  console.log('[generateAISummary] Starting API call...')
  console.log('[generateAISummary] Image extension:', ext)
  console.log('[generateAISummary] Base64 length:', base64.length)

  // Determine which API to use based on key format
  const openRouterKey = process.env.OPENROUTER_API_KEY
  const openAIKey = process.env.OPENAI_API_KEY
  
  // Check if OPENAI_API_KEY is actually an OpenRouter key (starts with sk-or-v1-)
  const isOpenRouterKeyInOpenAI = openAIKey?.startsWith('sk-or-v1-')
  
  // Determine which service to use
  const isOpenRouter = !!openRouterKey || isOpenRouterKeyInOpenAI
  const apiKey = openRouterKey || openAIKey
  
  const apiEndpoint = isOpenRouter 
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  
  const modelName = isOpenRouter ? 'openai/gpt-4o' : 'gpt-4o'
  
  console.log('[generateAISummary] Using API:', isOpenRouter ? 'OpenRouter' : 'OpenAI')
  console.log('[generateAISummary] Endpoint:', apiEndpoint)
  console.log('[generateAISummary] Model:', modelName)
  console.log('[generateAISummary] Key format:', apiKey?.substring(0, 10) + '...')

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }
    
    // OpenRouter requires additional headers
    if (isOpenRouter) {
      headers['HTTP-Referer'] = 'https://nirogya.app' // Your app URL
      headers['X-Title'] = 'Nirogya Medical Analysis'
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful medical assistant that analyzes medical reports and lab results. Explain findings clearly and concisely in layman terms while maintaining accuracy.' 
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: prompt 
              },
              { 
                type: 'image_url', 
                image_url: {
                  url: `data:image/${ext};base64,${base64}`,
                  detail: 'high'
                }
              },
            ],
          },
        ],
      }),
    })

    console.log('[generateAISummary] API response status:', response.status)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[generateAISummary] API error response:', errText)
      throw new Error(`API error: ${response.status} - ${errText}`)
    }

    const result = await response.json()
    console.log('[generateAISummary] Response received, has choices:', !!result?.choices)
    
    const content = result?.choices?.[0]?.message?.content
    
    if (typeof content === 'string' && content.trim()) {
      console.log('[generateAISummary] Summary generated successfully, length:', content.length)
      return content.trim()
    }
    
    console.error('[generateAISummary] No content in response:', JSON.stringify(result))
    throw new Error('API returned no content')
  } catch (error) {
    console.error('[generateAISummary] Error during API call:', error)
    throw error
  }
}
