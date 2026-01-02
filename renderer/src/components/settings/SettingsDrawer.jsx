import { X, Settings, Info } from 'lucide-react'
import useStore from '../../store/store'

/**
 * Settings Drawer - Dense technical configuration
 * Side drawer with form layout, not consumer-friendly
 */
export default function SettingsDrawer() {
    const { isSettingsOpen, toggleSettings, settings, updateSettings } = useStore()

    if (!isSettingsOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={toggleSettings}
            />

            {/* Drawer */}
            <aside className="fixed top-0 right-0 z-50 w-[400px] h-full bg-orion-bg-secondary border-l border-orion-border shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-5 py-4 border-b border-orion-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orion-accent" />
                        <h2 className="text-lg font-semibold text-orion-text-primary">
                            Configuration
                        </h2>
                    </div>
                    <button
                        onClick={toggleSettings}
                        className="p-1.5 rounded hover:bg-orion-bg-tertiary transition-fast"
                    >
                        <X className="w-5 h-5 text-orion-text-muted" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">

                    {/* Retrieval Settings */}
                    <SettingsSection title="Retrieval Parameters">
                        <SettingsField
                            label="Chunk Size"
                            description="Token count per document chunk"
                        >
                            <NumberInput
                                value={settings.chunkSize}
                                onChange={(v) => updateSettings({ chunkSize: v })}
                                min={128}
                                max={2048}
                                step={64}
                            />
                        </SettingsField>

                        <SettingsField
                            label="Overlap Size"
                            description="Token overlap between chunks"
                        >
                            <NumberInput
                                value={settings.overlapSize}
                                onChange={(v) => updateSettings({ overlapSize: v })}
                                min={0}
                                max={256}
                                step={10}
                            />
                        </SettingsField>

                        <SettingsField
                            label="Top-K Results"
                            description="Number of chunks to retrieve"
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    value={settings.topK}
                                    onChange={(e) => updateSettings({ topK: parseInt(e.target.value) })}
                                    min={1}
                                    max={20}
                                    className="flex-1 h-1.5 bg-orion-bg-tertiary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orion-accent"
                                />
                                <span className="mono text-sm text-orion-text-primary w-8 text-right">
                                    {settings.topK}
                                </span>
                            </div>
                        </SettingsField>
                    </SettingsSection>

                    {/* Pipeline Settings */}
                    <SettingsSection title="Processing Pipelines">
                        <SettingsField
                            label="Vision Pipeline"
                            description="Enable OCR and image analysis"
                        >
                            <Toggle
                                checked={settings.enableVision}
                                onChange={(v) => updateSettings({ enableVision: v })}
                            />
                        </SettingsField>

                        <SettingsField
                            label="Audio Pipeline"
                            description="Enable speech-to-text processing"
                        >
                            <Toggle
                                checked={settings.enableAudio}
                                onChange={(v) => updateSettings({ enableAudio: v })}
                            />
                        </SettingsField>
                    </SettingsSection>

                    {/* Info */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-orion-bg-tertiary border border-orion-border">
                        <Info className="w-4 h-4 text-orion-text-muted shrink-0 mt-0.5" />
                        <p className="text-xs text-orion-text-muted leading-relaxed">
                            Changes take effect immediately. Existing indexed documents will not be re-processed unless manually reindexed.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-5 py-4 border-t border-orion-border shrink-0">
                    <button
                        onClick={() => updateSettings({
                            chunkSize: 512,
                            overlapSize: 50,
                            topK: 5,
                            enableVision: true,
                            enableAudio: true,
                        })}
                        className="w-full px-4 py-2 text-sm text-orion-text-secondary rounded-lg border border-orion-border hover:bg-orion-bg-tertiary transition-fast"
                    >
                        Reset to Defaults
                    </button>
                </footer>
            </aside>
        </>
    )
}

function SettingsSection({ title, children }) {
    return (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-orion-text-muted mb-4">
                {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}

function SettingsField({ label, description, children }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium text-orion-text-primary">{label}</p>
                {description && (
                    <p className="text-xs text-orion-text-muted mt-0.5">{description}</p>
                )}
            </div>
            <div className="shrink-0">
                {children}
            </div>
        </div>
    )
}

function NumberInput({ value, onChange, min, max, step }) {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || min)}
            min={min}
            max={max}
            step={step}
            className="w-20 px-2 py-1 bg-orion-bg-tertiary border border-orion-border rounded text-sm text-orion-text-primary text-right font-mono outline-none focus:border-orion-accent transition-fast"
        />
    )
}

function Toggle({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5 rounded-full transition-fast
        ${checked ? 'bg-orion-accent' : 'bg-orion-bg-elevated'}`}
        >
            <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-fast
          ${checked ? 'left-5' : 'left-0.5'}`}
            />
        </button>
    )
}
