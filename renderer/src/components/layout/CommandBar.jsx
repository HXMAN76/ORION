import {
    Activity,
    Database,
    Cpu,
    Layers,
    Loader2,
    Settings,
    Plus
} from 'lucide-react'
import useStore from '../../store/store'

/**
 * Top Command Bar - System status and model information
 * NOT a navigation bar - shows system-level awareness
 */
export default function CommandBar() {
    const {
        backendStatus,
        systemInfo,
        processingQueue,
        toggleSettings,
        toggleIngestion
    } = useStore()

    const queueCount = processingQueue.length

    return (
        <header className="h-command-bar flex items-center justify-between px-4 bg-orion-bg-secondary border-b border-orion-border select-none">
            {/* Left: App Name + Backend Status */}
            <div className="flex items-center gap-4">
                <span className="font-semibold text-sm tracking-wide text-orion-text-primary">
                    ORION
                </span>
                <div className="h-4 w-px bg-orion-border" />
                <StatusIndicator status={backendStatus} />
            </div>

            {/* Center: Model Info */}
            <div className="flex items-center gap-6">
                <ModelInfo
                    icon={Cpu}
                    label="LLM"
                    value={systemInfo.llmModel || 'Not loaded'}
                />
                <ModelInfo
                    icon={Layers}
                    label="Embedding"
                    value={systemInfo.embeddingModel || 'Not loaded'}
                />
                <ModelInfo
                    icon={Database}
                    label="Vector DB"
                    value={systemInfo.vectorDbStatus || 'Offline'}
                />
            </div>

            {/* Right: Queue + Actions */}
            <div className="flex items-center gap-3">
                {queueCount > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-orion-bg-tertiary">
                        <Loader2 className="w-3 h-3 text-orion-accent animate-spin" />
                        <span className="mono">{queueCount} processing</span>
                    </div>
                )}

                <button
                    onClick={toggleIngestion}
                    className="p-1.5 rounded hover:bg-orion-bg-tertiary transition-fast"
                    title="Ingest Files"
                >
                    <Plus className="w-4 h-4 text-orion-text-secondary" />
                </button>

                <button
                    onClick={toggleSettings}
                    className="p-1.5 rounded hover:bg-orion-bg-tertiary transition-fast"
                    title="Settings"
                >
                    <Settings className="w-4 h-4 text-orion-text-secondary" />
                </button>
            </div>
        </header>
    )
}

function StatusIndicator({ status }) {
    const statusConfig = {
        connected: {
            color: 'status-dot-connected',
            text: 'Connected'
        },
        disconnected: {
            color: 'status-dot-disconnected',
            text: 'Disconnected'
        },
        checking: {
            color: 'status-dot-checking',
            text: 'Checking...'
        },
    }

    const config = statusConfig[status] || statusConfig.disconnected

    return (
        <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-orion-text-muted" />
            <span className={`status-dot ${config.color}`} />
            <span className="mono">{config.text}</span>
        </div>
    )
}

function ModelInfo({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-3 h-3 text-orion-text-muted" />
            <span className="mono text-orion-text-muted">{label}:</span>
            <span className="mono text-orion-text-secondary">{value}</span>
        </div>
    )
}
