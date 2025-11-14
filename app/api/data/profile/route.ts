import { NextResponse } from "next/server"
import { getRepo } from "@/lib/repository"
import { getSessionUserId } from "@/lib/auth"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await req.json()
  const repo = getRepo()
  
  // Save to local repository (existing behavior)
  await repo.upsertProfile({ userId, ...body })
  
  // Also save to Google Sheets
  try {
    await googleSheetsService.updateUserProfile(userId, body)
    console.log('Successfully saved profile to Google Sheets')
  } catch (error) {
    console.error('Error saving profile to Google Sheets:', error)
    // Don't fail the request if Google Sheets fails
  }
  
  return NextResponse.json({ ok: true })
}
