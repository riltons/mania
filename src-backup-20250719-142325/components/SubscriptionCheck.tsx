import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { useTheme } from '@/contexts/ThemeProvider';

interface SubscriptionCheckProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

export default function SubscriptionCheck({ children, showWarning = true }: SubscriptionCheckProps) {
  const { subscription, hasPremiumAccess, getRemainingDays } = useSubscription();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [remainingDays, setRemainingDays] = useState(0);
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const checkAccess = async () => {
      const access = await hasPremiumAccess();
      setHasAccess(access);
      
      if (subscription?.ends_at) {
        setRemainingDays(getRemainingDays());
      }
    };
    
    checkAccess();
  }, [hasPremiumAccess, subscription, getRemainingDays]);

  // Se ainda estiver verificando acesso, não mostra nada
  if (hasAccess === null) {
    return null;
  }

  // Se não tem acesso, mostra tela de bloqueio
  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Acesso Restrito
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Esta funcionalidade está disponível apenas para assinantes ou durante o período de teste.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/pricing')}
        >
          <Text style={styles.buttonText}>Ver Planos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Se tem acesso mas está no trial com poucos dias restantes, mostra aviso
  if (showWarning && subscription?.status === 'trial' && remainingDays <= 7) {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.warningBanner, { backgroundColor: colors.warning }]}>
          <Text style={styles.warningText}>
            {remainingDays <= 0
              ? 'Seu período de teste terminou hoje! Assine para continuar tendo acesso.'
              : `Seu período de teste termina em ${remainingDays} ${
                  remainingDays === 1 ? 'dia' : 'dias'
                }. Assine agora para não perder o acesso.`}
          </Text>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => router.push('/pricing?hideFree=true')}
          >
            <Text style={styles.warningButtonText}>Assinar</Text>
          </TouchableOpacity>
        </View>
        {children}
      </View>
    );
  }

  // Se tem acesso e não precisa mostrar aviso, renderiza normalmente
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    width: '100%',
  },
  warningText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  warningButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  warningButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
