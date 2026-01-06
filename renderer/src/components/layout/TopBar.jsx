import {
    Activity,
    Database,
    Cpu,
    Layers,
    Loader2,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react'
import useStore from '../../store/store'

/**
 * TopBar - Slim 36px status bar with system awareness
 * Electron drag region with status indicators
 */
export default function TopBar() {
    const {
        backendStatus,
        systemInfo,
        processingQueue,
        isContextPanelOpen,
        toggleContextPanel
    } = useStore()

    const queueCount = processingQueue.length
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })

    return (
        <header className="h-topbar flex items-center justify-between px-4 bg-orion-bg-panel border-b border-orion-border-DEFAULT select-none drag-region">
            {/* Left: App Name + Backend Status */}
            <div className="flex items-center gap-4 no-drag">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-orion-accent to-orion-accent-dark flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">O</span>
                    </div>
                    <span className="font-semibold text-sm tracking-wide text-orion-text-primary">
                        ORION
                    </span>
                </div>
                <div className="h-3 w-px bg-orion-border-light" />
                <StatusIndicator status={backendStatus} />
            </div>

            {/* Center: Model Info */}
            <div className="flex items-center gap-6 no-drag">
                <ModelInfo
                    icon={Cpu}
                    label="LLM"
                    value={systemInfo.llmModel || 'Offline'}
                    isActive={systemInfo.llmAvailable}
                />
                <ModelInfo
                    icon={Database}
                    label="VectorDB"
                    value={systemInfo.vectorDbStatus || 'Offline'}
                    isActive={systemInfo.vectorDbStatus === 'Online'}
                />
                <ModelInfo
                    icon={Layers}
                    label="Chunks"
                    value={systemInfo.totalChunks?.toLocaleString() || '0'}
                />
            </div>

            {/* Right: Queue + Time + Panel Toggle */}
            <div className="flex items-center gap-3 no-drag">
                {queueCount > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-orion-accent/10 border border-orion-border-accent">
                        <Loader2 className="w-3 h-3 text-orion-accent animate-spin" />
                        <span className="mono text-orion-accent">{queueCount} processing</span>
                    </div>
                )}

                <span className="mono text-orion-text-muted">{currentTime}</span>

                <button
                    onClick={toggleContextPanel}
                    className="p-1.5 rounded hover:bg-orion-bg-hover transition-fast"
                    title={isContextPanelOpen ? 'Hide Panel' : 'Show Panel'}
                >
                    {isContextPanelOpen ? (
                        <PanelRightClose className="w-4 h-4 text-orion-text-secondary" strokeWidth={1.5} />
                    ) : (
                        <PanelRightOpen className="w-4 h-4 text-orion-text-secondary" strokeWidth={1.5} />
                    )}
                </button>
            </div>
        </header>
    )
}

function StatusIndicator({ status }) {
    const statusConfig = {
        connected: {
            color: 'status-dot-connected',
            text: 'Online',
            textColor: 'text-orion-success'
        },
        disconnected: {
            color: 'status-dot-disconnected',
            text: 'Offline',
            textColor: 'text-orion-error'
        },
        checking: {
            color: 'status-dot-checking',
            text: 'Connecting...',
            textColor: 'text-orion-warning'
        },
    }

    const config = statusConfig[status] || statusConfig.disconnected

    return (
        <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-orion-text-muted" strokeWidth={1.5} />
            <span className={`status-dot ${config.color}`} />
            <span className={`mono ${config.textColor}`}>{config.text}</span>
        </div>
    )
}

function ModelInfo({ icon: Icon, label, value, isActive }) {
    return (
        <div className="flex items-center gap-2">
            <Icon
                className={`w-3 h-3 ${isActive ? 'text-orion-accent' : 'text-orion-text-muted'}`}
                strokeWidth={1.5}
            />
            <span className="mono text-orion-text-muted">{label}:</span>
            <span className={`mono ${isActive ? 'text-orion-text-primary' : 'text-orion-text-secondary'}`}>
                {value}
            </span>
        </div>
    )
}
