import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react'
import ResponseBlock from './ResponseBlock'

/**
 * Query Session - NOT a chat bubble
 * Structured session with query and annotated response block
 */
export default function QuerySession({ session }) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const formattedTime = new Date(session.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="rounded-xl border border-orion-border bg-orion-bg-secondary/50 overflow-hidden">
            {/* Session Header */}
            <div className="flex items-start gap-3 px-4 py-3 bg-orion-bg-tertiary/50 border-b border-orion-border">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-orion-text-muted" />
                        <span className="mono text-xs text-orion-text-muted">
                            {formattedTime}
                        </span>
                        {session.error && (
                            <span className="flex items-center gap-1 text-xs text-orion-error">
                                <AlertCircle className="w-3 h-3" />
                                Error
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-orion-text-primary leading-relaxed">
                        {session.query}
                    </p>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 rounded hover:bg-orion-bg-elevated transition-fast"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-orion-text-muted" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-orion-text-muted" />
                    )}
                </button>
            </div>

            {/* Response Block */}
            {!isCollapsed && (
                <ResponseBlock
                    response={session.response}
                    sources={session.sources}
                    isStreaming={session.isStreaming}
                    error={session.error}
                />
            )}
        </div>
    )
}
