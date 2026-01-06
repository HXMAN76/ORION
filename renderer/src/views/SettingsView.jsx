import { useState } from 'react'
import { Settings, Sliders, Database, Cpu, Info, Save, RotateCcw } from 'lucide-react'
import useStore from '../store/store'

/**
 * SettingsView - Application settings and configuration
 */
export default function SettingsView() {
    const { settings, updateSettings, systemInfo } = useStore()
    const [localSettings, setLocalSettings] = useState(settings)
    const [hasChanges, setHasChanges] = useState(false)

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = () => {
        updateSettings(localSettings)
        setHasChanges(false)
    }

    const handleReset = () => {
        setLocalSettings(settings)
        setHasChanges(false)
    }

    return (
        <div className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-orion-border-DEFAULT bg-orion-bg-panel">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orion-data-purple/20">
                        <Settings className="w-4 h-4 text-orion-data-purple" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-orion-text-primary">
                            Settings
                        </h1>
                        <p className="mono text-[11px] text-orion-text-muted">
                            Configure ORION behavior
                        </p>
                    </div>
                </div>

                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="btn-ghost text-sm">
                            <RotateCcw className="w-4 h-4 mr-2" strokeWidth={1.5} />
                            Reset
                        </button>
                        <button onClick={handleSave} className="btn-primary text-sm">
                            <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                            Save Changes
                        </button>
                    </div>
                )}
            </header>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto scrollbar-orion">
                <div className="max-w-2xl mx-auto p-6 space-y-6">
                    {/* Query Settings */}
                    <SettingsSection
                        icon={Sliders}
                        title="Query Settings"
                        description="Configure how queries are processed"
                    >
                        <SettingsRow label="Top-K Results" description="Number of similar chunks to retrieve">
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={localSettings.topK}
                                    onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                                    className="w-32 accent-orion-accent"
                                />
                                <span className="mono text-sm text-orion-accent w-6">{localSettings.topK}</span>
                            </div>
                        </SettingsRow>
                    </SettingsSection>

                    {/* Processing Settings */}
                    <SettingsSection
                        icon={Database}
                        title="Processing Settings"
                        description="Configure document ingestion"
                    >
                        <SettingsRow label="Chunk Size" description="Target size for document chunks">
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="128"
                                    max="2048"
                                    step="64"
                                    value={localSettings.chunkSize}
                                    onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                                    className="w-32 accent-orion-accent"
                                />
                                <span className="mono text-sm text-orion-text-secondary w-12">{localSettings.chunkSize}</span>
                            </div>
                        </SettingsRow>

                        <SettingsRow label="Overlap Size" description="Overlap between chunks">
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="256"
                                    step="16"
                                    value={localSettings.overlapSize}
                                    onChange={(e) => handleChange('overlapSize', parseInt(e.target.value))}
                                    className="w-32 accent-orion-accent"
                                />
                                <span className="mono text-sm text-orion-text-secondary w-12">{localSettings.overlapSize}</span>
                            </div>
                        </SettingsRow>

                        <SettingsRow label="Enable Vision" description="Process images with vision models">
                            <ToggleSwitch
                                enabled={localSettings.enableVision}
                                onChange={(val) => handleChange('enableVision', val)}
                            />
                        </SettingsRow>

                        <SettingsRow label="Enable Audio" description="Process audio files with transcription">
                            <ToggleSwitch
                                enabled={localSettings.enableAudio}
                                onChange={(val) => handleChange('enableAudio', val)}
                            />
                        </SettingsRow>
                    </SettingsSection>

                    {/* System Info */}
                    <SettingsSection
                        icon={Info}
                        title="System Information"
                        description="Current system status"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <InfoCard label="LLM Model" value={systemInfo.llmModel || 'Not loaded'} />
                            <InfoCard label="Embedding Model" value={systemInfo.embeddingModel || 'Default'} />
                            <InfoCard label="Vector DB" value={systemInfo.vectorDbStatus || 'Offline'} />
                            <InfoCard label="Total Chunks" value={systemInfo.totalChunks?.toLocaleString() || '0'} />
                        </div>
                    </SettingsSection>
                </div>
            </div>
        </div>
    )
}

function SettingsSection({ icon: Icon, title, description, children }) {
    return (
        <div className="card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-orion-border-DEFAULT">
                <Icon className="w-5 h-5 text-orion-accent" strokeWidth={1.5} />
                <div>
                    <h2 className="text-sm font-semibold text-orion-text-primary">{title}</h2>
                    <p className="text-xs text-orion-text-muted">{description}</p>
                </div>
            </div>
            <div className="p-5 space-y-4">
                {children}
            </div>
        </div>
    )
}

function SettingsRow({ label, description, children }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-sm text-orion-text-primary">{label}</p>
                <p className="text-xs text-orion-text-muted">{description}</p>
            </div>
            {children}
        </div>
    )
}

function ToggleSwitch({ enabled, onChange }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-orion-accent' : 'bg-orion-bg-elevated'}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'}`}
            />
        </button>
    )
}

function InfoCard({ label, value }) {
    return (
        <div className="p-3 bg-orion-bg-card rounded-lg">
            <p className="text-xs text-orion-text-muted mb-1">{label}</p>
            <p className="text-sm text-orion-text-primary font-medium truncate">{value}</p>
        </div>
    )
}
