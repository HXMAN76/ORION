import { X, FileText, ExternalLink } from 'lucide-react'
import useStore from '../../store/store'

/**
 * ContextPanel - Collapsible right panel
 * Shows active document context and source previews
 */
export default function ContextPanel() {
    const {
        setContextPanelOpen,
        activeDocument,
        activeSources
    } = useStore()

    return (
        <aside className="w-context flex flex-col bg-orion-bg-panel border-l border-orion-border">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-orion-border">
                <h2 className="font-semibold text-orion-text-primary">Context</h2>
                <button
                    onClick={() => setContextPanelOpen(false)}
                    className="btn-icon"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
                {/* Active Document */}
                {activeDocument ? (
                    <section>
                        <h3 className="text-xs font-medium text-orion-text-muted uppercase tracking-wider mb-3">
                            Active Document
                        </h3>
                        <div className="card p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orion-bg-elevated flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-orion-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-orion-text-primary truncate">
                                        {activeDocument.name}
                                    </p>
                                    <p className="text-xs text-orion-text-muted mt-1">
                                        {activeDocument.type} • {activeDocument.pages} pages
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section>
                        <h3 className="text-xs font-medium text-orion-text-muted uppercase tracking-wider mb-3">
                            Active Document
                        </h3>
                        <div className="card p-6 text-center">
                            <FileText size={32} className="text-orion-text-muted mx-auto mb-2" />
                            <p className="text-sm text-orion-text-muted">No document selected</p>
                        </div>
                    </section>
                )}

                {/* Sources */}
                <section>
                    <h3 className="text-xs font-medium text-orion-text-muted uppercase tracking-wider mb-3">
                        Referenced Sources
                    </h3>

                    {activeSources.length > 0 ? (
                        <div className="space-y-2">
                            {activeSources.map((source, index) => (
                                <button
                                    key={index}
                                    className="w-full text-left card p-3 hover:bg-orion-bg-hover transition-fast group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-orion-text-primary truncate">
                                                {source.filename}
                                            </p>
                                            <p className="text-xs text-orion-text-muted mt-0.5">
                                                Page {source.page} • Relevance: {Math.round(source.score * 100)}%
                                            </p>
                                        </div>
                                        <ExternalLink
                                            size={14}
                                            className="text-orion-text-muted group-hover:text-orion-accent transition-fast flex-shrink-0 ml-2"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-6 text-center">
                            <p className="text-sm text-orion-text-muted">
                                Sources will appear here when you ask questions
                            </p>
                        </div>
                    )}
                </section>

                {/* Quick Info */}
                <section>
                    <h3 className="text-xs font-medium text-orion-text-muted uppercase tracking-wider mb-3">
                        Quick Tips
                    </h3>
                    <div className="card p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-orion-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-orion-accent text-xs font-bold">1</span>
                            </div>
                            <p className="text-sm text-orion-text-secondary">
                                Upload documents to build your knowledge base
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-orion-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-orion-accent text-xs font-bold">2</span>
                            </div>
                            <p className="text-sm text-orion-text-secondary">
                                Ask questions about your documents
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-orion-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-orion-accent text-xs font-bold">3</span>
                            </div>
                            <p className="text-sm text-orion-text-secondary">
                                Click on sources to view original context
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </aside>
    )
}
