# Análise de Duplicações de Código - DominoMania App

## Resumo Executivo

Identificamos múltiplas duplicações de código no projeto que violam o princípio DRY (Don't Repeat Yourself). Estas duplicações estão principalmente em:

1. **Componentes de UI** (Loading, Error, Empty states)
2. **Estilos Styled Components** (containers, botões, textos)
3. **Funções utilitárias** (formatação de datas)
4. **Hooks e estados** (loading, error patterns)
5. **Componentes duplicados** (PlayerAvatar, TextInput)

## 1. Estados de Loading, Error e Empty

### Problema Identificado
Estes padrões aparecem em **mais de 50 arquivos** com implementações idênticas:

```typescript
// LoadingContainer - 50+ ocorrências
const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

// ErrorContainer - 6+ ocorrências  
const ErrorContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

// EmptyContainer - 20+ ocorrências
const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;
```

### Refatoração Sugerida

#### 1.1 Criar Componentes Reutilizáveis

```typescript
// src-new/core/components/feedback/LoadingState.tsx
import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
    message = 'Carregando...', 
    size = 'large' 
}) => {
    const { colors } = useTheme();
    
    return (
        <Container>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <LoadingText>{message}</LoadingText>}
        </Container>
    );
};

const LoadingText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
    margin-top: 12px;
    text-align: center;
`;
```

```typescript
// src-new/core/components/feedback/ErrorState.tsx
import React from 'react';
import styled from 'styled-components/native';
import { Button } from '@/core/components/ui/Button';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorText = styled.Text`
    color: ${({ theme }) => theme.colors.error};
    font-size: 16px;
    text-align: center;
    margin-bottom: 16px;
`;

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
    message, 
    onRetry, 
    retryText = 'Tentar Novamente' 
}) => {
    return (
        <Container>
            <ErrorText>{message}</ErrorText>
            {onRetry && (
                <Button onPress={onRetry} variant="secondary">
                    {retryText}
                </Button>
            )}
        </Container>
    );
};
```

```typescript
// src-new/core/components/feedback/EmptyState.tsx
import React from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyIcon = styled.View`
    margin-bottom: 16px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
`;

interface EmptyStateProps {
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    message, 
    icon = 'document-outline',
    iconSize = 48 
}) => {
    const { colors } = useTheme();
    
    return (
        <Container>
            <EmptyIcon>
                <Ionicons name={icon} size={iconSize} color={colors.textSecondary} />
            </EmptyIcon>
            <EmptyText>{message}</EmptyText>
        </Container>
    );
};
```

#### 1.2 Criar Hook Personalizado para Estados

```typescript
// src-new/core/hooks/useAsyncState.ts
import { useState, useCallback } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function useAsyncState<T>(initialData: T | null = null) {
    const [state, setState] = useState<AsyncState<T>>({
        data: initialData,
        loading: false,
        error: null
    });

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false }));
    }, []);

    const setData = useCallback((data: T) => {
        setState(prev => ({ ...prev, data, loading: false, error: null }));
    }, []);

    const reset = useCallback(() => {
        setState({ data: initialData, loading: false, error: null });
    }, [initialData]);

    return {
        ...state,
        setLoading,
        setError,
        setData,
        reset
    };
}
```

## 2. Componentes Styled Components Duplicados

### Problema Identificado
Múltiplos componentes com estilos idênticos:

#### 2.1 PlayerAvatar Duplicado
- `src/components/PlayerAvatar.tsx`
- `src/components/data-display/PlayerAvatar.tsx`
- `src-new/core/components/data-display/PlayerAvatar.tsx`

#### 2.2 TextInput Duplicado
- `src/components/TextInput.tsx`
- `src/components/ui/TextInput.tsx`
- `src-new/core/components/ui/TextInput.tsx`

### Refatoração Sugerida

#### 2.1 Consolidar PlayerAvatar

```typescript
// src-new/core/components/data-display/PlayerAvatar.tsx (versão consolidada)
import React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components/native';

