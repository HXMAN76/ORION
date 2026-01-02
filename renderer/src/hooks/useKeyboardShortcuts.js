import { useEffect, useCallback } from 'react'

/**
 * Hook for registering keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+enter': () => submitQuery(),
 *   'ctrl+k': () => focusSearch(),
 *   'escape': () => clearInput(),
 * })
 */
export function useKeyboardShortcuts(shortcuts) {
    const handleKeyDown = useCallback((event) => {
        const key = event.key.toLowerCase()
        const ctrl = event.ctrlKey || event.metaKey
        const shift = event.shiftKey
        const alt = event.altKey

        // Build key combination string
        let combo = ''
        if (ctrl) combo += 'ctrl+'
        if (shift) combo += 'shift+'
        if (alt) combo += 'alt+'
        combo += key

        const handler = shortcuts[combo]
        if (handler) {
            event.preventDefault()
            handler(event)
        }
    }, [shortcuts])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

export default useKeyboardShortcuts
