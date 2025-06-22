import { useState, useCallback } from 'react';

interface AsyncOperationState {
    loading: boolean;
    error: string | null;
}

export function useAsyncOperation() {
    const [state, setState] = useState<AsyncOperationState>({
        loading: false,
        error: null
    });

    const execute = useCallback(async <T>(
        operation: () => Promise<T>,
        onSuccess?: (result: T) => void,
        onError?: (error: string) => void
    ): Promise<T | null> => {
        setState({ loading: true, error: null });
        
        try {
            const result = await operation();
            setState({ loading: false, error: null });
            onSuccess?.(result);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setState({ loading: false, error: errorMessage });
            onError?.(errorMessage);
            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset
    };
} 