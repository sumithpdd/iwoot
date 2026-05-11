import { NextResponse } from "next/server"
import { getUidFromRequest, unauthorized } from "@/lib/server/require-auth"
import { getAdminFirestore } from "@/lib/server/firebase-admin"

export async function GET(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const db = getAdminFirestore()
  const snapshot = await db.collection("users").get()
  const users = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
  return NextResponse.json(users)
}
