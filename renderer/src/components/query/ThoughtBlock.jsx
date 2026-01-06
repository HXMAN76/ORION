import { useState, useMemo } from 'react'
import { Clock, ChevronDown, ChevronUp, Copy, Check, BookOpen, AlertCircle } from 'lucide-react'
import useStore from '../../store/store'

/**
 * ThoughtBlock - A "Reasoning Block" instead of a chat bubble
 * Structured session with query header and markdown response
 */
export default function ThoughtBlock({ session }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [copied, setCopied] = useState(false)
    const { setActiveSources } = useStore()

    const formattedTime = new Date(session.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const handleCopy = async () => {
        await navigator.clipboard.writeText(session.response)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Parse response for citation markers like [1], [2], etc.
    const formattedResponse = useMemo(() => {
        if (!session.response) return null

        const parts = session.response.split(/(\[\d+\])/g)

        return parts.map((part, index) => {
            const citationMatch = part.match(/\[(\d+)\]/)
            if (citationMatch) {
                const citationNum = parseInt(citationMatch[1])
                const source = session.sources[citationNum - 1]

                return (
                    <button
                        key={index}
                        onClick={() => source && setActiveSources([source])}
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-[10px] font-bold rounded bg-orion-accent/20 text-orion-accent hover:bg-orion-accent/30 transition-fast align-middle"
                        title={source?.document || `Citation ${citationNum}`}
                    >
                        {citationNum}
                    </button>
                )
            }
            return <span key={index}>{part}</span>
        })
    }, [session.response, session.sources, setActiveSources])

    return (
        <div className="card overflow-hidden">
            {/* Query Header */}
            <div className="flex items-start gap-3 px-5 py-4 bg-orion-bg-elevated/50 border-b border-orion-border-DEFAULT">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-orion-text-muted" strokeWidth={1.5} />
                        <span className="mono text-[11px] text-orion-text-muted">
                            {formattedTime}
                        </span>
                        {session.error && (
                            <span className="flex items-center gap-1 text-xs text-orion-error">
                                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                                Error
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-orion-text-primary leading-relaxed">
                        {session.query}
                    </p>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded hover:bg-orion-bg-hover transition-fast"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                    )}
                </button>
            </div>

            {/* Response Content */}
            {!isCollapsed && (
                <div className="px-5 py-4">
                    {session.error ? (
                        <div className="p-3 bg-orion-error/10 border border-orion-error/20 rounded-lg text-sm text-orion-error">
                            {session.response}
                        </div>
                    ) : (
                        <>
                            {/* Response Text */}
                            <div className="markdown-content text-sm leading-relaxed whitespace-pre-wrap">
                                {formattedResponse}
                                {session.isStreaming && (
                                    <span className="inline-block w-2 h-4 ml-1 bg-orion-accent animate-pulse rounded-sm" />
                                )}
                            </div>

                            {/* Actions Bar */}
                            {session.response && !session.isStreaming && (
                                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-orion-border-DEFAULT">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-orion-bg-elevated hover:bg-orion-bg-hover text-orion-text-muted hover:text-orion-text-secondary transition-fast"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3 text-orion-success" strokeWidth={1.5} />
                                        ) : (
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        )}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>

                                    {session.sources?.length > 0 && (
                                        <button
                                            onClick={() => setActiveSources(session.sources)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-orion-bg-elevated hover:bg-orion-bg-hover text-orion-text-muted hover:text-orion-text-secondary transition-fast"
                                        >
                                            <BookOpen className="w-3 h-3" strokeWidth={1.5} />
                                            {session.sources.length} sources
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Source Chips */}
                            {session.sources?.length > 0 && !session.isStreaming && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {session.sources.slice(0, 5).map((source, index) => (
                                        <button
                                            key={source.id || index}
                                            onClick={() => setActiveSources([source])}
                                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-orion-bg-elevated hover:bg-orion-accent/20 text-orion-text-muted hover:text-orion-accent transition-fast border border-orion-border-DEFAULT"
                                        >
                                            <span className="font-mono font-semibold">[{index + 1}]</span>
                                            <span className="truncate max-w-[140px]">{source.document}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
