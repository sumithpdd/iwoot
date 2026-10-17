import { apiRequest } from "@/lib/api/http"

export async function uploadImagesViaApi(
  getToken: () => Promise<string | null>,
  files: File[],
  folder: "products" | "receipts",
  ids: { productId?: string; receiptId?: string }
): Promise<string[]> {
  if (!ids.productId && !ids.receiptId) {
    throw new Error("productId or receiptId is required")
  }
  const urls: string[] = []
  for (const file of files) {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    if (ids.productId) formData.append("productId", ids.productId)
    if (ids.receiptId) formData.append("receiptId", ids.receiptId)

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

/** Download all product photos as a zip (for Gumtree / marketplace uploads). */
export async function downloadProductPhotosZip(
  getToken: () => Promise<string | null>,
  productId: string,
  images?: { url: string; tags?: string[] }[]
): Promise<void> {
  const token = await getToken()
  if (!token) throw new Error("Not authenticated")

  const usePost = Array.isArray(images) && images.length > 0
  const res = await fetch(`/api/products/${encodeURIComponent(productId)}/photos/zip`, {
    method: usePost ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(usePost ? { "Content-Type": "application/json" } : {}),
    },
    body: usePost ? JSON.stringify({ images }) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    try {
      const j = JSON.parse(text) as { error?: string }
      throw new Error(j.error || text || res.statusText)
    } catch (e) {
      if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e
      throw new Error(text || res.statusText)
    }
  }

  const blob = await res.blob()
  const cd = res.headers.get("Content-Disposition") || ""
  const match = cd.match(/filename="([^"]+)"/)
  const filename = match?.[1] || "product-photos.zip"

  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
