import { Stack, useRouter, usePathname, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '@/core/contexts/AuthProvider';
import { ThemeProvider, useTheme } from '@/core/contexts/ThemeProvider';
import { StatusBar, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import ErrorBoundary from '@/core/utils/errorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEnvironmentInfo } from '@/core/utils/environment';

registerTranslation('en-GB', enGB);

const AppContent = () => {
    const { colors, theme } = useTheme();
    const isDarkTheme = theme === 'dark';
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    
    // Verificando se a rota atual é uma tela de autenticação
    const isAuthScreen = [
        '/login', 
        '/register', 
        '/signup', 
        '/(pages)/onboarding'
    ].some(route => pathname === route || pathname?.startsWith(route));

    // Configura a barra de navegação no Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.backgroundDark);
            NavigationBar.setButtonStyleAsync(isDarkTheme ? 'light' : 'dark');
        }
    }, [colors, isDarkTheme]);

    return (
        <AppContainer>
            <StatusBar 
                barStyle={isDarkTheme ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent
            />
            <Stack screenOptions={{ 
                headerShown: false,
                contentStyle: { 
                    backgroundColor: colors.primary,
                    flex: 1,
                }
            }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(pages)" />
                <Stack.Screen name="index" />
            </Stack>
        </AppContainer>
    );
};

function AppLayout() {
    return (
        <SafeAreaProvider>
            <AppContent />
        </SafeAreaProvider>
    );
}

// Previne que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync().catch(() => {
    /* rejeição é esperada se já estiver escondida */
});

// Componente para gerenciar o estado de carregamento inicial
function InitialLoading() {
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const prepare = async () => {
            try {
                // Tempo mínimo para exibir a tela de splash
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsReady(true);
                await SplashScreen.hideAsync();
            } catch (e) {
                console.warn('Erro ao preparar o app:', e);
            }
        };

        prepare();
    }, []);

    // Se ainda não estiver pronto, mostra o loading
    if (!isReady) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LoadingContainer>
        );
    }

    return (
        <ErrorBoundary>
            <AuthProvider>
                <AuthContentWrapper />
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default function RootLayout() {
    // Registra informações sobre o ambiente de execução
    useEffect(() => {
        const envInfo = logEnvironmentInfo();
        console.log('Iniciando aplicativo em:', envInfo.isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
    }, []);

    return (
        <ThemeProvider>
            <InitialLoading />
        </ThemeProvider>
    );
}

interface ThemeProps {
    theme: {
        colors: {
            backgroundDark: string;
        };
    };
}

// Componente para gerenciar o conteúdo da autenticação
const AuthContentWrapper = () => {
    const { isLoading, showLanding } = useAuth();
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    
    // Redireciona para a landing page se necessário
    if (showLanding && !isLandingPage) {
        return <Redirect href="/" />;
    }

    // Mostra tela de carregamento se estiver carregando
    if (isLoading) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color="#8257E5" />
            </LoadingContainer>
        );
    }

    return <AppLayout />;
};

const AppContainer = styled.View<ThemeProps>`
    flex: 1;
    background-color: #8257E5;
`;

// Componente de carregamento com tema roxo
const LoadingContainer = styled.View<ThemeProps>`
    flex: 1;
    background-color: #8257E5;
    justify-content: center;
    align-items: center;
`;
