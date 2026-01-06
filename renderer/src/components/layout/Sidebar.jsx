import { MessageSquare, FolderOpen, Settings, Plus, Clock } from 'lucide-react'
import useStore from '../../store/store'

/**
 * Sidebar - Left navigation panel
 * Contains logo, new chat button, navigation menu, and recent chat history
 */
export default function Sidebar() {
    const {
        activeView,
        setActiveView,
        recentChats,
        startNewChat,
        toggleIngestion
    } = useStore()

    const navItems = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'documents', label: 'Library', icon: FolderOpen },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    const formatTimeAgo = (date) => {
        const now = new Date()
        const diff = now - new Date(date)
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <aside className="w-sidebar flex flex-col bg-orion-bg-app border-r border-orion-border">
            {/* Logo Area */}
            <div className="p-5 border-b border-orion-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orion-accent to-orion-accent-dark flex items-center justify-center shadow-lg shadow-orion-accent/20">
                        <span className="text-orion-bg-app font-bold text-lg">O</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-orion-text-primary text-lg tracking-wide">ORION</h1>
                        <p className="text-orion-text-muted text-xs">Multimodal RAG</p>
                    </div>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
                <button
                    onClick={startNewChat}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="px-3">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveView(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-fast ${isActive
                                            ? 'nav-active text-orion-text-primary'
                                            : 'text-orion-text-secondary hover:text-orion-text-primary hover:bg-orion-bg-hover'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-orion-accent' : ''} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Divider */}
            <div className="my-4 mx-4 border-t border-orion-border" />

            {/* Quick Actions */}
            <div className="px-4 mb-4">
                <button
                    onClick={toggleIngestion}
                    className="btn-secondary w-full text-sm"
                >
                    Upload Documents
                </button>
            </div>

            {/* Recent Chats */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-2 flex items-center gap-2">
                    <Clock size={14} className="text-orion-text-muted" />
                    <span className="text-xs font-medium text-orion-text-muted uppercase tracking-wider">Recent Chats</span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
                    <ul className="space-y-0.5">
                        {recentChats.map((chat) => (
                            <li key={chat.id}>
                                <button
                                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-orion-text-secondary hover:text-orion-text-primary hover:bg-orion-bg-hover transition-fast group"
                                >
                                    <p className="truncate font-medium">{chat.title}</p>
                                    <p className="text-xs text-orion-text-muted mt-0.5 group-hover:text-orion-text-secondary">
                                        {formatTimeAgo(chat.timestamp)}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-orion-border">
                <div className="flex items-center justify-between text-xs text-orion-text-muted">
                    <span>v1.0.0</span>
                    <span>Offline Mode</span>
                </div>
            </div>
        </aside>
    )
}
