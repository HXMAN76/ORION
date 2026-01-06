import { useState, useMemo } from 'react'
import {
    Search,
    FolderOpen,
    FolderPlus,
    FileText,
    Image,
    Mic,
    Video,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Plus
} from 'lucide-react'
import useStore from '../store/store'
import api from '../services/api'

/**
 * CollectionsManager - Manage documents and collections
 */
export default function CollectionsManager() {
    const {
        collections,
        documents,
        activeCollection,
        setActiveCollection,
        setCollections,
        toggleIngestion
    } = useStore()

    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCollections, setExpandedCollections] = useState(new Set())
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

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

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim() || isCreating) return

        setIsCreating(true)
        try {
            await api.createCollection(newCollectionName.trim())
            const updatedCollections = await api.getCollections()
            setCollections(updatedCollections)
            setNewCollectionName('')
            setShowCreateModal(false)
        } catch (error) {
            console.error('Failed to create collection:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteCollection = async (collectionName) => {
        if (!confirm(`Delete collection "${collectionName}"? Documents will not be deleted.`)) return

        try {
            await api.deleteCollection(collectionName)
            const updatedCollections = await api.getCollections()
            setCollections(updatedCollections)
            if (activeCollection === collectionName) {
                setActiveCollection(null)
            }
        } catch (error) {
            console.error('Failed to delete collection:', error)
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-orion-border-DEFAULT bg-orion-bg-panel">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orion-data-green/20">
                        <FolderOpen className="w-4 h-4 text-orion-data-green" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-orion-text-primary">
                            Collections
                        </h1>
                        <p className="mono text-[11px] text-orion-text-muted">
                            {collections.length} collections • {documents.length} documents
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleIngestion}
                        className="flex items-center gap-2 px-3 py-2 text-xs bg-orion-bg-elevated hover:bg-orion-bg-hover rounded-lg text-orion-text-secondary transition-fast"
                    >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                        Add Files
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs bg-orion-accent hover:bg-orion-accent-light rounded-lg text-white transition-fast"
                    >
                        <FolderPlus className="w-4 h-4" strokeWidth={1.5} />
                        New Collection
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="px-6 py-4 border-b border-orion-border-DEFAULT bg-orion-bg-panel">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-orion-bg-card rounded-lg border border-orion-border-DEFAULT focus-within:border-orion-accent/50 transition-fast">
                    <Search className="w-4 h-4 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="flex-1 bg-transparent text-sm text-orion-text-primary placeholder:text-orion-text-muted outline-none"
                    />
                </div>
            </div>

            {/* Collections List */}
            <div className="flex-1 overflow-y-auto scrollbar-orion p-4">
                {collections.length === 0 && documents.length === 0 ? (
                    <EmptyState onCreateClick={() => setShowCreateModal(true)} />
                ) : (
                    <div className="space-y-2">
                        {collections.map(collection => (
                            <CollectionNode
                                key={collection.id}
                                collection={collection}
                                documents={filteredDocuments[collection.id] || []}
                                isExpanded={expandedCollections.has(collection.id)}
                                isActive={activeCollection === collection.id}
                                onToggle={() => toggleCollection(collection.id)}
                                onSelect={() => setActiveCollection(collection.id)}
                                onDelete={() => handleDeleteCollection(collection.id)}
                            />
                        ))}

                        {filteredDocuments['uncategorized']?.length > 0 && (
                            <CollectionNode
                                collection={{ id: 'uncategorized', name: 'Uncategorized' }}
                                documents={filteredDocuments['uncategorized']}
                                isExpanded={expandedCollections.has('uncategorized')}
                                isActive={activeCollection === 'uncategorized'}
                                onToggle={() => toggleCollection('uncategorized')}
                                onSelect={() => setActiveCollection('uncategorized')}
                                canDelete={false}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateCollectionModal
                    name={newCollectionName}
                    setName={setNewCollectionName}
                    onCreate={handleCreateCollection}
                    onClose={() => { setShowCreateModal(false); setNewCollectionName('') }}
                    isCreating={isCreating}
                />
            )}
        </div>
    )
}

function CollectionNode({ collection, documents, isExpanded, isActive, onToggle, onSelect, onDelete, canDelete = true }) {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="card overflow-hidden">
            <div
                className={`group flex items-center gap-3 px-4 py-3 transition-fast cursor-pointer
                    ${isActive ? 'bg-orion-accent/10' : 'hover:bg-orion-bg-hover'}`}
            >
                <button
                    onClick={() => { onToggle(); onSelect() }}
                    className="flex-1 flex items-center gap-3 text-left"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-orion-text-muted shrink-0" strokeWidth={1.5} />
                    )}
                    <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-orion-accent' : 'text-orion-data-green'}`} strokeWidth={1.5} />
                    <span className={`flex-1 text-sm font-medium ${isActive ? 'text-orion-text-primary' : 'text-orion-text-secondary'}`}>
                        {collection.name}
                    </span>
                    <span className="badge badge-amber">{documents.length}</span>
                </button>

                {canDelete && (
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-orion-bg-elevated transition-fast"
                        >
                            <MoreVertical className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-orion-bg-elevated border border-orion-border-DEFAULT rounded-lg shadow-lg py-1">
                                    <button
                                        onClick={() => { onDelete?.(); setShowMenu(false) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orion-error hover:bg-orion-bg-hover transition-fast"
                                    >
                                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {isExpanded && documents.length > 0 && (
                <div className="border-t border-orion-border-DEFAULT divide-y divide-orion-border-DEFAULT">
                    {documents.map(doc => (
                        <DocumentItem key={doc.id} document={doc} />
                    ))}
                </div>
            )}
        </div>
    )
}

function DocumentItem({ document }) {
    const typeConfig = {
        pdf: { icon: FileText, color: 'text-red-400' },
        docx: { icon: FileText, color: 'text-blue-400' },
        image: { icon: Image, color: 'text-green-400' },
        audio: { icon: Mic, color: 'text-purple-400' },
        video: { icon: Video, color: 'text-pink-400' },
    }

    const config = typeConfig[document.type] || typeConfig.pdf
    const Icon = config.icon

    const statusIcon = {
        indexed: <CheckCircle2 className="w-3.5 h-3.5 text-orion-success" strokeWidth={1.5} />,
        processing: <Loader2 className="w-3.5 h-3.5 text-orion-warning animate-spin" strokeWidth={1.5} />,
        error: <AlertCircle className="w-3.5 h-3.5 text-orion-error" strokeWidth={1.5} />,
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-orion-bg-hover transition-fast">
            <Icon className={`w-4 h-4 shrink-0 ${config.color}`} strokeWidth={1.5} />
            <span className="flex-1 text-sm text-orion-text-secondary truncate">
                {document.name}
            </span>
            {statusIcon[document.status]}
        </div>
    )
}

function CreateCollectionModal({ name, setName, onCreate, onClose, isCreating }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[400px] bg-orion-bg-panel rounded-xl border border-orion-border-DEFAULT shadow-2xl overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 border-b border-orion-border-DEFAULT">
                    <h3 className="text-sm font-semibold text-orion-text-primary">Create Collection</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-orion-bg-hover transition-fast">
                        <X className="w-4 h-4 text-orion-text-muted" strokeWidth={1.5} />
                    </button>
                </header>
                <div className="p-5">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                        placeholder="Collection name..."
                        className="input"
                        autoFocus
                    />
                </div>
                <footer className="flex justify-end gap-2 px-5 py-4 border-t border-orion-border-DEFAULT bg-orion-bg-card">
                    <button onClick={onClose} className="btn-ghost text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={!name.trim() || isCreating}
                        className="btn-primary text-sm"
                    >
                        {isCreating ? 'Creating...' : 'Create'}
                    </button>
                </footer>
            </div>
        </div>
    )
}

function EmptyState({ onCreateClick }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orion-bg-card border border-orion-border-DEFAULT flex items-center justify-center mb-6">
                <FolderOpen className="w-7 h-7 text-orion-text-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-orion-text-primary mb-2">
                No collections yet
            </h2>
            <p className="text-sm text-orion-text-muted mb-6 max-w-[280px]">
                Create a collection to organize your documents
            </p>
            <button onClick={onCreateClick} className="btn-primary">
                <FolderPlus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Create Collection
            </button>
        </div>
    )
}
