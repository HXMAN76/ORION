import { useState, useRef, useCallback } from 'react'
import { Send, Loader2, ChevronDown, FolderOpen, SlidersHorizontal } from 'lucide-react'
import useStore from '../../store/store'
import api from '../../services/api'

/**
 * CommandDeck - Substantial input area with visible configuration
 * NOT a simple text input - a "Command Deck" for queries
 */
export default function CommandDeck() {
    const [query, setQuery] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showConfig, setShowConfig] = useState(false)
    const textareaRef = useRef(null)

    const {
        activeCollection,
        setActiveCollection,
        collections,
        settings,
        updateSettings,
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
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
        }
    }

    return (
        <div className="border-t border-orion-border-DEFAULT bg-orion-bg-panel">
            <div className="max-w-4xl mx-auto px-6 py-4">
                {/* Configuration Row */}
                {showConfig && (
                    <div className="flex items-center gap-4 mb-3 pb-3 border-b border-orion-border-DEFAULT">
                        {/* Collection Selector */}
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                            <select
                                value={activeCollection || ''}
                                onChange={(e) => setActiveCollection(e.target.value || null)}
                                className="bg-orion-bg-elevated border border-orion-border-DEFAULT rounded-lg px-3 py-1.5 text-xs text-orion-text-secondary outline-none focus:border-orion-accent transition-fast"
                            >
                                <option value="">All Collections</option>
                                {collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Top-K Slider */}
                        <div className="flex items-center gap-2">
                            <span className="mono text-[11px] text-orion-text-muted">Top-K:</span>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={settings.topK}
                                onChange={(e) => updateSettings({ topK: parseInt(e.target.value) })}
                                className="w-20 accent-orion-accent"
                            />
                            <span className="mono text-[11px] text-orion-accent w-4">{settings.topK}</span>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex gap-3">
                    <div className="flex-1 flex items-end gap-2 p-1 bg-orion-bg-card rounded-xl border border-orion-border-DEFAULT focus-within:border-orion-accent/50 transition-fast">
                        {/* Config Toggle */}
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className={`p-2.5 rounded-lg transition-fast shrink-0 ${showConfig ? 'bg-orion-accent/20 text-orion-accent' : 'hover:bg-orion-bg-hover text-orion-text-muted'}`}
                            title="Query Settings"
                        >
                            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
                        </button>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={query}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={isSubmitting}
                            rows={1}
                            className="flex-1 py-2.5 bg-transparent text-orion-text-primary text-sm leading-relaxed resize-none outline-none placeholder:text-orion-text-muted scrollbar-none"
                            placeholder="Enter your query..."
                        />

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!query.trim() || isSubmitting}
                            className="p-2.5 rounded-lg bg-orion-accent hover:bg-orion-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-fast shrink-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" strokeWidth={2} />
                            ) : (
                                <Send className="w-4 h-4 text-white" strokeWidth={2} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Keyboard Hint */}
                <div className="flex items-center gap-1 mt-2 mono text-[10px] text-orion-text-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-orion-bg-elevated border border-orion-border-DEFAULT">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-orion-bg-elevated border border-orion-border-DEFAULT">Enter</kbd>
                    <span className="ml-1">to submit</span>
                </div>
            </div>
        </div>
    )
}
