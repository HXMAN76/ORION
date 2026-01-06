import {
    LayoutDashboard,
    Search,
    FolderOpen,
    Settings,
    FileText,
    Layers
} from 'lucide-react'
import useStore from '../../store/store'

/**
 * Sidebar - 240px minimalist navigation with glowing active states
 */
export default function Sidebar() {
    const {
        activeView,
        setActiveView,
        systemInfo,
        collections,
        documents
    } = useStore()

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'query', icon: Search, label: 'Query' },
        { id: 'collections', icon: FolderOpen, label: 'Collections' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <aside className="w-sidebar flex flex-col bg-orion-bg-panel border-r border-orion-border-DEFAULT">
            {/* Navigation */}
            <nav className="flex-1 py-4">
                <div className="px-3 mb-4">
                    <span className="mono text-[10px] uppercase tracking-wider text-orion-text-muted">
                        Navigation
                    </span>
                </div>

                <div className="space-y-1 px-2">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeView === item.id}
                            onClick={() => setActiveView(item.id)}
                        />
                    ))}
                </div>
            </nav>

            {/* Stats Footer */}
            <div className="p-4 border-t border-orion-border-DEFAULT">
                <div className="space-y-2">
                    <StatRow
                        icon={FileText}
                        label="Documents"
                        value={documents.length || systemInfo.totalDocuments || 0}
                    />
                    <StatRow
                        icon={Layers}
                        label="Chunks"
                        value={systemInfo.totalChunks || 0}
                    />
                    <StatRow
                        icon={FolderOpen}
                        label="Collections"
                        value={collections.length || 0}
                    />
                </div>
            </div>
        </aside>
    )
}

function NavItem({ icon: Icon, label, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-fast
                ${isActive
                    ? 'nav-active bg-orion-accent/10 text-orion-text-primary'
                    : 'text-orion-text-secondary hover:bg-orion-bg-hover hover:text-orion-text-primary'
                }
            `}
        >
            <Icon
                className={`w-5 h-5 ${isActive ? 'text-orion-accent' : ''}`}
                strokeWidth={1.5}
            />
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}

function StatRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-orion-text-muted" strokeWidth={1.5} />
                <span className="mono text-orion-text-muted">{label}</span>
            </div>
            <span className="mono text-orion-text-secondary">{value.toLocaleString()}</span>
        </div>
    )
}
