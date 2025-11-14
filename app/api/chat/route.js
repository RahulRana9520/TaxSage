import { NextResponse } from 'next/server';
import { getSessionUserId } from '../../../lib/auth.js';
import { getRepo } from '../../../lib/repository.js';

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

    // Get user's complete financial context
    let userContext = null;
    try {
      const userId = await getSessionUserId();
      if (userId) {
        console.log('Loading user context for AI:', userId);
        const repo = getRepo();
        
        // Fetch all user data
        const [user, profile, income, expenses, budget, goals] = await Promise.all([
          repo.getUserById(userId),
          repo.getProfile(userId),
          repo.listIncome(userId),
          repo.listExpenses(userId),
          repo.getBudget(userId),
          repo.getGoals(userId)
        ]);
        
        userContext = {
          user,
          profile,
          income,
          expenses,
          budget,
          goals
        };
        
        console.log('User context loaded:', {
          hasProfile: !!profile,
          incomeEntries: income?.length || 0,
          expenseEntries: expenses?.length || 0,
          budgetCategories: budget?.length || 0,
          goals: goals?.length || 0
        });
      }
    } catch (error) {
      console.error('Failed to load user context:', error);
      // Continue without user context if there's an error
    }

    // Call OpenRouter API
    console.log('Calling OpenRouter API');
    
    // Build conversation messages
    const conversationMessages = [
      {
        role: 'system',
        content: buildSystemPrompt(creditScore, creditAnalysisDate, userContext),
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

// Build enhanced system prompt with user's complete financial profile
function buildSystemPrompt(creditScore, creditAnalysisDate, userContext) {
  let basePrompt = 'You are TaxSage AI, a helpful Chartered Accountant and financial advisor specializing in Indian tax laws, loan eligibility, and financial planning.\n\nWhen users ask for roadmaps, plans, or strategies for financial goals (like buying something, saving, investing), provide detailed step-by-step actionable plans with specific timelines, amounts, and tax-saving strategies.';
  
  // Add user's complete financial profile if available
  if (userContext && userContext.profile) {
    const { profile, income, expenses, budget, goals, user } = userContext;
    
    basePrompt += '\n\n=== YOUR CLIENT\'S COMPLETE FINANCIAL PROFILE ===\n';
    
    // Personal Information
    basePrompt += `\nPERSONAL DETAILS:`;
    basePrompt += `\n- Name: ${profile.fullName || user?.name || 'Not provided'}`;
    basePrompt += `\n- Age: ${profile.age || 'Not provided'}`;
    basePrompt += `\n- Location: ${profile.location || 'Not provided'}`;
    basePrompt += `\n- Filing Status: ${profile.filingStatus || 'Not provided'}`;
    basePrompt += `\n- Dependents: ${profile.dependents || 'Not provided'}`;
    
    // Credit Score Information
    if (profile.creditScore) {
      basePrompt += `\n\nCREDIT PROFILE:`;
      basePrompt += `\n- Credit Score: ${profile.creditScore} (${profile.creditBand || 'Unknown'} category)`;
      basePrompt += `\n- Credit Provider: ${profile.creditProvider || 'Unknown'}`;
      if (profile.creditRetrievedAt) {
        basePrompt += `\n- Last Updated: ${new Date(profile.creditRetrievedAt).toLocaleDateString()}`;
      }
    }
    
    // Income Information
    if (income && income.length > 0) {
      basePrompt += `\n\nINCOME SOURCES:`;
      let totalMonthlyIncome = 0;
      income.forEach(inc => {
        basePrompt += `\n- ${inc.source}: ₹${inc.amount.toLocaleString()} (${inc.frequency})`;
        // Convert to monthly for total calculation
        const monthlyAmount = inc.frequency === 'monthly' ? inc.amount : 
                             inc.frequency === 'annual' ? inc.amount / 12 : inc.amount;
        totalMonthlyIncome += monthlyAmount;
      });
      basePrompt += `\n- TOTAL ESTIMATED MONTHLY INCOME: ₹${totalMonthlyIncome.toLocaleString()}`;
    }
    
    // Recent Expenses
    if (expenses && expenses.length > 0) {
      basePrompt += `\n\nRECENT EXPENSES:`;
      const recentExpenses = expenses.slice(-10); // Last 10 expenses
      let totalExpenses = 0;
      const categorySums = {};
      
      recentExpenses.forEach(exp => {
        totalExpenses += exp.amount;
        categorySums[exp.category] = (categorySums[exp.category] || 0) + exp.amount;
        basePrompt += `\n- ${exp.category}: ₹${exp.amount.toLocaleString()} (${exp.description || 'No description'})`;
      });
      
      basePrompt += `\n- RECENT TOTAL: ₹${totalExpenses.toLocaleString()}`;
      
      // Top expense categories
      const topCategories = Object.entries(categorySums)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      if (topCategories.length > 0) {
        basePrompt += `\n- TOP SPENDING CATEGORIES: ${topCategories.map(([cat, amt]) => `${cat} (₹${amt.toLocaleString()})`).join(', ')}`;
      }
    }
    
    // Budget Allocations
    if (budget && budget.length > 0) {
      basePrompt += `\n\nMONTHLY BUDGET PLAN:`;
      let totalBudget = 0;
      budget.forEach(allocation => {
        totalBudget += allocation.monthlyAmount;
        basePrompt += `\n- ${allocation.category}: ₹${allocation.monthlyAmount.toLocaleString()}/month`;
      });
      basePrompt += `\n- TOTAL MONTHLY BUDGET: ₹${totalBudget.toLocaleString()}`;
    }
    
    // Financial Goals
    if (goals && goals.length > 0) {
      basePrompt += `\n\nFINANCIAL GOALS:`;
      goals.forEach(goal => {
        const targetDate = new Date(goal.targetDate);
        const monthsToGoal = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30));
        const monthlyRequired = monthsToGoal > 0 ? (goal.targetAmount / monthsToGoal) : 0;
        
        basePrompt += `\n- ${goal.name}: ₹${goal.targetAmount.toLocaleString()} by ${targetDate.toLocaleDateString()}`;
        if (monthsToGoal > 0) {
          basePrompt += ` (Need to save ₹${monthlyRequired.toLocaleString()}/month)`;
        }
      });
    }
    
    basePrompt += '\n\n=== END OF CLIENT PROFILE ===\n';
    basePrompt += '\nIMPORTANT: You now have complete access to your client\'s financial situation. Use this detailed information to provide highly personalized advice. Reference specific numbers, goals, and spending patterns when giving recommendations. Act like a real CA who knows their client intimately.';
  } else {
    // No user context available
    basePrompt += '\n\nIMPORTANT: Your client has not completed their financial profile yet. For personalized advice, encourage them to complete their onboarding process by providing their income, expenses, budget, and financial goals.';
  }
  
  // Credit score specific advice (existing logic)
  if (creditScore && creditScore !== 'null') {
    const score = parseInt(creditScore);
    let band = 'Poor';
    if (score >= 750) band = 'Excellent';
    else if (score >= 720) band = 'Very Good';  
    else if (score >= 680) band = 'Good';
    else if (score >= 650) band = 'Fair';
    
    const analysisDate = creditAnalysisDate ? new Date(creditAnalysisDate).toLocaleDateString() : 'recently';
    
    basePrompt += `\n\nCREDIT SCORE ANALYSIS: Your client analyzed their credit score (${analysisDate}). Current score: ${score} (${band} category). Use this for loan eligibility advice.`;
    
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
    basePrompt += `\n\nCREDIT ANALYSIS: Your client has not analyzed their credit score yet. For loan-related queries, direct them to the Credit Analysis page to check their credit score using Aadhaar and PAN.`;
  }
  
  basePrompt += '\n\nProvide practical, actionable advice considering Indian financial regulations, tax laws (Sections 80C, 80D, 24b, etc.), and current market conditions. Always mention TaxSage when appropriate. Reference their specific financial data when giving advice.';
  
  return basePrompt;
}

// Add a GET handler just to confirm the route is working
export async function GET() {
  return NextResponse.json({ status: 'Chat API is online' });
}
