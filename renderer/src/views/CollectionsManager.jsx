import { useState, useEffect, useCallback } from 'react'
import {
    FolderOpen,
    Search,
    Grid,
    List,
    FileText,
    Image,
    Mic,
    Trash2,
    Eye,
    Plus,
    Loader2,
    RefreshCw,
    FolderPlus,
    X
} from 'lucide-react'
import useStore from '../store/store'
import api from '../services/api'

/**
 * CollectionsManager - Document library view
 * Displays ingested documents with search, filter, and CRUD operations
 */
export default function CollectionsManager() {
    const { documents, setDocuments, collections, setCollections, toggleIngestion } = useStore()
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCollection, setSelectedCollection] = useState('all')
    const [isLoading, setIsLoading] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [isCreatingCollection, setIsCreatingCollection] = useState(false)

    // Fetch documents and collections on mount
    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [docsResponse, collectionsResponse] = await Promise.all([
                api.getDocuments(),
                api.getCollections()
            ])

            // Map backend document format to frontend format
            const mappedDocs = (docsResponse || []).map(doc => ({
                id: doc.document_id,
                document_id: doc.document_id,
                name: doc.source_file,
                source_file: doc.source_file,
                doc_type: doc.doc_type,
                collections: doc.collections || [],
                chunks: doc.chunk_count,
                created_at: doc.created_at,
            }))

            setDocuments(mappedDocs)
            setCollections(collectionsResponse || [])
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setIsLoading(false)
        }
    }, [setDocuments, setCollections])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filter documents
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCollection = selectedCollection === 'all' ||
            (doc.collections && doc.collections.includes(selectedCollection))
        return matchesSearch && matchesCollection
    })

    // Delete document handler
    const handleDeleteDocument = async (documentId) => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return
        }

        setDeletingId(documentId)
        try {
            await api.deleteDocument(documentId)
            // Remove from local state
            setDocuments(documents.filter(doc => doc.document_id !== documentId))
        } catch (err) {
            console.error('Failed to delete document:', err)
            alert(`Failed to delete document: ${err.message}`)
        } finally {
            setDeletingId(null)
        }
    }

    // Create collection handler
    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return

        setIsCreatingCollection(true)
        try {
            await api.createCollection(newCollectionName.trim())
            // Refresh collections
            const updatedCollections = await api.getCollections()
            setCollections(updatedCollections || [])
            setNewCollectionName('')
            setShowNewCollectionModal(false)
        } catch (err) {
            console.error('Failed to create collection:', err)
            alert(`Failed to create collection: ${err.message}`)
        } finally {
            setIsCreatingCollection(false)
        }
    }

    // Delete collection handler
    const handleDeleteCollection = async (collectionName) => {
        if (!confirm(`Delete collection "${collectionName}"? Documents will not be deleted.`)) {
            return
        }

        try {
            await api.deleteCollection(collectionName)
            // Refresh collections
            const updatedCollections = await api.getCollections()
            setCollections(updatedCollections || [])
            if (selectedCollection === collectionName) {
                setSelectedCollection('all')
            }
        } catch (err) {
            console.error('Failed to delete collection:', err)
            alert(`Failed to delete collection: ${err.message}`)
        }
    }

    const getFileIcon = (docType) => {
        switch (docType?.toLowerCase()) {
            case 'pdf': return { icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' }
            case 'docx':
            case 'doc': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' }
            case 'image':
            case 'png':
            case 'jpg':
            case 'jpeg': return { icon: Image, color: 'text-green-400', bg: 'bg-green-400/10' }
            case 'audio':
            case 'voice':
            case 'wav':
            case 'mp3': return { icon: Mic, color: 'text-purple-400', bg: 'bg-purple-400/10' }
            default: return { icon: FileText, color: 'text-orion-text-muted', bg: 'bg-orion-bg-elevated' }
        }
    }

    const formatDate = (date) => {
        if (!date) return 'Unknown'
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <main className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-orion-border flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <FolderOpen size={24} className="text-orion-accent" />
                        <div>
                            <h1 className="text-xl font-semibold text-orion-text-primary">Library</h1>
                            <p className="text-sm text-orion-text-muted">
                                {documents.length} document{documents.length !== 1 ? 's' : ''} in your knowledge base
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="btn-icon"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowNewCollectionModal(true)}
                            className="btn-ghost flex items-center gap-2"
                        >
                            <FolderPlus size={18} />
                            <span>New Collection</span>
                        </button>
                        <button onClick={toggleIngestion} className="btn-primary flex items-center gap-2">
                            <Plus size={18} />
                            <span>Add Documents</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orion-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="input pl-11"
                        />
                    </div>

                    {/* Collection Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="input w-auto min-w-[160px]"
                        >
                            <option value="all">All Collections</option>
                            {collections.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        {selectedCollection !== 'all' && (
                            <button
                                onClick={() => handleDeleteCollection(selectedCollection)}
                                className="btn-icon hover:text-orion-error"
                                title="Delete collection"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-orion-bg-card rounded-xl border border-orion-border p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-fast ${viewMode === 'grid'
                                ? 'bg-orion-accent text-orion-bg-app'
                                : 'text-orion-text-muted hover:text-orion-text-primary'
                                }`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-fast ${viewMode === 'list'
                                ? 'bg-orion-accent text-orion-bg-app'
                                : 'text-orion-text-muted hover:text-orion-text-primary'
                                }`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                {isLoading && documents.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-orion-accent" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <EmptyLibrary onUpload={toggleIngestion} hasDocuments={documents.length > 0} />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredDocuments.map((doc) => {
                            const { icon: Icon, color, bg } = getFileIcon(doc.doc_type)
                            return (
                                <DocumentCard
                                    key={doc.id}
                                    doc={doc}
                                    Icon={Icon}
                                    color={color}
                                    bg={bg}
                                    onDelete={handleDeleteDocument}
                                    isDeleting={deletingId === doc.document_id}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredDocuments.map((doc) => {
                            const { icon: Icon, color, bg } = getFileIcon(doc.doc_type)
                            return (
                                <DocumentRow
                                    key={doc.id}
                                    doc={doc}
                                    Icon={Icon}
                                    color={color}
                                    bg={bg}
                                    formatDate={formatDate}
                                    onDelete={handleDeleteDocument}
                                    isDeleting={deletingId === doc.document_id}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            {/* New Collection Modal */}
            {showNewCollectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowNewCollectionModal(false)}
                    />
                    <div className="relative w-full max-w-md mx-4 bg-orion-bg-panel border border-orion-border rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-orion-text-primary">Create Collection</h3>
                            <button
                                onClick={() => setShowNewCollectionModal(false)}
                                className="btn-icon"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="Collection name..."
                            className="input w-full mb-4"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewCollectionModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCollection}
                                disabled={!newCollectionName.trim() || isCreatingCollection}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isCreatingCollection && <Loader2 size={16} className="animate-spin" />}
                                <span>Create</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

