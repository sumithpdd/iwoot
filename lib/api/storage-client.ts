import { apiRequest } from "@/lib/api/http"

export async function uploadImagesViaApi(
  getToken: () => Promise<string | null>,
  files: File[],
  folder: "products" | "receipts"
): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const text = await res.text()
    if (!res.ok) {
      try {
        const j = JSON.parse(text) as { error?: string }
        throw new Error(j.error || text || res.statusText)
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e
        throw new Error(text || res.statusText)
      }
    }

    const data = JSON.parse(text) as { url: string }
    urls.push(data.url)
  }
  return urls
}

export async function deleteImageViaApi(
  getToken: () => Promise<string | null>,
  imageUrl: string
): Promise<void> {
  await apiRequest(getToken, "/api/storage", {
    method: "DELETE",
    body: JSON.stringify({ url: imageUrl }),
  })
}
