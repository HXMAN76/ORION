import { useState, useCallback } from 'react'
import api from '../services/api'
import useStore from '../store/store'

/**
 * Custom hook for handling streaming responses from the backend
 * Manages token-by-token updates and citation handling
 */
export default function useStreamingResponse() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const { addMessage, appendToLastMessage, setStreaming } = useStore()

    /**
     * Send a query and stream the response
     */
    const sendQuery = useCallback(async (query, options = {}) => {
        setIsLoading(true)
        setError(null)
        setStreaming(true)

        // Add user message
        addMessage({
            role: 'user',
            content: query,
        })

        // Add empty AI message that we'll stream into
        addMessage({
            role: 'assistant',
            content: '',
            sources: [],
        })

        try {
            let sources = []

            for await (const chunk of api.queryStream(query, options)) {
                if (chunk.type === 'token') {
                    appendToLastMessage(chunk.content)
                } else if (chunk.type === 'sources') {
                    sources = chunk.content
                }
            }

            // Update the last message with sources if we got any
            if (sources.length > 0) {
                useStore.setState((state) => {
                    const messages = [...state.messages]
                    if (messages.length > 0) {
                        messages[messages.length - 1].sources = sources
                    }
                    return { messages }
                })
            }

        } catch (err) {
            setError(err.message)

            // Update the AI message with error
            useStore.setState((state) => {
                const messages = [...state.messages]
                if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
                    messages[messages.length - 1].content = `Error: ${err.message}`
                    messages[messages.length - 1].isError = true
                }
                return { messages }
            })
        } finally {
            setIsLoading(false)
            setStreaming(false)
        }
    }, [addMessage, appendToLastMessage, setStreaming])

    /**
     * Send a query without streaming (for simpler responses)
     */
    const sendQuerySync = useCallback(async (query, options = {}) => {
        setIsLoading(true)
        setError(null)

        addMessage({
            role: 'user',
            content: query,
        })

        try {
            const response = await api.query(query, options)

            addMessage({
                role: 'assistant',
                content: response.answer || response.response,
                sources: response.sources || [],
            })

            return response
        } catch (err) {
            setError(err.message)
            addMessage({
                role: 'assistant',
                content: `Error: ${err.message}`,
                isError: true,
            })
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [addMessage])

    return {
        sendQuery,
        sendQuerySync,
        isLoading,
        error,
        clearError: () => setError(null),
    }
}
