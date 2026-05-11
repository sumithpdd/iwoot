/**
 * Strip tags for search, previews, and clipboard plain text.
 */
export function htmlToPlainText(html: string): string {
  if (!html?.trim()) return ""
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
