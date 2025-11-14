import { NextResponse } from "next/server"
import { getRepo, type BudgetAllocation } from "@/lib/repository"
import { getSessionUserId, newId } from "@/lib/auth"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const items: { category: string; monthlyAmount: number }[] = await req.json()
  const repo = getRepo()
  
  // Save to local repository (existing behavior)
  const allocations: BudgetAllocation[] = items.map((b) => ({
    id: newId(),
    userId,
    category: b.category,
    monthlyAmount: b.monthlyAmount,
  }))
  await repo.setBudget(userId, allocations)
  
  // Also save to Google Sheets
  try {
    await googleSheetsService.addMultipleBudgetEntries(userId, items)
    console.log('Successfully saved budget to Google Sheets')
  } catch (error) {
    console.error('Error saving budget to Google Sheets:', error)
    // Don't fail the request if Google Sheets fails
  }
  
  return NextResponse.json({ ok: true })
}
