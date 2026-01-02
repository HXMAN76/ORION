import {
    BookOpen,
    FileText,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Copy,
    Check
} from 'lucide-react'
import { useState } from 'react'
import useStore from '../../store/store'

/**
 * Sources Panel - Right context panel showing WHY the answer exists
 * Updates live while model streams output
 */
export default function SourcesPanel() {
    const { activeSources } = useStore()

    return (
        <aside className="w-sources flex flex-col bg-orion-bg-secondary border-l border-orion-border overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-2 px-4 py-3 border-b border-orion-border">
                <BookOpen className="w-4 h-4 text-orion-accent" />
                <h2 className="text-sm font-semibold text-orion-text-primary">
                    Sources & Evidence
                </h2>
                {activeSources.length > 0 && (
                    <span className="ml-auto mono text-xs text-orion-text-muted">
                        {activeSources.length} sources
                    </span>
                )}
            </header>

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {activeSources.length === 0 ? (
                    <EmptySourcesState />
                ) : (
                    <div className="p-2 space-y-2">
                        {activeSources.map((source, index) => (
                            <SourceCard
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

function SourceCard({ source, index }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(source.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Confidence color
    const confidenceColor = source.confidence >= 0.8
        ? 'text-orion-success'
        : source.confidence >= 0.5
            ? 'text-orion-warning'
            : 'text-orion-error'

    return (
        <div className="rounded-lg bg-orion-bg-tertiary border border-orion-border overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-orion-bg-elevated transition-fast"
            >
                <span className="flex items-center justify-center w-5 h-5 rounded bg-orion-accent/20 text-orion-accent text-xs font-semibold">
                    {index}
                </span>

                <FileText className="w-4 h-4 text-orion-text-muted shrink-0" />

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-orion-text-primary truncate">
                        {source.document}
                    </p>
                    <p className="mono text-xs text-orion-text-muted">
                        {source.page && `Page ${source.page}`}
                        {source.timestamp && `${source.timestamp}`}
                        {source.chunk && ` • Chunk ${source.chunk}`}
                    </p>
                </div>

                {source.confidence !== undefined && (
                    <span className={`mono text-xs ${confidenceColor}`}>
                        {Math.round(source.confidence * 100)}%
                    </span>
                )}

                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-orion-text-muted shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-orion-text-muted shrink-0" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-orion-border">
                    <div className="mt-2 p-3 rounded bg-orion-bg-primary text-sm text-orion-text-secondary leading-relaxed">
                        {source.content}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-elevated hover:bg-orion-accent/20 text-orion-text-muted hover:text-orion-accent transition-fast"
                        >
                            {copied ? (
                                <Check className="w-3 h-3" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </button>

                        <button
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-elevated hover:bg-orion-accent/20 text-orion-text-muted hover:text-orion-accent transition-fast"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Open Source
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptySourcesState() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <BookOpen className="w-10 h-10 text-orion-text-muted mb-4 opacity-50" />
            <p className="text-sm text-orion-text-muted">
                No sources yet
            </p>
            <p className="text-xs text-orion-text-muted mt-1 max-w-[200px]">
                Sources and evidence will appear here as you query your knowledge base
            </p>
        </div>
    )
}
