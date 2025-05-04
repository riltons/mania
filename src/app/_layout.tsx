import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../contexts/AuthProvider';
import { ThemeProvider, useTheme } from '../contexts/ThemeProvider';
import { StatusBar, Platform, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native';
import styled from 'styled-components/native';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import { usePathname } from 'expo-router';
import ErrorBoundary from '../utils/errorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

registerTranslation('en-GB', enGB);

function AppLayout() {
    const { session } = useAuth();
    const statusBarHeight = StatusBar.currentHeight || 0;
    const pathname = usePathname();
    const isAuthScreen = ['/login', '/register', '/signup', '/onboarding'].includes(pathname);
    const { theme, colors } = useTheme();
    const isDarkTheme = theme === 'dark';

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.primary);
        }
    }, [colors]);

    return (
        <SafeContainer statusBarHeight={statusBarHeight}>
            <StatusBar 
                barStyle={isDarkTheme ? "light-content" : "dark-content"}
                backgroundColor={colors.backgroundDark}
                translucent
            />
            {!isAuthScreen ? (
                session ? (
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="(pages)" />
                    </Stack>
                ) : (
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="(pages)" />
                    </Stack>
                )
            ) : (
                <Stack screenOptions={{ headerShown: false }}>
                    {/* Exibe tela de onboarding antes de login/registro */}
                    <Stack.Screen name="(pages)/onboarding" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="signup" />
                </Stack>
            )}
        </SafeContainer>
    );
}

import { logEnvironmentInfo } from '../utils/environment';

// Previne que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync().catch(() => {
    /* rejeição é esperada se já estiver escondida */
});

export default function RootLayout() {
    // Registra informações sobre o ambiente de execução
    useEffect(() => {
        const envInfo = logEnvironmentInfo();
        console.log('Iniciando aplicativo em:', envInfo.isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
    }, []);
    
    // Esconde a tela de splash após um curto período
    useEffect(() => {
        const hideSplash = async () => {
            try {
                // Pequeno atraso para garantir que os componentes estejam prontos
                await new Promise(resolve => setTimeout(resolve, 1500));
                await SplashScreen.hideAsync();
                console.log('Splash screen escondida com sucesso');
            } catch (e) {
                console.warn('Erro ao esconder splash screen:', e);
            }
        };
        
        hideSplash();
    }, []);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <AppLayout />
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

const SafeContainer = styled(SafeAreaView)<{ statusBarHeight: number }>`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
    padding-top: ${Platform.OS === 'android' ? props => props.statusBarHeight : 0}px;
    width: 100%;
`;
