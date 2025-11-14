import { NextResponse } from "next/server"
import { getRepo, type IncomeEntry } from "@/lib/repository"
import { getSessionUserId, newId } from "@/lib/auth"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const items: Omit<IncomeEntry, "id" | "userId">[] = await req.json()
  const repo = getRepo()
  
  // Save to local repository (existing behavior)
  for (const it of items) {
    await repo.addIncome({ id: newId(), userId, ...it })
  }
  
  // Also save to Google Sheets
  try {
    await googleSheetsService.addMultipleIncomeEntries(userId, items)
    console.log('Successfully saved income to Google Sheets')
  } catch (error) {
    console.error('Error saving income to Google Sheets:', error)
    // Don't fail the request if Google Sheets fails
  }
  
  return NextResponse.json({ ok: true })
}
