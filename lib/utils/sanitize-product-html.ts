import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize stored product description HTML for safe rendering.
 */
export function sanitizeProductHtml(html: string): string {
  if (!html?.trim()) return ""
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "del",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
      "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  })
}
