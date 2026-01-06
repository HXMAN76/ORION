import { useEffect, useState } from 'react'
import {
    Search,
    Upload,
    FolderPlus,
    Database,
    FileText,
    Layers,
    FolderOpen,
    Clock,
    ArrowRight
} from 'lucide-react'
import useStore from '../store/store'
import api from '../services/api'

/**
 * Dashboard - Bento-grid style landing page
 * "Mission Control" feel with stats and quick actions
 */
export default function Dashboard() {
    const {
        setActiveView,
        toggleIngestion,
        systemInfo,
        collections,
        documents,
        sessions
    } = useStore()

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="flex-1 overflow-y-auto scrollbar-orion bg-orion-bg-app">
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {/* Header */}
                <header className="pt-4">
                    <h1 className="text-2xl font-semibold text-orion-text-primary mb-1">
                        {getGreeting()}, <span className="text-gradient-amber">Analyst</span>
                    </h1>
                    <p className="mono text-orion-text-muted">{currentDate}</p>
                </header>

                {/* Stats Row */}
                <section>
                    <div className="grid grid-cols-3 gap-4">
                        <StatsCard
                            icon={FileText}
                            label="Documents"
                            value={documents.length || systemInfo.totalDocuments || 0}
                            gradient="amber"
                        />
                        <StatsCard
                            icon={Layers}
                            label="Chunks"
                            value={systemInfo.totalChunks || 0}
                            gradient="blue"
                        />
                        <StatsCard
                            icon={FolderOpen}
                            label="Collections"
                            value={collections.length || 0}
                            gradient="green"
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-sm font-medium text-orion-text-secondary mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionCard
                            icon={Search}
                            title="New Investigation"
                            description="Query your knowledge base"
                            onClick={() => setActiveView('query')}
                            accent
                        />
                        <ActionCard
                            icon={Upload}
                            title="Ingest Files"
                            description="Add documents to your knowledge base"
                            onClick={toggleIngestion}
                        />
                        <ActionCard
                            icon={FolderPlus}
                            title="Create Collection"
                            description="Organize documents into groups"
                            onClick={() => setActiveView('collections')}
                        />
                        <ActionCard
                            icon={Database}
                            title="Manage Data"
                            description="View and organize your documents"
                            onClick={() => setActiveView('collections')}
                        />
                    </div>
                </section>

                {/* Recent Activity */}
                <section>
                    <h2 className="text-sm font-medium text-orion-text-secondary mb-4">
                        Recent Queries
                    </h2>
                    <RecentActivity sessions={sessions} onViewAll={() => setActiveView('query')} />
                </section>
            </div>
        </div>
    )
}

function StatsCard({ icon: Icon, label, value, gradient = 'amber' }) {
    const gradientClasses = {
        amber: 'stat-gradient-amber',
        blue: 'stat-gradient-blue',
        green: 'stat-gradient-green',
        purple: 'stat-gradient-purple'
    }

    const iconColors = {
        amber: 'text-orion-accent',
        blue: 'text-orion-data-blue',
        green: 'text-orion-data-green',
        purple: 'text-orion-data-purple'
    }

    return (
        <div className={`card ${gradientClasses[gradient]} p-5`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg bg-orion-bg-elevated ${iconColors[gradient]}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-orion-text-primary mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                <p className="text-sm text-orion-text-muted">{label}</p>
            </div>
        </div>
    )
}

function ActionCard({ icon: Icon, title, description, onClick, accent = false }) {
    return (
        <button
            onClick={onClick}
            className={`
                group card p-5 text-left transition-all duration-200
                hover:border-orion-border-light hover:bg-orion-bg-card
                ${accent ? 'border-orion-border-accent bg-orion-accent/5' : ''}
            `}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`
                    p-2.5 rounded-lg transition-colors
                    ${accent
                        ? 'bg-orion-accent/20 text-orion-accent'
                        : 'bg-orion-bg-elevated text-orion-text-secondary group-hover:text-orion-accent'
                    }
                `}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <ArrowRight
                    className="w-4 h-4 text-orion-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    strokeWidth={1.5}
                />
            </div>
            <h3 className="text-sm font-semibold text-orion-text-primary mb-1">{title}</h3>
            <p className="text-xs text-orion-text-muted">{description}</p>
        </button>
    )
}

function RecentActivity({ sessions, onViewAll }) {
    const recentSessions = sessions.slice(-5).reverse()

    if (recentSessions.length === 0) {
        return (
            <div className="card p-8 text-center">
                <Clock className="w-8 h-8 text-orion-text-muted mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-orion-text-secondary mb-1">No recent queries</p>
                <p className="text-xs text-orion-text-muted">
                    Your recent investigations will appear here
                </p>
            </div>
        )
    }

    return (
        <div className="card divide-y divide-orion-border-DEFAULT">
            {recentSessions.map((session, index) => (
                <div key={session.id || index} className="p-4 hover:bg-orion-bg-hover transition-fast">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-orion-text-primary truncate mb-1">
                                {session.query}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="mono text-[11px] text-orion-text-muted">
                                    {new Date(session.timestamp).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {session.sources?.length > 0 && (
                                    <span className="mono text-[11px] text-orion-text-muted">
                                        {session.sources.length} sources
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {sessions.length > 5 && (
                <button
                    onClick={onViewAll}
                    className="w-full p-3 text-center text-xs text-orion-accent hover:bg-orion-bg-hover transition-fast"
                >
                    View all queries →
                </button>
            )}
        </div>
    )
}
