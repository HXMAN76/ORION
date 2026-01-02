import { useState, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import useStore from '../../store/store'
import api from '../../services/api'

/**
 * Query Input - Large multiline input, keyboard-first
 * Ctrl+Enter to submit, NO placeholder like "Ask me anything"
 */
export default function QueryInput() {
    const [query, setQuery] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef(null)

    const {
        activeCollection,
        settings,
        addSession,
        updateSession,
        setActiveSources
    } = useStore()

    const handleSubmit = useCallback(async () => {
        const trimmedQuery = query.trim()
        if (!trimmedQuery || isSubmitting) return

        setIsSubmitting(true)
        setQuery('')

        // Create new session
        const sessionId = Date.now()
        addSession({
            id: sessionId,
            query: trimmedQuery,
            response: '',
            sources: [],
            isStreaming: true,
        })

        try {
            // Use streaming API
            const options = {
                topK: settings.topK,
                collections: activeCollection ? [activeCollection] : []
            }

            const result = await api.queryStream(trimmedQuery, options, (chunk, type) => {
                if (type === 'chunk') {
                    updateSession(sessionId, {
                        response: (prev) => prev + chunk
                    })
                } else if (type === 'sources') {
                    updateSession(sessionId, { sources: chunk })
                    setActiveSources(chunk)
                }
            })

            updateSession(sessionId, {
                response: result.answer,
                sources: result.sources,
                isStreaming: false,
            })

            if (result.sources.length > 0) {
                setActiveSources(result.sources)
            }

        } catch (error) {
            updateSession(sessionId, {
                response: `Error: ${error.message}`,
                isStreaming: false,
                error: true,
            })
        } finally {
            setIsSubmitting(false)
            textareaRef.current?.focus()
        }
    }, [query, isSubmitting, activeCollection, settings.topK, addSession, updateSession, setActiveSources])

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleChange = (e) => {
        setQuery(e.target.value)
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }

    return (
        <div className="relative">
            <div className="flex gap-3 p-1 bg-orion-bg-tertiary rounded-xl border border-orion-border focus-within:border-orion-accent/50 transition-fast">
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    rows={1}
                    className="flex-1 px-4 py-3 bg-transparent text-orion-text-primary text-sm leading-relaxed resize-none outline-none placeholder:text-orion-text-muted"
                    placeholder="Enter your query..."
                />

                <button
                    onClick={handleSubmit}
                    disabled={!query.trim() || isSubmitting}
                    className="self-end px-4 py-3 rounded-lg bg-orion-accent hover:bg-orion-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-fast shrink-0"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                        <Send className="w-4 h-4 text-white" />
                    )}
                </button>
            </div>

            {/* Keyboard hint */}
            <div className="absolute -bottom-6 left-0 mono text-xs text-orion-text-muted">
                <kbd className="px-1.5 py-0.5 rounded bg-orion-bg-elevated">Ctrl</kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 rounded bg-orion-bg-elevated">Enter</kbd>
                {' to submit'}
            </div>
        </div>
    )
}
