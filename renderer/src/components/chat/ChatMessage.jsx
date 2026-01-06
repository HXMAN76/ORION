import { useState } from 'react'
import { User, Bot, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react'

/**
 * ChatMessage - Individual message bubble component
 * Handles both user and AI messages with citation support
 */
export default function ChatMessage({ message }) {
    const [showSources, setShowSources] = useState(false)
    const isUser = message.role === 'user'
    const hasSources = message.sources && message.sources.length > 0

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in`}>
            {/* AI Avatar */}
            {!isUser && (
                <div className="w-9 h-9 rounded-xl bg-orion-bg-card border border-orion-border flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-orion-accent" />
                </div>
            )}

            {/* Message Content */}
            <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
                <div
                    className={`px-5 py-3.5 ${isUser
                            ? 'message-user'
                            : message.isError
                                ? 'bg-orion-error/20 text-orion-error rounded-3xl rounded-bl-lg'
                                : 'message-ai'
                        }`}
                >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {message.content}
                    </p>
                </div>

                {/* Timestamp */}
                <div className={`flex items-center gap-2 mt-1.5 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <Clock size={12} className="text-orion-text-muted" />
                    <span className="text-xs text-orion-text-muted">
                        {formatTime(message.timestamp)}
                    </span>
                </div>

                {/* Sources Toggle (AI messages only) */}
                {!isUser && hasSources && (
                    <div className="mt-2">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-orion-text-muted hover:text-orion-text-secondary transition-fast rounded-lg hover:bg-orion-bg-hover"
                        >
                            <FileText size={14} />
                            <span>{message.sources.length} Source{message.sources.length > 1 ? 's' : ''}</span>
                            {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Expanded Sources */}
                        {showSources && (
                            <div className="mt-2 ml-2 space-y-1.5">
                                {message.sources.map((source, index) => (
                                    <button
                                        key={index}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl bg-orion-bg-elevated hover:bg-orion-bg-hover transition-fast group"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-orion-bg-card flex items-center justify-center flex-shrink-0">
                                            <FileText size={14} className="text-orion-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-orion-text-primary truncate font-medium">
                                                {source.filename || source.file_name || 'Unknown Source'}
                                            </p>
                                            <p className="text-xs text-orion-text-muted">
                                                {source.page && `Page ${source.page}`}
                                                {source.timestamp && `@ ${source.timestamp}`}
                                                {source.score && ` • ${Math.round(source.score * 100)}% match`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-9 h-9 rounded-xl bg-orion-accent flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-orion-bg-app" />
                </div>
            )}
        </div>
    )
}
