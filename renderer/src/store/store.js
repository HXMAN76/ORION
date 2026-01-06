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

    documents: [],
    setDocuments: (documents) => set({ documents }),

    // ============================================
    // Chat State
    // ============================================
    chatHistory: [],
    currentChatId: null,
    isStreaming: false,

    // Recent chat sessions for sidebar
    recentChats: [
        { id: '1', title: 'Research on Neural Networks', timestamp: new Date() },
        { id: '2', title: 'Document Analysis Query', timestamp: new Date() },
        { id: '3', title: 'Image Classification Help', timestamp: new Date() },
    ],

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

    startNewChat: () => {
        const newChatId = Date.now().toString()
        set((state) => ({
            messages: [],
            currentChatId: newChatId,
            recentChats: [
                { id: newChatId, title: 'New Chat', timestamp: new Date() },
                ...state.recentChats.slice(0, 9) // Keep last 10
            ]
        }))
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
