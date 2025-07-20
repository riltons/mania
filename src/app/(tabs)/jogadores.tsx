import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Header } from '@/core/components/layout/Header';
import { ScrollView } from 'react-native-gesture-handler';

export default function JogadoresScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Header title="Jogadores" />
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Lista de Jogadores
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Esta tela está em desenvolvimento. Em breve você poderá ver todos os jogadores aqui.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
});