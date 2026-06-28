import type { ApiError, ApiResponse } from './types'

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL || '/api'
}

class ApiClient {
  baseUrl: string
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  /**
   * Register a callback for 401 Unauthorized responses.
   * Used to clear session and redirect to login when the token expires.
   */
  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.baseUrl || getBaseUrl()
    const url = `${baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      }

      // Handle 401 — token expired or invalid
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized()
      }

      throw error
    }

    const data: ApiResponse<T> = await response.json()
    return data.data
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
}

export const api = new ApiClient(getBaseUrl())
