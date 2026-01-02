import { useState, useMemo } from 'react'
import { Copy, Check, BookOpen } from 'lucide-react'
import useStore from '../../store/store'

/**
 * Response Block - Annotated analysis block with citations
 * NOT a chat message - structured response with inline citation markers
 */
export default function ResponseBlock({ response, sources, isStreaming, error }) {
    const [copied, setCopied] = useState(false)
    const { setActiveSources } = useStore()

    const handleCopy = async () => {
        await navigator.clipboard.writeText(response)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Parse response for citation markers like [1], [2], etc.
    const formattedResponse = useMemo(() => {
        if (!response) return null

        // Split by citation markers
        const parts = response.split(/(\[\d+\])/g)

        return parts.map((part, index) => {
            const citationMatch = part.match(/\[(\d+)\]/)
            if (citationMatch) {
                const citationNum = parseInt(citationMatch[1])
                const source = sources[citationNum - 1]

                return (
                    <button
                        key={index}
                        onClick={() => source && setActiveSources([source])}
                        className="inline-flex items-center justify-center w-4 h-4 mx-0.5 text-xs rounded bg-orion-accent/20 text-orion-accent hover:bg-orion-accent/30 transition-fast"
                        title={source?.document || `Citation ${citationNum}`}
                    >
                        {citationNum}
                    </button>
                )
            }
            return <span key={index}>{part}</span>
        })
    }, [response, sources, setActiveSources])

    if (error) {
        return (
            <div className="px-4 py-3 text-sm text-orion-error bg-orion-error/10">
                {response}
            </div>
        )
    }

    return (
        <div className="px-4 py-3">
            {/* Response Text */}
            <div className="text-sm text-orion-text-primary leading-relaxed whitespace-pre-wrap">
                {formattedResponse}
                {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-orion-accent animate-pulse" />
                )}
            </div>

            {/* Actions Bar */}
            {response && !isStreaming && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-orion-border">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-tertiary hover:bg-orion-bg-elevated text-orion-text-muted hover:text-orion-text-secondary transition-fast"
                    >
                        {copied ? (
                            <Check className="w-3 h-3 text-orion-success" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                        {copied ? 'Copied' : 'Copy'}
                    </button>

                    {sources.length > 0 && (
                        <button
                            onClick={() => setActiveSources(sources)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-orion-bg-tertiary hover:bg-orion-bg-elevated text-orion-text-muted hover:text-orion-text-secondary transition-fast"
                        >
                            <BookOpen className="w-3 h-3" />
                            {sources.length} sources
                        </button>
                    )}
                </div>
            )}

            {/* Source Citations */}
            {sources.length > 0 && !isStreaming && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {sources.slice(0, 5).map((source, index) => (
                        <button
                            key={source.id || index}
                            onClick={() => setActiveSources([source])}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-orion-bg-tertiary hover:bg-orion-accent/20 text-orion-text-muted hover:text-orion-accent transition-fast"
                        >
                            <span className="font-mono font-semibold">[{index + 1}]</span>
                            <span className="truncate max-w-[150px]">{source.document}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
