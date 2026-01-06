import { LayoutDashboard, FileText, MessageSquare, Cpu, Database, TrendingUp } from 'lucide-react'
import useStore from '../store/store'

/**
 * Dashboard - Overview view with system stats and quick actions
 */
export default function Dashboard() {
    const { systemInfo, backendStatus, documents, recentChats, toggleIngestion, setActiveView } = useStore()

    const stats = [
        {
            label: 'Documents',
            value: systemInfo.totalDocuments || documents.length,
            icon: FileText,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
        },
        {
            label: 'Chunks',
            value: systemInfo.totalChunks || 0,
            icon: Database,
            color: 'text-green-400',
            bg: 'bg-green-400/10',
        },
        {
            label: 'Conversations',
            value: recentChats.length,
            icon: MessageSquare,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
        {
            label: 'LLM Status',
            value: systemInfo.llmAvailable ? 'Online' : 'Offline',
            icon: Cpu,
            color: systemInfo.llmAvailable ? 'text-orion-success' : 'text-orion-error',
            bg: systemInfo.llmAvailable ? 'bg-orion-success/10' : 'bg-orion-error/10',
        },
    ]

    const quickActions = [
        {
            label: 'Start Chat',
            description: 'Ask questions about your documents',
            icon: MessageSquare,
            action: () => setActiveView('chat'),
            primary: true,
        },
        {
            label: 'Upload Documents',
            description: 'Add files to your knowledge base',
            icon: FileText,
            action: toggleIngestion,
        },
        {
            label: 'View Library',
            description: 'Browse your document collection',
            icon: Database,
            action: () => setActiveView('documents'),
        },
    ]

    return (
        <main className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-orion-border flex-shrink-0">
                <div className="flex items-center gap-3">
                    <LayoutDashboard size={24} className="text-orion-accent" />
                    <div>
                        <h1 className="text-xl font-semibold text-orion-text-primary">Dashboard</h1>
                        <p className="text-sm text-orion-text-muted">
                            Welcome to your offline intelligence workspace
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Stats Grid */}
                    <section>
                        <h2 className="text-sm font-medium text-orion-text-muted uppercase tracking-wider mb-4">
                            Overview
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat) => {
                                const Icon = stat.icon
                                return (
                                    <div key={stat.label} className="card p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                                <Icon size={20} className={stat.color} />
                                            </div>
                                            <TrendingUp size={14} className="text-orion-text-muted" />
                                        </div>
                                        <p className="text-2xl font-bold text-orion-text-primary mb-1">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-orion-text-muted">{stat.label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section>
                        <h2 className="text-sm font-medium text-orion-text-muted uppercase tracking-wider mb-4">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={action.label}
                                        onClick={action.action}
                                        className={`p-6 rounded-2xl text-left transition-fast group ${action.primary
                                                ? 'bg-gradient-to-br from-orion-accent/20 to-orion-accent/5 border border-orion-accent/30 hover:border-orion-accent/50'
                                                : 'bg-orion-bg-card border border-orion-border hover:border-orion-accent/30'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${action.primary ? 'bg-orion-accent/20' : 'bg-orion-bg-elevated'
                                            }`}>
                                            <Icon size={24} className={action.primary ? 'text-orion-accent' : 'text-orion-text-secondary'} />
                                        </div>
                                        <h3 className="font-semibold text-orion-text-primary mb-1 group-hover:text-orion-accent transition-fast">
                                            {action.label}
                                        </h3>
                                        <p className="text-sm text-orion-text-muted">
                                            {action.description}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* System Status */}
                    <section>
                        <h2 className="text-sm font-medium text-orion-text-muted uppercase tracking-wider mb-4">
                            System Status
                        </h2>
                        <div className="card p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <StatusItem
                                    label="Backend"
                                    status={backendStatus}
                                    value={backendStatus === 'connected' ? 'Online' : 'Offline'}
                                />
                                <StatusItem
                                    label="LLM Model"
                                    status={systemInfo.llmAvailable ? 'connected' : 'disconnected'}
                                    value={systemInfo.llmModel || 'Not loaded'}
                                />
                                <StatusItem
                                    label="Vector DB"
                                    status="connected"
                                    value="ChromaDB"
                                />
                                <StatusItem
                                    label="Mode"
                                    status="connected"
                                    value="Offline"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    {recentChats.length > 0 && (
                        <section>
                            <h2 className="text-sm font-medium text-orion-text-muted uppercase tracking-wider mb-4">
                                Recent Conversations
                            </h2>
                            <div className="space-y-2">
                                {recentChats.slice(0, 5).map((chat) => (
                                    <button
                                        key={chat.id}
                                        className="w-full flex items-center gap-4 p-4 bg-orion-bg-card border border-orion-border rounded-xl hover:border-orion-accent/30 transition-fast text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orion-bg-elevated flex items-center justify-center flex-shrink-0">
                                            <MessageSquare size={18} className="text-orion-text-muted group-hover:text-orion-accent transition-fast" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-orion-text-primary truncate group-hover:text-orion-accent transition-fast">
                                                {chat.title}
                                            </p>
                                            <p className="text-xs text-orion-text-muted">
                                                {new Date(chat.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    )
}

function StatusItem({ label, status, value }) {
    const getStatusClass = () => {
        switch (status) {
            case 'connected': return 'status-dot-connected'
            case 'disconnected': return 'status-dot-disconnected'
            default: return 'status-dot-checking'
        }
    }

    return (
        <div>
            <p className="text-xs text-orion-text-muted mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <div className={`status-dot ${getStatusClass()}`} />
                <span className="text-sm font-medium text-orion-text-primary">{value}</span>
            </div>
        </div>
    )
}
