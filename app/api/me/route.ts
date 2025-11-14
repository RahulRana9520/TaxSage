import { NextResponse } from "next/server"
import { getRepo } from "@/lib/repository"
import { getSessionUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    console.log("Session check:", { userId: userId ? "exists" : "none" })
    
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    const repo = getRepo()
    // Get user details first
    const user = await repo.getUserById(userId)
    
    // fetch any data you want to show on client
    const profile = await repo.getProfile(userId)
    const budget = await repo.getBudget(userId)
    const goals = await repo.getGoals(userId)
    const income = await repo.listIncome(userId)
    
    console.log("User data:", { 
      userId, 
      hasProfile: !!profile, 
      profileName: profile?.fullName,
      hasUser: !!user 
    })
    
    return NextResponse.json({ 
      user: { 
        id: userId, 
        name: profile?.fullName || user?.name || user?.email?.split('@')[0] || 'User',
        email: user?.email 
      }, 
      profile, 
      budget, 
      goals, 
      income 
    })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
