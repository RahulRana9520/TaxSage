import { NextResponse } from "next/server"
import { getRepo, type Goal } from "@/lib/repository"
import { getSessionUserId, newId } from "@/lib/auth"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const items: { name: string; targetAmount: number; targetDate: string }[] = await req.json()
  const repo = getRepo()
  
  // Save to local repository (existing behavior)
  const goals: Goal[] = items.map((g) => ({ id: newId(), userId, ...g }))
  await repo.setGoals(userId, goals)
  
  // Also save to Google Sheets
  try {
    await googleSheetsService.addMultipleGoalEntries(userId, items)
    console.log('Successfully saved goals to Google Sheets')
  } catch (error) {
    console.error('Error saving goals to Google Sheets:', error)
    // Don't fail the request if Google Sheets fails
  }
  
  return NextResponse.json({ ok: true })
}
