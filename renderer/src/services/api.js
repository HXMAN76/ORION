/**
 * ORION API Client
 * Handles all communication with the Python FastAPI backend
 */

const DEFAULT_BASE_URL = 'http://172.20.10.3:8000'

class ApiClient {
    constructor(baseUrl = DEFAULT_BASE_URL) {
        this.baseUrl = baseUrl
    }

    /**
     * Set the base URL dynamically (useful for runtime port configuration)
     */
    setBaseUrl(url) {
        this.baseUrl = url
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
            }

            // Handle empty responses
            const text = await response.text()
            return text ? JSON.parse(text) : null
        } catch (error) {
            // Handle network errors gracefully (backend not started yet)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Backend not available. Please wait for the server to start.')
            }
            throw error
        }
    }

    // ============================================
    // Health & Status Endpoints
    // ============================================

    /**
     * Check if backend is healthy
     */
    async checkHealth() {
        try {
            await this.request('/health')
            return true
        } catch {
            return false
        }
    }

    /**
     * Get system statistics
     */
    async getStats() {
        return this.request('/stats')
    }

    /**
     * Get model status (LLM and Vision)
     */
    async getModelStatus() {
        return this.request('/models/status')
    }

    // ============================================
    // Query Endpoints
    // ============================================

    /**
     * Send a query and get a response (non-streaming)
     */
    async query(queryText, options = {}) {
        return this.request('/query', {
            method: 'POST',
            body: JSON.stringify({
                query: queryText,
                collection: options.collection || 'default',
                top_k: options.topK || 5,
                include_sources: options.includeSources !== false,
            }),
        })
    }

    /**
     * Send a query with streaming response
     * Returns an async generator that yields tokens
     */
    async *queryStream(queryText, options = {}) {
        const url = `${this.baseUrl}/query/stream`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: queryText,
                collection: options.collection || 'default',
                top_k: options.topK || 5,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') return

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.token) {
                                yield { type: 'token', content: parsed.token }
                            }
                            if (parsed.sources) {
                                yield { type: 'sources', content: parsed.sources }
                            }
                        } catch {
                            // Raw token
                            yield { type: 'token', content: data }
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    // ============================================
    // Collection Endpoints
    // ============================================

    /**
     * Get all collections
     */
    async getCollections() {
        return this.request('/collections')
    }

    /**
     * Create a new collection
     */
    async createCollection(name, description = '') {
        return this.request('/collections', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        })
    }

    /**
     * Delete a collection
     */
    async deleteCollection(name) {
        return this.request(`/collections/${name}`, {
            method: 'DELETE',
        })
    }

    // ============================================
    // Document Endpoints
    // ============================================

    /**
     * Get all documents
     */
    async getDocuments(collection = null) {
        const endpoint = collection ? `/documents?collection=${collection}` : '/documents'
        return this.request(endpoint)
    }

    /**
     * Delete a document
     */
    async deleteDocument(docId) {
        return this.request(`/documents/${docId}`, {
            method: 'DELETE',
        })
    }

    // ============================================
    // Ingestion Endpoints
    // ============================================

    /**
     * Ingest files (upload and process)
     */
    async ingestFiles(files, collection = 'default') {
        const formData = new FormData()

        for (const file of files) {
            formData.append('files', file)
        }
        formData.append('collection', collection)

        const response = await fetch(`${this.baseUrl}/ingest`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `HTTP ${response.status}`)
        }

        return response.json()
    }

    /**
     * Get ingestion status
     */
    async getIngestionStatus(taskId) {
        return this.request(`/ingest/status/${taskId}`)
    }

    /**
     * Poll ingestion status until complete
     */
    async waitForIngestion(taskId, onProgress = null, pollInterval = 1000) {
        while (true) {
            const status = await this.getIngestionStatus(taskId)

            if (onProgress) {
                onProgress(status)
            }

            if (status.status === 'completed' || status.status === 'failed') {
                return status
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
    }
}

// Create and export singleton instance
const api = new ApiClient()
export default api

// Also export the class for testing/custom instances
export { ApiClient }
