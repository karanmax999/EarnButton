/**
 * API Client for Agent Dashboard
 * 
 * Provides a fetch wrapper with error handling, retry logic, and timeout management.
 * All agent dashboard API calls should use this client for consistent error handling.
 */

interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface FetchResponse<T> {
  data: T | null
  error: Error | null
  status: number
}

/**
 * Default configuration for API client
 */
const DEFAULT_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
}

/**
 * Exponential backoff calculator
 * 
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt)
}

/**
 * Sleep utility for delays
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch with timeout
 * 
 * @param {string} url - URL to fetch
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If timeout is exceeded
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const timeout = options.timeout || DEFAULT_CONFIG.timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Fetch with retry logic
 * 
 * @param {string} url - URL to fetch
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If all retries fail
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const retries = options.retries || DEFAULT_CONFIG.retries
  const retryDelay = options.retryDelay || DEFAULT_CONFIG.retryDelay

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry on server errors (5xx) and network errors
      if (response.status >= 500) {
        if (attempt < retries) {
          const delay = calculateBackoff(attempt, retryDelay)
          await sleep(delay)
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on timeout if it's the last attempt
      if (attempt < retries) {
        const delay = calculateBackoff(attempt, retryDelay)
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries')
}

/**
 * API Client - Main fetch wrapper
 * 
 * Provides error handling, retry logic, and timeout management.
 * 
 * @template T - Response data type
 * @param {string} url - URL to fetch
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<FetchResponse<T>>} Response with data or error
 * 
 * @example
 * const { data, error } = await apiClient<MyData>('/api/endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 * })
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  try {
    const response = await fetchWithRetry(url, options)

    // Handle error responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      return {
        data: null,
        error: new Error(errorMessage),
        status: response.status,
      }
    }

    // Parse response
    let data: T

    try {
      data = await response.json()
    } catch {
      return {
        data: null,
        error: new Error('Failed to parse response JSON'),
        status: response.status,
      }
    }

    return {
      data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      data: null,
      error: new Error(errorMessage),
      status: 0,
    }
  }
}

/**
 * POST request helper
 * 
 * @template T - Response data type
 * @param {string} url - URL to POST to
 * @param {any} body - Request body
 * @param {FetchOptions} options - Additional fetch options
 * @returns {Promise<FetchResponse<T>>} Response with data or error
 */
export async function apiPost<T = any>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * GET request helper
 * 
 * @template T - Response data type
 * @param {string} url - URL to GET from
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<FetchResponse<T>>} Response with data or error
 */
export async function apiGet<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'GET',
  })
}

/**
 * PUT request helper
 * 
 * @template T - Response data type
 * @param {string} url - URL to PUT to
 * @param {any} body - Request body
 * @param {FetchOptions} options - Additional fetch options
 * @returns {Promise<FetchResponse<T>>} Response with data or error
 */
export async function apiPut<T = any>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request helper
 * 
 * @template T - Response data type
 * @param {string} url - URL to DELETE
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<FetchResponse<T>>} Response with data or error
 */
export async function apiDelete<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'DELETE',
  })
}
