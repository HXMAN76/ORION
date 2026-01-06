import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import useStore from '../../store/store'
import api from '../../services/api'
import DropZone from './DropZone'
import FileQueue from './FileQueue'

/**
 * IngestionPanel - Modal overlay for file upload and processing
 * Manages the full ingestion workflow
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
    } = useStore()

    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    if (!isIngestionOpen) return null

    const handleClose = () => {
        if (!isIngesting) {
            setIngestionOpen(false)
            setError(null)
            setSuccess(false)
        }
    }

    const handleProcess = async () => {
        if (ingestionQueue.length === 0) return

        setIngesting(true, 0)
        setError(null)
        setSuccess(false)

        try {
            // Mark all as processing
            ingestionQueue.forEach((file) => {
                updateIngestionStatus(file.id, 'processing')
            })

            // Extract actual File objects
            const files = ingestionQueue.map((item) => item.file)

            // Upload files
            const response = await api.ingestFiles(files)

            // Poll for completion if we get a task ID
            if (response.task_id) {
                await api.waitForIngestion(response.task_id, (status) => {
                    setIngesting(true, status.progress || 0)
                })
            }

            // Mark all as done
            ingestionQueue.forEach((file) => {
                updateIngestionStatus(file.id, 'done')
            })

            setSuccess(true)

            // Clear queue after delay
            setTimeout(() => {
                clearIngestionQueue()
                setSuccess(false)
            }, 2000)

        } catch (err) {
            setError(err.message)

            // Mark all as error
            ingestionQueue.forEach((file) => {
                updateIngestionStatus(file.id, 'error')
            })
        } finally {
            setIngesting(false, 0)
        }
    }

    const queuedCount = ingestionQueue.filter(f => f.status === 'queued').length

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
                            <p className="text-sm text-orion-success">Files processed successfully!</p>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isIngesting && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-orion-text-secondary">Processing files...</span>
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
