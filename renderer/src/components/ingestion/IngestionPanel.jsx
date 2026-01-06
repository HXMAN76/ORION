import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import useStore from '../../store/store'
import api from '../../services/api'
import DropZone from './DropZone'
import FileQueue from './FileQueue'

/**
 * IngestionPanel - Modal overlay for file upload and processing
 * Manages the full ingestion workflow with single and batch file uploads
 */
export default function IngestionPanel() {
    const {
        isIngestionOpen,
        setIngestionOpen,
        ingestionQueue,
        clearIngestionQueue,
        updateIngestionStatus,
        isIngesting,
        setIngesting,
        ingestionProgress,
        setDocuments,
        documents,
        activeCollection
    } = useStore()

    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [processedCount, setProcessedCount] = useState(0)

    if (!isIngestionOpen) return null

    const handleClose = () => {
        if (!isIngesting) {
            setIngestionOpen(false)
            setError(null)
            setSuccess(false)
            setProcessedCount(0)
        }
    }

    const handleProcess = async () => {
        if (ingestionQueue.length === 0) return

        setIngesting(true, 0)
        setError(null)
        setSuccess(false)
        setProcessedCount(0)

        const files = ingestionQueue.filter(f => f.status === 'queued')
        const totalFiles = files.length

        try {
            // Process files based on count
            if (totalFiles === 1) {
                // Single file - use single endpoint
                const item = files[0]
                updateIngestionStatus(item.id, 'processing')
                setIngesting(true, 50)

                try {
                    const collections = (activeCollection && activeCollection !== 'all') ? [activeCollection] : []
                    const response = await api.ingestFile(item.file, collections)
                    updateIngestionStatus(item.id, 'done')
                    setProcessedCount(1)

                    // Add to local documents state
                    const newDoc = {
                        id: response.document_id,
                        document_id: response.document_id,
                        name: response.filename,
                        source_file: response.filename,
                        doc_type: response.doc_type,
                        chunks: response.chunks_created,
                        collections: response.collections || [],
                        created_at: new Date().toISOString(),
                    }
                    setDocuments([...documents, newDoc])
                } catch (err) {
                    updateIngestionStatus(item.id, 'error')
                    throw err
                }
            } else {
                // Multiple files - use batch endpoint
                // Mark all as processing
                files.forEach((file) => {
                    updateIngestionStatus(file.id, 'processing')
                })

                // Extract actual File objects
                const fileObjects = files.map((item) => item.file)
                const collections = (activeCollection && activeCollection !== 'all') ? [activeCollection] : []

                const response = await api.ingestFiles(fileObjects, collections)

                // Update statuses based on response
                let successCount = 0

                if (response.results) {
                    response.results.forEach((result) => {
                        const item = files.find(f => f.name === result.file)
                        if (item) {
                            updateIngestionStatus(item.id, 'done')
                            successCount++

                            // Add to local documents state
                            const newDoc = {
                                id: result.document_id,
                                document_id: result.document_id,
                                name: result.file,
                                source_file: result.file,
                                doc_type: result.file.split('.').pop(),
                                chunks: result.chunks,
                                collections: collections,
                                created_at: new Date().toISOString(),
                            }
                            setDocuments(prev => [...prev, newDoc])
                        }
                    })
                }

                if (response.errors) {
                    response.errors.forEach((err) => {
                        const item = files.find(f => f.name === err.file)
                        if (item) {
                            updateIngestionStatus(item.id, 'error')
                        }
                    })
                }

                setProcessedCount(successCount)

                if (response.failed > 0) {
                    setError(`${response.failed} file(s) failed to process`)
                }
            }

            setSuccess(true)
            setIngesting(true, 100)

            // Clear queue after delay
            setTimeout(() => {
                clearIngestionQueue()
                setSuccess(false)
                setProcessedCount(0)
            }, 2000)

        } catch (err) {
            setError(err.message)

            // Mark remaining files as error
            files.forEach((file) => {
                if (file.status === 'processing') {
                    updateIngestionStatus(file.id, 'error')
                }
            })
        } finally {
            setIngesting(false, 0)
        }
    }

    const queuedCount = ingestionQueue.filter(f => f.status === 'queued').length
    const processingCount = ingestionQueue.filter(f => f.status === 'processing').length
    const doneCount = ingestionQueue.filter(f => f.status === 'done').length

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-orion-bg-panel border border-orion-border rounded-3xl shadow-2xl overflow-hidden animate-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-orion-border">
                    <div>
                        <h2 className="text-xl font-semibold text-orion-text-primary">
                            Upload Documents
                        </h2>
                        <p className="text-sm text-orion-text-muted mt-0.5">
                            Add files to your knowledge base
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isIngesting}
                        className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Drop Zone */}
                    <DropZone />

                    {/* File Queue */}
                    <FileQueue />

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-orion-error/10 border border-orion-error/20">
                            <AlertCircle size={20} className="text-orion-error flex-shrink-0" />
                            <p className="text-sm text-orion-error">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-orion-success/10 border border-orion-success/20">
                            <CheckCircle size={20} className="text-orion-success flex-shrink-0" />
                            <p className="text-sm text-orion-success">
                                {processedCount} file{processedCount !== 1 ? 's' : ''} processed successfully!
                            </p>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isIngesting && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-orion-text-secondary">
                                    Processing {processingCount > 0 ? `${doneCount + 1} of ${queuedCount + doneCount + processingCount}` : '...'}
                                </span>
                                <span className="text-orion-accent font-medium">{Math.round(ingestionProgress)}%</span>
                            </div>
                            <div className="h-2 bg-orion-bg-elevated rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orion-accent rounded-full transition-all duration-300"
                                    style={{ width: `${ingestionProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-orion-border bg-orion-bg-card/50">
                    <button
                        onClick={() => clearIngestionQueue()}
                        disabled={isIngesting || ingestionQueue.length === 0}
                        className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear Queue
                    </button>

                    <button
                        onClick={handleProcess}
                        disabled={isIngesting || queuedCount === 0}
                        className="btn-primary min-w-[140px] flex items-center justify-center gap-2"
                    >
                        {isIngesting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <span>Process {queuedCount > 0 ? `${queuedCount} File${queuedCount > 1 ? 's' : ''}` : 'Files'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
