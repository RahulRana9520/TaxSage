import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth'
import { getRepo } from '@/lib/repository'

export async function GET() {
  try {
    console.log('=== SESSION DEBUG ===')
    
    // Get session info
    const userId = await getSessionUserId()
    console.log('Session userId:', userId)
    
    if (!userId) {
      return NextResponse.json({
        error: 'No session found',
        userId: null,
        authenticated: false
      })
    }
    
    // Get repository and user data
    const repo = getRepo()
    console.log('Repository type:', repo.constructor.name)
    
    // Fetch user data
    const [user, profile, income, expenses, budget, goals] = await Promise.all([
      repo.getUserById(userId),
      repo.getProfile(userId),
      repo.listIncome(userId),
      repo.listExpenses(userId),
      repo.getBudget(userId),
      repo.getGoals(userId)
    ])
    
    console.log('Debug results:', {
      userId,
      hasUser: !!user,
      hasProfile: !!profile,
      profileData: profile,
      incomeCount: income?.length || 0,
      expenseCount: expenses?.length || 0,
      budgetCount: budget?.length || 0,
      goalCount: goals?.length || 0
    })
    
    return NextResponse.json({
      authenticated: true,
      userId,
      repositoryType: repo.constructor.name,
      data: {
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
        profile,
        incomeEntries: income?.length || 0,
        expenseEntries: expenses?.length || 0,
        budgetCategories: budget?.length || 0,
        goals: goals?.length || 0,
        sampleIncome: income?.slice(0, 2),
        sampleExpenses: expenses?.slice(0, 2)
      }
    })
    
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}