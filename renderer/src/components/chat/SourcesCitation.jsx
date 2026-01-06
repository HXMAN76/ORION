import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react'

/**
 * SourcesCitation - Expandable sources component for AI messages
 * Shows filenames, page numbers, timestamps, and relevance scores
 */
export default function SourcesCitation({ sources, onSourceClick }) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!sources || sources.length === 0) return null

    return (
        <div className="mt-3">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-orion-text-secondary hover:text-orion-text-primary bg-orion-bg-elevated hover:bg-orion-bg-hover rounded-xl transition-fast"
            >
                <FileText size={16} className="text-orion-accent" />
                <span className="font-medium">
                    {sources.length} Source{sources.length > 1 ? 's' : ''}
                </span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expanded Sources List */}
            {isExpanded && (
                <div className="mt-3 space-y-2 animate-fade-in">
                    {sources.map((source, index) => (
                        <SourceCard
                            key={index}
                            source={source}
                            index={index + 1}
                            onClick={() => onSourceClick?.(source)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Individual source card
 */
function SourceCard({ source, index, onClick }) {
    const getFileIcon = (filename) => {
        const ext = filename?.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'pdf': return '📄'
            case 'docx':
            case 'doc': return '📝'
            case 'png':
            case 'jpg':
            case 'jpeg': return '🖼️'
            case 'mp3':
            case 'wav': return '🎵'
            default: return '📎'
        }
    }

    const filename = source.filename || source.file_name || source.document_name || 'Unknown Source'
    const page = source.page || source.page_number
    const timestamp = source.timestamp
    const score = source.score || source.relevance_score

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-orion-bg-card border border-orion-border hover:border-orion-accent/30 hover:bg-orion-bg-elevated transition-fast group text-left"
        >
            {/* Index Badge */}
            <div className="w-8 h-8 rounded-lg bg-orion-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-orion-accent font-semibold text-sm">{index}</span>
            </div>

            {/* File Icon */}
            <div className="w-10 h-10 rounded-xl bg-orion-bg-elevated flex items-center justify-center flex-shrink-0 text-xl">
                {getFileIcon(filename)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-orion-text-primary truncate group-hover:text-orion-accent transition-fast">
                    {filename}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-orion-text-muted">
                    {page && <span>Page {page}</span>}
                    {timestamp && <span>@ {timestamp}</span>}
                    {score && (
                        <span className="badge badge-accent">
                            {Math.round(score * 100)}% match
                        </span>
                    )}
                </div>
                {source.snippet && (
                    <p className="text-sm text-orion-text-secondary mt-2 line-clamp-2">
                        "{source.snippet}"
                    </p>
                )}
            </div>

            {/* External Link Icon */}
            <ExternalLink
                size={16}
                className="text-orion-text-muted group-hover:text-orion-accent transition-fast flex-shrink-0"
            />
        </button>
    )
}
