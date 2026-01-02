import { useState, useMemo } from 'react'
import {
    Search,
    FolderOpen,
    FileText,
    Image,
    Mic,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    RefreshCw,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react'
import useStore from '../../store/store'

/**
 * Knowledge Manager - Left sidebar for document exploration
 * NOT a menu - this is a knowledge explorer with tree structure
 */
export default function KnowledgeManager() {
    const {
        collections,
        documents,
        activeCollection,
        setActiveCollection
    } = useStore()

    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCollections, setExpandedCollections] = useState(new Set())

    // Group documents by collection
    const documentsByCollection = useMemo(() => {
        const grouped = {}
        documents.forEach(doc => {
            const collId = doc.collectionId || 'uncategorized'
            if (!grouped[collId]) grouped[collId] = []
            grouped[collId].push(doc)
        })
        return grouped
    }, [documents])

    // Filter based on search
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documentsByCollection

        const query = searchQuery.toLowerCase()
        const filtered = {}

        Object.entries(documentsByCollection).forEach(([collId, docs]) => {
            const matchingDocs = docs.filter(doc =>
                doc.name.toLowerCase().includes(query)
            )
            if (matchingDocs.length > 0) {
                filtered[collId] = matchingDocs
            }
        })

        return filtered
    }, [documentsByCollection, searchQuery])

    const toggleCollection = (id) => {
        setExpandedCollections(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <aside className="w-sidebar flex flex-col bg-orion-bg-secondary border-r border-orion-border overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-orion-border">
                <div className="flex items-center gap-2 px-3 py-2 bg-orion-bg-tertiary rounded-lg">
                    <Search className="w-4 h-4 text-orion-text-muted shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="flex-1 bg-transparent text-sm text-orion-text-primary placeholder:text-orion-text-muted outline-none"
                    />
                </div>
            </div>

            {/* Document Tree */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {collections.length === 0 && documents.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {collections.map(collection => (
                            <CollectionNode
                                key={collection.id}
                                collection={collection}
                                documents={filteredDocuments[collection.id] || []}
                                isExpanded={expandedCollections.has(collection.id)}
                                isActive={activeCollection === collection.id}
                                onToggle={() => toggleCollection(collection.id)}
                                onSelect={() => setActiveCollection(collection.id)}
                            />
                        ))}

                        {/* Uncategorized documents */}
                        {filteredDocuments['uncategorized']?.length > 0 && (
                            <CollectionNode
                                collection={{ id: 'uncategorized', name: 'Uncategorized' }}
                                documents={filteredDocuments['uncategorized']}
                                isExpanded={expandedCollections.has('uncategorized')}
                                isActive={activeCollection === 'uncategorized'}
                                onToggle={() => toggleCollection('uncategorized')}
                                onSelect={() => setActiveCollection('uncategorized')}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Footer Stats */}
            <div className="p-3 border-t border-orion-border">
                <div className="flex justify-between mono">
                    <span>{collections.length} collections</span>
                    <span>{documents.length} documents</span>
                </div>
            </div>
        </aside>
    )
}

function CollectionNode({ collection, documents, isExpanded, isActive, onToggle, onSelect }) {
    return (
        <div className="mb-1">
            <button
                onClick={() => { onToggle(); onSelect(); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-fast
          ${isActive ? 'bg-orion-accent/15 text-orion-accent-light' : 'hover:bg-orion-bg-tertiary text-orion-text-secondary'}`}
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                )}
                <FolderOpen className="w-4 h-4 shrink-0 text-orion-accent" />
                <span className="flex-1 text-sm truncate">{collection.name}</span>
                <span className="mono text-xs">{documents.length}</span>
            </button>

            {isExpanded && documents.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5">
                    {documents.map(doc => (
                        <DocumentItem key={doc.id} document={doc} />
                    ))}
                </div>
            )}
        </div>
    )
}

function DocumentItem({ document }) {
    const [showMenu, setShowMenu] = useState(false)

    const typeConfig = {
        pdf: { icon: FileText, color: 'text-red-400' },
        docx: { icon: FileText, color: 'text-blue-400' },
        image: { icon: Image, color: 'text-green-400' },
        audio: { icon: Mic, color: 'text-purple-400' },
    }

    const config = typeConfig[document.type] || typeConfig.pdf
    const Icon = config.icon

    const statusIcon = {
        indexed: <CheckCircle2 className="w-3 h-3 text-orion-success" />,
        processing: <Loader2 className="w-3 h-3 text-orion-warning animate-spin" />,
        error: <AlertCircle className="w-3 h-3 text-orion-error" />,
    }

    return (
        <div
            className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-orion-bg-tertiary transition-fast cursor-pointer"
        >
            <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
            <span className="flex-1 text-sm text-orion-text-secondary truncate">
                {document.name}
            </span>

            {statusIcon[document.status]}

            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-orion-bg-elevated transition-fast"
                >
                    <MoreVertical className="w-3 h-3 text-orion-text-muted" />
                </button>

                {showMenu && (
                    <DocumentMenu
                        document={document}
                        onClose={() => setShowMenu(false)}
                    />
                )}
            </div>
        </div>
    )
}

function DocumentMenu({ document, onClose }) {
    return (
        <>
            <div
                className="fixed inset-0 z-10"
                onClick={onClose}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-orion-bg-elevated border border-orion-border rounded-lg shadow-lg py-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orion-text-secondary hover:bg-orion-bg-tertiary transition-fast">
                    <RefreshCw className="w-4 h-4" />
                    Reindex
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orion-error hover:bg-orion-bg-tertiary transition-fast">
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <FolderOpen className="w-12 h-12 text-orion-text-muted mb-4 opacity-50" />
            <p className="text-sm text-orion-text-muted">
                No documents yet
            </p>
            <p className="text-xs text-orion-text-muted mt-1">
                Ingest files to start building your knowledge base
            </p>
        </div>
    )
}