function DocumentCard({ doc, Icon, color, bg, onDelete, isDeleting }) {
    return (
        <div className="card p-4 hover:border-orion-accent/30 transition-fast group cursor-pointer relative">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
            </div>
            <h3 className="font-medium text-orion-text-primary truncate mb-1 group-hover:text-orion-accent transition-fast">
                {doc.name}
            </h3>
            <p className="text-xs text-orion-text-muted">
                {doc.chunks || 0} chunks • {doc.doc_type || 'unknown'}
            </p>
            {doc.collections && doc.collections.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {doc.collections.slice(0, 2).map(col => (
                        <span key={col} className="badge badge-muted text-xs">{col}</span>
                    ))}
                    {doc.collections.length > 2 && (
                        <span className="badge badge-muted text-xs">+{doc.collections.length - 2}</span>
                    )}
                </div>
            )}

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(doc.document_id)
                }}
                disabled={isDeleting}
                className="absolute top-3 right-3 p-2 rounded-lg bg-orion-bg-elevated opacity-0 group-hover:opacity-100 hover:bg-orion-error/20 hover:text-orion-error transition-fast"
            >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
        </div>
    )
}

function DocumentRow({ doc, Icon, color, bg, formatDate, onDelete, isDeleting }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-orion-bg-card border border-orion-border rounded-xl hover:border-orion-accent/30 transition-fast group">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-orion-text-primary truncate group-hover:text-orion-accent transition-fast">
                    {doc.name}
                </h3>
                <p className="text-xs text-orion-text-muted">
                    {doc.chunks || 0} chunks • {doc.doc_type || 'unknown'}
                    {doc.collections && doc.collections.length > 0 && ` • ${doc.collections.join(', ')}`}
                </p>
            </div>
            <div className="text-sm text-orion-text-muted">
                {formatDate(doc.created_at)}
            </div>
            <div className="flex items-center gap-1">
                <button className="btn-icon">
                    <Eye size={16} />
                </button>
                <button
                    onClick={() => onDelete(doc.document_id)}
                    disabled={isDeleting}
                    className="btn-icon hover:text-orion-error"
                >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
            </div>
        </div>
    )
}

function EmptyLibrary({ onUpload, hasDocuments }) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-orion-bg-card border border-orion-border flex items-center justify-center mb-6">
                <FolderOpen size={36} className="text-orion-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-orion-text-primary mb-2">
                {hasDocuments ? 'No matching documents' : 'No documents yet'}
            </h2>
            <p className="text-orion-text-secondary text-center max-w-md mb-6">
                {hasDocuments
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Upload documents to build your knowledge base. ORION supports PDFs, Word documents, images, and audio files.'
                }
            </p>
            {!hasDocuments && (
                <button onClick={onUpload} className="btn-primary">
                    Upload Your First Document
                </button>
            )}
        </div>
    )
}
