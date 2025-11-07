import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('Chat API received request');
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body', e);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Handle both useChat format (messages array) and direct message format
    const messages = body?.messages || [];
    const directMessage = body?.message;
    const creditScore = body?.creditScore;
    const creditAnalysisDate = body?.creditAnalysisDate;
    
    console.log('Messages received:', messages);
    console.log('Direct message:', directMessage);
    console.log('Credit score provided:', creditScore);
    
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const message = lastUserMessage?.content || directMessage;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('API Key check:', { 
      exists: !!apiKey, 
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) || 'MISSING',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENROUTER')).join(', ')
    });
    
    if (!apiKey) {
      console.error('OpenRouter API key is missing from environment variables');
      return NextResponse.json({ 
        error: 'OpenRouter API key is not configured',
        hint: 'Please check Vercel environment variables and redeploy',
        availableKeys: Object.keys(process.env).filter(k => k.includes('OPENROUTER'))
      }, { status: 500 });
    }

    // Call OpenRouter API
    console.log('Calling OpenRouter API');
    
    // Build conversation messages
    const conversationMessages = [
      {
        role: 'system',
        content: buildSystemPrompt(creditScore, creditAnalysisDate),
      }
    ];
    
    // Add conversation history if available
    if (messages.length > 0) {
      conversationMessages.push(...messages);
    } else {
      // Single message format
      conversationMessages.push({
        role: 'user',
        content: message,
      });
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.get('origin') || 'https://taxsage.vercel.app',
        'X-Title': 'TaxSage - CA Advisor',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: conversationMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    console.log('OpenRouter response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Try to parse error for more details
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorJson.message || errorText;
      } catch (e) {
        // Keep as text
      }
      
      return NextResponse.json({ 
        error: 'Failed to get response from OpenRouter AI',
        details: errorDetails,
        status: response.status,
        hint: response.status === 401 ? 'Invalid API key - please check your OPENROUTER_API_KEY' : 
              response.status === 402 ? 'Insufficient credits - please add credits to your OpenRouter account' :
              response.status === 429 ? 'Rate limit exceeded - please try again later' :
              'OpenRouter API error'
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    // Return format compatible with both useChat hook and mobile app
    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      message: content  // Add this for mobile app compatibility
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// Build enhanced system prompt with user's credit score data
function buildSystemPrompt(creditScore, creditAnalysisDate) {
  let basePrompt = 'You are TaxSage AI, a helpful Chartered Accountant and financial advisor specializing in Indian tax laws, loan eligibility, and financial planning.\n\nWhen users ask for roadmaps, plans, or strategies for financial goals (like buying something, saving, investing), provide detailed step-by-step actionable plans with specific timelines, amounts, and tax-saving strategies.';
  
  // Check if user has analyzed their credit score
  if (creditScore && creditScore !== 'null') {
    const score = parseInt(creditScore);
    let band = 'Poor';
    if (score >= 750) band = 'Excellent';
    else if (score >= 720) band = 'Very Good';  
    else if (score >= 680) band = 'Good';
    else if (score >= 650) band = 'Fair';
    
    const analysisDate = creditAnalysisDate ? new Date(creditAnalysisDate).toLocaleDateString() : 'recently';
    
    basePrompt += `\n\nIMPORTANT: The user has analyzed their credit score (${analysisDate}). Their current credit score is ${score} (${band} category). Use this information to provide personalized loan eligibility advice, interest rate estimates, and tax-saving strategies. Consider their creditworthiness when suggesting loan amounts and types.`;
    
    // Add specific context based on score band
    if (score >= 750) {
      basePrompt += '\nThey qualify for premium loan products with lowest interest rates (7-9%). Suggest tax-efficient loans like home loans (Section 80C + 24b deductions up to ₹3.5L total).';
    } else if (score >= 720) {
      basePrompt += '\nThey qualify for good loan products with competitive rates (8-11%). Focus on home loans and business loans with tax benefits.';
    } else if (score >= 680) {
      basePrompt += '\nThey qualify for standard loan products (9-13% rates). Focus on improving score while accessing necessary credit.';
    } else if (score >= 650) {
      basePrompt += '\nThey may get higher interest rates (12-16%). Suggest credit improvement before major loans.';
    } else {
      basePrompt += '\nThey may face loan rejections or very high rates (15%+). Focus on credit repair strategies first.';
    }
  } else {
    // User hasn't analyzed their credit score
    basePrompt += `\n\nIMPORTANT: The user has NOT analyzed their credit score yet. For ANY loan-related queries, banking questions, or credit advice, you MUST first direct them to check their credit score by visiting the Credit Analysis page and using their Aadhaar and PAN. Say something like: "Before I can provide specific loan advice, please first analyze your credit score by going to the Credit Analysis page and entering your Aadhaar and PAN. This will help me give you personalized recommendations based on your actual creditworthiness."`;
  }
  
  basePrompt += '\n\nProvide practical, actionable advice considering Indian financial regulations, tax laws (Sections 80C, 80D, 24b, etc.), and current market conditions. Always mention TaxSage when appropriate.';
  
  return basePrompt;
}

// Add a GET handler just to confirm the route is working
export async function GET() {
  return NextResponse.json({ status: 'Chat API is online' });
}
