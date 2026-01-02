import {
    FileSearch,
    ScanEye,
    Scissors,
    GitBranch,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react'

/**
 * Ingestion Pipeline - Visual pipeline stages
 * Reading → OCR → Chunking → Embedding → Indexed
 */
export default function IngestionPipeline({ queue }) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-orion-text-secondary font-medium">
                Processing
            </p>

            {queue.map(item => (
                <PipelineItem key={item.id} item={item} />
            ))}
        </div>
    )
}

function PipelineItem({ item }) {
    const stages = [
        { id: 'reading', label: 'Reading', icon: FileSearch },
        { id: 'ocr', label: 'OCR', icon: ScanEye },
        { id: 'chunking', label: 'Chunking', icon: Scissors },
        { id: 'embedding', label: 'Embedding', icon: GitBranch },
        { id: 'indexed', label: 'Indexed', icon: CheckCircle2 },
    ]

    const currentStageIndex = stages.findIndex(s => s.id === item.stage)
    const isError = item.stage === 'error'

    return (
        <div className="p-4 bg-orion-bg-tertiary rounded-lg border border-orion-border">
            {/* File Name */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-orion-text-primary font-medium truncate max-w-[60%]">
                    {item.file}
                </span>

                {isError ? (
                    <span className="flex items-center gap-1.5 text-xs text-orion-error">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </span>
                ) : item.stage === 'indexed' ? (
                    <span className="flex items-center gap-1.5 text-xs text-orion-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                    </span>
                ) : (
                    <span className="mono text-xs text-orion-text-muted">
                        {item.progress}%
                    </span>
                )}
            </div>

            {/* Stage Indicators */}
            <div className="flex items-center gap-1">
                {stages.map((stage, index) => {
                    const Icon = stage.icon
                    const isPast = index < currentStageIndex
                    const isCurrent = index === currentStageIndex && !isError
                    const isFuture = index > currentStageIndex

                    return (
                        <div
                            key={stage.id}
                            className="flex items-center"
                        >
                            <div
                                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-fast
                  ${isPast ? 'bg-orion-success/20 text-orion-success' : ''}
                  ${isCurrent ? 'bg-orion-accent/20 text-orion-accent' : ''}
                  ${isFuture ? 'bg-orion-bg-elevated text-orion-text-muted' : ''}
                  ${isError && index === currentStageIndex ? 'bg-orion-error/20 text-orion-error' : ''}
                `}
                                title={stage.label}
                            >
                                {isCurrent && !isError ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </div>

                            {index < stages.length - 1 && (
                                <div
                                    className={`w-4 h-0.5 mx-0.5 transition-fast
                    ${isPast ? 'bg-orion-success' : 'bg-orion-bg-elevated'}
                  `}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Progress Bar */}
            {item.stage !== 'indexed' && !isError && (
                <div className="mt-3 h-1 bg-orion-bg-elevated rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orion-accent transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                    />
                </div>
            )}

            {/* Time Estimate */}
            {item.estimatedTime && item.stage !== 'indexed' && !isError && (
                <p className="mt-2 mono text-xs text-orion-text-muted">
                    ~{item.estimatedTime}s remaining
                </p>
            )}
        </div>
    )
}
