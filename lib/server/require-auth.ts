import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/server/firebase-admin"

export type RequestAuthContext = {
  uid: string
  email: string | undefined
}

export async function getAuthContext(
  request: Request
): Promise<RequestAuthContext | null> {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7)
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "development") {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : ""
      const message = err instanceof Error ? err.message : String(err)
      const hint =
        code === "app/invalid-app-options"
          ? "Usually: wrong service account for this Firebase project, bad private_key newlines in FIREBASE_SERVICE_ACCOUNT_JSON, or project_id mismatch with NEXT_PUBLIC_FIREBASE_PROJECT_ID. Prefer FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json from the same project as your web app."
          : "Check FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_SERVICE_ACCOUNT_PATH matches NEXT_PUBLIC_FIREBASE_PROJECT_ID."
      console.warn("[require-auth] verifyIdToken failed:", code || message, hint)
    }
    return null
  }
}

export async function getUidFromRequest(request: Request): Promise<string | null> {
  const ctx = await getAuthContext(request)
  return ctx?.uid ?? null
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 })
}
