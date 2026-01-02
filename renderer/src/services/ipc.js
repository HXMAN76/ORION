/**
 * IPC service for Electron communication
 * Uses the preload-exposed window.electron API
 */
export const ipc = {
    /**
     * Open native file picker dialog
     * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
     */
    async openFileDialog() {
        if (typeof window !== 'undefined' && window.electron) {
            return window.electron.openFile()
        }
        // Fallback for development in browser
        console.warn('Electron IPC not available, using browser fallback')
        return { canceled: true, filePaths: [] }
    },

    /**
     * Open native folder picker dialog
     * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
     */
    async openFolderDialog() {
        if (typeof window !== 'undefined' && window.electron) {
            return window.electron.openFolder()
        }
        console.warn('Electron IPC not available, using browser fallback')
        return { canceled: true, filePaths: [] }
    },

    /**
     * Get application info
     * @returns {Promise<{version: string, name: string, platform: string}>}
     */
    async getAppInfo() {
        if (typeof window !== 'undefined' && window.electron) {
            return window.electron.getAppInfo()
        }
        return {
            version: '1.0.0',
            name: 'ORION',
            platform: 'browser'
        }
    },

    /**
     * Check if running in Electron
     */
    isElectron() {
        return typeof window !== 'undefined' && !!window.electron
    },

    /**
     * Get platform
     */
    getPlatform() {
        if (typeof window !== 'undefined' && window.electron) {
            return window.electron.platform
        }
        return 'browser'
    }
}

export default ipc
