import { useState } from 'react'
import {
    FolderOpen,
    Search,
    Grid,
    List,
    MoreVertical,
    FileText,
    Image,
    Mic,
    Trash2,
    Eye,
    Plus
} from 'lucide-react'
import useStore from '../store/store'

/**
 * CollectionsManager - Document library view
 * Displays ingested documents with search and filter options
 */
export default function CollectionsManager() {
    const { documents, collections, toggleIngestion } = useStore()
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCollection, setSelectedCollection] = useState('all')

    // Filter documents
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCollection = selectedCollection === 'all' || doc.collection === selectedCollection
        return matchesSearch && matchesCollection
    })

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'pdf': return { icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' }
            case 'docx':
            case 'doc': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' }
            case 'png':
            case 'jpg':
            case 'jpeg': return { icon: Image, color: 'text-green-400', bg: 'bg-green-400/10' }
            case 'wav':
            case 'mp3': return { icon: Mic, color: 'text-purple-400', bg: 'bg-purple-400/10' }
            default: return { icon: FileText, color: 'text-orion-text-muted', bg: 'bg-orion-bg-elevated' }
        }
    }

    const formatDate = (date) => {
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

                    <button onClick={toggleIngestion} className="btn-primary flex items-center gap-2">
                        <Plus size={18} />
                        <span>Add Documents</span>
                    </button>
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
                    <select
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        className="input w-auto min-w-[160px]"
                    >
                        <option value="all">All Collections</option>
                        {collections.map((col) => (
                            <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                    </select>

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
                {filteredDocuments.length === 0 ? (
                    <EmptyLibrary onUpload={toggleIngestion} />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredDocuments.map((doc) => {
                            const { icon: Icon, color, bg } = getFileIcon(doc.name)
                            return (
                                <DocumentCard key={doc.id} doc={doc} Icon={Icon} color={color} bg={bg} />
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredDocuments.map((doc) => {
                            const { icon: Icon, color, bg } = getFileIcon(doc.name)
                            return (
                                <DocumentRow key={doc.id} doc={doc} Icon={Icon} color={color} bg={bg} formatDate={formatDate} />
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}

function DocumentCard({ doc, Icon, color, bg }) {
    return (
        <div className="card p-4 hover:border-orion-accent/30 transition-fast group cursor-pointer">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
            </div>
            <h3 className="font-medium text-orion-text-primary truncate mb-1 group-hover:text-orion-accent transition-fast">
                {doc.name}
            </h3>
            <p className="text-xs text-orion-text-muted">
                {doc.chunks || 0} chunks • {doc.collection || 'default'}
            </p>
        </div>
    )
}

function DocumentRow({ doc, Icon, color, bg, formatDate }) {
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
                    {doc.chunks || 0} chunks • {doc.collection || 'default'}
                </p>
            </div>
            <div className="text-sm text-orion-text-muted">
                {formatDate(doc.created_at || new Date())}
            </div>
            <div className="flex items-center gap-1">
                <button className="btn-icon">
                    <Eye size={16} />
                </button>
                <button className="btn-icon hover:text-orion-error">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}

function EmptyLibrary({ onUpload }) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-orion-bg-card border border-orion-border flex items-center justify-center mb-6">
                <FolderOpen size={36} className="text-orion-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-orion-text-primary mb-2">
                No documents yet
            </h2>
            <p className="text-orion-text-secondary text-center max-w-md mb-6">
                Upload documents to build your knowledge base. ORION supports PDFs, Word documents, images, and audio files.
            </p>
            <button onClick={onUpload} className="btn-primary">
                Upload Your First Document
            </button>
        </div>
    )
}
