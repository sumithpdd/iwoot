/**
 * Google Gemini model id for AI SDK (`@ai-sdk/google`).
 * `gemini-2.5-flash` is blocked for many new API keys — prefer the latest flash alias.
 */
export function getGeminiModelId(): string {
  const fromEnv =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() ||
    ""
  if (fromEnv === "gemini-2.5-flash" || fromEnv === "gemini-2.5-flash-lite") {
    return "gemini-flash-latest"
  }
  return fromEnv || "gemini-flash-latest"
}
