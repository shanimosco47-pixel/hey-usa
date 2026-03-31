// Simple retry with exponential backoff for transient network errors

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = baseDelayMs * 2 ** attempt
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}
