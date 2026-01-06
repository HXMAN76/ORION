import { useState, useCallback } from 'react'
import { Upload, FolderOpen, X, Plus } from 'lucide-react'
import useStore from '../../store/store'
import ipc from '../../services/ipc'
import api from '../../services/api'
import IngestionPipeline from './IngestionPipeline'

/**
 * Ingestion Panel - Desktop-native file ingestion flow
 * Drag & drop from OS, file picker via Electron dialog
 */
export default function IngestionPanel() {
    const {
        isIngestionOpen,
        toggleIngestion,
        collections,
        processingQueue,
        addToQueue,
        updateQueueItem,
        removeFromQueue
    } = useStore()

    const [isDragging, setIsDragging] = useState(false)
    const [selectedCollection, setSelectedCollection] = useState('')
    const [files, setFiles] = useState([])
    const [isIngesting, setIsIngesting] = useState(false)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(prev => [...prev, ...droppedFiles])
    }, [])

    const handleFileSelect = async () => {
        // Try Electron dialog first
        if (ipc.isElectron()) {
            const result = await ipc.openFileDialog()
            if (!result.canceled && result.filePaths.length > 0) {
                // For Electron, we get file paths - create File-like objects
                const newFiles = result.filePaths.map(path => ({
                    name: path.split(/[/\\]/).pop(),
                    path,
                    isPath: true
                }))
                setFiles(prev => [...prev, ...newFiles])
            }
        } else {
            // Browser fallback - use input element
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = '.pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.bmp,.mp3,.wav,.m4a,.ogg,.flac'
            input.onchange = (e) => {
                const newFiles = Array.from(e.target.files)
                setFiles(prev => [...prev, ...newFiles])
            }
            input.click()
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleIngest = async () => {
        if (files.length === 0 || isIngesting) return

        setIsIngesting(true)
        const collectionsToUse = selectedCollection ? [selectedCollection] : []

        // Process files one by one
        for (const file of files) {
            const queueId = Date.now() + Math.random()

            addToQueue({
                id: queueId,
                file: file.name,
                collection: selectedCollection
            })

            try {
                // Simulate stages for UX
                updateQueueItem(queueId, { stage: 'reading', progress: 20 })

                // Ingest the file
                await api.ingest(file, collectionsToUse)

                updateQueueItem(queueId, { stage: 'indexed', progress: 100 })

                // Remove from queue after success
                setTimeout(() => removeFromQueue(queueId), 2000)

            } catch (error) {
                updateQueueItem(queueId, {
                    stage: 'error',
                    progress: 0,
                    error: error.message
                })
            }
        }

        setFiles([])
        setIsIngesting(false)
    }

    if (!isIngestionOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[600px] max-h-[80vh] bg-orion-bg-panel rounded-xl border border-orion-border-DEFAULT shadow-2xl overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-5 py-4 border-b border-orion-border-DEFAULT">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orion-accent/20">
                            <Upload className="w-4 h-4 text-orion-accent" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-base font-semibold text-orion-text-primary">
                            Ingest Documents
                        </h2>
                    </div>
                    <button
                        onClick={toggleIngestion}
                        className="p-1.5 rounded hover:bg-orion-bg-hover transition-fast"
                    >
                        <X className="w-5 h-5 text-orion-text-muted" strokeWidth={1.5} />
                    </button>
                </header>

                {/* Content */}
                <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-orion">
                    {/* Collection Selector */}
                    <div>
                        <label className="block text-sm text-orion-text-secondary mb-2">
                            Target Collection (optional)
                        </label>
                        <select
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="w-full px-3 py-2.5 bg-orion-bg-card border border-orion-border-DEFAULT rounded-lg text-sm text-orion-text-primary outline-none focus:border-orion-accent transition-fast"
                        >
                            <option value="">No Collection</option>
                            {collections.map(coll => (
                                <option key={coll.id} value={coll.id}>
                                    {coll.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-fast
                            ${isDragging
                                ? 'border-orion-accent bg-orion-accent/10'
                                : 'border-orion-border-DEFAULT hover:border-orion-text-muted'
                            }`}
                    >
                        <FolderOpen className="w-10 h-10 text-orion-text-muted mb-3" strokeWidth={1.5} />
                        <p className="text-sm text-orion-text-secondary mb-1">
                            Drop files here or click to browse
                        </p>
                        <p className="mono text-xs text-orion-text-muted">
                            PDF, DOCX, Images, Audio files
                        </p>
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-orion-text-secondary">
                                Selected files ({files.length})
                            </p>
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 px-3 py-2.5 bg-orion-bg-card rounded-lg border border-orion-border-DEFAULT"
                                >
                                    <span className="flex-1 text-sm text-orion-text-primary truncate">
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 rounded hover:bg-orion-bg-hover transition-fast"
                                    >
                                        <X className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Processing Queue */}
                    {processingQueue.length > 0 && (
                        <IngestionPipeline queue={processingQueue} />
                    )}
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-end gap-3 px-5 py-4 border-t border-orion-border-DEFAULT bg-orion-bg-card">
                    <button
                        onClick={toggleIngestion}
                        className="btn-ghost text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleIngest}
                        disabled={files.length === 0 || isIngesting}
                        className="btn-primary text-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        {isIngesting ? 'Ingesting...' : `Ingest ${files.length > 0 ? `(${files.length})` : ''}`}
                    </button>
                </footer>
            </div>
        </div>
    )
}

