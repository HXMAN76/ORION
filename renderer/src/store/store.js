import { create } from 'zustand'

const useStore = create((set, get) => ({
    // Backend Status
    backendStatus: 'checking', // 'checking' | 'connected' | 'disconnected'
    setBackendStatus: (status) => set({ backendStatus: status }),

    // System Info (from /api/stats and /api/models/status)
    systemInfo: {
        llmModel: null,
        embeddingModel: null,
        vectorDbStatus: null,
        totalChunks: 0,
        totalDocuments: 0,
    },
    setSystemInfo: (info) => set({ systemInfo: { ...get().systemInfo, ...info } }),

    // Collections (from /api/collections - returns array of strings)
    collections: [],
    setCollections: (collections) => {
        // Backend returns array of collection names as strings
        const formatted = Array.isArray(collections)
            ? collections.map((name, idx) =>
                typeof name === 'string' ? { id: name, name } : name
            )
            : []
        set({ collections: formatted })
    },
    activeCollection: null,
    setActiveCollection: (id) => set({ activeCollection: id }),

    // Documents (from /api/documents)
    documents: [],
    setDocuments: (documents) => {
        // Backend returns DocumentInfo objects
        const formatted = documents.map(doc => ({
            id: doc.document_id,
            name: doc.source_file,
            type: doc.doc_type,
            collectionId: doc.collections?.[0] || 'uncategorized',
            collections: doc.collections || [],
            status: 'indexed'
        }))
        set({ documents: formatted })
    },

    // Query Sessions
    sessions: [],
    addSession: (session) => set((state) => ({
        sessions: [...state.sessions, {
            id: Date.now(),
            query: session.query,
            response: '',
            sources: [],
            isStreaming: false,
            timestamp: new Date().toISOString(),
            ...session
        }]
    })),
    updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => {
            if (s.id !== id) return s
            // Handle function updates for response
            const newUpdates = { ...updates }
            if (typeof updates.response === 'function') {
                newUpdates.response = updates.response(s.response)
            }
            return { ...s, ...newUpdates }
        })
    })),
    clearSessions: () => set({ sessions: [] }),

    // Active Sources (right panel)
    activeSources: [],
    setActiveSources: (sources) => {
        // Format sources from backend
        const formatted = sources.map((source, idx) => ({
            id: source.id || idx,
            document: source.source_file || source.document || 'Unknown',
            page: source.page_number,
            chunk: source.chunk_index,
            content: source.content || source.text || '',
            confidence: source.similarity || source.confidence || 0.5,
            ...source
        }))
        set({ activeSources: formatted })
    },

    // Processing Queue
    processingQueue: [],
    addToQueue: (item) => set((state) => ({
        processingQueue: [...state.processingQueue, {
            id: Date.now(),
            file: item.file,
            stage: 'reading', // reading | ocr | chunking | embedding | indexed | error
            progress: 0,
            ...item
        }]
    })),
    updateQueueItem: (id, updates) => set((state) => ({
        processingQueue: state.processingQueue.map(item =>
            item.id === id ? { ...item, ...updates } : item
        )
    })),
    removeFromQueue: (id) => set((state) => ({
        processingQueue: state.processingQueue.filter(item => item.id !== id)
    })),
    clearQueue: () => set({ processingQueue: [] }),

    // Settings
    settings: {
        chunkSize: 512,
        overlapSize: 50,
        topK: 5,
        enableVision: true,
        enableAudio: true,
    },
    updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
    })),

    // UI State
    isSettingsOpen: false,
    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

    isIngestionOpen: false,
    toggleIngestion: () => set((state) => ({ isIngestionOpen: !state.isIngestionOpen })),
}))

export default useStore
