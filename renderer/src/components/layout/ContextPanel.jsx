import { useState } from 'react'
import {
    BookOpen,
    FileText,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    ExternalLink,
    X
} from 'lucide-react'
import useStore from '../../store/store'

/**
 * ContextPanel - 300px collapsible right panel for evidence/sources
 */
export default function ContextPanel() {
    const { activeSources, isContextPanelOpen, toggleContextPanel } = useStore()

    if (!isContextPanelOpen) return null

    return (
        <aside className="w-context flex flex-col bg-orion-bg-panel border-l border-orion-border-DEFAULT">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-orion-border-DEFAULT">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orion-accent" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-orion-text-primary">
                        Sources & Evidence
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {activeSources.length > 0 && (
                        <span className="badge badge-amber">
                            {activeSources.length}
                        </span>
                    )}
                    <button
                        onClick={toggleContextPanel}
                        className="p-1 rounded hover:bg-orion-bg-hover transition-fast"
                    >
                        <X className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                    </button>
                </div>
            </header>

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto scrollbar-orion">
                {activeSources.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="p-3 space-y-3">
                        {activeSources.map((source, index) => (
                            <EvidenceCard
                                key={source.id || index}
                                source={source}
                                index={index + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    )
}

function EvidenceCard({ source, index }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(source.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Similarity as percentage
    const similarity = Math.round((source.confidence || source.similarity || 0) * 100)

    // Confidence color based on score
    const getConfidenceColor = (score) => {
        if (score >= 80) return 'bg-orion-success'
        if (score >= 50) return 'bg-orion-warning'
        return 'bg-orion-error'
    }

    return (
        <div className="card overflow-hidden">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-orion-bg-hover transition-fast"
            >
                {/* Index Badge */}
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-orion-accent/20 text-orion-accent text-xs font-bold shrink-0">
                    {index}
                </span>

                <div className="flex-1 min-w-0">
                    {/* File Name */}
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                        <span className="text-sm text-orion-text-primary truncate">
                            {source.document || source.file || 'Unknown'}
                        </span>
                    </div>

                    {/* Location Info */}
                    <p className="mono text-[11px] text-orion-text-muted">
                        {source.page && `Page ${source.page}`}
                        {source.chunk && ` • Chunk ${source.chunk}`}
                        {source.location && ` • ${source.location}`}
                    </p>

                    {/* Similarity Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-orion-bg-elevated rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getConfidenceColor(similarity)} transition-all duration-300`}
                                style={{ width: `${similarity}%` }}
                            />
                        </div>
                        <span className="mono text-[10px] text-orion-text-muted w-8 text-right">
                            {similarity}%
                        </span>
                    </div>
                </div>

                {/* Expand Icon */}
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                ) : (
                    <ChevronDown className="w-4 h-4 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-orion-border-DEFAULT">
                    {/* Text Snippet */}
                    <div className="mt-3 p-3 bg-orion-bg-app rounded-lg">
                        <p className="text-xs text-orion-text-secondary leading-relaxed line-clamp-6">
                            {source.content || 'No preview available'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-elevated hover:bg-orion-bg-hover text-orion-text-muted hover:text-orion-text-secondary transition-fast"
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-orion-success" strokeWidth={1.5} />
                            ) : (
                                <Copy className="w-3 h-3" strokeWidth={1.5} />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </button>

                        <button className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-elevated hover:bg-orion-bg-hover text-orion-text-muted hover:text-orion-text-secondary transition-fast">
                            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                            Open
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-orion-bg-elevated flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-orion-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-orion-text-secondary mb-1">
                No sources yet
            </p>
            <p className="text-xs text-orion-text-muted max-w-[200px]">
                Evidence and citations will appear here when you run a query
            </p>
        </div>
    )
}
