import { create } from 'zustand'

/**
 * ORION Global State Store
 * Manages application state using Zustand
 */
const useStore = create((set, get) => ({
    // ============================================
    // Navigation State
    // ============================================
    activeView: 'chat', // 'chat' | 'documents' | 'settings'
    setActiveView: (view) => set({ activeView: view }),

    // ============================================
    // Sidebar State
    // ============================================
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    // ============================================
    // Context Panel State
    // ============================================
    isContextPanelOpen: false,
    toggleContextPanel: () => set((state) => ({ isContextPanelOpen: !state.isContextPanelOpen })),
    setContextPanelOpen: (open) => set({ isContextPanelOpen: open }),

    // ============================================
    // Backend Connection State
    // ============================================
    backendStatus: 'checking', // 'connected' | 'disconnected' | 'checking'
    setBackendStatus: (status) => set({ backendStatus: status }),

    // ============================================
    // System Info
    // ============================================
    systemInfo: {
        totalChunks: 0,
        totalDocuments: 0,
        llmModel: 'Unknown',
        llmAvailable: false,
        visionModel: 'Unknown',
        visionAvailable: false,
    },
    setSystemInfo: (info) => set((state) => ({
        systemInfo: { ...state.systemInfo, ...info }
    })),

    // ============================================
    // Collections & Documents
    // ============================================
    collections: [],
    setCollections: (collections) => set({ collections }),

    activeCollection: 'all', // Current collection context for viewing/uploading
    setActiveCollection: (collection) => set({ activeCollection: collection }),

    documents: [],
    setDocuments: (documents) => set({ documents }),

    // ============================================
    // Chat State
    // ============================================
    chatHistory: [],
    currentChatId: null,
    isStreaming: false,

    // Recent chat sessions for sidebar
    recentChats: [],

    setRecentChats: (chats) => set({ recentChats: chats }),

    // Current conversation messages
    messages: [],

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, id: Date.now(), timestamp: new Date() }]
    })),

    updateLastMessage: (content) => set((state) => {
        const messages = [...state.messages]
        if (messages.length > 0) {
            messages[messages.length - 1].content = content
        }
        return { messages }
    }),

    appendToLastMessage: (token) => set((state) => {
        const messages = [...state.messages]
        if (messages.length > 0) {
            messages[messages.length - 1].content += token
        }
        return { messages }
    }),

    setStreaming: (isStreaming) => set({ isStreaming }),

    clearMessages: () => set({ messages: [], currentChatId: null }),

    // Chat Actions
    loadRecentChats: async (api) => {
        try {
            const sessions = await api.getSessions()
            set({ recentChats: sessions })
        } catch (err) {
            console.error('Failed to load sessions:', err)
        }
    },

    loadChatSession: async (api, sessionId) => {
        try {
            // Load messages
            const messages = await api.getSessionMessages(sessionId)
            set({
                currentChatId: sessionId,
                messages: messages.map(m => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: m.created_at,
                    sources: m.metadata?.sources || []
                }))
            })
        } catch (err) {
            console.error('Failed to load session:', err)
        }
    },

    startNewChat: async (api) => {
        try {
            const session = await api.createSession("New Chat")
            set((state) => ({
                currentChatId: session.id,
                messages: [],
                recentChats: [session, ...state.recentChats]
            }))
            return session.id
        } catch (err) {
            console.error('Failed to create session:', err)
            // Fallback for offline mode
            const tempId = Date.now().toString()
            set({ currentChatId: tempId, messages: [] })
            return tempId
        }
    },

    deleteChatSession: async (api, sessionId) => {
        try {
            await api.deleteSession(sessionId)
            set(state => ({
                recentChats: state.recentChats.filter(c => c.id !== sessionId),
                // If deleting current chat, clear it
                ...(state.currentChatId === sessionId ? { currentChatId: null, messages: [] } : {})
            }))
        } catch (err) {
            console.error('Failed to delete session:', err)
        }
    },

    // ============================================
    // Ingestion State
    // ============================================
    isIngestionOpen: false,
    toggleIngestion: () => set((state) => ({ isIngestionOpen: !state.isIngestionOpen })),
    setIngestionOpen: (open) => set({ isIngestionOpen: open }),

    ingestionQueue: [],
    addToIngestionQueue: (files) => set((state) => ({
        ingestionQueue: [...state.ingestionQueue, ...files.map(f => ({
            id: Date.now() + Math.random(),
            file: f,
            name: f.name,
            size: f.size,
            type: f.type,
            status: 'queued' // 'queued' | 'processing' | 'done' | 'error'
        }))]
    })),

    removeFromIngestionQueue: (id) => set((state) => ({
        ingestionQueue: state.ingestionQueue.filter(f => f.id !== id)
    })),

    clearIngestionQueue: () => set({ ingestionQueue: [] }),

    updateIngestionStatus: (id, status) => set((state) => ({
        ingestionQueue: state.ingestionQueue.map(f =>
            f.id === id ? { ...f, status } : f
        )
    })),

    isIngesting: false,
    ingestionProgress: 0,
    setIngesting: (isIngesting, progress = 0) => set({ isIngesting, ingestionProgress: progress }),

    // ============================================
    // Settings State
    // ============================================
    settings: {
        llmModel: 'mistral',
        visionModel: 'llava',
        chunkSize: 512,
        ollamaEndpoint: 'http://localhost:11434',
    },
    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    // ============================================
    // Active Document Context
    // ============================================
    activeDocument: null,
    setActiveDocument: (doc) => set({ activeDocument: doc }),
    activeSources: [],
    setActiveSources: (sources) => set({ activeSources: sources }),

    // ============================================
    // Query Filters (for collection-scoped searches)
    // ============================================
    selectedCollections: [], // Collections to filter queries to
    setSelectedCollections: (collections) => set({ selectedCollections: collections }),
    toggleCollectionFilter: (collection) => set((state) => {
        const isSelected = state.selectedCollections.includes(collection)
        return {
            selectedCollections: isSelected
                ? state.selectedCollections.filter(c => c !== collection)
                : [...state.selectedCollections, collection]
        }
    }),
    clearCollectionFilters: () => set({ selectedCollections: [] }),
}))

export default useStore
