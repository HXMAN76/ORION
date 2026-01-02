import { useRef, useEffect } from 'react'
import { MessageSquare, Clock } from 'lucide-react'
import useStore from '../../store/store'
import QueryInput from '../query/QueryInput'
import QuerySession from '../query/QuerySession'

/**
 * Main Workspace - Central query and reasoning area
 * NOT a chat interface - structured query sessions with annotated responses
 */
export default function MainWorkspace() {
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
        <main className="flex-1 flex flex-col min-w-0 bg-orion-bg-primary">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-orion-border bg-orion-bg-secondary/50">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-orion-accent" />
                    <div>
                        <h1 className="text-lg font-semibold text-orion-text-primary">
                            Query Workspace
                        </h1>
                        {activeCollectionName && (
                            <p className="text-xs text-orion-text-muted">
                                Querying: {activeCollectionName}
                            </p>
                        )}
                    </div>
                </div>

                {sessions.length > 0 && (
                    <div className="flex items-center gap-2 text-orion-text-muted">
                        <Clock className="w-4 h-4" />
                        <span className="mono text-xs">{sessions.length} sessions</span>
                    </div>
                )}
            </header>

            {/* Sessions Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4"
            >
                {sessions.length === 0 ? (
                    <EmptyWorkspace />
                ) : (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {sessions.map((session) => (
                            <QuerySession key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>

            {/* Query Input */}
            <div className="border-t border-orion-border bg-orion-bg-secondary/50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <QueryInput />
                </div>
            </div>
        </main>
    )
}

function EmptyWorkspace() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-orion-bg-tertiary flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-orion-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-orion-text-primary mb-2">
                Ready to Query
            </h2>
            <p className="text-orion-text-muted max-w-md leading-relaxed">
                Enter your query below to search your knowledge base.
                Responses will include citations to source documents.
            </p>
            <div className="mt-6 flex items-center gap-4 mono text-xs text-orion-text-muted">
                <span className="px-2 py-1 rounded bg-orion-bg-tertiary">Ctrl + Enter</span>
                <span>to submit query</span>
            </div>
        </div>
    )
}