interface PlayerAvatarProps {
    avatarUrl?: string | null;
    name: string;
    size?: number;
    backgroundColor?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
    avatarUrl,
    name,
    size = 40,
    backgroundColor = '#007AFF'
}) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AvatarContainer size={size} backgroundColor={backgroundColor}>
            {avatarUrl ? (
                <AvatarImage 
                    source={{ uri: avatarUrl }} 
                    size={size}
                    resizeMode="cover"
                />
            ) : (
                <InitialsText size={size}>{getInitials(name)}</InitialsText>
            )}
        </AvatarContainer>
    );
};

const AvatarContainer = styled.View<{ size: number; backgroundColor: string }>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: ${props => props.size / 2}px;
    background-color: ${props => props.backgroundColor};
    justify-content: center;
    align-items: center;
    overflow: hidden;
`;

const AvatarImage = styled.Image<{ size: number }>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: ${props => props.size / 2}px;
`;

const InitialsText = styled.Text<{ size: number }>`
    color: white;
    font-size: ${props => props.size * 0.4}px;
    font-weight: bold;
`;
```

#### 2.2 Consolidar TextInput

```typescript
// src-new/core/components/ui/TextInput.tsx (versão consolidada)
import React from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';
import styled from 'styled-components/native';

interface CustomTextInputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
}

export const TextInput: React.FC<CustomTextInputProps> = ({
    label,
    error,
    helperText,
    ...props
}) => {
    return (
        <Container>
            {label && <Label>{label}</Label>}
            <Input 
                {...props}
                hasError={!!error}
            />
            {error && <ErrorText>{error}</ErrorText>}
            {helperText && !error && <HelperText>{helperText}</HelperText>}
        </Container>
    );
};

const Container = styled.View`
    gap: 4px;
`;

const Label = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.TextInput<{ hasError?: boolean }>`
    background-color: ${({ theme }) => theme.colors.tertiary};
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textPrimary};
    border: 1px solid ${({ theme, hasError }) => 
        hasError ? theme.colors.error : theme.colors.border};
`;

const ErrorText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.error};
`;

const HelperText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;
```

## 3. Funções Utilitárias Duplicadas

### Problema Identificado
Múltiplas implementações de formatação de data:

- `src/utils/date.ts`
- `src/utils/dateFormatter.ts`
- `src-new/core/utils/date.ts`
- `src-new/core/utils/dateFormatter.ts`
- `src-new/core/utils/formatDate.ts`

### Refatoração Sugerida

```typescript
// src-new/core/utils/date.ts (versão consolidada)
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateFormatOptions {
    includeTime?: boolean;
    includeYear?: boolean;
    relative?: boolean;
}

/**
 * Formata uma data para o padrão brasileiro
 */
export const formatDate = (
    dateString: string, 
    options: DateFormatOptions = {}
): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    const { includeTime = true, includeYear = true, relative = false } = options;
    
    if (relative) {
        return formatDistanceToNow(date, { 
            addSuffix: true, 
            locale: ptBR 
        });
    }
    
    if (includeTime) {
        return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
    
    if (includeYear) {
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    
    return format(date, "dd 'de' MMMM", { locale: ptBR });
};

/**
 * Formata uma data para o formato dd/mm/yyyy
 */
export const formatDateBR = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formata uma data para o formato dd/mm/yyyy HH:mm
 */
export const formatDateTimeBR = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};
```

## 4. Padrões de Botões Duplicados

### Problema Identificado
Múltiplas implementações de `ActionButton` com estilos similares.

### Refatoração Sugerida

```typescript
// src-new/core/components/ui/Button.tsx (versão consolidada)
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import styled from 'styled-components/native';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    children,
    ...props
}) => {
    return (
        <StyledButton
            variant={variant}
            size={size}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <LoadingIndicator size="small" color="white" />
            ) : (
                children
            )}
        </StyledButton>
    );
};

const StyledButton = styled.TouchableOpacity<{
    variant: string;
    size: string;
    disabled: boolean;
}>`
    padding: ${({ size }) => {
        switch (size) {
            case 'small': return '8px 16px';
            case 'large': return '16px 32px';
            default: return '12px 24px';
        }
    }};
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    opacity: ${({ disabled }) => disabled ? 0.6 : 1};
    
    background-color: ${({ theme, variant }) => {
        switch (variant) {
            case 'secondary': return theme.colors.secondary;
            case 'danger': return theme.colors.error;
            case 'ghost': return 'transparent';
            default: return theme.colors.primary;
        }
    }};
    
    border: ${({ theme, variant }) => 
        variant === 'ghost' ? `1px solid ${theme.colors.border}` : 'none'};
