const API_BASE = 'http://127.0.0.1:8000'

/**
 * API service for communicating with the FastAPI backend
 * Endpoints aligned with src/api/routes/
 */
export const api = {
    /**
     * Check backend health
     * GET /health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE}/health`)
            return response.ok
        } catch {
            return false
        }
    },

    /**
     * Get system stats (models, counts)
     * GET /api/stats
     */
    async getStats() {
        const response = await fetch(`${API_BASE}/api/stats`)
        if (!response.ok) throw new Error('Failed to fetch stats')
        return response.json()
    },

    /**
     * Get model status
     * GET /api/models/status
     */
    async getModelStatus() {
        const response = await fetch(`${API_BASE}/api/models/status`)
        if (!response.ok) throw new Error('Failed to fetch model status')
        return response.json()
    },

    /**
     * Get all collections
     * GET /api/collections
     */
    async getCollections() {
        const response = await fetch(`${API_BASE}/api/collections`)
        if (!response.ok) throw new Error('Failed to fetch collections')
        return response.json()
    },

    /**
     * Get documents in a collection
     * GET /api/collections/{collection}/documents
     */
    async getCollectionDocuments(collection) {
        const response = await fetch(`${API_BASE}/api/collections/${encodeURIComponent(collection)}/documents`)
        if (!response.ok) throw new Error('Failed to fetch collection documents')
        return response.json()
    },

    /**
     * Create a new collection
     * POST /api/collections?name={name}
     */
    async createCollection(name) {
        const response = await fetch(`${API_BASE}/api/collections?name=${encodeURIComponent(name)}`, {
            method: 'POST'
        })
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || 'Failed to create collection')
        }
        return response.json()
    },

    /**
     * Delete a collection
     * DELETE /api/collections/{collection_name}
     */
    async deleteCollection(collectionName) {
        const response = await fetch(`${API_BASE}/api/collections/${encodeURIComponent(collectionName)}`, {
            method: 'DELETE'
        })
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || 'Failed to delete collection')
        }
        return response.json()
    },

    /**
     * Add document to collection
     * POST /api/collections/add
     */
    async addToCollection(documentId, collection) {
        const response = await fetch(`${API_BASE}/api/collections/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId, collection })
        })
        if (!response.ok) throw new Error('Failed to add to collection')
        return response.json()
    },

    /**
     * Get all documents
     * GET /api/documents
     */
    async getDocuments() {
        const response = await fetch(`${API_BASE}/api/documents`)
        if (!response.ok) throw new Error('Failed to fetch documents')
        return response.json()
    },

    /**
     * Delete a document
     * DELETE /api/documents/{document_id}
     */
    async deleteDocument(documentId) {
        const response = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(documentId)}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete document')
        return response.json()
    },

    /**
     * Ingest a single file
     * POST /api/ingest
     */
    async ingest(file, collections = []) {
        const formData = new FormData()
        formData.append('file', file)
        if (collections.length > 0) {
            formData.append('collections', collections.join(','))
        }

        const response = await fetch(`${API_BASE}/api/ingest`, {
            method: 'POST',
            body: formData
        })
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || 'Failed to ingest file')
        }
        return response.json()
    },

    /**
     * Ingest multiple files
     * POST /api/ingest/batch
     */
    async ingestBatch(files, collections = []) {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        if (collections.length > 0) {
            formData.append('collections', collections.join(','))
        }

        const response = await fetch(`${API_BASE}/api/ingest/batch`, {
            method: 'POST',
            body: formData
        })
        if (!response.ok) throw new Error('Failed to ingest files')
        return response.json()
    },

    /**
     * Get supported file types
     * GET /api/ingest/supported
     */
    async getSupportedTypes() {
        const response = await fetch(`${API_BASE}/api/ingest/supported`)
        if (!response.ok) throw new Error('Failed to fetch supported types')
        return response.json()
    },

    /**
     * Query the knowledge base (non-streaming)
     * POST /api/query
     */
    async query(text, options = {}) {
        const response = await fetch(`${API_BASE}/api/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: text,
                top_k: options.topK || 5,
                collections: options.collections || [],
                doc_types: options.docTypes || []
            })
        })

        if (!response.ok) throw new Error('Query failed')
        return response.json()
    },

    /**
     * Query with streaming response
     * POST /api/query/stream
     */
    async queryStream(text, options = {}, onChunk) {
        const response = await fetch(`${API_BASE}/api/query/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: text,
                top_k: options.topK || 5,
                collections: options.collections || [],
                doc_types: options.docTypes || []
            })
        })

        if (!response.ok) throw new Error('Query failed')

        // Handle NDJSON streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let result = { answer: '', sources: [] }
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue
                try {
                    const data = JSON.parse(line)
                    if (data.type === 'chunk') {
                        result.answer += data.content
                        onChunk?.(data.content, 'chunk')
                    } else if (data.type === 'answer') {
                        result.answer = data.content
                        onChunk?.(data.content, 'answer')
                    } else if (data.type === 'sources') {
                        result.sources = data.sources
                        onChunk?.(data.sources, 'sources')
                    } else if (data.type === 'error') {
                        throw new Error(data.error)
                    } else if (data.type === 'done') {
                        break
                    }
                } catch (e) {
                    if (e.message !== 'done') {
                        console.warn('Failed to parse streaming chunk:', line)
                    }
                }
            }
        }

        return result
    },

    /**
     * Semantic search (without LLM generation)
     * POST /api/search
     */
    async search(query, options = {}) {
        const response = await fetch(`${API_BASE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                top_k: options.topK || 10,
                collections: options.collections || [],
                doc_types: options.docTypes || []
            })
        })
        if (!response.ok) throw new Error('Search failed')
        return response.json()
    }
}

export default api
