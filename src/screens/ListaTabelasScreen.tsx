import React from 'react';
import { View, StyleSheet } from 'react-native';
import ListaTabelasSupabase from '@/components/ListaTabelasSupabase';
import { useRouter } from 'expo-router';

export default function ListaTabelasScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ListaTabelasSupabase />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
