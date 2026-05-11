export async function apiRequest<T = unknown>(
  getToken: () => Promise<string | null>,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getToken()
  if (!token) {
    throw new Error("Not authenticated")
  }

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(path, { ...init, headers })
  const text = await res.text()

  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string }
      throw new Error(j.error || text || res.statusText)
    } catch (e) {
      if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
        throw e
      }
      throw new Error(text || res.statusText)
    }
  }

  if (!text || res.status === 204) {
    return undefined as T
  }

  return JSON.parse(text) as T
}
