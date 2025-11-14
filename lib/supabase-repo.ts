import { createClient } from '@supabase/supabase-js'
import type { User, UserProfile, IncomeEntry, ExpenseEntry, BudgetAllocation, Goal, CARepository } from './repository'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export class SupabaseRepo implements CARepository {
  
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.log('User not found:', email)
      return null
    }
    
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      createdAt: data.created_at
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.log('User not found by ID:', id)
      return null
    }
    
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      createdAt: data.created_at
    }
  }

  async createUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .insert({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        name: user.name,
        created_at: user.createdAt
      })
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: profile.userId,
        full_name: profile.fullName,
        age: profile.age,
        location: profile.location,
        dependents: profile.dependents,
        filing_status: profile.filingStatus,
        credit_score: profile.creditScore,
        credit_band: profile.creditBand,
        credit_provider: profile.creditProvider,
        credit_retrieved_at: profile.creditRetrievedAt,
        credit_source: profile.creditSource
      })
    
    if (error) {
      throw new Error(`Failed to upsert profile: ${error.message}`)
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) return null
    
    return {
      userId: data.user_id,
      fullName: data.full_name,
      age: data.age,
      location: data.location,
      dependents: data.dependents,
      filingStatus: data.filing_status,
      creditScore: data.credit_score,
      creditBand: data.credit_band,
      creditProvider: data.credit_provider,
      creditRetrievedAt: data.credit_retrieved_at,
      creditSource: data.credit_source
    }
  }

  async addIncome(entry: IncomeEntry): Promise<void> {
    const { error } = await supabase
      .from('income_entries')
      .insert({
        id: entry.id,
        user_id: entry.userId,
        source: entry.source,
        amount: entry.amount,
        frequency: entry.frequency
      })
    
    if (error) {
      throw new Error(`Failed to add income: ${error.message}`)
    }
  }

  async listIncome(userId: string): Promise<IncomeEntry[]> {
    const { data, error } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !data) return []
    
    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      source: row.source,
      amount: row.amount,
      frequency: row.frequency
    }))
  }

  async addExpense(entry: ExpenseEntry): Promise<void> {
    const { error } = await supabase
      .from('expense_entries')
      .insert({
        id: entry.id,
        user_id: entry.userId,
        category: entry.category,
        amount: entry.amount,
        date: entry.date,
        description: entry.description,
        level: entry.level
      })
    
    if (error) {
      throw new Error(`Failed to add expense: ${error.message}`)
    }
  }

  async listExpenses(userId: string, monthISO?: string): Promise<ExpenseEntry[]> {
    let query = supabase
      .from('expense_entries')
      .select('*')
      .eq('user_id', userId)
    
    if (monthISO) {
      const [year, month] = monthISO.split('-')
      query = query
        .gte('date', `${year}-${month.padStart(2, '0')}-01`)
        .lt('date', `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01`)
    }
    
    const { data, error } = await query
    
    if (error || !data) return []
    
    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      category: row.category,
      amount: row.amount,
      date: row.date,
      description: row.description,
      level: row.level
    }))
  }

  async setBudget(userId: string, allocations: BudgetAllocation[]): Promise<void> {
    // Delete existing budget
    await supabase
      .from('budget_allocations')
      .delete()
      .eq('user_id', userId)
    
    // Insert new allocations
    const { error } = await supabase
      .from('budget_allocations')
      .insert(allocations.map(alloc => ({
        id: alloc.id,
        user_id: alloc.userId,
        category: alloc.category,
        monthly_amount: alloc.monthlyAmount
      })))
    
    if (error) {
      throw new Error(`Failed to set budget: ${error.message}`)
    }
  }

  async getBudget(userId: string): Promise<BudgetAllocation[]> {
    const { data, error } = await supabase
      .from('budget_allocations')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !data) return []
    
    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      category: row.category,
      monthlyAmount: row.monthly_amount
    }))
  }

  async setGoals(userId: string, goals: Goal[]): Promise<void> {
    // Delete existing goals
    await supabase
      .from('user_goals')
      .delete()
      .eq('user_id', userId)
    
    // Insert new goals
    const { error } = await supabase
      .from('user_goals')
      .insert(goals.map(goal => ({
        id: goal.id,
        user_id: goal.userId,
        name: goal.name,
        target_amount: goal.targetAmount,
        target_date: goal.targetDate
      })))
    
    if (error) {
      throw new Error(`Failed to set goals: ${error.message}`)
    }
  }

  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !data) return []
    
    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      targetAmount: row.target_amount,
      targetDate: row.target_date
    }))
  }
}