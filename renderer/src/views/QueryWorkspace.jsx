import { useRef, useEffect } from 'react'
import { Sparkles, PanelRightOpen } from 'lucide-react'
import useStore from '../store/store'
import useStreamingResponse from '../hooks/useStreamingResponse'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'

/**
 * QueryWorkspace - Main chat interface view
 * Features message history, streaming responses, and input area
 */
export default function QueryWorkspace() {
    const { messages, isStreaming, isContextPanelOpen, setContextPanelOpen } = useStore()
    const { sendQuery, isLoading } = useStreamingResponse()
    const messagesEndRef = useRef(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = (message) => {
        sendQuery(message)
    }

    return (
        <main className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b border-orion-border flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-orion-accent" />
                    <h1 className="font-semibold text-orion-text-primary">Chat</h1>
                    {messages.length > 0 && (
                        <span className="badge badge-muted">{messages.length} messages</span>
                    )}
                </div>

                <button
                    onClick={() => setContextPanelOpen(!isContextPanelOpen)}
                    className={`btn-icon ${isContextPanelOpen ? 'text-orion-accent' : ''}`}
                    title="Toggle context panel"
                >
                    <PanelRightOpen size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {/* Streaming indicator */}
                        {isStreaming && (
                            <div className="flex items-center gap-2 text-orion-text-muted">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-orion-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-orion-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-orion-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm">Generating response...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <ChatInput onSend={handleSend} isLoading={isLoading || isStreaming} />
        </main>
    )
}

/**
 * Empty state when no messages
 */
function EmptyState() {
    const suggestedQueries = [
        "What are the key findings in my research papers?",
        "Summarize the main points from the uploaded documents",
        "Find information about machine learning techniques",
        "Compare the methodologies across my documents",
    ]

    const { sendQuery } = useStreamingResponse()

    return (
        <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orion-accent/20 to-orion-accent/5 flex items-center justify-center mb-8">
                <Sparkles size={36} className="text-orion-accent" />
            </div>

            <h2 className="text-2xl font-semibold text-orion-text-primary mb-3">
                Welcome to ORION
            </h2>
            <p className="text-orion-text-secondary text-center max-w-md mb-10">
                Your offline multimodal intelligence workspace. Ask questions about your documents and get AI-powered answers with source citations.
            </p>

            <div className="w-full max-w-2xl">
                <h3 className="text-sm font-medium text-orion-text-muted mb-4 text-center">
                    Try asking...
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQueries.map((query, index) => (
                        <button
                            key={index}
                            onClick={() => sendQuery(query)}
                            className="p-4 text-left bg-orion-bg-card border border-orion-border rounded-2xl hover:border-orion-accent/30 hover:bg-orion-bg-elevated transition-fast group"
                        >
                            <p className="text-sm text-orion-text-secondary group-hover:text-orion-text-primary transition-fast">
                                {query}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
