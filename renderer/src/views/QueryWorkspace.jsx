import { useRef, useEffect } from 'react'
import { MessageSquare, Clock, Sparkles } from 'lucide-react'
import useStore from '../store/store'
import CommandDeck from '../components/query/CommandDeck'
import ThoughtBlock from '../components/query/ThoughtBlock'

/**
 * QueryWorkspace - "Command Deck" style query interface
 * NOT a chat - structured reasoning blocks with evidence
 */
export default function QueryWorkspace() {
    const { sessions, activeCollection, collections } = useStore()
    const scrollRef = useRef(null)

    // Auto-scroll to bottom on new sessions
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [sessions])

    const activeCollectionName = collections.find(c => c.id === activeCollection)?.name

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-orion-bg-app">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-orion-border-DEFAULT bg-orion-bg-panel">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orion-accent/20">
                        <Sparkles className="w-4 h-4 text-orion-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-orion-text-primary">
                            Query Workspace
                        </h1>
                        {activeCollectionName ? (
                            <p className="mono text-[11px] text-orion-text-muted">
                                Querying: <span className="text-orion-accent">{activeCollectionName}</span>
                            </p>
                        ) : (
                            <p className="mono text-[11px] text-orion-text-muted">
                                All collections
                            </p>
                        )}
                    </div>
                </div>

                {sessions.length > 0 && (
                    <div className="flex items-center gap-2 text-orion-text-muted">
                        <Clock className="w-4 h-4" strokeWidth={1.5} />
                        <span className="mono text-xs">{sessions.length} sessions</span>
                    </div>
                )}
            </header>

            {/* Sessions Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-orion"
            >
                {sessions.length === 0 ? (
                    <EmptyWorkspace />
                ) : (
                    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                        {sessions.map((session) => (
                            <ThoughtBlock key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>

            {/* Command Deck (Bottom Input) */}
            <CommandDeck />
        </div>
    )
}

function EmptyWorkspace() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-orion-bg-card border border-orion-border-DEFAULT flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-orion-text-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-orion-text-primary mb-2">
                Ready for Investigation
            </h2>
            <p className="text-orion-text-muted max-w-md leading-relaxed mb-6">
                Enter your query below to search your knowledge base.
                Responses include citations linked to source documents.
            </p>
            <div className="flex items-center gap-3 mono text-xs text-orion-text-muted">
                <kbd className="px-2 py-1 rounded bg-orion-bg-elevated border border-orion-border-DEFAULT">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 rounded bg-orion-bg-elevated border border-orion-border-DEFAULT">Enter</kbd>
                <span className="text-orion-text-muted">to submit query</span>
            </div>
        </div>
    )
}
