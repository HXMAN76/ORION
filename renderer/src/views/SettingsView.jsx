import { useState, useEffect } from 'react'
import { Settings, Server, Brain, Sliders, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import useStore from '../store/store'
import api from '../services/api'

/**
 * SettingsView - Configuration options
 * Model selection, chunk size, and Ollama status
 */
export default function SettingsView() {
    const { settings, updateSettings, backendStatus } = useStore()
    const [ollamaStatus, setOllamaStatus] = useState('checking')
    const [availableModels, setAvailableModels] = useState({
        llm: ['mistral', 'llama3', 'phi3', 'gemma'],
        vision: ['llava', 'bakllava', 'llava-phi3'],
    })

    // Check Ollama status
    useEffect(() => {
        const checkOllama = async () => {
            try {
                const modelStatus = await api.getModelStatus()
                setOllamaStatus(modelStatus.ollama_available ? 'connected' : 'disconnected')

                if (modelStatus.available_models) {
                    setAvailableModels(modelStatus.available_models)
                }
            } catch {
                setOllamaStatus('disconnected')
            }
        }

        if (backendStatus === 'connected') {
            checkOllama()
        }
    }, [backendStatus])

    const handleSettingChange = (key, value) => {
        updateSettings({ [key]: value })
    }

    return (
        <main className="flex-1 flex flex-col bg-orion-bg-app overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-orion-border flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Settings size={24} className="text-orion-accent" />
                    <div>
                        <h1 className="text-xl font-semibold text-orion-text-primary">Settings</h1>
                        <p className="text-sm text-orion-text-muted">Configure ORION to your preferences</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                <div className="max-w-2xl space-y-6">
                    {/* Ollama Status */}
                    <section className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Server size={20} className="text-orion-accent" />
                            <h2 className="font-semibold text-orion-text-primary">Ollama Status</h2>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-orion-bg-elevated rounded-xl">
                            <div className="flex items-center gap-3">
                                {ollamaStatus === 'checking' && (
                                    <Loader2 size={20} className="text-orion-warning animate-spin" />
                                )}
                                {ollamaStatus === 'connected' && (
                                    <CheckCircle size={20} className="text-orion-success" />
                                )}
                                {ollamaStatus === 'disconnected' && (
                                    <XCircle size={20} className="text-orion-error" />
                                )}
                                <div>
                                    <p className="font-medium text-orion-text-primary">
                                        {ollamaStatus === 'checking' && 'Checking connection...'}
                                        {ollamaStatus === 'connected' && 'Ollama is running'}
                                        {ollamaStatus === 'disconnected' && 'Ollama not available'}
                                    </p>
                                    <p className="text-sm text-orion-text-muted">
                                        {settings.ollamaEndpoint}
                                    </p>
                                </div>
                            </div>

                            <div className={`status-dot ${ollamaStatus === 'connected' ? 'status-dot-connected' :
                                    ollamaStatus === 'disconnected' ? 'status-dot-disconnected' :
                                        'status-dot-checking'
                                }`} />
                        </div>
                    </section>

                    {/* Model Selection */}
                    <section className="card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain size={20} className="text-orion-accent" />
                            <h2 className="font-semibold text-orion-text-primary">Model Selection</h2>
                        </div>

                        <div className="space-y-6">
                            {/* LLM Model */}
                            <div>
                                <label className="block text-sm font-medium text-orion-text-secondary mb-2">
                                    Language Model (LLM)
                                </label>
                                <select
                                    value={settings.llmModel}
                                    onChange={(e) => handleSettingChange('llmModel', e.target.value)}
                                    className="input"
                                >
                                    {availableModels.llm.map((model) => (
                                        <option key={model} value={model}>
                                            {model.charAt(0).toUpperCase() + model.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-orion-text-muted mt-2">
                                    Primary model for text generation and question answering
                                </p>
                            </div>

                            {/* Vision Model */}
                            <div>
                                <label className="block text-sm font-medium text-orion-text-secondary mb-2">
                                    Vision Model
                                </label>
                                <select
                                    value={settings.visionModel}
                                    onChange={(e) => handleSettingChange('visionModel', e.target.value)}
                                    className="input"
                                >
                                    {availableModels.vision.map((model) => (
                                        <option key={model} value={model}>
                                            {model.charAt(0).toUpperCase() + model.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-orion-text-muted mt-2">
                                    Model for processing images and visual content
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Chunk Configuration */}
                    <section className="card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Sliders size={20} className="text-orion-accent" />
                            <h2 className="font-semibold text-orion-text-primary">Processing Settings</h2>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-orion-text-secondary">
                                    Chunk Size (tokens)
                                </label>
                                <span className="text-sm font-mono text-orion-accent">{settings.chunkSize}</span>
                            </div>

                            <input
                                type="range"
                                min="256"
                                max="2048"
                                step="128"
                                value={settings.chunkSize}
                                onChange={(e) => handleSettingChange('chunkSize', parseInt(e.target.value))}
                                className="w-full h-2 bg-orion-bg-elevated rounded-full appearance-none cursor-pointer accent-orion-accent"
                            />

                            <div className="flex justify-between text-xs text-orion-text-muted mt-2">
                                <span>256</span>
                                <span>1024</span>
                                <span>2048</span>
                            </div>

                            <p className="text-xs text-orion-text-muted mt-4">
                                Smaller chunks provide more precise retrieval but may lose context.
                                Larger chunks preserve more context but may include irrelevant information.
                            </p>
                        </div>
                    </section>

                    {/* Backend Endpoint */}
                    <section className="card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Server size={20} className="text-orion-accent" />
                            <h2 className="font-semibold text-orion-text-primary">Backend Configuration</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-orion-text-secondary mb-2">
                                Ollama Endpoint
                            </label>
                            <input
                                type="text"
                                value={settings.ollamaEndpoint}
                                onChange={(e) => handleSettingChange('ollamaEndpoint', e.target.value)}
                                placeholder="http://localhost:11434"
                                className="input"
                            />
                            <p className="text-xs text-orion-text-muted mt-2">
                                URL where your local Ollama instance is running
                            </p>
                        </div>
                    </section>

                    {/* About */}
                    <section className="card p-6">
                        <h2 className="font-semibold text-orion-text-primary mb-4">About ORION</h2>
                        <div className="space-y-2 text-sm text-orion-text-secondary">
                            <p>Version: 1.0.0</p>
                            <p>Offline Multimodal RAG System</p>
                            <p className="text-orion-text-muted">
                                Built with Electron, React, and FastAPI. All processing happens locally on your machine.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
