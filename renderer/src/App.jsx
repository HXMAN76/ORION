import { useEffect, useCallback } from 'react'
import useStore from './store/store'
import api from './services/api'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

// Layout Components
import CommandBar from './components/layout/CommandBar'
import KnowledgeManager from './components/layout/KnowledgeManager'
import MainWorkspace from './components/layout/MainWorkspace'
import SourcesPanel from './components/layout/SourcesPanel'

// Feature Components
import IngestionPanel from './components/ingestion/IngestionPanel'
import SettingsDrawer from './components/settings/SettingsDrawer'

/**
 * ORION - Offline Multimodal Intelligence Workspace
 * Three-pane desktop layout for research and knowledge exploration
 */
export default function App() {
  const {
    setBackendStatus,
    setSystemInfo,
    setCollections,
    setDocuments,
    toggleSettings,
    toggleIngestion
  } = useStore()

  // Backend health check and data fetch
  const checkBackend = useCallback(async () => {
    try {
      const isHealthy = await api.checkHealth()
      setBackendStatus(isHealthy ? 'connected' : 'disconnected')

      if (isHealthy) {
        // Fetch stats
        try {
          const stats = await api.getStats()
          setSystemInfo({
            totalChunks: stats.total_chunks,
            totalDocuments: stats.total_documents,
            vectorDbStatus: 'Online'
          })
        } catch (e) {
          console.warn('Stats not available:', e.message)
        }

        // Fetch model status
        try {
          const modelStatus = await api.getModelStatus()
          setSystemInfo({
            llmModel: modelStatus.llm?.model || 'Unknown',
            llmAvailable: modelStatus.llm?.available
          })
        } catch (e) {
          console.warn('Model status not available:', e.message)
        }

        // Fetch collections
        try {
          const collections = await api.getCollections()
          setCollections(collections)
        } catch (e) {
          console.warn('Collections not available:', e.message)
        }

        // Fetch documents
        try {
          const documents = await api.getDocuments()
          setDocuments(documents)
        } catch (e) {
          console.warn('Documents not available:', e.message)
        }
      }
    } catch {
      setBackendStatus('disconnected')
    }
  }, [setBackendStatus, setSystemInfo, setCollections, setDocuments])

  // Initial check and polling
  useEffect(() => {
    checkBackend()
    const interval = setInterval(checkBackend, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [checkBackend])

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+,': () => toggleSettings(),
    'ctrl+i': () => toggleIngestion(),
    'ctrl+k': () => {
      // Focus search in knowledge manager
      const searchInput = document.querySelector('input[placeholder*="Search"]')
      searchInput?.focus()
    }
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-orion-bg-primary">
      {/* Top Command Bar */}
      <CommandBar />

      {/* Main Three-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Knowledge Manager */}
        <KnowledgeManager />

        {/* Center: Main Workspace */}
        <MainWorkspace />

        {/* Right: Sources Panel */}
        <SourcesPanel />
      </div>

      {/* Modal Overlays */}
      <IngestionPanel />
      <SettingsDrawer />
    </div>
  )
}
