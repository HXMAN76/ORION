import { useEffect, useCallback } from 'react'
import useStore from './store/store'
import api from './services/api'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

// Layout Components
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import ContextPanel from './components/layout/ContextPanel'

// Views
import Dashboard from './views/Dashboard'
import QueryWorkspace from './views/QueryWorkspace'
import CollectionsManager from './views/CollectionsManager'
import SettingsView from './views/SettingsView'

// Feature Components
import IngestionPanel from './components/ingestion/IngestionPanel'

/**
 * ORION - Offline Multimodal Intelligence Workspace
 * "Mission Control" style desktop layout for research and knowledge exploration
 */
export default function App() {
  const {
    activeView,
    setActiveView,
    isContextPanelOpen,
    setBackendStatus,
    setSystemInfo,
    setCollections,
    setDocuments,
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
    'ctrl+,': () => setActiveView('settings'),
    'ctrl+i': () => toggleIngestion(),
    'ctrl+k': () => setActiveView('query'),
    'ctrl+d': () => setActiveView('dashboard'),
  })

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'query':
        return <QueryWorkspace />
      case 'collections':
        return <CollectionsManager />
      case 'settings':
        return <SettingsView />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-orion-bg-app">
      {/* Top Bar - Slim status bar */}
      <TopBar />

      {/* Main Three-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Navigation Sidebar */}
        <Sidebar />

        {/* Center: Main Workspace (Dynamic View) */}
        {renderView()}

        {/* Right: Context Panel (Collapsible) */}
        {isContextPanelOpen && <ContextPanel />}
      </div>

      {/* Modal Overlays */}
      <IngestionPanel />
    </div>
  )
}
