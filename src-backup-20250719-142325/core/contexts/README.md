# Contextos da Aplicação

Este diretório contém os contextos globais da aplicação, incluindo o gerenciamento de autenticação e tema.

## AuthProvider

O `AuthProvider` é responsável por gerenciar o estado de autenticação em toda a aplicação. Ele fornece métodos para autenticação, cadastro, logout e gerenciamento de sessão do usuário.

### Como usar

1. **Envolva sua aplicação com o AuthProvider**

   No ponto de entrada da sua aplicação (geralmente `_layout.tsx`), envolva seu aplicativo com o `AuthProvider`:

   ```tsx
   import { AuthProvider } from '@/core/contexts/AuthProvider';
   
   export default function RootLayout() {
     return (
       <AuthProvider>
         <App />
       </AuthProvider>
     );
   }
   ```

2. **Use o hook useAuth em qualquer componente**

   ```tsx
   import { useAuth } from '@/core/contexts/AuthProvider';
   
   function MeuComponente() {
     const { 
       user, 
       isAuthenticated, 
       signIn, 
       signOut 
     } = useAuth();
     
     // ...
   }
   ```

### Métodos disponíveis

| Método | Descrição | Parâmetros | Retorno |
|--------|-----------|------------|---------|
| `signIn` | Realiza o login do usuário | `email: string`, `password: string` | `Promise<AuthResponse>` |
| `signUp` | Cadastra um novo usuário | `email: string`, `password: string`, `name?: string` | `Promise<AuthResponse>` |
| `signOut` | Realiza o logout do usuário atual | - | `Promise<AuthResponse>` |
| `resetPassword` | Solicita redefinição de senha | `email: string` | `Promise<AuthResponse>` |
| `refreshSession` | Atualiza a sessão do usuário | - | `Promise<{ session: Session \| null, user: User \| null, error?: AuthError \| null }>` |

### Estados disponíveis

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `user` | `User \| null` | Dados do usuário autenticado |
| `session` | `Session \| null` | Sessão atual do usuário |
| `isAuthenticated` | `boolean` | Indica se o usuário está autenticado |
| `isLoading` | `boolean` | Indica se a verificação de autenticação está em andamento |
| `isInitialized` | `boolean` | Indica se o AuthProvider foi inicializado |
| `showLanding` | `boolean` | Controla a exibição da página inicial |

### Exemplo de uso completo

```tsx
import { useAuth } from '@/core/contexts/AuthProvider';
import { View, Text, Button, TextInput } from 'react-native';
import { useState } from 'react';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { signIn, isAuthenticated, isLoading } = useAuth();
  
  const handleLogin = async () => {
    try {
      setError('');
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Falha no login');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    }
  };
  
  if (isLoading) {
    return <Text>Carregando...</Text>;
  }
  
  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }
  
  return (
    <View>
      <Text>Login</Text>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <TextInput
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Entrar" onPress={handleLogin} disabled={isLoading} />
    </View>
  );
}
```

### Tratamento de erros

O `AuthProvider` inclui tratamento de erros global para os seguintes cenários:

- Sessão expirada
- Token de atualização inválido
- Erros de rede
- Credenciais inválidas

### Boas práticas

1. **Verificação de autenticação**: Use o estado `isLoading` para mostrar um indicador de carregamento durante a verificação inicial de autenticação.

2. **Proteção de rotas**: Use o componente `ProtectedRoute` para rotas que exigem autenticação:

   ```tsx
   import { useAuth } from '@/core/contexts/AuthProvider';
   import { Redirect } from 'expo-router';
   
   export function ProtectedRoute({ children }) {
     const { isAuthenticated, isLoading } = useAuth();
     
     if (isLoading) {
       return <LoadingScreen />;
     }
     
     if (!isAuthenticated) {
       return <Redirect href="/login" />;
     }
     
     return <>{children}</>;
   }
   ```

3. **Atualização de sessão**: Use `refreshSession()` para atualizar os tokens de acesso quando necessário.

4. **Logout em caso de erro**: Em caso de erros de autenticação, o usuário será redirecionado para a tela de login automaticamente.

### Personalização

Você pode personalizar o comportamento do `AuthProvider` através das seguintes propriedades:

- `onAuthStateChange`: Função chamada sempre que o estado de autenticação mudar
- `onError`: Função chamada quando ocorrer um erro de autenticação
- `initialAuthState`: Estado inicial de autenticação (útil para testes)