`;

const LoadingIndicator = styled.ActivityIndicator`
    margin-right: 8px;
`;
```

## 5. Padrões de Modal Duplicados

### Problema Identificado
Múltiplas implementações de modais com estilos similares.

### Refatoração Sugerida

```typescript
// src-new/core/components/feedback/Modal.tsx
import React from 'react';
import { Modal as RNModal, ModalProps } from 'react-native';
import styled from 'styled-components/native';
import { Button } from '@/core/components/ui/Button';

interface CustomModalProps extends ModalProps {
    title?: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

export const Modal: React.FC<CustomModalProps> = ({
    title,
    onClose,
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    showCancel = true,
    children,
    ...props
}) => {
    return (
        <RNModal
            transparent
            animationType="fade"
            onRequestClose={onClose}
            {...props}
        >
            <Overlay>
                <Content>
                    {title && <Title>{title}</Title>}
                    {children}
                    <ButtonContainer>
                        {showCancel && (
                            <Button variant="ghost" onPress={onClose}>
                                {cancelText}
                            </Button>
                        )}
                        {onConfirm && (
                            <Button onPress={onConfirm}>
                                {confirmText}
                            </Button>
                        )}
                    </ButtonContainer>
                </Content>
            </Overlay>
        </RNModal>
    );
};

const Overlay = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const Content = styled.View`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
`;

const Title = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 16px;
    text-align: center;
`;

const ButtonContainer = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
`;
```

## 6. Hook para Gerenciamento de Estados Assíncronos

### Refatoração Sugerida

```typescript
// src-new/core/hooks/useAsyncOperation.ts
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
```

## 7. Plano de Implementação

### Fase 1: Criar Componentes Base (Semana 1)
1. Criar `LoadingState`, `ErrorState`, `EmptyState`
2. Consolidar `PlayerAvatar` e `TextInput`
3. Criar `Button` unificado
4. Criar `Modal` unificado

### Fase 2: Criar Hooks Utilitários (Semana 2)
1. Implementar `useAsyncState`
2. Implementar `useAsyncOperation`
3. Consolidar funções de formatação de data

### Fase 3: Migração Gradual (Semanas 3-4)
1. Substituir componentes duplicados nos arquivos existentes
2. Atualizar imports
3. Remover arquivos duplicados

### Fase 4: Testes e Validação (Semana 5)
1. Testes unitários para novos componentes
2. Testes de integração
3. Validação visual

## 8. Benefícios Esperados

### Redução de Código
- **~40% redução** no número de linhas de código
- **~60% redução** em styled-components duplicados
- **~50% redução** em funções utilitárias

### Manutenibilidade
- Mudanças de estilo centralizadas
- Consistência visual garantida
- Facilidade para implementar novos temas

### Performance
- Menos JavaScript para carregar
- Melhor tree-shaking
- Componentes otimizados

### Desenvolvimento
- Velocidade de desenvolvimento aumentada
- Menos bugs por inconsistências
- Melhor experiência do desenvolvedor

## 9. Arquivos a Serem Removidos

Após a migração, os seguintes arquivos podem ser removidos:

```
src/components/PlayerAvatar.tsx
src/components/data-display/PlayerAvatar.tsx
src/components/TextInput.tsx
src/components/ui/TextInput.tsx
src/utils/date.ts
src/utils/dateFormatter.ts
src-new/core/utils/dateFormatter.ts
src/components/feedback/CustomModal.tsx
```

## 10. Conclusão

Esta refatoração eliminará significativamente a duplicação de código no projeto, seguindo as melhores práticas do princípio DRY. A implementação deve ser feita de forma gradual para minimizar riscos e garantir que a funcionalidade existente não seja afetada.

Os novos componentes e hooks serão mais robustos, testáveis e reutilizáveis, proporcionando uma base sólida para o crescimento futuro do projeto. 